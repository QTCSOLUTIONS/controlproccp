
import React, { useState, useMemo } from 'react';
import { TaskPlannerEntry } from '../types';
import { SCOPE_OPTIONS, PHASE_OPTIONS } from '../constants';

interface TaskPlannerProps {
  data: TaskPlannerEntry[];
  onUpdate: (newData: TaskPlannerEntry[]) => void;
}

const TaskPlanner: React.FC<TaskPlannerProps> = ({ data, onUpdate }) => {
  const [localData, setLocalData] = useState<TaskPlannerEntry[]>(data);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  const handleCellChange = (id: string, field: keyof TaskPlannerEntry, value: string) => {
    const updated = localData.map(item => item.id === id ? { ...item, [field]: value } : item);
    setLocalData(updated);
    onUpdate(updated);
  };

  const addRow = () => {
    const newRow: TaskPlannerEntry = {
      id: `tp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      scope: '', // Iniciamos en blanco
      task: '',  // Iniciamos en blanco
      phase: ''  // Iniciamos en blanco
    };
    // Añadimos al final de la lista actual
    const updated = [...localData, newRow];
    setLocalData(updated);
    onUpdate(updated);
  };

  const removeRow = (id: string) => {
    const updated = localData.filter(item => item.id !== id);
    setLocalData(updated);
    onUpdate(updated);
  };

  const toggleSort = () => {
    if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortDirection('asc');
    }
  };

  const displayData = useMemo(() => {
    if (!sortDirection) return localData;

    return [...localData].sort((a, b) => {
      const valA = a.phase.toLowerCase();
      const valB = b.phase.toLowerCase();
      
      if (valA === '' && valB !== '') return 1;
      if (valA !== '' && valB === '') return -1;

      if (sortDirection === 'asc') {
        return valA.localeCompare(valB);
      } else {
        return valB.localeCompare(valA);
      }
    });
  }, [localData, sortDirection]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-in fade-in duration-700">
      <div className="p-6 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Planificador de Tareas</h3>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">Vinculación de Alcance, Tareas y Fases</p>
        </div>
        <button 
          onClick={addRow}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
        >
          <span className="material-icons-outlined text-sm">add</span>
          Añadir Línea
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/50">
              <th className="p-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 border-b border-slate-200 w-1/4">Alcance de Auditoría</th>
              <th className="p-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 border-b border-slate-200 w-2/4">Tareas</th>
              <th 
                className="p-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 border-b border-slate-200 w-1/4 cursor-pointer hover:bg-slate-200/50 transition-colors group/sort"
                onClick={toggleSort}
              >
                <div className="flex items-center gap-1">
                  Fase
                  <span className={`material-icons-outlined text-sm transition-all ${sortDirection ? 'text-blue-600 opacity-100' : 'text-slate-300 opacity-0 group-hover/sort:opacity-100'}`}>
                    {sortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward'}
                  </span>
                </div>
              </th>
              <th className="p-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 border-b border-slate-200 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayData.map((item) => (
              <tr key={item.id} className={`group hover:bg-blue-50/30 transition-colors ${item.scope === '' || item.phase === '' ? 'bg-amber-50/20' : ''}`}>
                <td className="p-0 border-r border-slate-50">
                  <select
                    className={`w-full h-full p-4 text-sm font-semibold bg-transparent border-none focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer ${item.scope === '' ? 'text-slate-400 italic font-normal' : 'text-slate-800'}`}
                    value={item.scope}
                    onChange={(e) => handleCellChange(item.id, 'scope', e.target.value)}
                  >
                    <option value="" disabled>Seleccionar Alcance...</option>
                    {SCOPE_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    {!SCOPE_OPTIONS.includes(item.scope) && item.scope !== '' && (
                      <option value={item.scope}>{item.scope}</option>
                    )}
                  </select>
                </td>
                <td className="p-0 border-r border-slate-50">
                  <textarea
                    rows={1}
                    className="w-full h-full p-4 text-sm bg-transparent border-none focus:ring-2 focus:ring-blue-500/20 outline-none resize-none placeholder:text-slate-300"
                    placeholder="Describir tarea..."
                    value={item.task}
                    onChange={(e) => handleCellChange(item.id, 'task', e.target.value)}
                  />
                </td>
                <td className="p-0 border-r border-slate-50">
                  <select
                    className={`w-full h-full p-4 text-xs font-bold bg-transparent border-none focus:ring-2 focus:ring-blue-500/20 outline-none uppercase tracking-tight cursor-pointer ${item.phase === '' ? 'text-slate-400 italic font-normal' : 'text-blue-600'}`}
                    value={item.phase}
                    onChange={(e) => handleCellChange(item.id, 'phase', e.target.value)}
                  >
                    <option value="" disabled>Seleccionar Fase...</option>
                    {PHASE_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => removeRow(item.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Eliminar línea"
                  >
                    <span className="material-icons-outlined text-sm">delete</span>
                  </button>
                </td>
              </tr>
            ))}
            {displayData.length === 0 && (
              <tr>
                <td colSpan={4} className="p-20 text-center text-slate-400 italic font-medium">
                  No hay tareas planificadas. Haz clic en "Añadir Línea" para comenzar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
         <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="material-icons-outlined text-xs">info</span>
            <span>Las nuevas líneas se añaden en blanco para ser completadas. Ordenable por Fase.</span>
         </div>
         <div className="text-[10px] font-bold text-slate-300">
            AUDITPRO TASK PLANNER V1.3
         </div>
      </div>
    </div>
  );
};

export default TaskPlanner;
