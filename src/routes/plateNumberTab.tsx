import { useEffect, useState } from 'react';
import { Plus, Truck, Edit2, Trash2, Calendar } from 'lucide-react';
import RequestHandler from '../lib/utilities/RequestHandler';
import Swal from 'sweetalert2';
import DynamicForm, { DynamicFormField } from '../components/form';
import DataTable from '../components/table';
import { useAuth } from '../lib/context/auth';

interface PlateNumberRecord {
    id: number;
    plateNumber: string;
    licenseExpiryDate: string;
    status: 'active' | 'banned';
    truckCompany: string;
}

const PlateNumberTab = () => {
    const { admin } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [records, setRecords] = useState<PlateNumberRecord[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [initialFormValues, setInitialFormValues] = useState<Record<string, any>>({});

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        setIsLoading(true);
        try {
            const response = await RequestHandler.fetchData('GET', 'plate-numbers/get-all');
            if (response?.success) {
                setRecords(response.plateNumbers);
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch plate numbers.' });
                setRecords([]);
            }
        } catch (error) {
            console.error('Error fetching records:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch plate numbers.' });
            setRecords([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddNew = () => {
        setEditMode(false);
        setEditingId(null);
        setInitialFormValues({ plateNumber: '', licenseExpiryDate: '', status: 'active', truckCompany: '' });
        setIsModalOpen(true);
    };

    const handleEdit = (record: PlateNumberRecord) => {
        setEditMode(true);
        setEditingId(record.id);
        setInitialFormValues({
            plateNumber: record.plateNumber,
            licenseExpiryDate: record.licenseExpiryDate
                ? new Date(record.licenseExpiryDate).toISOString().split('T')[0]
                : '',
            status: record.status,
            truckCompany: record.truckCompany,
        });
        setIsModalOpen(true);
    };

    /**
     * Check for duplicate plateNumber among existing records.
     * When editing, exclude the record being edited (by id).
     */
    const checkDuplicates = (plateNumber: string): { field: string; value: string } | null => {
        const normalized = plateNumber.trim().toUpperCase();

        for (const record of records) {
            if (editMode && record.id === editingId) continue;

            if (record.plateNumber.trim().toUpperCase() === normalized) {
                return { field: 'Plate Number', value: record.plateNumber };
            }
        }
        return null;
    };

    const getFormFields = (): DynamicFormField[] => [
        {
            name: 'plateNumber',
            label: 'Plate Number',
            type: 'text',
            icon: Truck,
            placeholder: 'e.g., ABC 1234',
            required: true,
            value: initialFormValues.plateNumber,
        },
        {
            name: 'licenseExpiryDate',
            label: 'License Expiry Date',
            type: 'date',
            icon: Calendar,
            placeholder: '',
            required: true,
            value: initialFormValues.licenseExpiryDate,
        },
        {
            name: 'truckCompany',
            label: 'Truck Company',
            type: 'text',
            icon: Truck,
            placeholder: 'e.g., Santos Trucking Inc.',
            required: true,
            value: initialFormValues.truckCompany,
        },
        {
            name: 'status',
            label: 'Status',
            type: 'select',
            required: true,
            value: initialFormValues.status ?? 'active',
            options: [
                { label: 'Active', value: 'active' },
                { label: 'Banned', value: 'banned' },
            ],
        },
    ];

    const handleFormSubmit = async (data: Record<string, any>) => {
        const duplicate = checkDuplicates(data.plateNumber);
        if (duplicate) {
            await Swal.fire({
                icon: 'warning',
                title: 'Duplicate Found',
                html: `<p>A record with this <strong>${duplicate.field}</strong> already exists.</p><p class="mt-2 font-mono text-sm text-slate-700">"${duplicate.value}"</p><p class="mt-2 text-sm text-slate-500">Please use a different ${duplicate.field.toLowerCase()}.</p>`,
                confirmButtonColor: '#f59e0b',
                confirmButtonText: 'Got it',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                plateNumber: data.plateNumber.trim().toUpperCase(),
                licenseExpiryDate: data.licenseExpiryDate,
                status: data.status,
                truckCompany: data.truckCompany.trim(),
            };

            let response;
            if (editMode && editingId) {
                response = await RequestHandler.fetchData('PUT', `plate-numbers/update/${editingId}`, payload);
            } else {
                response = await RequestHandler.fetchData('POST', 'plate-numbers/create', payload);
            }

            if (response?.success) {
                await Swal.fire({
                    icon: 'success',
                    title: editMode ? 'Updated!' : 'Added!',
                    timer: 2000,
                    showConfirmButton: false,
                });
                setIsModalOpen(false);
                setEditMode(false);
                setEditingId(null);
                setInitialFormValues({});
                fetchRecords();
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: response?.message || 'Failed to save.' });
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to save. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFormCancel = () => {
        setIsModalOpen(false);
        setEditMode(false);
        setEditingId(null);
        setInitialFormValues({});
    };

    const handleDelete = async (record: PlateNumberRecord) => {
        const result = await Swal.fire({
            title: 'Confirm Delete',
            html: `<p>Remove plate <strong>${record.plateNumber}</strong>?</p>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Delete',
        });

        if (!result.isConfirmed) return;

        setIsSubmitting(true);
        try {
            const response = await RequestHandler.fetchData('DELETE', `plate-numbers/delete/${record.id}`);
            if (response?.success) {
                await Swal.fire({ icon: 'success', title: 'Deleted!', timer: 2000, showConfirmButton: false });
                fetchRecords();
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete.' });
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (record: PlateNumberRecord) => {
        const newStatus: 'active' | 'banned' = record.status === 'active' ? 'banned' : 'active';
        setIsSubmitting(true);
        try {
            await RequestHandler.fetchData('PUT', `plate-numbers/update/${record.id}`, {
                ...record,
                status: newStatus,
            });
            setRecords(prev => prev.map(r => r.id === record.id ? { ...r, status: newStatus } : r));
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update status.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
    };

    const isExpired = (dateStr: string) => {
        if (!dateStr) return false;
        return new Date(dateStr) < new Date();
    };

    const columns = [
        {
            key: 'plateNumber',
            label: 'Plate Number',
            sortable: true,
            render: (value: string) => (
                <p className="text-sm font-bold text-slate-800 font-mono">{value}</p>
            ),
        },
        {
            key: 'truckCompany',
            label: 'Truck Company',
            sortable: true,
            render: (value: string) => (
                <p className="text-sm text-slate-800">{value}</p>
            ),
        },
        {
            key: 'licenseExpiryDate',
            label: 'License Expiry Date',
            sortable: true,
            render: (value: string) => {
                const expired = isExpired(value);
                return (
                    <span className={`text-sm font-medium ${expired ? 'text-red-600' : 'text-slate-700'}`}>
                        {formatDate(value)}
                        {expired && (
                            <span className="ml-2 text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                                Expired
                            </span>
                        )}
                    </span>
                );
            },
            exportRender: (value: string) => formatDate(value),
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (value: string, row: PlateNumberRecord) => (
                <button
                    onClick={(e) => { e.stopPropagation(); handleToggleStatus(row); }}
                    title={`Click to set ${value === 'active' ? 'Banned' : 'Active'}`}
                    className={`
                        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
                        border transition-all duration-200 cursor-pointer select-none
                        ${value === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                        }
                    `}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${value === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {value === 'active' ? 'Active' : 'Banned'}
                </button>
            ),
            exportRender: (value: string) => value,
        },
        

        ...(admin?.role === 'admin' ? [{
            key: 'actions',
            label: 'Actions',
            sortable: false,
            filterable: false,
            render: (_: any, row: PlateNumberRecord) => (
                <div className="flex gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                        className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-semibold flex items-center gap-1"
                    >
                        <Edit2 size={14} /> Edit
                    </button>
                    
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-semibold flex items-center gap-1"
                    >
                        <Trash2 size={14} /> Delete
                    </button>
                </div>
            ),
            exportRender: () => '',
        }] : []),
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
            <div className="max-w-[75vw] mx-auto">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <h1
                            className="text-4xl font-black mb-3 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent"
                            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.02em' }}
                        >
                            Plate Numbers
                        </h1>
                        <p className="text-slate-600 text-sm">Manage plate number records</p>
                    </div>
                    <button
                        onClick={handleAddNew}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        <Plus size={24} />
                        Add Entry
                    </button>
                </div>

                <DataTable
                    columns={columns}
                    data={records}
                    title="Plate Number Records"
                    loading={isLoading}
                    searchable={true}
                    exportable={true}
                    printable={true}
                    pageSize={25}
                    pageSizeOptions={[10, 25, 50, 100]}
                    emptyMessage="No plate numbers found"
                />
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-3xl font-bold mb-6 text-center text-gray-900">
                            {editMode ? 'Edit Plate Number' : 'Add Plate Number'}
                        </h2>
                        <DynamicForm
                            fields={getFormFields()}
                            onSubmit={handleFormSubmit}
                            onCancel={handleFormCancel}
                            submitLabel={editMode ? 'Update' : 'Submit'}
                            cancelLabel="Cancel"
                            showCancel={true}
                            loading={isSubmitting}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlateNumberTab;