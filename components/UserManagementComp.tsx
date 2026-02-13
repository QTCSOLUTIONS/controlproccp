import React, { useState } from 'react';
import { Person } from '../types';

interface UserManagementProps {
    users: Person[];
    onUserUpdated: () => void;
    onDeleteUser: (id: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onUserUpdated, onDeleteUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        role: 'Auditor',
        password: '',
        visible_in_team: true
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.password || formData.password.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al crear usuario');
            }

            alert('Usuario creado correctamente. Ya puede iniciar sesión.');

            onUserUpdated();

            setIsModalOpen(false);
            setFormData({ full_name: '', email: '', role: 'Auditor', password: '', visible_in_team: true });

        } catch (error: any) {
            console.error('Error creating user:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestión de Usuarios</h2>
                    <p className="text-slate-500 font-medium text-sm">Administración de acceso y perfiles de la plataforma.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
                >
                    <span className="material-icons-outlined">person_add</span>
                    Crear Usuario
                </button>
            </div>

            <div className="grid gap-4">
                {users.map((user) => (
                    <div key={user.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                            <img src={user.avatar_url} alt={user.full_name} className="w-12 h-12 rounded-full object-cover border-2 border-slate-100" />
                            <div>
                                <h3 className="font-bold text-slate-800">{user.full_name}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="material-icons-outlined text-xs text-slate-400">email</span>
                                    <span className="text-xs font-medium text-slate-500">{user.email}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex flex-col items-center" title={user.visible_in_team !== false ? "Visible en Equipo" : "Oculto en Equipo"}>
                                <span className={`material-icons-outlined text-sm ${user.visible_in_team !== false ? 'text-emerald-500' : 'text-slate-300'}`}>
                                    {user.visible_in_team !== false ? 'visibility' : 'visibility_off'}
                                </span>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.role === 'Admin' || user.role === 'Audit Manager' ? 'bg-purple-100 text-purple-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                {user.role}
                            </div>

                            <button
                                onClick={() => {
                                    if (window.confirm(`¿Estás seguro de que deseas eliminar a ${user.full_name}?`)) {
                                        onDeleteUser(user.id);
                                    }
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                                title="Eliminar usuario"
                            >
                                <span className="material-icons-outlined">delete</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Nuevo Usuario</h3>
                            <button onClick={() => setIsModalOpen(false)} className="material-icons-outlined text-slate-400 hover:text-slate-600">close</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Nombre</label>
                                <input required type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Email</label>
                                <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Rol</label>
                                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20">
                                    <option value="Auditor">Auditor</option>
                                    <option value="Senior Staff">Senior Staff</option>
                                    <option value="Lead Auditor">Lead Auditor</option>
                                    <option value="Audit Manager">Audit Manager</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Contraseña</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Mínimo 6 caracteres"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                                <p className="text-[10px] text-slate-400">* Esta será la contraseña de acceso.</p>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <input
                                    type="checkbox"
                                    id="visible_in_team"
                                    checked={formData.visible_in_team}
                                    onChange={e => setFormData({ ...formData, visible_in_team: e.target.checked })}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 accent-blue-600"
                                />
                                <label htmlFor="visible_in_team" className="text-sm font-bold text-slate-600 cursor-pointer select-none">
                                    Mostrar en selectores de equipo
                                </label>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl">Cancelar</button>
                                <button disabled={loading} type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 flex justify-center items-center gap-2">
                                    {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : null}
                                    {loading ? 'Creando...' : 'Crear Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
