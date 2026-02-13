import React from 'react';
import { Person, AuditEntity } from '../types';

interface PeopleListProps {
  people: Person[];
  entities: AuditEntity[];
  onAddPersonClick: () => void;
  onEditPerson: (person: Person) => void;
}

const PeopleList: React.FC<PeopleListProps> = ({ people, entities, onAddPersonClick, onEditPerson }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-in fade-in duration-700">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              <th className="p-6 text-xs font-extrabold uppercase tracking-widest text-slate-400">Miembro del Equipo</th>
              <th className="p-6 text-xs font-extrabold uppercase tracking-widest text-slate-400">Correo Electrónico</th>
              <th className="p-6 text-xs font-extrabold uppercase tracking-widest text-slate-400">Entidades Asignadas</th>
              <th className="p-6 text-xs font-extrabold uppercase tracking-widest text-slate-400 w-24">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {people.map((person) => {
              const assignedEntities = entities.filter(e => e.responsible_id === person.id);

              return (
                <tr key={person.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <img src={person.avatar_url} className="w-12 h-12 rounded-full border-2 border-slate-100 shadow-sm" alt={person.full_name} />
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{person.full_name}</p>
                        <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">{person.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="text-sm font-medium text-slate-600">{person.email}</span>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-wrap gap-2">
                      {assignedEntities.length > 0 ? (
                        assignedEntities.map(e => (
                          <span key={e.id} className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded-lg border border-blue-100/50">
                            {e.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sin entidades asignadas</span>
                      )}
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <button
                      onClick={() => onEditPerson(person)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      title="Editar miembro"
                    >
                      <span className="material-icons-outlined text-xl">edit</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-slate-50/50 border-t border-slate-100">
        <button
          onClick={onAddPersonClick}
          className="flex items-center gap-2 text-blue-600 font-bold text-xs hover:underline group"
        >
          <span className="material-icons-outlined text-sm group-hover:scale-110 transition-transform">person_add</span>
          Añadir Miembro al Equipo
        </button>
      </div>
    </div>
  );
};

export default PeopleList;
