import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/context/auth';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (!isLoading && !isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <>
            {children}
            {isLoading && (
                <div className="fixed inset-0 bg-white/60 flex items-center justify-center z-[9999]">
                    <svg className="animate-spin w-10 h-10 text-orange-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </div>
            )}
        </>
    );
};

export default ProtectedRoute;