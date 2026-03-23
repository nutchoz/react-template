import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../lib/context/auth';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const result = await login(email, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message || 'Invalid credentials');
        }
        setIsLoading(false);
    };

    return (
        <div
            className="min-h-screen w-screen flex items-center justify-center p-4 overflow-hidden relative"
            style={{ background: 'linear-gradient(145deg, #e8e6e1 0%, #d6d3cc 40%, #ccc9c0 100%)' }}
        >
            {/* Vignette edges — darkens corners so card feels lit from center */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.18) 100%)'
                }}
            />

            {/* Card wrapper — adds the floating illusion */}
            <div className="relative w-full max-w-md z-10" style={{ filter: 'drop-shadow(0 32px 48px rgba(0,0,0,0.22)) drop-shadow(0 8px 16px rgba(0,0,0,0.12))' }}>

                {/* Top orange accent bar */}
                <div className="h-2 w-full bg-gradient-to-r from-orange-700 to-orange-400 rounded-t-2xl" />

                {/* Main card */}
                <div className="bg-white border-x border-b border-gray-200 rounded-b-2xl overflow-hidden">

                    {/* Header band */}
                    <div className="bg-gradient-to-r from-orange-700 to-orange-500 px-10 py-8 flex flex-col items-center border-b-8 border-blue-900">
                        <h1
                            className="text-5xl font-black text-white leading-none"
                            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}
                        >
                            CGT SYSTEM
                        </h1>
                        <p className="text-orange-200 text-sm mt-1.5 font-medium tracking-wide">
                            Container Management Platform
                        </p>
                    </div>

                    {/* Form area */}
                    <div className="px-10 py-8">

                        {error && (
                            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500 pointer-events-none" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="admin@example.com"
                                        required
                                        disabled={isLoading}
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400
                                                   focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:bg-white
                                                   hover:border-gray-300 transition-all duration-200 disabled:opacity-50 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500 pointer-events-none" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        disabled={isLoading}
                                        className="w-full pl-11 pr-12 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400
                                                   focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:bg-white
                                                   hover:border-gray-300 transition-all duration-200 disabled:opacity-50 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(p => !p)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 mt-2 bg-gradient-to-r from-orange-700 to-orange-500 text-white rounded-xl
                                           hover:from-orange-600 hover:to-orange-400 transition-all duration-200
                                           shadow-md shadow-orange-200 hover:shadow-orange-300
                                           disabled:opacity-50 disabled:cursor-not-allowed
                                           border-b-4 border-orange-900/40
                                           transform hover:scale-[1.02] active:scale-[0.98] active:border-b-0"
                                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.25rem', letterSpacing: '0.15em' }}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        SIGNING IN...
                                    </span>
                                ) : 'SIGN IN'}
                            </button>
                        </form>

                        <p className="text-center text-gray-400 text-xs mt-8 tracking-wide">
                            Container Gate Terminal System &copy; {new Date().getFullYear()}
                        </p>
                    </div>
                </div>

                {/* Bottom navy accent */}
                <div className="h-2 w-full bg-blue-900 rounded-b-xl" />
            </div>
        </div>
    );
};

export default Login;