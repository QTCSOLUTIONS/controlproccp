import React from 'react';
import { AuditEntity, Person } from '../types';

interface EntityListProps {
  entities: AuditEntity[];
  onAddClick: () => void;
  people: Person[];
  onViewDetails: (entityId: string) => void;
  onEditClick: (entity: AuditEntity) => void;
}

const EntityList: React.FC<EntityListProps> = ({ entities, onAddClick, people, onViewDetails, onEditClick }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in slide-in-from-right-4 duration-700">
      {entities.map((entity) => {
        const responsible = people.find(p => p.id === entity.responsible_id);
        const formatDate = (dateStr: string) => {
          if (!dateStr) return 'N/A';
          const d = new Date(dateStr);
          return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        };

        return (
          <div key={entity.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col relative">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <span className="material-icons-outlined text-3xl">corporate_fare</span>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditClick(entity)}
                      className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Editar entidad"
                    >
                      <span className="material-icons-outlined text-sm">edit</span>
                    </button>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${entity.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        entity.status === 'Execution' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                      {entity.status}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Inicio: {formatDate(entity.start_date)}</span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-6 group-hover:text-blue-600 transition-colors">{entity.name}</h3>

              <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 rounded-2xl">
                <img src={responsible?.avatar_url} className="w-10 h-10 rounded-full border-2 border-white" alt={responsible?.full_name} />
                <div>
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Encargado</p>
                  <p className="text-sm font-bold text-slate-800">{responsible?.full_name || 'No asignado'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-tight">
                  <span className="text-slate-400">Progreso General</span>
                  <span className="text-blue-600">{entity.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${entity.progress}%` }}></div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end items-center">
              <button
                onClick={() => onViewDetails(entity.id)}
                className="text-blue-600 font-bold text-xs flex items-center gap-1 hover:underline group/btn"
              >
                Ver Detalles
                <span className="material-icons-outlined text-sm group-hover/btn:translate-x-1 transition-transform">chevron_right</span>
              </button>
            </div>
          </div>
        );
      })}

      <button
        onClick={onAddClick}
        className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 group hover:border-blue-400 hover:bg-blue-50/30 transition-all min-h-[350px]"
      >
        <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:scale-110 transition-all mb-4">
          <span className="material-icons-outlined text-4xl">add</span>
        </div>
        <span className="text-lg font-bold text-slate-800">Nueva Entidad</span>
        <p className="text-sm text-slate-400 mt-2 px-8 text-center leading-relaxed">Asigne una nueva entidad al programa de control interno.</p>
      </button>
    </div>
  );
};

export default EntityList;
