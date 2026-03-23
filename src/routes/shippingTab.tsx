import { useEffect, useState } from 'react';
import { Plus, Package, Edit2, Trash2, Mail } from 'lucide-react';
import RequestHandler from '../lib/utilities/RequestHandler';
import Swal from 'sweetalert2';
import DynamicForm, { DynamicFormField } from '../components/form';
import DataTable from '../components/table';
import { useAuth } from '../lib/context/auth';

interface ShippingLineRecord {
    id: number;
    code: string;
    name: string;
    email: string; //  comma-separated, e.g. "a@x.com, b@x.com, c@x.com"
    life_state: 'Active' | 'Inactive';
}

//  Validate every email in a comma-separated string
const validateEmails = (value: string): string | null => {
    if (!value || !value.trim()) return null; // field is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalid = value.split(',').map(e => e.trim()).filter(e => e && !emailRegex.test(e));
    if (invalid.length > 0) return `Invalid email${invalid.length > 1 ? 's' : ''}: ${invalid.join(', ')}`;
    return null;
};

//  Normalise: trim each part, remove blanks, rejoin with ", "
const normaliseEmails = (value: string): string =>
    value.split(',').map(e => e.trim()).filter(Boolean).join(', ');

const ShippingTab = () => {
    const { admin } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [records, setRecords] = useState<ShippingLineRecord[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [initialFormValues, setInitialFormValues] = useState<Record<string, any>>({});

    useEffect(() => { fetchRecords(); }, []);

    const fetchRecords = async () => {
        setIsLoading(true);
        try {
            const response = await RequestHandler.fetchData('GET', 'shipping-lines/get-all');
            if (response?.success) {
                setRecords(response.shippingLines);
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch shipping lines.' });
                setRecords([]);
            }
        } catch (error) {
            console.error('Error fetching records:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch shipping lines.' });
            setRecords([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddNew = () => {
        setEditMode(false);
        setEditingId(null);
        setInitialFormValues({ code: '', name: '', email: '', life_state: 'Active' });
        setIsModalOpen(true);
    };

    const handleEdit = (record: ShippingLineRecord) => {
        setEditMode(true);
        setEditingId(record.id);
        setInitialFormValues({
            code: record.code,
            name: record.name,
            email: record.email ?? '',
            life_state: record.life_state,
        });
        setIsModalOpen(true);
    };

    const checkDuplicates = (code: string, name: string): { field: string; value: string } | null => {
        const normCode = code.toUpperCase().trim();
        const normName = name.trim().toLowerCase();
        for (const r of records) {
            if (editMode && r.id === editingId) continue;
            if (r.code.toUpperCase().trim() === normCode) return { field: 'Code', value: r.code };
            if (r.name.trim().toLowerCase() === normName) return { field: 'Shipping Line Name', value: r.name };
        }
        return null;
    };

    const getFormFields = (): DynamicFormField[] => [
        {
            name: 'code',
            label: 'Code',
            type: 'text',
            icon: Package,
            placeholder: 'e.g., MSC, MAERSK',
            required: true,
            value: initialFormValues.code,
        },
        {
            name: 'name',
            label: 'Shipping Line Name',
            type: 'text',
            icon: Package,
            placeholder: 'e.g., Mediterranean Shipping Company',
            required: true,
            value: initialFormValues.name,
        },
        {
            //  type='text' so the browser accepts comma-separated values freely
            name: 'email',
            label: 'Email(s)',
            type: 'text',
            icon: Mail,
            placeholder: 'ops@msc.com, notify@msc.com, billing@msc.com',
            required: false,
            value: initialFormValues.email,
            validation: validateEmails,
        },
        {
            name: 'life_state',
            label: 'Life State',
            type: 'select',
            required: true,
            value: initialFormValues.life_state ?? 'Active',
            options: [
                { label: 'Active', value: 'Active' },
                { label: 'Inactive', value: 'Inactive' },
            ],
        },
    ];

    const handleFormSubmit = async (data: Record<string, any>) => {
        const duplicate = checkDuplicates(data.code, data.name);
        if (duplicate) {
            await Swal.fire({
                icon: 'warning',
                title: 'Duplicate Found',
                html: `<p>A shipping line with this <strong>${duplicate.field}</strong> already exists.</p><p class="mt-2 font-mono text-sm text-slate-700">"${duplicate.value}"</p><p class="mt-2 text-sm text-slate-500">Please use a different ${duplicate.field.toLowerCase()}.</p>`,
                confirmButtonColor: '#f59e0b',
                confirmButtonText: 'Got it',
            });
            return;
        }

        const emailError = validateEmails(data.email);
        if (emailError) {
            await Swal.fire({ icon: 'error', title: 'Invalid Email(s)', text: emailError, confirmButtonColor: '#ef4444' });
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                code: data.code.toUpperCase().trim(),
                name: data.name,
                //  normalise then store; null when blank
                email: data.email ? normaliseEmails(data.email) : null,
                life_state: data.life_state,
            };

            const response = editMode && editingId
                ? await RequestHandler.fetchData('PUT', `shipping-lines/update/${editingId}`, payload)
                : await RequestHandler.fetchData('POST', 'shipping-lines/create', payload);

            if (response?.success) {
                await Swal.fire({ icon: 'success', title: editMode ? 'Updated!' : 'Added!', timer: 2000, showConfirmButton: false });
                setIsModalOpen(false);
                setEditMode(false);
                setEditingId(null);
                setInitialFormValues({});
                fetchRecords();
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: response?.message || 'Failed to save.' });
            }
        } catch {
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

    const handleDelete = async (record: ShippingLineRecord) => {
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
            const response = await RequestHandler.fetchData('DELETE', `shipping-lines/delete/${record.id}`);
            if (response?.success) {
                await Swal.fire({ icon: 'success', title: 'Deleted!', timer: 2000, showConfirmButton: false });
                fetchRecords();
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete.' });
            }
        } catch {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleLifeState = async (record: ShippingLineRecord) => {
        const newState: 'Active' | 'Inactive' = record.life_state === 'Active' ? 'Inactive' : 'Active';
        setIsSubmitting(true);
        try {
            await RequestHandler.fetchData('PUT', `shipping-lines/update/${record.id}`, { ...record, life_state: newState });
            setRecords(prev => prev.map(r => r.id === record.id ? { ...r, life_state: newState } : r));
        } catch {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update life state.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns = [
        {
            key: 'code', label: 'Code', sortable: true,
            render: (value: string) => <p className="text-sm font-bold text-slate-800 font-mono">{value}</p>,
        },
        {
            key: 'name', label: 'Shipping Line Name', sortable: true,
            render: (value: string) => <p className="text-sm text-slate-800">{value}</p>,
        },
        {
            key: 'email', label: 'Email(s)', sortable: true,
            render: (value: string) => {
                if (!value) return <span className="text-sm text-slate-400 italic">—</span>;
                //  Render each email as its own pill
                const emails = value.split(',').map(e => e.trim()).filter(Boolean);
                return (
                    <div className="flex flex-col gap-1">
                        {emails.map((email, i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full w-fit">
                                <Mail size={10} className="text-slate-400" />
                                {email}
                            </span>
                        ))}
                    </div>
                );
            },
            exportRender: (value: string) => value || '—',
        },
        {
            key: 'life_state', label: 'Life State', sortable: true,
            render: (value: string, row: ShippingLineRecord) => (
                <button
                    onClick={(e) => { e.stopPropagation(); handleToggleLifeState(row); }}
                    title={`Click to set ${value === 'Active' ? 'Inactive' : 'Active'}`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all duration-200 cursor-pointer select-none ${
                        value === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                    }`}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${value === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {value}
                </button>
            ),
            exportRender: (value: string) => value,
        },
        {
            key: 'actions', label: 'Actions', sortable: false, filterable: false,
            render: (_: any, row: ShippingLineRecord) => (
                <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-semibold flex items-center gap-1">
                        <Edit2 size={14} /> Edit
                    </button>
                    {admin?.role === 'admin' && (
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-semibold flex items-center gap-1">
                            <Trash2 size={14} /> Delete
                        </button>
                    )}
                </div>
            ),
            exportRender: () => '',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
            <div className="max-w-[75vw] mx-auto">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <h1 className="text-4xl font-black mb-3 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.02em' }}>
                            Shipping Line
                        </h1>
                        <p className="text-slate-600 text-sm">Manage shipping lines</p>
                    </div>
                    <button onClick={handleAddNew} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
                        <Plus size={24} /> Add Entry
                    </button>
                </div>

                <DataTable
                    columns={columns}
                    data={records}
                    title="Shipping Line Records"
                    loading={isLoading}
                    searchable={true}
                    exportable={true}
                    printable={true}
                    pageSize={25}
                    pageSizeOptions={[10, 25, 50, 100]}
                    emptyMessage="No shipping lines found"
                />
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-3xl font-bold mb-2 text-center text-gray-900">
                            {editMode ? 'Edit Shipping Line' : 'Add Shipping Line'}
                        </h2>
                        <p className="text-sm text-slate-500 text-center mb-6">
                            Multiple emails? Separate them with a comma.
                        </p>
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

export default ShippingTab;