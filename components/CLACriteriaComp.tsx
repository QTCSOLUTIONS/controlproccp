import React, { useState, useEffect } from 'react';
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
  const [localCriteria, setLocalCriteria] = useState<CLACriterion[]>(criteria);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalCriteria(criteria);
    setHasChanges(false);
  }, [criteria]);

  const filteredCriteria = filterEntityName
    ? localCriteria.filter(c => c.entity_name === filterEntityName)
    : localCriteria;

  const handleCellChange = (id: string, field: keyof CLACriterion, value: string) => {
    let extraUpdates = {};
    if (field === 'entity_name') {
      const selectedEntity = entities.find(e => e.name === value);
      if (selectedEntity) {
        extraUpdates = { audit_id: selectedEntity.id };
      }
    }

    const updated = localCriteria.map(item =>
      item.id === id ? { ...item, [field]: value, ...extraUpdates } : item
    );
    setLocalCriteria(updated);
    setHasChanges(true);
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
    const defaultEntityName = filterEntityName || (entities.length > 0 ? entities[0].name : '');
    const defaultEntity = entities.find(e => e.name === defaultEntityName);
    const defaultAuditId = defaultEntity ? defaultEntity.id : '';

    const newRow: CLACriterion = {
      id: `CLA-${Date.now()}`,
      audit_id: defaultAuditId,
      entity_name: defaultEntityName,
      area: areas[0] || '',
      criterion: '',
      description: '',
      source: '',
      complies: 'N/A'
    };
    setLocalCriteria([...localCriteria, newRow]);
    setHasChanges(true);
  };

  const removeRow = (id: string) => {
    setLocalCriteria(localCriteria.filter(c => c.id !== id));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate(localCriteria);
    setHasChanges(false);
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
        <div className="flex items-center gap-3">
          {hasChanges && (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 animate-pulse"
            >
              <span className="material-icons-outlined text-sm">save</span>
              Guardar Cambios
            </button>
          )}
          <button
            onClick={addRow}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#0a192f] text-white rounded-lg text-xs font-bold hover:bg-[#1a365d] transition-all shadow-md shadow-slate-200"
          >
            <span className="material-icons-outlined text-sm">add</span>
            Nuevo Criterio
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1500px]">
          <thead>
            <tr className="bg-[#0a192f] text-white sticky top-0 z-30 h-7 shadow-lg">
              <th className="px-2 text-[9px] font-black uppercase tracking-widest border border-slate-700 whitespace-nowrap min-w-[180px] sticky left-0 z-40 bg-[#0a192f] shadow-[1px_0_3px_rgba(0,0,0,0.4)]">Entidad</th>
              <th className="px-2 text-[9px] font-black uppercase tracking-widest border border-slate-700 whitespace-nowrap min-w-[150px]">Área</th>
              <th className="px-2 text-[9px] font-black uppercase tracking-widest border border-slate-700 whitespace-nowrap min-w-[120px]">Criterio</th>
              <th className="px-2 text-[9px] font-black uppercase tracking-widest border border-slate-700 whitespace-nowrap min-w-[350px]">Descripción de Criterio</th>
              <th className="px-2 text-[9px] font-black uppercase tracking-widest border border-slate-700 whitespace-nowrap min-w-[200px]">Fuente/Referencia</th>
              <th className="px-2 text-[9px] font-black uppercase tracking-widest border border-slate-700 whitespace-nowrap min-w-[110px] text-center">Cumple</th>
              <th className="px-2 text-[9px] font-black uppercase tracking-widest border border-slate-700 whitespace-nowrap w-8 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCriteria.map((item) => (
              <tr key={item.id} className="group hover:bg-blue-50/50 transition-colors even:bg-slate-50 odd:bg-white text-[9px] h-8">
                <td className="p-0 border border-slate-300 sticky left-0 z-20 bg-inherit group-hover:bg-blue-50/50 transition-colors shadow-[1px_0_3px_rgba(0,0,0,0.1)]">
                  <select
                    className="w-full h-full px-1 py-0.5 text-[9px] font-black text-[#0a192f] bg-transparent border-none focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none cursor-pointer"
                    value={item.entity_name}
                    aria-label="Seleccionar entidad"
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

                <td className="p-0 border border-slate-300">
                  <select
                    className="w-full h-full px-1 py-0.5 text-[9px] text-slate-700 font-bold bg-transparent border-none focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none cursor-pointer"
                    value={item.area}
                    aria-label="Seleccionar área"
                    onChange={(e) => handleAreaChange(item.id, e.target.value)}
                  >
                    <option value="" disabled>Seleccionar área...</option>
                    {areas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                    <option value="__add__" className="text-blue-600 font-bold">+ Añadir nueva área...</option>
                  </select>
                </td>

                <td className="p-0 border border-slate-300">
                  <input
                    type="text"
                    className="w-full h-full px-1 py-0.5 text-[9px] font-black text-blue-900 bg-transparent border-none focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none"
                    placeholder="Ref. Criterio..."
                    aria-label="Referencia del criterio"
                    value={item.criterion}
                    onChange={(e) => handleCellChange(item.id, 'criterion', e.target.value)}
                  />
                </td>

                <td className="p-0 border border-slate-300">
                  <textarea
                    rows={1}
                    className="w-full h-full px-1 py-0.5 text-[9px] text-slate-600 bg-transparent border-none focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none resize-none leading-tight"
                    placeholder="Descripción detallada del criterio..."
                    aria-label="Descripción del criterio"
                    value={item.description}
                    onChange={(e) => handleCellChange(item.id, 'description', e.target.value)}
                  />
                </td>

                <td className="p-0 border border-slate-300">
                  <input
                    type="text"
                    className="w-full h-full px-1 py-0.5 text-[9px] text-slate-500 italic bg-transparent border-none focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none"
                    placeholder="Referencia normativa..."
                    aria-label="Referencia normativa"
                    value={item.source}
                    onChange={(e) => handleCellChange(item.id, 'source', e.target.value)}
                  />
                </td>

                <td className="p-0.5 border border-slate-300 bg-slate-50/20 text-center">
                  <select
                    className={`w-full h-full px-1 py-0.5 text-[9px] font-black uppercase tracking-widest bg-transparent border-none focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer transition-all ${item.complies === 'Sí' ? 'text-emerald-700' :
                      item.complies === 'No' ? 'text-red-700' :
                        'text-slate-500'
                      }`}
                    value={item.complies}
                    aria-label="Cumplimiento"
                    onChange={(e) => handleCellChange(item.id, 'complies', e.target.value)}
                  >
                    {COMPLIANCE_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </td>

                <td className="p-0 border border-slate-300 text-center">
                  <button
                    onClick={() => removeRow(item.id)}
                    className="p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Eliminar criterio"
                    aria-label="Eliminar criterio"
                  >
                    <span className="material-icons-outlined text-xs">delete</span>
                  </button>
                </td>
              </tr>
            ))}
            {localCriteria.length === 0 && (
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
