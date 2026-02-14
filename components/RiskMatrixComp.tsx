import React from 'react';
import { RiskControl, AuditEntity, TaskPlannerEntry, Person } from '../types';
import { SCOPE_OPTIONS } from '../constants';

interface RiskMatrixProps {
  risks: RiskControl[];
  entities: AuditEntity[];
  plannerData: TaskPlannerEntry[];
  areas: string[];
  onAddArea: (area: string) => void;
  filterEntityName?: string | null;
  onClearFilter?: () => void;
  onUpdate: (newRisks: RiskControl[]) => void;
  people?: Person[];
}

const IMPACT_LEVELS = [
  { value: 1, label: 'Bajo', description: 'Impacto mínimo, no afecta significativamente la operación' },
  { value: 2, label: 'Moderado bajo', description: 'Afecta ligeramente el proceso' },
  { value: 3, label: 'Medio', description: 'Genera retrasos o pérdidas moderadas' },
  { value: 4, label: 'Alto', description: 'Impacto financiero o legal importante' },
  { value: 5, label: 'Critico', description: 'Impacto grave: fraude, sanciones, daño reputacional' },
];

const PROBABILITY_LEVELS = [
  { value: 1, label: 'Muy baja', description: 'Rara vez ocurre' },
  { value: 2, label: 'Baja', description: 'Poco frecuente' },
  { value: 3, label: 'Media', description: 'Ocurre Ocasionalmente' },
  { value: 4, label: 'Alta', description: 'Ocurre Frecuentemente' },
  { value: 5, label: 'Muy alta', description: 'Es recurrente o casi seguro' },
];

const EFFECTIVENESS_LEVELS = [
  { value: 1, label: 'Muy baja', description: 'No existe control o es informal' },
  { value: 2, label: 'Baja', description: 'Control débil, no documentado' },
  { value: 3, label: 'Moderada', description: 'Existe control, pero no siempre se cumple' },
  { value: 4, label: 'Alta', description: 'Control documentado y aplicado regularmente' },
  { value: 5, label: 'Muy alta', description: 'Control robusto, documentado y supervisado' },
];

const STATUS_OPTIONS = ['Pendiente', 'En curso', 'Completado'] as const;

