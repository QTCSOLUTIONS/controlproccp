import React, { useState } from 'react';
import { Phase, AuditStatus } from '../types';

interface EditPhaseModalProps {
  entityId: string;
  phase: Phase;
  onClose: () => void;
  onSave: (phase: Phase) => void;
}

const EditPhaseModal: React.FC<EditPhaseModalProps> = ({ phase, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    duration_weeks: phase.duration_weeks,
    status: phase.status,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...phase,
      duration_weeks: formData.duration_weeks,
      status: formData.status,
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{phase.name}</h3>
            <p className="text-xs text-slate-400 font-medium">Editar parámetros de la fase</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        <div className="px-8 pt-6 space-y-4">
          {phase.alert_note && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 items-start">
              <span className="material-icons-outlined text-amber-600 text-lg">history_edu</span>
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 block mb-1">Nota de Auditoría</label>
                <p className="text-xs font-semibold text-amber-800 italic">
                  {phase.alert_note}
                </p>
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 block mb-2">Objetivo de la Fase</label>
            <p className="text-sm font-medium text-blue-800 leading-relaxed italic">
              "{phase.objectives[0]}"
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Duración (Número de semanas)</label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="1"
                max="12"
                required
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-bold"
                value={formData.duration_weeks}
                onChange={e => setFormData({ ...formData, duration_weeks: parseInt(e.target.value) || 1 })}
              />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Semanas</span>
            </div>
            <p className="text-[9px] text-slate-400 italic mt-1">* Si cambia el estándar (2, 2, 3, 2, 2), se generará una alerta de registro.</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Estado de la Fase</label>
            <select
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as AuditStatus })}
            >
              <option value="Planning">Pendiente / Planificación</option>
              <option value="Execution">En Curso / Ejecución</option>
              <option value="Completed">Completado</option>
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
            >
              Cerrar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPhaseModal;
