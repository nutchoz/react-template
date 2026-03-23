import { useEffect, useState } from 'react';
import { Plus, User, Edit2, Trash2, CreditCard } from 'lucide-react';
import RequestHandler from '../lib/utilities/RequestHandler';
import Swal from 'sweetalert2';
import DynamicForm, { DynamicFormField } from '../components/form';
import DataTable from '../components/table';
import { useAuth } from '../lib/context/auth';

interface DriverRecord {
    id: number;
    name: string;
    licenseNumber: string;
    status: 'active' | 'banned';
    lifeState: 'active' | 'deceased';
}

const DriverTab = () => {
    const { admin } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [records, setRecords] = useState<DriverRecord[]>([]);
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
            const response = await RequestHandler.fetchData('GET', 'drivers/get-all');
            if (response?.success) {
                setRecords(response.drivers);
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch drivers.' });
                setRecords([]);
            }
        } catch (error) {
            console.error('Error fetching records:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch drivers.' });
            setRecords([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddNew = () => {
        setEditMode(false);
        setEditingId(null);
        setInitialFormValues({ name: '', licenseNumber: '', status: 'active', lifeState: 'active' });
        setIsModalOpen(true);
    };

    const handleEdit = (record: DriverRecord) => {
        setEditMode(true);
        setEditingId(record.id);
        setInitialFormValues({
            name: record.name,
            licenseNumber: record.licenseNumber,
            status: record.status,
            lifeState: record.lifeState,
        });
        setIsModalOpen(true);
    };

    /**
     * Check for duplicate licenseNumber among existing records.
     * When editing, exclude the record being edited (by id).
     */
    const checkDuplicates = (licenseNumber: string): { field: string; value: string } | null => {
        const normalizedLicense = licenseNumber.trim().toUpperCase();

        for (const record of records) {
            if (editMode && record.id === editingId) continue;

            if (record.licenseNumber.trim().toUpperCase() === normalizedLicense) {
                return { field: 'License Number', value: record.licenseNumber };
            }
        }
        return null;
    };

    const getFormFields = (): DynamicFormField[] => [
        {
            name: 'name',
            label: 'Driver Name',
            type: 'text',
            icon: User,
            placeholder: 'e.g., Juan Dela Cruz',
            required: true,
            value: initialFormValues.name,
        },
        {
            name: 'licenseNumber',
            label: 'License Number',
            type: 'text',
            icon: CreditCard,
            placeholder: 'e.g., N01-12-345678',
            required: true,
            value: initialFormValues.licenseNumber,
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
        {
            name: 'lifeState',
            label: 'Life State',
            type: 'select',
            required: true,
            value: initialFormValues.lifeState ?? 'active',
            options: [
                { label: 'Active', value: 'active' },
                { label: 'Deceased', value: 'deceased' },
            ],
        },
    ];

    const handleFormSubmit = async (data: Record<string, any>) => {
        // Duplicate check before hitting the API
        const duplicate = checkDuplicates(data.licenseNumber);
        if (duplicate) {
            await Swal.fire({
                icon: 'warning',
                title: 'Duplicate Found',
                html: `<p>A driver with this <strong>${duplicate.field}</strong> already exists.</p><p class="mt-2 font-mono text-sm text-slate-700">"${duplicate.value}"</p><p class="mt-2 text-sm text-slate-500">Please use a different ${duplicate.field.toLowerCase()}.</p>`,
                confirmButtonColor: '#f59e0b',
                confirmButtonText: 'Got it',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            let response;
            const payload = {
                name: data.name.trim(),
                licenseNumber: data.licenseNumber.trim().toUpperCase(),
                status: data.status,
                lifeState: data.lifeState,
            };

            if (editMode && editingId) {
                response = await RequestHandler.fetchData('PUT', `drivers/update/${editingId}`, payload);
            } else {
                response = await RequestHandler.fetchData('POST', 'drivers/create', payload);
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

    const handleDelete = async (record: DriverRecord) => {
        const result = await Swal.fire({
            title: 'Confirm Delete',
            html: `<p>Remove driver <strong>${record.name}</strong>?</p>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Delete',
        });

        if (!result.isConfirmed) return;

        setIsSubmitting(true);
        try {
            const response = await RequestHandler.fetchData('DELETE', `drivers/delete/${record.id}`);
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

    const handleToggleStatus = async (record: DriverRecord) => {
        const newStatus: 'active' | 'banned' = record.status === 'active' ? 'banned' : 'active';
        setIsSubmitting(true);
        try {
            await RequestHandler.fetchData('PUT', `drivers/update/${record.id}`, {
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

    const handleToggleLifeState = async (record: DriverRecord) => {
        const newState: 'active' | 'deceased' = record.lifeState === 'active' ? 'deceased' : 'active';
        setIsSubmitting(true);
        try {
            await RequestHandler.fetchData('PUT', `drivers/update/${record.id}`, {
                ...record,
                lifeState: newState,
            });
            setRecords(prev => prev.map(r => r.id === record.id ? { ...r, lifeState: newState } : r));
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update life state.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns = [
        {
            key: 'name',
            label: 'Driver Name',
            sortable: true,
            render: (value: string) => (
                <p className="text-sm font-semibold text-slate-800">{value}</p>
            ),
        },
        {
            key: 'licenseNumber',
            label: 'License Number',
            sortable: true,
            render: (value: string) => (
                <p className="text-sm font-bold text-slate-800 font-mono">{value}</p>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (value: string, row: DriverRecord) => (
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
        {
            key: 'lifeState',
            label: 'Life State',
            sortable: true,
            render: (value: string, row: DriverRecord) => (
                <button
                    onClick={(e) => { e.stopPropagation(); handleToggleLifeState(row); }}
                    title={`Click to set ${value === 'active' ? 'Deceased' : 'Active'}`}
                    className={`
                        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
                        border transition-all duration-200 cursor-pointer select-none
                        ${value === 'active'
                            ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                            : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                        }
                    `}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${value === 'active' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                    {value === 'active' ? 'Active' : 'Deceased'}
                </button>
            ),
            exportRender: (value: string) => value,
        },
        
            ...(admin?.role === 'admin' ? [{
            key: 'actions',
            label: 'Actions',
            sortable: false,
            filterable: false,
            render: (_: any, row: DriverRecord) => (
                <div className="flex gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                        className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-semibold flex items-center gap-1"
                    >
                        <Edit2 size={14} /> Edit
                    </button>
                    {admin?.role === 'admin' && (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-semibold flex items-center gap-1"
                    >
                        <Trash2 size={14} /> Delete
                    </button>)}
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
                            Drivers
                        </h1>
                        <p className="text-slate-600 text-sm">Manage driver records</p>
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
                    title="Driver Records"
                    loading={isLoading}
                    searchable={true}
                    exportable={true}
                    printable={true}
                    pageSize={25}
                    pageSizeOptions={[10, 25, 50, 100]}
                    emptyMessage="No drivers found"
                />
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-3xl font-bold mb-6 text-center text-gray-900">
                            {editMode ? 'Edit Driver' : 'Add Driver'}
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

export default DriverTab;