import { useEffect, useState } from 'react';
import { ShieldCheck, User } from 'lucide-react';
import RequestHandler from '../lib/utilities/RequestHandler';
import Swal from 'sweetalert2';
import DataTable from '../components/table';
import { useAuth } from '../lib/context/auth';

interface AdminRecord {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user';
    createdAt: string;
}

const RoleAssignmentTab = () => {
    const { admin: currentAdmin } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [records, setRecords] = useState<AdminRecord[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        setIsLoading(true);
        try {
            const response = await RequestHandler.fetchData('GET', 'auth/get-all');
            if (response?.success) {
                setRecords(response.admins);
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch users.' });
                setRecords([]);
            }
        } catch {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch users.' });
            setRecords([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssignRole = async (record: AdminRecord, newRole: 'admin' | 'user') => {
        if (record.id === currentAdmin?.id) {
            Swal.fire({ icon: 'warning', title: 'Action Denied', text: 'You cannot change your own role.' });
            return;
        }
        if (record.role === newRole) return;

        const result = await Swal.fire({
            title: 'Confirm Role Change',
            html: `<p>Change <strong>${record.name}</strong>'s role to <strong>${newRole === 'admin' ? 'Admin' : 'User'}</strong>?</p>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Change',
        });

        if (!result.isConfirmed) return;

        setIsSubmitting(true);
        try {
            const response = await RequestHandler.fetchData('PUT', `auth/update/${record.id}`, {
                role: newRole,
            });

            if (response?.success) {
                setRecords(prev => prev.map(r => r.id === record.id ? { ...r, role: newRole } : r));
                Swal.fire({ icon: 'success', title: 'Role Updated!', timer: 1500, showConfirmButton: false });
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: response?.message || 'Failed to update role.' });
            }
        } catch {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update role.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns = [
        {
            key: 'name',
            label: 'Name',
            sortable: true,
            render: (value: string, row: AdminRecord) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{value.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-800">{value}</p>
                        {row.id === currentAdmin?.id && (
                            <span className="text-[10px] font-bold text-blue-500">You</span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'email',
            label: 'Email',
            sortable: true,
            render: (value: string) => (
                <p className="text-sm text-slate-500 font-mono">{value}</p>
            ),
        },
        {
            key: 'role',
            label: 'Current Role',
            sortable: true,
            render: (value: string) => (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
                    ${value === 'admin'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}
                >
                    {value === 'admin'
                        ? <ShieldCheck className="w-3 h-3" />
                        : <User className="w-3 h-3" />
                    }
                    {value === 'admin' ? 'Admin' : 'User'}
                </span>
            ),
            exportRender: (value: string) => value,
        },
        {
            key: 'createdAt',
            label: 'Created',
            sortable: true,
            render: (value: string) => (
                <p className="text-sm text-slate-500">
                    {new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
            ),
        },
        {
            key: 'actions',
            label: 'Assign Role',
            sortable: false,
            filterable: false,
            render: (_: any, row: AdminRecord) => {
                const isSelf = row.id === currentAdmin?.id;
                return (
                    <div className="flex gap-2">
                        <button
                            disabled={isSubmitting || isSelf || row.role === 'admin'}
                            onClick={(e) => { e.stopPropagation(); handleAssignRole(row, 'admin'); }}
                            title={isSelf ? 'Cannot change your own role' : 'Set as Admin'}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all
                                ${row.role === 'admin' || isSelf
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-indigo-500 text-white hover:bg-indigo-600 cursor-pointer'
                                }`}
                        >
                            <ShieldCheck size={14} /> Admin
                        </button>
                        <button
                            disabled={isSubmitting || isSelf || row.role === 'user'}
                            onClick={(e) => { e.stopPropagation(); handleAssignRole(row, 'user'); }}
                            title={isSelf ? 'Cannot change your own role' : 'Set as User'}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all
                                ${row.role === 'user' || isSelf
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-slate-500 text-white hover:bg-slate-600 cursor-pointer'
                                }`}
                        >
                            <User size={14} /> User
                        </button>
                    </div>
                );
            },
            exportRender: () => '',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
            <div className="max-w-[75vw] mx-auto">
                <div className="mb-3">
                    <h1
                        className="text-4xl font-black mb-3 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent"
                        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.02em' }}
                    >
                        Role Assignment
                    </h1>
                    <p className="text-slate-600 text-sm">Assign roles to system accounts</p>
                </div>

                <DataTable
                    columns={columns}
                    data={records}
                    title="User Accounts"
                    loading={isLoading}
                    searchable={true}
                    exportable={true}
                    printable={true}
                    pageSize={25}
                    pageSizeOptions={[10, 25, 50, 100]}
                    emptyMessage="No accounts found"
                />
            </div>
        </div>
    );
};

export default RoleAssignmentTab;