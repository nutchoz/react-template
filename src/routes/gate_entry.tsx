import { useEffect, useState } from 'react';
import { Search, Plus, X } from 'lucide-react';
import RequestHandler from '../lib/utilities/RequestHandler';
import EquipmentInterchangeReceipt from './equipment_receipt';

const GateEntryManagement = () => {
    const [_, setIsLoading] = useState(false);
    const [records, setRecords] = useState<any>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [formData, setFormData] = useState({
        gate_in: '',
        location: '',
        transaction_nbr: '',
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
        mnr_status: '',
        damage_code: '',
        inspection_notes: '',
        gate_inspector: '',
        vgm_weight: ''
    });

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportData, setReportData] = useState(null);

    const handleReportClick = (record: any) => {
        setReportData(record);
        setIsReportModalOpen(true);
    };

    const filteredRecords = records.filter((record: any) =>
        Object.values(record).some(value =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    useEffect(() => {
        fetchRecords();
    }, []);

    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0]; // YYYY-MM-DD
    };

    useEffect(() => {
        if (isModalOpen) {
            setFormData(prev => ({
                ...prev,
                gate_in: getTodayDate()
            }));
        }
    }, [isModalOpen]);

    const fetchRecords = async () => {
        setIsLoading(true);
        try {
            const response = await RequestHandler.fetchData('GET', 'gate-entry/get-all');
            if (response && !response.success === false) {
                setRecords(Array.isArray(response.gateEntries) ? response.gateEntries : []);
                console.log('Fetched records:', response.gateEntries);
            }
        } catch (error) {
            console.error('Error fetching records:', error);
            alert('Failed to fetch records. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev, [name]: name === 'location'
                ? value.toUpperCase()   // 👈 converts small → CAPITAL
                : value
        }));
    };

    const resetForm = () => {
        setFormData({
            gate_in: '',
            location: '',
            transaction_nbr: '',
            shipping_line: '',
            container_no: '',
            booking_no: '',
            category: '',
            reefer_reqt: 'NO',
            seal_no: '',
            iso_code: '',
            driver_licence: '',
            move_type: '',
            transport_company: '',
            drivers_name: '',
            plate_no: '',
            trans_creator: 'SYSTEM',
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
        setEditMode(false);
    };

    const [editMode, setEditMode] = useState(false);
    const [__, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const submitData = {
                ...formData,
                gate_in: new Date(formData.gate_in).toISOString(),
                gross_weight: Number(formData.gross_weight),
                tare_weight: Number(formData.tare_weight),
                net_weight: Number(formData.net_weight),
                vgm_weight: formData.vgm_weight ? Number(formData.vgm_weight) : null
            };

            let response = await RequestHandler.fetchData('POST', 'gate-entry/create', submitData);
            if (response && !response.success === false) {
                alert(editMode ? 'Entry updated successfully!' : 'Entry created successfully!');
                setIsModalOpen(false);
                resetForm();
                fetchRecords();
            } else {
                alert(response.message || 'Failed to save entry');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Failed to save entry. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const DetailModal = ({ record, onClose }: { record: any; onClose: any }) => {
        const [showGateOut, setShowGateOut] = useState(false);
        const [gateOutForm, setGateOutForm] = useState('');

        const handleGateOut = async (e: any) => {
            e.preventDefault();
            setIsSubmitting(true);
            try {
                let response = await RequestHandler.fetchData('POST', 'gate-entry/gate-out', {
                    id: record.id,
                    gate_out: gateOutForm
                });
                if (response && !response.success === false) {
                    setIsModalOpen(false);
                    resetForm();
                    fetchRecords();
                    onClose();
                } else {
                    alert(response.message || 'Failed to save gate out');
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                alert('Failed to gate out entry. Please try again.');
            } finally {
                setIsSubmitting(false);
            }
        };

        if (!record) return null;

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Truck Record Details</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-semibold">Gate In:</span>{" "}
                            {formatDate(record.gate_in)}
                        </div>

                        {/* GATE OUT */}
                        <div>
                            <span className="font-semibold">Gate Out:</span>{" "}
                            {record.gate_out ? (
                                formatDate(record.gate_out)
                            ) : (
                                <button
                                    onClick={() => setShowGateOut(true)}
                                    className="ml-2 text-blue-600 hover:underline"
                                >
                                    Gate Out
                                </button>
                            )}
                        </div>

                        <div><span className="font-semibold">Location:</span> {record.location}</div>
                        <div><span className="font-semibold">Transaction NBR:</span> {record.transaction_nbr}</div>
                        <div><span className="font-semibold">Shipping Line:</span> {record.shipping_line}</div>
                        <div><span className="font-semibold">Container No:</span> {record.container_no}</div>
                        <div><span className="font-semibold">Booking No:</span> {record.booking_no}</div>
                        <div><span className="font-semibold">Reefer REQT:</span> {record.reefer_reqt}</div>
                        <div><span className="font-semibold">Seal No:</span> {record.seal_no}</div>
                        <div><span className="font-semibold">ISO CODE:</span> {record.iso_code}</div>
                        <div><span className="font-semibold">Category:</span> {record.category}</div>
                        <div><span className="font-semibold">Driver License:</span> {record.driver_licence}</div>
                        <div><span className="font-semibold">Move:</span> {record.move_type}</div>
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
                        <div className="col-span-2">
                            <span className="font-semibold">Inspection Notes:</span>{" "}
                            {record.inspection_notes || 'None'}
                        </div>
                        <div><span className="font-semibold">Gate Inspector:</span> {record.gate_inspector}</div>
                        <div><span className="font-semibold">VGM Weight:</span> {record.vgm_weight} kg</div>
                    </div>

                    {showGateOut && (
                        <form onSubmit={handleGateOut} className="mt-6 border-t pt-4">
                            <label className="block text-sm font-semibold mb-2">
                                Gate Out Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                value={gateOutForm}
                                onChange={(e) => setGateOutForm(e.target.value)}
                                required
                                className="w-full border rounded px-3 py-2 mb-4"
                            />

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowGateOut(false)}
                                    className="px-4 py-2 border rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    Confirm Gate Out
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 p-6 overflow-y-auto">
            {/* Search and Add Button */}

            <div className="flex items-center space-x-4 mb-2">
                <div className='flex justify-between w-full items-center bg-gray-300 p-3 rounded-lg'>
                    <h2 className="text-2xl font-bold mb-4 text-blue-900">Truck Records</h2>
                    <div className='flex gap-4'>
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search records..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        >
                            <Plus size={20} />
                            Add Entry
                        </button>
                        {/* <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                        >
                            Report
                        </button> */}
                    </div>
                </div>
            </div>

            <section>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-blue-950 to-blue-700 text-white text-sm">
                                    <th className="p-3 text-center text-xs">Gate In</th>
                                    <th className="p-3 text-center text-xs">Gate Out</th>
                                    <th className="p-3 text-center text-xs">Location</th>
                                    <th className="p-3 text-center text-xs">Container No.</th>
                                    <th className="p-3 text-center text-xs">Transaction NBR</th>
                                    <th className="p-3 text-center text-xs">Shipping Line</th>
                                    <th className="p-3 text-center text-xs">Booking No</th>
                                    <th className="p-3 text-center text-xs">ISO CODE</th>
                                    <th className="p-3 text-center text-xs">Category</th>
                                    {/* <th className="p-3 text-center text-xs">Move</th> */}
                                    <th className="p-3 text-center text-xs">Transport Company</th>
                                    <th className="p-3 text-center text-xs">Driver's Name</th>
                                    <th className="p-3 text-center text-xs">Plate No</th>
                                    <th className="p-3 text-center text-xs">MNR Status</th>
                                    <th className="p-3 text-center text-xs">Days in Yard</th>
                                    <th className="p-3 text-center text-xs">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.length > 0 ? (
                                    filteredRecords.map((record: any) => (
                                        <tr
                                            key={record.id}
                                            onClick={() => setSelectedRecord(record)}
                                            className="cursor-pointer hover:bg-blue-100 transition text-sm"
                                        >
                                            <td className="p-2 border-r border-gray-200">{formatDate(record.gate_in)}</td>
                                            <td className="p-2 border-r border-gray-200">{record.gate_out ? formatDate(record.gate_out) : 'N/A'}</td>
                                            <td className="p-2 border-r border-gray-200">{record.location}</td>
                                            <td className="p-2 border-r border-gray-200">{record.container_no}</td>
                                            <td className="p-2 border-r border-gray-200">{record.transaction_nbr}</td>
                                            <td className="p-2 border-r border-gray-200">{record.shipping_line}</td>
                                            <td className="p-2 border-r border-gray-200">{record.booking_no}</td>
                                            <td className="p-2 border-r border-gray-200">{record.iso_code}</td>
                                            <td className="p-2 border-r border-gray-200">{record.category}</td>
                                            {/* <td className="p-3 border-r border-gray-200">{record.move_type}</td> */}
                                            <td className="p-2 border-r border-gray-200">{record.transport_company}</td>
                                            <td className="p-2 border-r border-gray-200">{record.drivers_name}</td>
                                            <td className="p-2 border-r border-gray-200">{record.plate_no}</td>
                                            <td className="p-2 border-r border-gray-200">{record.mnr_status}</td>
                                            <td className="p-2">{record.days_in_yard - 1} {record.days_in_yard === 1 ? 'Day' : 'Days'}</td>
                                            <td className="p-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleReportClick(record);
                                                    }}
                                                    className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                                                >
                                                    Report
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={16} className="text-center p-8 text-gray-500">
                                            No truck records found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-100 p-8 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6 text-center">Truck Data Entry Form</h2>

                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block mb-2 font-medium">Gate In: *</label>
                                    <input
                                        type="date"
                                        name="gate_in"
                                        min={getTodayDate()}
                                        value={formData.gate_in}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">
                                        Location (Block-Row-Bay-Tier): *
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        placeholder="XA-1-1-1"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">Transaction NBR: *</label>
                                    <input
                                        type="text"
                                        name="transaction_nbr"
                                        value={formData.transaction_nbr}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">Shipping Line: *</label>
                                    <input
                                        type="text"
                                        name="shipping_line"
                                        value={formData.shipping_line}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">Container No: *</label>
                                    <input
                                        type="text"
                                        name="container_no"
                                        value={formData.container_no}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        maxLength={11}
                                        minLength={11}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">Booking No: </label>
                                    <input
                                        type="text"
                                        name="booking_no"
                                        value={formData.booking_no}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"

                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">Category: *</label>
                                    <input
                                        type="text"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">Reefer REQT:</label>
                                    <input
                                        type="text"
                                        name="reefer_reqt"
                                        value={formData.reefer_reqt}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">Seal No:</label>
                                    <input
                                        type="text"
                                        name="seal_no"
                                        value={formData.seal_no}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">ISO CODE: *</label>
                                    <input
                                        type="text"
                                        name="iso_code"
                                        value={formData.iso_code}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">Driver License:</label>
                                    <input
                                        type="text"
                                        name="driver_licence"
                                        value={formData.driver_licence}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">Move: *</label>
                                    <input
                                        type="text"
                                        name="move_type"
                                        value={formData.move_type}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">Transport Company: *</label>
                                    <input
                                        type="text"
                                        name="transport_company"
                                        value={formData.transport_company}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">Driver's Name: *</label>
                                    <input
                                        type="text"
                                        name="drivers_name"
                                        value={formData.drivers_name}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">Plate No: *</label>
                                    <input
                                        type="text"
                                        name="plate_no"
                                        value={formData.plate_no}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">Trans Creator:</label>
                                    <input
                                        type="text"
                                        name="trans_creator"
                                        value={formData.trans_creator}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">Gross Weight (kg): *</label>
                                    <input
                                        type="number"
                                        name="gross_weight"
                                        value={formData.gross_weight}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">Tare Weight (kg): *</label>
                                    <input
                                        type="number"
                                        name="tare_weight"
                                        value={formData.tare_weight}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">Net Weight (kg): *</label>
                                    <input
                                        type="number"
                                        name="net_weight"
                                        value={formData.net_weight}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">Entry Lane:</label>
                                    <input
                                        type="text"
                                        name="entry_lane"
                                        value={formData.entry_lane}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">Exit Lane:</label>
                                    <input
                                        type="text"
                                        name="exit_lane"
                                        value={formData.exit_lane}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">MNR Status:</label>
                                    <input
                                        type="text"
                                        name="mnr_status"
                                        value={formData.mnr_status}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">Damage Code:</label>
                                    <input
                                        type="text"
                                        name="damage_code"
                                        value={formData.damage_code}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">Inspection Notes:</label>
                                    <input
                                        type="text"
                                        name="inspection_notes"
                                        value={formData.inspection_notes}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">Gate Inspector:</label>
                                    <input
                                        type="text"
                                        name="gate_inspector"
                                        value={formData.gate_inspector}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 font-medium">VGM Weight (kg):</label>
                                    <input
                                        type="number"
                                        name="vgm_weight"
                                        value={formData.vgm_weight}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                                >
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isReportModalOpen && reportData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* <div className="flex justify-between items-center mb-6">                            
                            <button onClick={() => setIsReportModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div> */}
                        <EquipmentInterchangeReceipt data={reportData} />
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => window.print()}
                                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                            >
                                Print
                            </button>
                            <button
                                onClick={() => setIsReportModalOpen(false)}
                                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedRecord && (
                <DetailModal
                    record={selectedRecord}
                    onClose={() => setSelectedRecord(null)}
                />
            )}
        </div>
    );
};

export default GateEntryManagement;