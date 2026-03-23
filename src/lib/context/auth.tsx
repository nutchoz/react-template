import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import RequestHandler from '../utilities/RequestHandler';

interface Admin {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface AuthContextType {
    admin: Admin | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [admin, setAdmin] = useState<Admin | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 🔄 Restore auth on app load
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('authToken');

            // no token → not logged in
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await RequestHandler.fetchData('GET', 'auth/me');

                if (response?.success && response.admin) {
                    setAdmin(response.admin);
                } else {
                    // token invalid → cleanup
                    localStorage.removeItem('authToken');
                    setAdmin(null);
                }
            } catch {
                localStorage.removeItem('authToken');
                setAdmin(null);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    // 🔐 LOGIN
    const login = async (
        email: string,
        password: string
    ): Promise<{ success: boolean; message?: string }> => {
        try {
            const response = await RequestHandler.fetchData(
                'POST',
                'auth/login',
                { email, password }
            );

            if (response?.success && response.token && response.admin) {
                // ✅ store JWT (RequestHandler expects authToken)
                localStorage.setItem('authToken', response.token);

                setAdmin(response.admin);
                return { success: true };
            }

            return {
                success: false,
                message: response?.message || 'Invalid credentials',
            };
        } catch {
            return {
                success: false,
                message: 'Login failed. Please try again.',
            };
        }
    };

    // 🚪 LOGOUT
    const logout = async () => {
        try {
            // optional API call (safe even if backend ignores)
            await RequestHandler.fetchData('POST', 'auth/logout');
        } catch {
            // ignore
        } finally {
            localStorage.removeItem('authToken');
            setAdmin(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                admin,
                isAuthenticated: !!admin,
                isLoading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};