const RiskMatrix: React.FC<RiskMatrixProps> = ({ risks, entities, plannerData, areas, onAddArea, filterEntityName, onClearFilter, onUpdate, people = [] }) => {
  const filteredRisks = filterEntityName
    ? risks.filter(r => r.entity_name === filterEntityName)
    : risks;

  const getTrafficLightColor = (level: string) => {
    switch (level) {
      case 'Alto': return 'bg-red-600 text-white shadow-sm';
      case 'Medio': return 'bg-orange-500 text-white shadow-sm';
      case 'Bajo': return 'bg-green-600 text-white shadow-sm';
      default: return 'bg-slate-200 text-slate-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completado': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'En curso': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'Pendiente': return 'text-slate-500 bg-slate-50 border-slate-100';
      default: return 'text-slate-500';
    }
  };

  const handleCellChange = (id: string, field: keyof RiskControl, value: string | number) => {
    const updated = risks.map(risk => {
      if (risk.id !== id) return risk;
      const newRisk = { ...risk, [field]: value };

      if (field === 'impact' || field === 'probability') {
        const impactVal = Number(newRisk.impact);
        const probVal = Number(newRisk.probability);
        newRisk.inherent_risk = impactVal * probVal;

        if (newRisk.inherent_risk >= 15) {
          newRisk.traffic_light_level = 'Alto';
        } else if (newRisk.inherent_risk >= 8) {
          newRisk.traffic_light_level = 'Medio';
        } else {
          newRisk.traffic_light_level = 'Bajo';
        }
      }

      if (field === 'impact' || field === 'probability' || field === 'control_effectiveness') {
        const effectiveness = Number(newRisk.control_effectiveness) || 1;
        const rawResidual = newRisk.inherent_risk / effectiveness;
        newRisk.residual_risk = parseFloat(rawResidual.toFixed(2));
      }

      return newRisk;
    });
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
    const defaultEntityId = entities.find(e => e.name === defaultEntity)?.id || '';

    const newRisk: RiskControl = {
      id: `RC-${Date.now()}`,
      audit_id: defaultEntityId,
      entity_name: defaultEntity,
      audit_scope: '',
      tasks: '',
      process: '',
      area: areas[0] || '',
      risk_description: '',
      impact: 1,
      probability: 1,
      inherent_risk: 1,
      existing_controls: '',
      control_effectiveness: 1,
      residual_risk: 1,
      traffic_light_level: 'Bajo',
      status: 'Pendiente',
      responsible: '',
      implementation_date: new Date().toISOString().split('T')[0],
      recommendation: ''
    };
    onUpdate([...risks, newRisk]);
  };

  const removeRow = (id: string) => {
    onUpdate(risks.filter(r => r.id !== id));
  };

  const getTasksForScope = (scope: string) => {
    if (!scope) return plannerData.map(d => d.task);
    return plannerData.filter(d => d.scope === scope).map(d => d.task);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-in fade-in duration-700">
      <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/30">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-800">Matriz de Riesgos y Controles</h3>
            {filterEntityName && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border border-blue-200">
                <span>Filtrado: {filterEntityName}</span>
                <button onClick={onClearFilter} className="hover:text-blue-900 transition-colors">
                  <span className="material-icons-outlined text-xs">close</span>
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1 italic tracking-tight">Cálculo Residual: Inherente / Efectividad | Clasificación: 1-7 Bajo, 8-14 Medio, 15-25 Alto</p>
        </div>
        <button
          onClick={addRow}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a5f7a] text-white rounded-xl text-xs font-bold hover:brightness-110 transition-all shadow-lg shadow-slate-200"
        >
          <span className="material-icons-outlined text-sm">add</span>
          Nueva Línea de Riesgo
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[2800px]">
          <thead>
            <thead>
              <tr className="bg-[#1a5f7a] text-white shadow-lg sticky top-0 z-30">
                <th className="p-4 text-xs font-bold uppercase tracking-wide border-r border-white/10 whitespace-nowrap min-w-[220px] sticky left-0 z-40 bg-[#1a5f7a] shadow-[4px_0_10px_-2px_rgba(0,0,0,0.1)]">Entidad</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wide border-r border-white/10 whitespace-nowrap min-w-[250px] sticky left-[220px] z-40 bg-[#1a5f7a] shadow-[4px_0_10px_-2px_rgba(0,0,0,0.1)]">Alcance de Auditoría</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wide border-r border-white/10 whitespace-nowrap min-w-[350px]">Tareas</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wide border-r border-white/10 whitespace-nowrap">Proceso</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wide border-r border-white/10 whitespace-nowrap min-w-[180px]">Área</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wide border-r border-white/10 whitespace-nowrap">Riesgo Identificado</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wide border-r border-white/10 whitespace-nowrap min-w-[180px]">Impacto</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wide border-r border-white/10 whitespace-nowrap min-w-[180px]">Probabilidad</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wide border-r border-white/10 whitespace-nowrap text-center">Riesgo Inherente (I x P)</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wide border-r border-white/10 whitespace-nowrap">Controles existentes</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wide border-r border-white/10 whitespace-nowrap min-w-[180px]">Efectividad (1-5)</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wide border-r border-white/10 whitespace-nowrap text-center">Riesgo Residual (RI / EF)</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wide border-r border-white/10 whitespace-nowrap text-center">Clasificación / Semáforo</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wide border-r border-white/10 whitespace-nowrap min-w-[160px]">Estado</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wide border-r border-white/10 whitespace-nowrap">Responsable</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wide border-r border-white/10 whitespace-nowrap">Implementación</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wide whitespace-nowrap">Recomendación</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wide w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRisks.map((risk) => (
                <tr key={risk.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="p-0 border-r border-slate-100 sticky left-0 z-20 bg-white group-hover:bg-slate-50 transition-colors shadow-[4px_0_10px_-2px_rgba(0,0,0,0.05)]">
                    <select
                      className="w-full h-full p-4 text-sm font-semibold text-slate-800 bg-transparent border-none focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                      value={risk.entity_name}
                      onChange={(e) => handleCellChange(risk.id, 'entity_name', e.target.value)}
                    >
                      <option value="" disabled>Seleccionar entidad...</option>
                      {entities.map(entity => (
                        <option key={entity.id} value={entity.name}>
                          {entity.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="p-0 border-r border-slate-100 sticky left-[220px] z-20 bg-white group-hover:bg-slate-50 transition-colors shadow-[4px_0_10px_-2px_rgba(0,0,0,0.05)]">
                    <select
                      className={`w-full h-full p-4 text-sm bg-transparent border-none focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer ${!risk.audit_scope ? 'text-slate-400 italic' : 'text-slate-700 font-medium'}`}
                      value={risk.audit_scope}
                      onChange={(e) => handleCellChange(risk.id, 'audit_scope', e.target.value)}
                    >
                      <option value="" disabled>Seleccionar alcance...</option>
                      {SCOPE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>

                  <td className="p-0 border-r border-slate-100">
                    <select
                      className={`w-full h-full p-4 text-sm bg-transparent border-none focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer ${!risk.tasks ? 'text-slate-400 italic' : 'text-slate-700 italic font-medium'}`}
                      value={risk.tasks}
                      onChange={(e) => handleCellChange(risk.id, 'tasks', e.target.value)}
                    >
                      <option value="" disabled>Seleccionar tarea...</option>
                      {Array.from(new Set(getTasksForScope(risk.audit_scope || ''))).map(task => (
                        <option key={task} value={task}>{task}</option>
                      ))}
                    </select>
                  </td>

                  <td className="p-0 border-r border-slate-100">
                    <input
                      type="text"
                      className="w-full h-full p-4 text-sm font-bold text-blue-800 bg-transparent border-none focus:ring-2 focus:ring-blue-500/20 outline-none placeholder:text-slate-300"
                      placeholder="Proceso..."
                      value={risk.process}
                      onChange={(e) => handleCellChange(risk.id, 'process', e.target.value)}
                    />
                  </td>
                  <td className="p-0 border-r border-slate-100">
                    <select
                      className="w-full h-full p-4 text-sm text-slate-600 font-medium bg-transparent border-none focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                      value={risk.area}
                      onChange={(e) => handleAreaChange(risk.id, e.target.value)}
                    >
                      <option value="" disabled>Seleccionar área...</option>
                      {areas.map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                      <option value="__add__" className="text-blue-600 font-bold">+ Añadir nueva área...</option>
                    </select>
                  </td>
                  <td className="p-0 border-r border-slate-100 min-w-[300px]">
                    <textarea
                      rows={2}
                      className="w-full h-full p-4 text-sm text-slate-700 bg-transparent border-none focus:ring-2 focus:ring-blue-500/20 outline-none resize-none leading-tight placeholder:text-slate-300"
                      placeholder="Descripción del riesgo..."
                      value={risk.risk_description}
                      onChange={(e) => handleCellChange(risk.id, 'risk_description', e.target.value)}
                    />
                  </td>

                  <td className="p-0 border-r border-slate-100 bg-slate-50/20">
                    <select
                      className="w-full h-full p-4 text-xs font-bold text-slate-700 bg-transparent border-none focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                      value={risk.impact}
                      onChange={(e) => handleCellChange(risk.id, 'impact', parseInt(e.target.value))}
                    >
                      {IMPACT_LEVELS.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.value} - {level.label}
                        </option>
                      ))}
                    </select>
                    <div className="px-4 pb-2 -mt-2 text-[9px] text-slate-400 italic leading-none truncate max-w-[170px]">
                      {IMPACT_LEVELS.find(l => l.value === risk.impact)?.description}
                    </div>
                  </td>

                  <td className="p-0 border-r border-slate-100 bg-slate-50/20">
                    <select
                      className="w-full h-full p-4 text-xs font-bold text-slate-700 bg-transparent border-none focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                      value={risk.probability}
                      onChange={(e) => handleCellChange(risk.id, 'probability', parseInt(e.target.value))}
                    >
                      {PROBABILITY_LEVELS.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.value} - {level.label}
                        </option>
                      ))}
                    </select>
                    <div className="px-4 pb-2 -mt-2 text-[9px] text-slate-400 italic leading-none truncate max-w-[170px]">
                      {PROBABILITY_LEVELS.find(l => l.value === risk.probability)?.description}
                    </div>
                  </td>

                  <td className="p-4 text-sm text-center font-extrabold text-blue-900 bg-blue-50/40 border-r border-slate-100">
                    {risk.inherent_risk}
                  </td>

                  <td className="p-4 text-sm text-slate-600 border-r border-slate-100">
                    <textarea
                      rows={1}
                      className="w-full h-full p-0 text-sm bg-transparent border-none focus:ring-0 outline-none resize-none"
                      value={risk.existing_controls}
                      onChange={(e) => handleCellChange(risk.id, 'existing_controls', e.target.value)}
                    />
                  </td>

                  <td className="p-0 border-r border-slate-100 bg-slate-50/20">
                    <select
                      className="w-full h-full p-4 text-xs font-bold text-slate-700 bg-transparent border-none focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                      value={risk.control_effectiveness}
                      onChange={(e) => handleCellChange(risk.id, 'control_effectiveness', parseInt(e.target.value) || 1)}
                    >
                      {EFFECTIVENESS_LEVELS.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.value} - {level.label}
                        </option>
                      ))}
                    </select>
                    <div className="px-4 pb-2 -mt-2 text-[9px] text-slate-400 italic leading-none truncate max-w-[170px]">
                      {EFFECTIVENESS_LEVELS.find(l => l.value === risk.control_effectiveness)?.description}
                    </div>
                  </td>

                  <td className="p-4 text-sm text-center font-extrabold text-indigo-900 bg-indigo-50/30 border-r border-slate-100">
                    {risk.residual_risk}
                  </td>

                  <td className="p-4 text-center border-r border-slate-100">
                    <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest inline-block min-w-[100px] ${getTrafficLightColor(risk.traffic_light_level)}`}>
                      {risk.traffic_light_level}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1 font-bold">
                      ({risk.inherent_risk})
                    </div>
                  </td>

                  <td className="p-0 border-r border-slate-100 bg-slate-50/30">
                    <div className="flex items-center h-full px-2">
                      <select
                        className={`w-full py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg border focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer shadow-sm transition-all ${getStatusColor(risk.status)}`}
                        value={risk.status}
                        onChange={(e) => handleCellChange(risk.id, 'status', e.target.value)}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt} value={opt} className="bg-white text-slate-800 normal-case font-medium">{opt}</option>
                        ))}
                      </select>
                    </div>
                  </td>

                  <td className="p-0 border-r border-slate-100">
                    <select
                      className="w-full h-full p-4 text-sm text-slate-800 font-medium bg-transparent border-none focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                      value={risk.responsible}
                      onChange={(e) => handleCellChange(risk.id, 'responsible', e.target.value)}
                    >
                      <option value="" disabled>Asignar responsable...</option>
                      {people.map(person => (
                        <option key={person.id} value={person.full_name}>{person.full_name}</option>
                      ))}
                      {/* Permitir valores antiguos que no estén en la lista por compatibilidad */}
                      {risk.responsible && !people.some(p => p.full_name === risk.responsible) && (
                        <option value={risk.responsible}>{risk.responsible}</option>
                      )}
                    </select>
                  </td>
                  <td className="p-0 border-r border-slate-100">
                    <input
                      type="date"
                      className="w-full h-full p-4 text-[10px] text-slate-500 bg-transparent border-none focus:ring-2 focus:ring-blue-500/20 outline-none font-mono"
                      value={risk.implementation_date}
                      onChange={(e) => handleCellChange(risk.id, 'implementation_date', e.target.value)}
                    />
                  </td>
                  <td className="p-0">
                    <textarea
                      rows={1}
                      className="w-full h-full p-4 text-sm text-slate-600 italic leading-tight bg-transparent border-none focus:ring-2 focus:ring-blue-500/20 outline-none resize-none placeholder:text-slate-300"
                      placeholder="Recomendación..."
                      value={risk.recommendation}
                      onChange={(e) => handleCellChange(risk.id, 'recommendation', e.target.value)}
                    />
                  </td>

                  <td className="p-4 text-center">
                    <button
                      onClick={() => removeRow(risk.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <span className="material-icons-outlined text-sm">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRisks.length === 0 && (
                <tr>
                  <td colSpan={18} className="p-20 text-center text-slate-400 italic">
                    No se han encontrado registros para esta entidad en la matriz de riesgos.
                  </td>
                </tr>
              )}
            </tbody>
        </table>
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Escala de Riesgo:</span>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-green-600"></span>
              <span className="text-[9px] font-bold text-slate-500">1-7 BAJO</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-orange-500"></span>
              <span className="text-[9px] font-bold text-slate-500">8-14 MEDIO</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-red-600"></span>
              <span className="text-[9px] font-bold text-slate-500">15-25 ALTO</span>
            </div>
          </div>
          <div className="h-4 w-px bg-slate-200"></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="material-icons-outlined text-xs">calculate</span>
            Residual = Inherente / Efectividad
          </p>
        </div>
        <p className="text-[10px] text-slate-300 font-bold tracking-tighter uppercase">AuditPro Control Engine v3.5</p>
      </div>
    </div>
  );
};

export default RiskMatrix;
