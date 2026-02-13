import React from 'react';
import { CLACriterion, AuditEntity } from '../types';

interface CLACriteriaProps {
  criteria: CLACriterion[];
  entities: AuditEntity[];
  areas: string[];
  onAddArea: (area: string) => void;
  onUpdate: (newCriteria: CLACriterion[]) => void;
  filterEntityName?: string | null;
  onClearFilter?: () => void;
}

const COMPLIANCE_OPTIONS = ['Sí', 'No', 'N/A'] as const;

const CLACriteria: React.FC<CLACriteriaProps> = ({ criteria, entities, areas, onAddArea, onUpdate, filterEntityName, onClearFilter }) => {
  const handleCellChange = (id: string, field: keyof CLACriterion, value: string) => {
    const updated = criteria.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    onUpdate(updated);
  };

  const handleAreaChange = (id: string, value: string) => {
    if (value === '__add__') {
      const newArea = prompt("Nombre de la nueva área:");
      if (newArea && newArea.trim()) {
        onAddArea(newArea.trim());
        handleCellChange(id, 'area', newArea.trim());
      }
    } else {
      handleCellChange(id, 'area', value);
    }
  };

  const addRow = () => {
    const defaultEntity = filterEntityName || (entities.length > 0 ? entities[0].name : '');
    const newRow: CLACriterion = {
      id: `CLA-${Date.now()}`,
      audit_id: '', // Should be filled based on entity selection logic in real app, or ignored if virtual
      entity_name: defaultEntity,
      area: areas[0] || '',
      criterion: '',
      description: '',
      source: '',
      complies: 'N/A'
    };
    onUpdate([...criteria, newRow]);
  };

  const removeRow = (id: string) => {
    onUpdate(criteria.filter(c => c.id !== id));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-in fade-in duration-700">
      <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/30">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-800">Criterios de CLA</h3>
            {filterEntityName && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border border-blue-200">
                <span>Filtrado: {filterEntityName}</span>
                <button onClick={onClearFilter} className="hover:text-blue-900 transition-colors">
                  <span className="material-icons-outlined text-xs">close</span>
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">Evaluación de Cumplimiento por Entidad y Área</p>
        </div>
        <button
          onClick={addRow}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a5f7a] text-white rounded-xl text-xs font-bold hover:brightness-110 transition-all shadow-lg shadow-slate-200"
        >
          <span className="material-icons-outlined text-sm">add</span>
          Nuevo Criterio
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1500px]">
          <thead>
            <tr className="bg-[#1a5f7a] text-white">
              <th className="p-4 text-sm font-bold uppercase tracking-wide border-r border-white/10 whitespace-nowrap min-w-[220px]">Entidad</th>
              <th className="p-4 text-sm font-bold uppercase tracking-wide border-r border-white/10 whitespace-nowrap min-w-[180px]">Área</th>
              <th className="p-4 text-sm font-bold uppercase tracking-wide border-r border-white/10 whitespace-nowrap min-w-[150px]">Criterio</th>
              <th className="p-4 text-sm font-bold uppercase tracking-wide border-r border-white/10 whitespace-nowrap min-w-[400px]">Descripción de Criterio</th>
              <th className="p-4 text-sm font-bold uppercase tracking-wide border-r border-white/10 whitespace-nowrap min-w-[250px]">Fuente/Referencia</th>
              <th className="p-4 text-sm font-bold uppercase tracking-wide border-r border-white/10 whitespace-nowrap min-w-[140px] text-center">Cumple Si/No</th>
              <th className="p-4 text-sm font-bold uppercase tracking-wide w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {criteria.map((item) => (
              <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                <td className="p-0 border-r border-slate-100">
                  <select
                    className="w-full h-full p-4 text-sm font-semibold text-slate-800 bg-transparent border-none focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                    value={item.entity_name}
                    onChange={(e) => handleCellChange(item.id, 'entity_name', e.target.value)}
                  >
                    <option value="" disabled>Seleccionar entidad...</option>
                    {entities.map(entity => (
                      <option key={entity.id} value={entity.name}>
                        {entity.name}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="p-0 border-r border-slate-100">
                  <select
                    className="w-full h-full p-4 text-sm text-slate-700 font-medium bg-transparent border-none focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                    value={item.area}
                    onChange={(e) => handleAreaChange(item.id, e.target.value)}
                  >
                    <option value="" disabled>Seleccionar área...</option>
                    {areas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                    <option value="__add__" className="text-blue-600 font-bold">+ Añadir nueva área...</option>
                  </select>
                </td>

                <td className="p-0 border-r border-slate-100">
                  <input
                    type="text"
                    className="w-full h-full p-4 text-sm font-bold text-blue-900 bg-transparent border-none focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="Ref. Criterio..."
                    value={item.criterion}
                    onChange={(e) => handleCellChange(item.id, 'criterion', e.target.value)}
                  />
                </td>

                <td className="p-0 border-r border-slate-100">
                  <textarea
                    rows={2}
                    className="w-full h-full p-4 text-sm text-slate-600 bg-transparent border-none focus:ring-2 focus:ring-blue-500/20 outline-none resize-none leading-relaxed"
                    placeholder="Descripción detallada del criterio..."
                    value={item.description}
                    onChange={(e) => handleCellChange(item.id, 'description', e.target.value)}
                  />
                </td>

                <td className="p-0 border-r border-slate-100">
                  <input
                    type="text"
                    className="w-full h-full p-4 text-sm text-slate-500 italic bg-transparent border-none focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="Referencia normativa..."
                    value={item.source}
                    onChange={(e) => handleCellChange(item.id, 'source', e.target.value)}
                  />
                </td>

                <td className="p-2 border-r border-slate-100 bg-slate-50/20 text-center">
                  <select
                    className={`w-full py-2 px-3 text-xs font-extrabold uppercase tracking-widest rounded-lg border focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer shadow-sm transition-all ${item.complies === 'Sí' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        item.complies === 'No' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    value={item.complies}
                    onChange={(e) => handleCellChange(item.id, 'complies', e.target.value)}
                  >
                    {COMPLIANCE_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </td>

                <td className="p-4 text-center">
                  <button
                    onClick={() => removeRow(item.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Eliminar criterio"
                  >
                    <span className="material-icons-outlined text-sm">delete</span>
                  </button>
                </td>
              </tr>
            ))}
            {criteria.length === 0 && (
              <tr>
                <td colSpan={7} className="p-20 text-center text-slate-400 italic">
                  {filterEntityName
                    ? `No se han encontrado criterios para la entidad "${filterEntityName}".`
                    : 'No hay criterios registrados. Haga clic en "Nuevo Criterio" para comenzar.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span className="material-icons-outlined text-xs">info</span>
          <span>Evaluación técnica de cumplimiento normativo (CLA)</span>
        </div>
        <p className="text-[10px] text-slate-300 font-bold tracking-tighter uppercase">ControlPro CLA Module v1.0</p>
      </div>
    </div>
  );
};

export default CLACriteria;
