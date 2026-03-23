import { useEffect, useState } from 'react';
import { Plus, Calendar, DollarSign, MapPin, Hash, FileText, Weight, Shield, User, Truck, Package } from 'lucide-react';
import RequestHandler from '../lib/utilities/RequestHandler';
import EquipmentInterchangeReceipt from './equipment_receipt';
import Swal from 'sweetalert2';
import DynamicForm, { DynamicFormField } from '../components/form';
import DataTable from '../components/table';
import { useAuth } from '../lib/context/auth';


const GateEntryManagement = () => {
    const [_, setIsLoading] = useState(false);
    const [records, setRecords] = useState<any>([]);
    const [allEntries, setAllEntries] = useState<any>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<any>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
    const [backupData, setBackupData] = useState<any>(null);
    const [editMode, setEditMode] = useState(false);
    const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [initialFormValues, setInitialFormValues] = useState<Record<string, any>>({});
    const { admin } = useAuth();
    const [datalistOptions, setDatalistOptions] = useState<{
        shipping_line: string[];
        transport_company: string[];
        drivers_name: string[];
        plate_no: string[];
        iso_code: string[];
        category: string[];
        gate_inspector: string[];
        move_type: string[];
        container_no: string[];
        booking_no: string[];
        seal_no: string[];
        driver_licence: string[];
        reefer_reqt: string[];
        entry_lane: string[];
        exit_lane: string[];
        damage_code: string[];
        trans_creator: string[];
        block_location: string[];
    }>({
        shipping_line: [],
        transport_company: [],
        drivers_name: [],
        plate_no: [],
        iso_code: [],
        category: [],
        gate_inspector: [],
        move_type: [],
        container_no: [],
        booking_no: [],
        seal_no: [],
        driver_licence: [],
        reefer_reqt: [],
        entry_lane: [],
        exit_lane: [],
        damage_code: [],
        trans_creator: [],
        block_location: [],
    });

    const handleReportClick = (record: any) => {
        setReportData(record);
        setIsReportModalOpen(true);
    };

    const handleViewBackup = (record: any) => {
        if (record.backup) {
            setBackupData(record.backup);
            setIsBackupModalOpen(true);
        } else {
            Swal.fire({
                icon: 'info',
                title: 'No Backup Available',
                text: 'This record has no previous version saved.',
                confirmButtonColor: '#0F172A'
            });
        }
    };

    const [shippingLineOptions, setShippingLineOptions] = useState<{ label: string; value: string }[]>([]);
    const [transportCompanies, settransportCompanies] = useState<{ label: string; value: string }[]>([]);
    const [driversOption, setDriversOption] = useState<{ label: string; value: string }[]>([]);
    const [plateNumberOption, setPlateNumberOption] = useState<{ label: string; value: string }[]>([]);
    const [driverLicenseMap, setDriverLicenseMap] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchRecords();
        fetchShippingLines();
        fetchTransportCompany();
        fetchDrivers();
        fetchPlateNumber();
    }, []);

    const fetchShippingLines = async () => {
        const response = await RequestHandler.fetchData('GET', 'shipping-lines/get-all');
        if (response?.success && response.shippingLines) {
            setShippingLineOptions(
                response.shippingLines
                    .filter((s: any) => s.life_state === 'Active')
                    .map((s: any) => ({ label: s.name, value: s.name }))
            );
        }
    };

    const fetchTransportCompany = async () => {
        const response = await RequestHandler.fetchData('GET', 'transport-companies/get-all');
        if (response?.success && response.transportCompanies) {
            settransportCompanies(
                response.transportCompanies
                    .filter((s: any) => s.status === 'active')
                    .map((s: any) => ({ label: s.name, value: s.name }))
            );
        }
    };

    const fetchDrivers = async () => {
        const response = await RequestHandler.fetchData('GET', 'drivers/get-all');
        if (response?.success && response.drivers) {
            const active = response.drivers.filter((s: any) => s.status === 'active' && s.lifeState === 'active');
            setDriversOption(active.map((s: any) => ({ label: s.name, value: s.name })));
            const map: Record<string, string> = {};
            active.forEach((s: any) => { map[s.name] = s.licenseNumber; });
            setDriverLicenseMap(map);
        }
    };

    const fetchPlateNumber = async () => {
        const response = await RequestHandler.fetchData('GET', 'plate-numbers/get-all');
        if (response?.success && response.plateNumbers) {
            setPlateNumberOption(
                response.plateNumbers
                    .filter((s: any) => s.status === 'active')
                    .map((s: any) => ({ label: s.plateNumber, value: s.plateNumber }))
            );
        }
    };

    useEffect(() => {
        const source = allEntries.length > 0 ? allEntries : records;
        if (source.length > 0) {
            const extract = (key: string) =>
                [...new Set(source.map((r: any) => r[key]).filter(Boolean))].sort() as string[];

            const blockLocationOptions = [
                ...new Set(
                    source
                        .filter((r: any) => r.block_location && r.row_location != null && r.col_location != null)
                        .map((r: any) => `${r.block_location}-${r.row_location}-${r.col_location}`)
                )
            ].sort() as string[];

            setDatalistOptions({
                shipping_line:     extract('shipping_line'),
                transport_company: extract('transport_company'),
                drivers_name:      extract('drivers_name'),
                plate_no:          extract('plate_no'),
                iso_code:          extract('iso_code'),
                category:          extract('category'),
                gate_inspector:    extract('gate_inspector'),
                move_type:         extract('move_type'),
                container_no:      extract('container_no'),
                booking_no:        extract('booking_no'),
                seal_no:           extract('seal_no'),
                driver_licence:    extract('driver_licence'),
                reefer_reqt:       extract('reefer_reqt'),
                entry_lane:        extract('entry_lane'),
                exit_lane:         extract('exit_lane'),
                damage_code:       extract('damage_code'),
                trans_creator:     extract('trans_creator'),
                block_location:    blockLocationOptions,
            });
        }
    }, [records, allEntries]);

    const getTodayDateTime = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const hours = String(today.getHours()).padStart(2, '0');
        const minutes = String(today.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const parseBlockLocation = (value: string): { block: string; row: number; col: number } | null => {
        const trimmed = value.trim();
        const parts = trimmed.split('-');
        if (parts.length !== 3) return null;
        const [block, rowStr, colStr] = parts;
        const row = Number(rowStr);
        const col = Number(colStr);
        if (!block || isNaN(row) || isNaN(col)) return null;
        return { block: block.toUpperCase(), row, col };
    };

    const calculateNextElevation = (block: string, row: number, col: number, excludeId?: number): number => {
        const matchingRecords = records.filter((r: any) =>
            r.block_location === block.toUpperCase() &&
            r.row_location === row &&
            r.col_location === col &&
            !r.gate_out &&
            r.id !== excludeId
        );
        return matchingRecords.length + 1;
    };

    const fetchRecords = async () => {
        setIsLoading(true);
        try {
            const response = await RequestHandler.fetchData('GET', 'gate-entry/get-all');
            if (response && response.success !== false) {
                const entries = Array.isArray(response.gateEntries) ? response.gateEntries : [];
                setAllEntries(entries);
                const realEntries = entries.filter((e: any) => e.trans_creator !== 'SHIPPING_LINE');
                setRecords(realEntries);
            } else {
                setRecords([]);
            }
        } catch (error) {
            console.error('Error fetching records:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch records.' });
            setRecords([]);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: '2-digit', day: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    };

    const handleEdit = (record: any) => {
        setEditMode(true);
        setEditingRecordId(record.id);
        const gateInDate = record.gate_in ? new Date(record.gate_in) : new Date();
        const year = gateInDate.getFullYear();
        const month = String(gateInDate.getMonth() + 1).padStart(2, '0');
        const day = String(gateInDate.getDate()).padStart(2, '0');
        const hours = String(gateInDate.getHours()).padStart(2, '0');
        const minutes = String(gateInDate.getMinutes()).padStart(2, '0');
        const blockLocationFull = `${record.block_location || 'XA'}-${record.row_location ?? 0}-${record.col_location ?? 0}`;

        setInitialFormValues({
            gate_in: `${year}-${month}-${day}T${hours}:${minutes}`,
            block_location: blockLocationFull,
            tier_location: record.tier_location || 1,
            //  Only gate_in_payment_need is set upfront — gate out amount is entered at payment time
            gate_in_payment_need: record.gate_in_payment_need || 0,
            transaction_nbr: record.transaction_nbr || '',
            shipping_line: record.shipping_line || '',
            container_no: record.container_no || '',
            booking_no: record.booking_no || '',
            category: record.category || '',
            reefer_reqt: record.reefer_reqt || '',
            seal_no: record.seal_no || '',
            iso_code: record.iso_code || '',
            driver_licence: record.driver_licence || '',
            move_type: record.move_type || '',
            transport_company: record.transport_company || '',
            drivers_name: record.drivers_name || '',
            plate_no: record.plate_no || '',
            trans_creator: record.trans_creator || '',
            gross_weight: record.gross_weight || '',
            tare_weight: record.tare_weight || '',
            net_weight: record.net_weight || '',
            entry_lane: record.entry_lane || '',
            exit_lane: record.exit_lane || '',
            mnr_status: record.mnr_status || 'OK',
            damage_code: record.damage_code || '',
            inspection_notes: record.inspection_notes || '',
            gate_inspector: record.gate_inspector || '',
            vgm_weight: record.vgm_weight || ''
        });
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditMode(false);
        setEditingRecordId(null);
        setInitialFormValues({
            gate_in: getTodayDateTime(),
            block_location: 'XA-1-1',
            tier_location: 1,
            //  Only gate_in_payment_need here — gate out amount is set later in the payment tab
            gate_in_payment_need: 0,
            transaction_nbr: records.length > 0 ? `${String(records.length + 1).padStart(6, '0')}` : '000001',
            shipping_line: '',
            container_no: '',
            booking_no: '',
            category: '',
            reefer_reqt: '',
            seal_no: '',
            iso_code: '',
            driver_licence: '',
            move_type: '',
            transport_company: '',
            drivers_name: '',
            plate_no: '',
            trans_creator: '',
            gross_weight: '',
            tare_weight: '',
            net_weight: '',
            entry_lane: '',
            exit_lane: '',
            mnr_status: 'OK',
            damage_code: '',
            inspection_notes: '',
            gate_inspector: '',
            vgm_weight: ''
        });
        setIsModalOpen(true);
    };

    const UPPERCASE_FIELDS = new Set([
        // 'container_no', 'booking_no', 'seal_no', 'iso_code',
        // 'block_location', 'trans_creator', 'damage_code',
        // 'entry_lane', 'exit_lane', 'transaction_nbr', 'plate_no'
        'container_no'
    ]);
    
    const handleFieldChange = (name: string, value: any) => {
        const normalizedValue = typeof value === 'string' && UPPERCASE_FIELDS.has(name)
            ? value.toUpperCase()
            : value;
    
        setInitialFormValues(prev => ({
            ...prev,
            [name]: normalizedValue,
            ...(name === 'drivers_name' && driverLicenseMap[value]
                ? { driver_licence: driverLicenseMap[value] }
                : {}),
        }));
    };

    const getFormFields = (): DynamicFormField[] => [
        {
            name: 'gate_in',
            label: 'Gate In',
            type: 'datetime-local',
            icon: Calendar,
            required: true,
            disabled: editMode,
            value: initialFormValues.gate_in,
        },
        {
            //  Only gate in payment amount is set here
            name: 'gate_in_payment_need',
            label: 'Gate In Payment Required (₱)',
            type: 'number',
            icon: DollarSign,
            required: false,
            disabled: editMode,
            value: initialFormValues.gate_in_payment_need,
        },
        //  payment_need (gate out) is REMOVED — admin enters it manually in the Gate Out Payment tab
        {
            name: 'block_location',
            label: 'Block Location (e.g. XA-1-1)',
            type: 'text',
            icon: MapPin,
            placeholder: 'XA-1-1',
            required: true,
            disabled: editMode,
            value: initialFormValues.block_location,
            datalist: datalistOptions.block_location,
            validation: (value: any) => {
                const parsed = parseBlockLocation(value);
                if (!parsed) return 'Format must be BLOCK-ROW-COL (e.g. XA-1-1)';
                return null;
            },
        },
        {
            name: 'transaction_nbr',
            label: 'Transaction NBR',
            type: 'text',
            icon: Hash,
            required: true,
            disabled: true,
            value: initialFormValues.transaction_nbr,
        },
        {
            name: 'shipping_line',
            label: 'Shipping Line',
            type: 'select',
            icon: Package,
            required: true,
            value: initialFormValues.shipping_line,
            options: shippingLineOptions,
        },
        {
            name: 'container_no',
            label: 'Container No',
            type: 'text',
            icon: Package,
            required: true,
            value: initialFormValues.container_no,
            datalist: datalistOptions.container_no,
            validation: (value: any) => {
                if (value.length !== 11) return 'Container number must be exactly 11 characters';
                return null;
            },
        },
        {
            name: 'booking_no',
            label: 'Booking No',
            type: 'text',
            icon: FileText,
            value: initialFormValues.booking_no,
            datalist: datalistOptions.booking_no,
        },
        {
            name: 'category',
            label: 'Category',
            type: 'select',
            options: [{ label: 'Storage', value: 'Storage' }],
            icon: FileText,
            required: true,
            value: initialFormValues.category,
        },
        {
            name: 'reefer_reqt',
            label: 'Reefer REQT',
            type: 'select',
            options: [
                { label: 'NO', value: 'NO' },
                { label: 'YES', value: 'YES' },
            ],
            value: initialFormValues.reefer_reqt,
        },
        {
            name: 'seal_no',
            label: 'Seal No',
            type: 'text',
            icon: Shield,
            value: initialFormValues.seal_no,
            datalist: datalistOptions.seal_no,
        },
        {
            name: 'iso_code',
            label: 'ISO CODE',
            type: 'text',
            icon: Hash,
            required: true,
            value: initialFormValues.iso_code,
            datalist: datalistOptions.iso_code,
        },
        {
            name: 'drivers_name',
            label: "Driver's Name",
            type: 'select',
            icon: User,
            required: true,
            value: initialFormValues.drivers_name,
            options: driversOption,
        },
        {
            name: 'driver_licence',
            label: 'Driver License',
            type: 'text',
            icon: User,
            disabled: true,
            value: initialFormValues.driver_licence,
            datalist: datalistOptions.driver_licence,
        },
        {
            name: 'move_type',
            label: 'Move Type',
            icon: Truck,
            type: 'select',
            options: [
                { label: 'Empty', value: 'Empty' },
                { label: 'Laden', value: 'Laden' },
            ],
            required: true,
            value: initialFormValues.move_type,
        },
        {
            name: 'transport_company',
            label: 'Transport Company',
            type: 'select',
            icon: Truck,
            required: true,
            value: initialFormValues.transport_company,
            options: transportCompanies,
        },
        {
            name: 'plate_no',
            label: 'Plate No',
            type: 'select',
            icon: Truck,
            required: true,
            value: initialFormValues.plate_no,
            options: plateNumberOption,
        },
        {
            name: 'trans_creator',
            label: 'Trans Creator',
            type: 'text',
            value: initialFormValues.trans_creator,
            datalist: datalistOptions.trans_creator,
        },
        {
            name: 'gross_weight',
            label: 'Gross Weight (kg)',
            type: 'number',
            icon: Weight,
            required: true,
            min: 0,
            value: initialFormValues.gross_weight,
        },
        {
            name: 'tare_weight',
            label: 'Tare Weight (kg)',
            type: 'number',
            icon: Weight,
            required: true,
            min: 0,
            value: initialFormValues.tare_weight,
        },
        {
            name: 'net_weight',
            label: 'Net Weight (kg)',
            type: 'number',
            icon: Weight,
            required: true,
            min: 0,
            value: initialFormValues.net_weight,
        },
        {
            name: 'entry_lane',
            label: 'Entry Lane',
            type: 'text',
            value: initialFormValues.entry_lane,
            datalist: datalistOptions.entry_lane,
        },
        {
            name: 'exit_lane',
            label: 'Exit Lane',
            type: 'text',
            value: initialFormValues.exit_lane,
            datalist: datalistOptions.exit_lane,
        },
        {
            name: 'mnr_status',
            label: 'MNR Status',
            type: 'select',
            options: [
                { label: 'OK', value: 'OK' },
                { label: 'Damaged', value: 'Damaged' },
                { label: 'Repair Required', value: 'Repair Required' },
            ],
            value: initialFormValues.mnr_status,
        },
        {
            name: 'damage_code',
            label: 'Damage Code',
            type: 'text',
            value: initialFormValues.damage_code,
            datalist: datalistOptions.damage_code,
        },
        {
            name: 'inspection_notes',
            label: 'Inspection Notes',
            type: 'textarea',
            rows: 3,
            value: initialFormValues.inspection_notes,
        },
        {
            name: 'gate_inspector',
            label: 'Gate Inspector',
            type: 'text',
            icon: User,
            value: initialFormValues.gate_inspector,
            datalist: datalistOptions.gate_inspector,
        },
        {
            name: 'vgm_weight',
            label: 'VGM Weight (kg)',
            type: 'number',
            icon: Weight,
            min: 0,
            value: initialFormValues.vgm_weight,
        },
    ];

    const handleFormSubmit = async (data: Record<string, any>) => {
        setIsSubmitting(true);
        try {
            const parsed = parseBlockLocation(data.block_location);
            if (!parsed) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Invalid Location Format',
                    html: `<p>Block Location must be in <strong>BLOCK-ROW-COL</strong> format.</p><p class="text-sm mt-2">Example: <code>XA-1-1</code></p>`,
                    confirmButtonColor: '#ef4444',
                });
                setIsSubmitting(false);
                return;
            }

            const { block, row, col } = parsed;
            const elevation = calculateNextElevation(block, row, col, editingRecordId || undefined);

            if (elevation > 4) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'Location at Capacity',
                    html: `<p>The location <strong>${block}-${row}-${col}</strong> already has 4 containers stacked.</p>`,
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#ef4444',
                });
                setIsSubmitting(false);
                return;
            }

            const submitData = {
                ...data,
                //  Only gate_in_payment_need is submitted — no payment_need
                gate_in_payment_need: Number(data.gate_in_payment_need || 0),
                gate_in: new Date(data.gate_in).toISOString(),
                block_location: block,
                row_location: row,
                col_location: col,
                tier_location: elevation,
                gross_weight: Number(data.gross_weight),
                tare_weight: Number(data.tare_weight),
                net_weight: Number(data.net_weight),
                vgm_weight: data.vgm_weight ? Number(data.vgm_weight) : null,
                person_incharge: admin?.name || 'Unknown'
            };

            let response;
            if (editMode && editingRecordId) {
                response = await RequestHandler.fetchData('PUT', `gate-entry/update/${editingRecordId}`, submitData);
            } else {
                response = await RequestHandler.fetchData('POST', 'gate-entry/create', submitData);
            }

            if (response && response.success !== false) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    html: `<p>${editMode ? 'Entry updated!' : 'Entry created!'}</p><p class="text-sm mt-2">Location: <strong>${block}-${row}-${col}-${elevation}</strong></p>`,
                    timer: 3000,
                    showConfirmButton: false
                });
                setIsModalOpen(false);
                setEditMode(false);
                setEditingRecordId(null);
                setInitialFormValues({});
                fetchRecords();
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: response.message || 'Failed to save entry' });
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to save entry. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFormCancel = () => {
        setIsModalOpen(false);
        setEditMode(false);
        setEditingRecordId(null);
        setInitialFormValues({});
    };

    const handleGateOut = async (record: any) => {
        const result = await Swal.fire({
            title: 'Confirm Gate Out',
            html: `<p>Gate out this container?</p><p class="text-sm mt-2"><strong>Container:</strong> ${record.container_no}</p><p class="text-sm"><strong>Location:</strong> ${record.block_location}-${record.row_location}-${record.col_location}-${record.tier_location}</p>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Gate Out',
        });
        if (!result.isConfirmed) return;
        setIsSubmitting(true);
        try {
            const response = await RequestHandler.fetchData('POST', 'gate-entry/gate-out', {
                id: record.id,
                gate_out: new Date().toISOString()
            });
            if (response && response.success !== false) {
                await Swal.fire({ icon: 'success', title: 'Success!', text: 'Gate Out recorded!', timer: 2000, showConfirmButton: false });
                setSelectedRecord(null); 
                fetchRecords();
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: response.message || 'Failed to gate out' });
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to gate out. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns = [
        {
            key: 'gate_in', label: 'Gate In', sortable: true,
            render: (value: any) => <div className="text-sm"><p className="font-semibold text-slate-800">{formatDate(value)}</p></div>,
            exportRender: (value: any) => formatDate(value)
        },
        {
            key: 'gate_out', label: 'Gate Out', sortable: true,
            render: (value: any) => <span className="text-sm text-slate-800">{value ? formatDate(value) : 'N/A'}</span>,
            exportRender: (value: any) => value ? formatDate(value) : 'N/A'
        },
        {
            key: 'location', label: 'Location', sortable: true,
            render: (_: any, row: any) => (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-mono font-semibold">
                    {row.gate_out ? 'OUT' : `${row.block_location}-${row.row_location}-${row.col_location}-${row.tier_location}`}
                </span>
            ),
            exportRender: (_: any, row: any) => row.gate_out ? 'OUT' : `${row.block_location}-${row.row_location}-${row.col_location}-${row.tier_location}`
        },
        {
            key: 'person_incharge', label: "Person's Incharge", sortable: true,
            render: (value: any) => (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200">
                    <User size={12} />{value || '—'}
                </span>
            ),
            exportRender: (value: any) => value || '—',
        },
        { key: 'container_no', label: 'Container No.', sortable: true, render: (value: any) => <p className="text-sm font-bold text-slate-800 font-mono">{value}</p> },
        { key: 'transaction_nbr', label: 'Transaction NBR', sortable: true, render: (value: any) => <p className="text-sm text-slate-800">{value}</p> },
        { key: 'shipping_line', label: 'Shipping Line', sortable: true, render: (value: any) => <p className="text-sm text-slate-800">{value}</p> },
        { key: 'booking_no', label: 'Booking No', sortable: true, render: (value: any) => <p className="text-sm text-slate-800">{value}</p> },
        { key: 'iso_code', label: 'ISO CODE', sortable: true, render: (value: any) => <p className="text-sm text-slate-800">{value}</p> },
        { key: 'category', label: 'Category', sortable: true, filterable: true, render: (value: any) => <p className="text-sm text-slate-800">{value}</p> },
        { key: 'transport_company', label: 'Transport Company', sortable: true, render: (value: any) => <p className="text-sm text-slate-800">{value}</p> },
        { key: 'drivers_name', label: "Driver's Name", sortable: true, render: (value: any) => <p className="text-sm text-slate-800">{value}</p> },
        { key: 'plate_no', label: 'Plate No', sortable: true, render: (value: any) => <p className="text-sm text-slate-800">{value}</p> },
        {
            key: 'mnr_status', label: 'MNR Status', sortable: true, filterable: true,
            render: (value: any) => (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${value === 'OK' ? 'bg-emerald-100 text-emerald-800' : value === 'Damaged' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {value}
                </span>
            ),
            exportRender: (value: any) => value
        },
        {
            key: 'days_in_yard', label: 'Days in Yard', sortable: true,
            render: (value: any) => <span className="text-sm text-slate-800">{value || 0} {value === 1 ? 'Day' : 'Days'}</span>,
            exportRender: (value: any) => `${value || 0} ${value === 1 ? 'Day' : 'Days'}`
        },
        {
            key: 'actions', label: 'Actions', sortable: false, filterable: false,
            render: (_: any, row: any) => (
                <div className="flex gap-2">
                    {row.backup && (
                        <button onClick={(e) => { e.stopPropagation(); handleViewBackup(row); }} className="px-3 py-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm font-semibold">Older</button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); handleReportClick(row); }} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm font-semibold">Report</button>
                    {!row.gate_out && (
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-semibold">Records</button>
                    )}
                </div>
            ),
            exportRender: () => ''
        }
    ];

    const DetailModal = ({ record, onClose }: { record: any; onClose: () => void }) => {
        if (!record) return null;
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Truck Record Details</h2>
                        {!record.gate_out && (
                            <button onClick={(e) => { e.stopPropagation(); onClose(); handleEdit(record); }} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">Edit</button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="font-semibold">Gate In:</span> {formatDate(record.gate_in)}</div>
                        <div>
                            <span className="font-semibold">Gate Out:</span>{" "}
                            {record.gate_out ? formatDate(record.gate_out) : (
                                <button onClick={() => handleGateOut(record)} className="ml-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition">Gate Out Now</button>
                            )}
                        </div>
                        <div><span className="font-semibold">Location:</span> {record.gate_out ? 'Out' : `${record.block_location}-${record.row_location}-${record.col_location}-${record.tier_location}`}<span className="ml-2 text-xs text-gray-500">(Block-Row-Col-Tier)</span></div>
                        <div><span className="font-semibold">Transaction NBR:</span> {record.transaction_nbr}</div>
                        <div><span className="font-semibold">Shipping Line:</span> {record.shipping_line}</div>
                        <div><span className="font-semibold">Container No:</span> {record.container_no}</div>
                        <div><span className="font-semibold">Booking No:</span> {record.booking_no}</div>
                        <div><span className="font-semibold">Reefer REQT:</span> {record.reefer_reqt}</div>
                        <div><span className="font-semibold">Seal No:</span> {record.seal_no}</div>
                        <div><span className="font-semibold">ISO CODE:</span> {record.iso_code}</div>
                        <div><span className="font-semibold">Category:</span> {record.category}</div>
                        <div><span className="font-semibold">Driver License:</span> {record.driver_licence}</div>
                        <div><span className="font-semibold">Move Type:</span> {record.move_type}</div>
                        <div><span className="font-semibold">Transport Company:</span> {record.transport_company}</div>
                        <div><span className="font-semibold">Driver's Name:</span> {record.drivers_name}</div>
                        <div><span className="font-semibold">Plate No:</span> {record.plate_no}</div>
                        <div><span className="font-semibold">Trans Creator:</span> {record.trans_creator}</div>
                        <div><span className="font-semibold">Gross Weight:</span> {record.gross_weight} kg</div>
                        <div><span className="font-semibold">Tare Weight:</span> {record.tare_weight} kg</div>
                        <div><span className="font-semibold">Net Weight:</span> {record.net_weight} kg</div>
                        <div><span className="font-semibold">Entry Lane:</span> {record.entry_lane}</div>
                        <div><span className="font-semibold">Exit Lane:</span> {record.exit_lane || 'N/A'}</div>
                        <div><span className="font-semibold">MNR Status:</span> {record.mnr_status}</div>
                        <div><span className="font-semibold">Damage Code:</span> {record.damage_code || 'None'}</div>
                        <div className="col-span-2"><span className="font-semibold">Inspection Notes:</span> {record.inspection_notes || 'None'}</div>
                        <div><span className="font-semibold">Gate Inspector:</span> {record.gate_inspector}</div>
                        <div><span className="font-semibold">VGM Weight:</span> {record.vgm_weight || 'N/A'} {record.vgm_weight ? 'kg' : ''}</div>
                        <div><span className="font-semibold">Gate In Payment Required:</span> ₱{record.gate_in_payment_need?.toLocaleString() || '0'}</div>
                        <div><span className="font-semibold">Days in Yard:</span> {record.days_in_yard || 0} {record.days_in_yard === 1 ? 'Day' : 'Days'}</div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button onClick={onClose} className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">Close</button>
                    </div>
                </div>
            </div>
        );
    };

    const BackupModal = ({ backup, onClose }: { backup: any; onClose: () => void }) => {
        if (!backup) return null;
        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-purple-200">
                        <div>
                            <h2 className="text-3xl font-bold text-purple-900">Previous Version</h2>
                            <p className="text-sm text-purple-600 mt-1">Backup of the record before last modification</p>
                        </div>
                        <div className="bg-purple-100 px-4 py-2 rounded-lg">
                            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Historical Data</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        {[
                            ['Gate In', backup.gate_in ? formatDate(backup.gate_in) : 'N/A'],
                            ['Gate Out', backup.gate_out ? formatDate(backup.gate_out) : 'N/A'],
                            ['Location', backup.gate_out ? 'Out' : `${backup.block_location}-${backup.row_location}-${backup.col_location}-${backup.tier_location}`],
                            ['Transaction NBR', backup.transaction_nbr],
                            ['Shipping Line', backup.shipping_line],
                            ['Container No', backup.container_no],
                            ['Booking No', backup.booking_no],
                            ['Reefer REQT', backup.reefer_reqt],
                            ['Seal No', backup.seal_no],
                            ['ISO CODE', backup.iso_code],
                            ['Category', backup.category],
                            ['Driver License', backup.driver_licence],
                            ['Move Type', backup.move_type],
                            ['Transport Company', backup.transport_company],
                            ["Driver's Name", backup.drivers_name],
                            ['Plate No', backup.plate_no],
                            ['Trans Creator', backup.trans_creator],
                            ['Gross Weight', `${backup.gross_weight} kg`],
                            ['Tare Weight', `${backup.tare_weight} kg`],
                            ['Net Weight', `${backup.net_weight} kg`],
                            ['Entry Lane', backup.entry_lane],
                            ['Exit Lane', backup.exit_lane || 'N/A'],
                            ['MNR Status', backup.mnr_status],
                            ['Damage Code', backup.damage_code || 'None'],
                            ['Gate Inspector', backup.gate_inspector],
                            ['VGM Weight', backup.vgm_weight ? `${backup.vgm_weight} kg` : 'N/A'],
                        ].map(([label, value]) => (
                            <div key={label} className="bg-purple-50 p-3 rounded-lg">
                                <span className="font-semibold text-purple-900">{label}:</span>{' '}
                                <span className="text-slate-700">{value}</span>
                            </div>
                        ))}
                        <div className="col-span-2 bg-purple-50 p-3 rounded-lg">
                            <span className="font-semibold text-purple-900">Inspection Notes:</span>{' '}
                            <span className="text-slate-700">{backup.inspection_notes || 'None'}</span>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end">
                        <button onClick={onClose} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-bold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg">Close</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
            <div className="max-w-[75vw] mx-auto">
                <div className="flex justify-between items-center mb-3">
                    <h1 className="text-4xl font-black mb-3 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.02em' }}>
                        Truck Records
                    </h1>
                    <button onClick={handleAddNew} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
                        <Plus size={24} />
                        Add Entry
                    </button>
                </div>
                <DataTable
                    columns={columns}
                    data={records}
                    title="Gate Entry Records"
                    loading={_ as boolean}
                    searchable={true}
                    exportable={true}
                    printable={true}
                    pageSize={25}
                    pageSizeOptions={[10, 25, 50, 100]}
                    emptyMessage="No truck records found"
                    onRowClick={(row) => setSelectedRecord(row)}
                />
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-3xl font-bold mb-6 text-center text-gray-900">{editMode ? 'Edit Truck Record' : 'Truck Data Entry Form'}</h2>
                        <DynamicForm
                            fields={getFormFields()}
                            onSubmit={handleFormSubmit}
                            onCancel={handleFormCancel}
                            onFieldChange={handleFieldChange}
                            submitLabel={editMode ? 'Update Entry' : 'Submit Entry'}
                            cancelLabel="Cancel"
                            showCancel={true}
                            layout="grid"
                            gridCols={2}
                            loading={isSubmitting}
                        />
                    </div>
                </div>
            )}

            {isReportModalOpen && reportData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-4 max-w-sm w-full max-h-[90vh] overflow-y-auto">
                        <EquipmentInterchangeReceipt data={reportData} />
                        <div className="mt-4 flex justify-end gap-2 no-print">
                            <button
                                onClick={() => {
                                    const printContents = document.querySelector('.receipt-root')?.innerHTML;
                                    if (!printContents) return;
                                    const win = window.open('', '_blank', 'width=400,height=600');
                                    if (!win) return;
                                    win.document.write(`<html><head><title>Receipt</title><style>@page { size: 80mm auto; margin: 4mm; } body { margin: 0; font-family: 'Arial', Courier, monospace; font-size: 2px; width: 80mm; }</style></head><body>${printContents}</body></html>`);
                                    win.document.close();
                                    win.focus();
                                    win.print();
                                    win.close();
                                }}
                                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                            >Print</button>
                            <button onClick={() => setIsReportModalOpen(false)} className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedRecord && <DetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />}
            {isBackupModalOpen && backupData && (
                <BackupModal backup={backupData} onClose={() => { setIsBackupModalOpen(false); setBackupData(null); }} />
            )}
        </div>
    );
};

export default GateEntryManagement;