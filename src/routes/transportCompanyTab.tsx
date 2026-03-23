import { useEffect, useState } from 'react';
import { Plus, Building2, Edit2, Trash2 } from 'lucide-react';
import RequestHandler from '../lib/utilities/RequestHandler';
import Swal from 'sweetalert2';
import DynamicForm, { DynamicFormField } from '../components/form';
import DataTable from '../components/table';
import { useAuth } from '../lib/context/auth';

interface TransportCompanyRecord {
    id: number;
    name: string;
    code: string;
    status: 'active' | 'banned';
}

const TransportCompanyTab = () => {
    const { admin } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [records, setRecords] = useState<TransportCompanyRecord[]>([]);
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
            const response = await RequestHandler.fetchData('GET', 'transport-companies/get-all');
            if (response?.success) {
                setRecords(response.transportCompanies);
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch transport companies.' });
                setRecords([]);
            }
        } catch (error) {
            console.error('Error fetching records:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch transport companies.' });
            setRecords([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddNew = () => {
        setEditMode(false);
        setEditingId(null);
        setInitialFormValues({ name: '', code: '', status: 'active' });
        setIsModalOpen(true);
    };

    const handleEdit = (record: TransportCompanyRecord) => {
        setEditMode(true);
        setEditingId(record.id);
        setInitialFormValues({
            name: record.name,
            code: record.code,
            status: record.status,
        });
        setIsModalOpen(true);
    };

    /**
     * Check for duplicate code or name among existing records.
     * When editing, exclude the record being edited (by id).
     */
    const checkDuplicates = (code: string, name: string): { field: string; value: string } | null => {
        const normalizedCode = code.trim().toUpperCase();
        const normalizedName = name.trim().toLowerCase();

        for (const record of records) {
            if (editMode && record.id === editingId) continue;

            if (record.code.trim().toUpperCase() === normalizedCode) {
                return { field: 'Code', value: record.code };
            }
            if (record.name.trim().toLowerCase() === normalizedName) {
                return { field: 'Company Name', value: record.name };
            }
        }
        return null;
    };

    const getFormFields = (): DynamicFormField[] => [
        {
            name: 'name',
            label: 'Company Name',
            type: 'text',
            icon: Building2,
            placeholder: 'e.g., Santos Trucking Inc.',
            required: true,
            value: initialFormValues.name,
        },
        {
            name: 'code',
            label: 'Code',
            type: 'text',
            icon: Building2,
            placeholder: 'e.g., STI',
            required: true,
            value: initialFormValues.code,
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
        const duplicate = checkDuplicates(data.code, data.name);
        if (duplicate) {
            await Swal.fire({
                icon: 'warning',
                title: 'Duplicate Found',
                html: `<p>A transport company with this <strong>${duplicate.field}</strong> already exists.</p><p class="mt-2 font-mono text-sm text-slate-700">"${duplicate.value}"</p><p class="mt-2 text-sm text-slate-500">Please use a different ${duplicate.field.toLowerCase()}.</p>`,
                confirmButtonColor: '#f59e0b',
                confirmButtonText: 'Got it',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                name: data.name.trim(),
                code: data.code.trim().toUpperCase(),
                status: data.status,
            };

            let response;
            if (editMode && editingId) {
                response = await RequestHandler.fetchData('PUT', `transport-companies/update/${editingId}`, payload);
            } else {
                response = await RequestHandler.fetchData('POST', 'transport-companies/create', payload);
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

    const handleDelete = async (record: TransportCompanyRecord) => {
        const result = await Swal.fire({
            title: 'Confirm Delete',
            html: `<p>Remove <strong>${record.name}</strong>?</p>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Delete',
        });

        if (!result.isConfirmed) return;

        setIsSubmitting(true);
        try {
            const response = await RequestHandler.fetchData('DELETE', `transport-companies/delete/${record.id}`);
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

    const handleToggleStatus = async (record: TransportCompanyRecord) => {
        const newStatus: 'active' | 'banned' = record.status === 'active' ? 'banned' : 'active';
        setIsSubmitting(true);
        try {
            await RequestHandler.fetchData('PUT', `transport-companies/update/${record.id}`, {
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

    const columns = [
        {
            key: 'code',
            label: 'Code',
            sortable: true,
            render: (value: string) => (
                <p className="text-sm font-bold text-slate-800 font-mono">{value}</p>
            ),
        },
        {
            key: 'name',
            label: 'Company Name',
            sortable: true,
            render: (value: string) => (
                <p className="text-sm text-slate-800">{value}</p>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (value: string, row: TransportCompanyRecord) => (
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
            render: (_: any, row: TransportCompanyRecord) => (
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
                            Transport Companies
                        </h1>
                        <p className="text-slate-600 text-sm">Manage transport company records</p>
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
                    title="Transport Company Records"
                    loading={isLoading}
                    searchable={true}
                    exportable={true}
                    printable={true}
                    pageSize={25}
                    pageSizeOptions={[10, 25, 50, 100]}
                    emptyMessage="No transport companies found"
                />
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-3xl font-bold mb-6 text-center text-gray-900">
                            {editMode ? 'Edit Transport Company' : 'Add Transport Company'}
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

export default TransportCompanyTab;