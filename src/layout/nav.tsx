import {
    LayoutDashboard,
    ShieldCheck,
    Container,
    CreditCard,
    Ship,
    User,
    Truck,
    Hash,
    Users,
} from 'lucide-react';
import { useAuth } from '../lib/context/auth';

export default function Navbar() {
    const { admin } = useAuth();
    const path = window.location.pathname;
    const isAdmin = admin?.role === 'admin';

    const navLinks = [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { href: '/gate', label: 'Gate Entry', icon: ShieldCheck },
        { href: '/container', label: 'Container Grid', icon: Container },
        { href: '/paymentIn', label: 'Payment in', icon: CreditCard },
        { href: '/payment', label: 'Payment out', icon: CreditCard },
        { href: '/shipping', label: 'Shipping Line', icon: Ship },
        { href: '/driver', label: 'Driver', icon: User },
        { href: '/transport-company', label: 'Transport Company', icon: Truck },
        { href: '/plate-no', label: 'Plate No.', icon: Hash },
        
        // admin only
        { href: '/users', label: 'Users', icon: Users, adminOnly: true },
    ];

    const isActive = (href: string, exact?: boolean) =>
        exact ? path === href : path === href || path.startsWith(href + '/');

    return (
        <nav className="min-w-75 w-75 h-screen bg-gray-50 shadow-2xl">
            <div className="p-6">
                <img src="/logo.jpg" alt="Logo" className="w-full rounded-lg" />
            </div>

            <ul className="flex flex-col px-4 mt-8 space-y-2">
                {navLinks
                    .filter(link => !link.adminOnly || isAdmin)
                    .map(({ href, label, icon: Icon, exact }) => {
                        const active = isActive(href, exact);
                        return (
                            <li key={href}>
                                <a
                                    href={href}
                                    className={`flex items-center gap-3 px-6 py-2 text-lg font-medium rounded-lg border-2 transition-all duration-300
                                        ${active
                                            ? 'border-orange-400 bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-md translate-x-1'
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800 hover:shadow-sm hover:translate-x-1'
                                        }`}
                                >
                                    <Icon size={20} />
                                    {label}
                                </a>
                            </li>
                        );
                    })}
            </ul>
        </nav>
    );
}