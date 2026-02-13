import React, { useState } from 'react';
import { Person } from '../types';

interface NewPersonModalProps {
  onClose: () => void;
  onSave: (person: Person) => void;
}

const NewPersonModal: React.FC<NewPersonModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'Auditor',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email) return;

    const newPerson: Person = {
      id: `p${Math.random().toString(36).substr(2, 9)}`,
      full_name: formData.full_name,
      email: formData.email,
      role: formData.role,
      avatar_url: `https://picsum.photos/seed/${formData.full_name}/100`,
    };

    onSave(newPerson);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Nuevo Miembro del Equipo</h3>
            <p className="text-xs text-slate-400 font-medium">Añada un nuevo integrante al equipo de auditoría</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Nombre Completo</label>
            <input
              autoFocus
              required
              type="text"
              placeholder="Ej. Juan Pérez"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium"
              value={formData.full_name}
              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Correo Electrónico</label>
            <input
              required
              type="email"
              placeholder="juan.perez@empresa.com"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Rol / Cargo</label>
            <select
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="Lead Auditor">Lead Auditor</option>
              <option value="Senior Staff">Senior Staff</option>
              <option value="Auditor">Auditor</option>
              <option value="Audit Manager">Audit Manager</option>
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
            >
              Añadir al Equipo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPersonModal;
