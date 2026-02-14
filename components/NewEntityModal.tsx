import React, { useState, useEffect } from 'react';
import { AuditEntity, AuditStatus, Phase, Person } from '../types';

interface NewEntityModalProps {
  onClose: () => void;
  onSave: (entity: AuditEntity) => void;
  people: Person[];
}

const NewEntityModal: React.FC<NewEntityModalProps> = ({ onClose, onSave, people }) => {
  const [formData, setFormData] = useState({
    name: '',
    scope: '',
    responsible_id: people[0]?.id || '',
    start_date: '2026-02-16', // Default standard start date
  });

  // Ensure responsible_id is updated if people list changes or initializes
  useEffect(() => {
    if (!formData.responsible_id && people.length > 0) {
      setFormData(prev => ({ ...prev, responsible_id: people[0].id }));
    }
  }, [people]);

  const STANDARD_PHASES: Phase[] = [
    { id: 'p1', name: 'Fase I - Planificación', objectives: ['Definir alcance, metodología y riesgos iniciales.'], start_week: 1, duration_weeks: 2, status: 'Planning' },
    { id: 'p2', name: 'Fase II - Levantamiento de información', objectives: ['Recopilar evidencia y comprender procesos.'], start_week: 3, duration_weeks: 3, status: 'Planning' },
    { id: 'p3', name: 'Fase III - Evaluación y Pruebas', objectives: ['Validar controles y medir riesgos.'], start_week: 6, duration_weeks: 3, status: 'Planning' },
    { id: 'p4', name: 'Fase IV - Análisis de Hallazgos', objectives: ['Consolidar resultados.'], start_week: 9, duration_weeks: 2, status: 'Planning' },
    { id: 'p5', name: 'Fase V - Informe y Cierre', objectives: ['Presentar resultados y formalizar cierre.'], start_week: 11, duration_weeks: 2, status: 'Planning' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.scope || !formData.responsible_id || !formData.start_date) return;

    const newEntity: AuditEntity = {
      id: `e${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name,
      scope: formData.scope,
      responsible_id: formData.responsible_id,
      start_date: formData.start_date,
      status: 'Planning' as AuditStatus,
      progress: 0,
      last_updated: new Date().toISOString().split('T')[0],
      tasks: [],
      phases: STANDARD_PHASES,
    };

    onSave(newEntity);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Nueva Entidad Auditada</h3>
            <p className="text-xs text-slate-400 font-medium">Configure la entidad y asigne un responsable del equipo</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors" aria-label="Cerrar modal">
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Nombre de la Entidad</label>
            <input
              autoFocus
              required
              type="text"
              placeholder="Ej. Atlantida (Urbanización)"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Fecha de Inicio</label>
              <input
                required
                type="date"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                value={formData.start_date}
                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Persona Encargada</label>
              <select
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                value={formData.responsible_id}
                onChange={e => setFormData({ ...formData, responsible_id: e.target.value })}
              >
                <option value="" disabled>Seleccione un responsable...</option>
                {people.filter(p => p.visible_in_team !== false).map(person => (
                  <option key={person.id} value={person.id}>
                    {person.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Alcance de la Auditoría</label>
            <textarea
              required
              rows={3}
              placeholder="Describa el objetivo y alcance..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium"
              value={formData.scope}
              onChange={e => setFormData({ ...formData, scope: e.target.value })}
            />
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
              Crear Entidad
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewEntityModal;
