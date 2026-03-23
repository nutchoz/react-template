import { useState } from 'react';
import { LogOut, UserPlus, X, Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import RequestHandler from '../lib/utilities/RequestHandler';
import Swal from 'sweetalert2';
import { useAuth } from '../lib/context/auth';

interface HeaderProps {
    headerName: string;
}

export default function Header({ headerName }: HeaderProps) {
    const { admin, logout } = useAuth();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '' });

    const isAdmin = admin?.role === 'admin';

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: 'Sign Out',
            text: 'Are you sure you want to log out?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Log Out',
        });
        if (result.isConfirmed) await logout();
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await RequestHandler.fetchData('POST', 'auth/create-admin', {
                ...form,
                role: 'user', // header always creates users
            });
            if (response?.success) {
                await Swal.fire({ icon: 'success', title: 'User Created!', timer: 2000, showConfirmButton: false });
                closeModal();
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: response?.message || 'Failed to create user.' });
            }
        } catch {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to create user. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setIsCreateModalOpen(false);
        setForm({ name: '', email: '', password: '' });
    };

    return (
        <>
            <header className="flex w-full min-h-[80px] bg-gradient-to-r from-orange-700 to-orange-500 border-b-8 border-blue-900 shadow-md items-center px-6 justify-between">
                {/* Page Title */}
                <div className="text-3xl text-gray-50 font-bold">{headerName}</div>

                {/* Right side: admin info + actions */}
                <div className="flex items-center gap-3">
                    {/* Admin info */}
                    {admin && (
                        <div className="flex items-center gap-2 bg-white/15 px-4 py-2 rounded-xl">
                            <div className="w-8 h-8 bg-white/25 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                            </div>
                            <div className="leading-tight">
                                <p className="text-white font-semibold text-sm">{admin.name}</p>
                                <div className="flex items-center gap-1.5">
                                    <p className="text-orange-200 text-xs">{admin.email}</p>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide border
                                        ${isAdmin
                                            ? 'bg-yellow-400/30 text-yellow-200 border-yellow-400/40'
                                            : 'bg-white/10 text-white/60 border-white/20'
                                        }`}
                                    >
                                        {isAdmin ? 'Admin' : 'User'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Create User — admin only */}
                    {isAdmin && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            title="Create User Account"
                            className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl transition-all duration-200 text-sm font-semibold border border-white/20"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span className="hidden sm:inline">Add User</span>
                        </button>
                    )}

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        title="Log Out"
                        className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl transition-all duration-200 text-sm font-semibold border border-red-500/40"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </header>

            {/* Create User Modal — admin only */}
            {isAdmin && isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Create User Account</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Add a new user to the system</p>
                            </div>
                            <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="px-8 py-6 space-y-5">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                        placeholder="e.g., Juan Dela Cruz"
                                        required
                                        disabled={isSubmitting}
                                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10 transition-all disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                        placeholder="user@example.com"
                                        required
                                        disabled={isSubmitting}
                                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10 transition-all disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={form.password}
                                        onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                        disabled={isSubmitting}
                                        className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10 transition-all disabled:opacity-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(p => !p)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all shadow-lg disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Creating...
                                        </span>
                                    ) : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}