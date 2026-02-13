import React, { useState } from 'react';
import { supabase } from '../src/lib/supabase';

const LoginComp: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            // AuthContext will automatically redirect via App.tsx when session changes
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a192f] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">

                {/* Header */}
                <div className="p-8 bg-slate-50 border-b border-slate-100 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 mb-4 rotate-3">
                        <span className="material-icons-outlined text-white text-4xl">admin_panel_settings</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">CONTROLPRO</h2>
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-[0.2em] mt-1">Acceso Seguro</p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="p-8 space-y-6">

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <span className="material-icons-outlined text-sm">error</span>
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 pl-1">Mail</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-icons-outlined text-lg">email</span>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="mail"
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 pl-1">Contraseña</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-icons-outlined text-lg">lock</span>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-blue-900 hover:bg-blue-800 text-white text-sm font-bold rounded-xl shadow-xl shadow-blue-900/20 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <span>Iniciar Sesión</span>
                                <span className="material-icons-outlined text-lg">arrow_forward</span>
                            </>
                        )}
                    </button>

                    <p className="text-center text-[10px] text-slate-400 font-medium pt-4">
                        Sistema restringido para personal autorizado de QTC Solutions.
                        <br />
                        Copyright QTC-SOLUTIONS 2026
                    </p>
                </form>
            </div>
        </div>
    );
};

export default LoginComp;
