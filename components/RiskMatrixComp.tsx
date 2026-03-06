import React, { useState, useEffect, useMemo } from 'react';
import { RiskControl, AuditEntity, TaskPlannerEntry, Person } from '../types';
import { SCOPE_OPTIONS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { canEditEntity } from '../src/lib/permissions';
import RiskEditModal from './RiskEditModal';

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
  const { dbUser } = useAuth();
  const [localRisks, setLocalRisks] = useState<RiskControl[]>(risks);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSaveRisk = (updatedRisk: RiskControl) => {
    let newRisks: RiskControl[];
    const exists = localRisks.some(r => r.id === updatedRisk.id);

    if (exists) {
      newRisks = localRisks.map(r => r.id === updatedRisk.id ? updatedRisk : r);
    } else {
      newRisks = [...localRisks, updatedRisk];
    }

    setLocalRisks(newRisks);
    setHasChanges(true);
    // Persist immediately as it is a modal save
    onUpdate(newRisks);
    setIsModalOpen(false);
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<RiskControl | undefined>(undefined);

  // Filter State
  const [filters, setFilters] = useState({
    entity_name: '',
    audit_scope: '',
    tasks: '',
    area: '',
    responsible: '',
    status: '',
    traffic_light_level: ''
  });

  useEffect(() => {
    setLocalRisks(risks);
    setHasChanges(false);
  }, [risks]);

  const filteredRisks = useMemo(() => {
    let result = localRisks;

    if (filterEntityName) {
      result = result.filter(r => r.entity_name === filterEntityName);
    }

    if (filters.entity_name) result = result.filter(r => r.entity_name.toLowerCase().includes(filters.entity_name.toLowerCase()));
    if (filters.audit_scope) result = result.filter(r => r.audit_scope?.toLowerCase().includes(filters.audit_scope.toLowerCase()));
    if (filters.tasks) result = result.filter(r => r.tasks?.toLowerCase().includes(filters.tasks.toLowerCase()));
    if (filters.area) result = result.filter(r => r.area?.toLowerCase().includes(filters.area.toLowerCase()));
    if (filters.responsible) result = result.filter(r => r.responsible?.toLowerCase().includes(filters.responsible.toLowerCase()));
    if (filters.status) result = result.filter(r => r.status === filters.status);
    if (filters.traffic_light_level) result = result.filter(r => r.traffic_light_level === filters.traffic_light_level);

    return result;
  }, [localRisks, filterEntityName, filters]);

  const canEditRisk = (riskOrEntityName: RiskControl | string | undefined) => {
    let entityName = '';
    if (typeof riskOrEntityName === 'string') {
      entityName = riskOrEntityName;
    } else if (riskOrEntityName && typeof riskOrEntityName === 'object' && 'entity_name' in riskOrEntityName) {
      entityName = riskOrEntityName.entity_name || '';
    }

    if (!entityName && filterEntityName) entityName = filterEntityName;

    if (!entityName) return false;

    const entity = entities.find(e => e.name === entityName);
    if (!entity) return false;

    return canEditEntity(dbUser, entity);
  };

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
    const risk = localRisks.find(r => r.id === id);
    if (risk && !canEditRisk(risk)) {
      alert("No tienes permisos para editar esta entidad.");
      return;
    }

    const updated = localRisks.map(risk => {
      if (risk.id !== id) return risk;
      const newRisk = { ...risk, [field]: value };

      if (field === 'impact' || field === 'probability' || field === 'control_effectiveness') {
        const impactVal = Number(newRisk.impact) || 1;
        const probVal = Number(newRisk.probability) || 1;
        newRisk.inherent_risk = impactVal * probVal;

        const effectiveness = Number(newRisk.control_effectiveness) || 1;
        const rawResidual = newRisk.inherent_risk / effectiveness;
        newRisk.residual_risk = parseFloat(rawResidual.toFixed(2));

        if (newRisk.residual_risk >= 20) {
          newRisk.traffic_light_level = 'Crítico';
        } else if (newRisk.residual_risk >= 12) {
          newRisk.traffic_light_level = 'Alto';
        } else if (newRisk.residual_risk >= 6) {
          newRisk.traffic_light_level = 'Medio';
        } else {
          newRisk.traffic_light_level = 'Bajo';
        }
      }

      return newRisk;
    });
    setLocalRisks(updated);
    setHasChanges(true);
  };

  const handleAreaChange = (id: string, value: string) => {
    const risk = localRisks.find(r => r.id === id);
    if (risk && !canEditRisk(risk)) return;

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

    if (!canEditRisk(defaultEntity)) {
      alert("No tienes permisos para añadir riesgos a esta entidad.");
      return;
    }

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
    setLocalRisks([...localRisks, newRisk]);
    setHasChanges(true);
  };

  const removeRow = (id: string) => {
    const risk = localRisks.find(r => r.id === id);
    if (risk && !canEditRisk(risk)) return;
    setLocalRisks(localRisks.filter(r => r.id !== id));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate(localRisks);
    setHasChanges(false);
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
            {/* New button to create a new Risk‑Control matrix entry */}
            <button
              onClick={addRow}
              className="flex items-center gap-2 px-4 py-2 bg-[#0a192f] text-white rounded-xl text-xs font-bold hover:brightness-110 transition-all shadow-lg shadow-slate-200"
            >
              <span className="material-icons-outlined text-sm">add</span>
              Crear Matriz R‑C
            </button>
          </div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1 italic tracking-tight">Cálculo Residual: Inherente / Efectividad | Clasificación: 1-7 Bajo, 8-14 Medio, 15-25 Alto</p>
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
          {(filterEntityName && canEditRisk(filterEntityName)) && (
            <button
              onClick={() => {
                setEditingRisk(undefined);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a365d] text-white rounded-xl text-xs font-bold hover:brightness-110 transition-all shadow-lg shadow-slate-200"
            >
              <span className="material-icons-outlined text-sm">add_circle</span>
              Nuevo Riesgo (Formulario)
            </button>
          )}
        </div>
      </div>

      {filterEntityName && (
        <div className="px-6 pb-4 bg-slate-50/30 border-b border-slate-200 flex items-center gap-4 animate-in slide-in-from-top-2">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Equipo Asignado:</span>
          {entities.find(e => e.name === filterEntityName)?.members && entities.find(e => e.name === filterEntityName)!.members!.length > 0 ? (
            <div className="flex items-center gap-3">
              {entities.find(e => e.name === filterEntityName)!.members!.map((member: Person) => (
                <div key={member.id} className="flex items-center gap-2 bg-white px-2 py-1 rounded-full border border-slate-200 shadow-sm">
                  <img src={member.avatar_url} className="w-5 h-5 rounded-full" alt={member.full_name} title={member.full_name} />
                  <span className="text-xs font-bold text-slate-700">{member.full_name}</span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">No hay auditores asignados.</span>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[2800px] border border-slate-300">
          <thead>
            {/* Headers Label Row */}
            <tr className="bg-[#0a192f] text-white shadow-lg sticky top-0 z-30 h-7">
              <th className="px-1 text-[9px] font-black uppercase tracking-widest border border-slate-700 whitespace-nowrap w-12 sticky left-0 z-40 bg-[#0a192f] shadow-[1px_0_3px_rgba(0,0,0,0.4)]">#</th>
              <th className="px-2 text-[9px] font-black uppercase tracking-widest border border-slate-700 whitespace-nowrap min-w-[200px] sticky left-12 z-40 bg-[#0a192f] shadow-[1px_0_3px_rgba(0,0,0,0.4)]">Entidad</th>
              <th className="px-2 text-[9px] font-black uppercase tracking-widest border border-slate-700 whitespace-nowrap min-w-[220px] sticky left-[248px] z-40 bg-[#0a192f] shadow-[1px_0_3px_rgba(0,0,0,0.4)]">Alcance de Auditoría</th>
              <th className="px-2 text-[9px] font-black uppercase tracking-widest border border-slate-700 whitespace-nowrap min-w-[300px]">Tareas</th>
              <th className="px-2 text-[9px] font-black uppercase tracking-widest border border-slate-700 whitespace-nowrap">Proceso</th>
              <th className="px-2 text-[9px] font-black uppercase tracking-widest border border-slate-700 whitespace-nowrap min-w-[150px]">Área</th>
              <th className="px-2 text-[9px] font-black uppercase tracking-widest border border-slate-700 whitespace-nowrap">Riesgo Identificado</th>
              <th className="px-2 text-[9px] font-black uppercase tracking-widest border border-slate-700 whitespace-nowrap min-w-[100px]">Impacto</th>
              <th className="px-2 text-[9px] font-black uppercase tracking-widest border border-slate-700 whitespace-nowrap min-w-[100px]">Probabilidad</th>
              <th className="px-2 text-[9px] font-black uppercase tracking-widest border border-slate-700 whitespace-nowrap text-center">Inherente</th>
              <th className="px-2 text-[9px] font-black uppercase tracking-widest border border-slate-700 whitespace-nowrap">Controles</th>
              <th className="px-2 text-[9px] font-black uppercase tracking-widest border border-slate-700 whitespace-nowrap min-w-[100px]">Efectividad</th>
              <th className="px-2 text-[9px] font-black uppercase tracking-widest border border-slate-700 whitespace-nowrap text-center">Residual</th>
              <th className="px-2 text-[9px] font-black uppercase tracking-widest border border-slate-700 whitespace-nowrap text-center">Nivel</th>
              <th className="px-2 text-[9px] font-black uppercase tracking-widest border border-slate-700 whitespace-nowrap min-w-[120px]">Estado</th>
              <th className="px-2 text-[9px] font-black uppercase tracking-widest border border-slate-700 whitespace-nowrap">Responsable</th>
              <th className="px-2 text-[9px] font-black uppercase tracking-widest border border-slate-700 whitespace-nowrap">Fecha Imp.</th>
              <th className="px-2 text-[9px] font-black uppercase tracking-widest border border-slate-700 whitespace-nowrap">Rec.</th>
            </tr>
            {/* Filter Row */}
            <tr className="bg-slate-100 sticky top-7 z-20 shadow-sm h-6">
              <th className="p-0.5 border border-slate-300 sticky left-0 z-40 bg-slate-100 shadow-[1px_0_3px_rgba(0,0,0,0.1)]"></th>
              <th className="p-0.5 border border-slate-300 sticky left-12 z-40 bg-slate-100 shadow-[1px_0_3px_rgba(0,0,0,0.1)]">
                <input
                  type="text"
                  placeholder="Filtrar Entidad..."
                  title="Filtrar por Entidad"
                  className="w-full px-1 py-0.5 text-[9px] rounded border border-slate-300 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  value={filters.entity_name}
                  onChange={(e) => setFilters({ ...filters, entity_name: e.target.value })}
                />
              </th>
              <th className="p-0.5 border border-slate-300 sticky left-[248px] z-40 bg-slate-100 shadow-[1px_0_3px_rgba(0,0,0,0.1)]">
                <input
                  type="text"
                  placeholder="Filtrar Alcance..."
                  title="Filtrar por Alcance"
                  className="w-full px-1 py-0.5 text-[9px] rounded border border-slate-300 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  value={filters.audit_scope}
                  onChange={(e) => setFilters({ ...filters, audit_scope: e.target.value })}
                />
              </th>
              <th className="p-1 border border-slate-300">
                <input
                  type="text"
                  placeholder="Filtrar Tarea..."
                  title="Filtrar por Tarea"
                  className="w-full px-2 py-1 text-[10px] rounded border border-slate-200 outline-none focus:ring-1 focus:ring-[#0a192f]"
                  value={filters.tasks}
                  onChange={(e) => setFilters({ ...filters, tasks: e.target.value })}
                />
              </th>
              <th className="p-1 border border-slate-300"></th>
              <th className="p-1 border border-slate-300">
                <input
                  type="text"
                  placeholder="Filtrar Área..."
                  title="Filtrar por Área"
                  className="w-full px-2 py-1 text-[10px] rounded border border-slate-200 outline-none focus:ring-1 focus:ring-[#0a192f]"
                  value={filters.area}
                  onChange={(e) => setFilters({ ...filters, area: e.target.value })}
                />
              </th>
              <th className="p-1 border border-slate-300"></th>
              <th className="p-1 border border-slate-300"></th>
              <th className="p-1 border border-slate-300"></th>
              <th className="p-1 border border-slate-300"></th>
              <th className="p-1 border border-slate-300"></th>
              <th className="p-1 border border-slate-300"></th>
              <th className="p-1 border border-slate-300">
                <select
                  title="Filtrar por Nivel de Riesgo"
                  className="w-full px-2 py-1 text-[10px] rounded border border-slate-200 outline-none focus:ring-1 focus:ring-[#0a192f] bg-white"
                  value={filters.traffic_light_level}
                  onChange={(e) => setFilters({ ...filters, traffic_light_level: e.target.value })}
                >
                  <option value="">Nivel...</option>
                  <option value="Alto">Alto</option>
                  <option value="Medio">Medio</option>
                  <option value="Bajo">Bajo</option>
                </select>
              </th>
              <th className="p-1 border border-slate-300"></th>
              <th className="p-1 border border-slate-300">
                <select
                  title="Filtrar por Estado"
                  className="w-full px-2 py-1 text-[10px] rounded border border-slate-200 outline-none focus:ring-1 focus:ring-[#0a192f] bg-white"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">Estado...</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En curso">En curso</option>
                  <option value="Completado">Completado</option>
                </select>
              </th>
              <th className="p-1 border border-slate-300">
                <input
                  type="text"
                  placeholder="Responsable..."
                  title="Filtrar por Responsable"
                  className="w-full px-2 py-1 text-[10px] rounded border border-slate-200 outline-none focus:ring-1 focus:ring-[#0a192f]"
                  value={filters.responsible}
                  onChange={(e) => setFilters({ ...filters, responsible: e.target.value })}
                />
              </th>
              <th className="p-1 border border-slate-300"></th>
              <th className="p-1 border border-slate-300"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredRisks.map((risk) => {
              const readOnly = !canEditRisk(risk);
              return (
                <tr key={risk.id} className="group hover:bg-blue-50/50 transition-colors even:bg-slate-50 odd:bg-white text-[9px] h-8">
                  {/* Action Column */}
                  <td className="p-0 border border-slate-300 sticky left-0 z-20 bg-inherit group-hover:bg-blue-50/50 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-center h-full min-h-[32px]">
                      <button
                        onClick={() => {
                          setEditingRisk(risk);
                          setIsModalOpen(true);
                        }}
                        className="p-0.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded transition-all"
                        title="Editar Riesgo"
                      >
                        <span className="material-icons-outlined text-sm">edit_note</span>
                      </button>
                    </div>
                  </td>

                  <td className="p-0 border border-slate-300 sticky left-12 z-20 bg-inherit group-hover:bg-blue-50/50 transition-colors shadow-[1px_0_3px_rgba(0,0,0,0.1)]">
                    <select
                      disabled={readOnly}
                      className="w-full h-full px-1 py-0.5 border-none focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none cursor-pointer disabled:cursor-not-allowed disabled:text-slate-500 bg-transparent text-[9px]"
                      value={risk.entity_name}
                      title="Seleccionar entidad"
                      aria-label="Seleccionar entidad"
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

                  <td className="p-0 border border-slate-300 sticky left-[248px] z-20 bg-inherit group-hover:bg-blue-50/50 transition-colors shadow-[1px_0_3px_rgba(0,0,0,0.1)]">
                    <select
                      disabled={readOnly}
                      className={`w-full h-full px-1 py-0.5 border-none focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none cursor-pointer disabled:cursor-not-allowed bg-transparent text-[9px] ${!risk.audit_scope ? 'text-slate-400 italic' : 'text-slate-700 font-bold'}`}
                      value={risk.audit_scope}
                      title="Seleccionar alcance"
                      aria-label="Seleccionar alcance"
                      onChange={(e) => handleCellChange(risk.id, 'audit_scope', e.target.value)}
                    >
                      <option value="" disabled>Seleccionar alcance...</option>
                      {SCOPE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>

                  <td className="p-0 border border-slate-300">
                    <select
                      disabled={readOnly}
                      className={`w-full h-full px-1 py-0.5 border-none focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none cursor-pointer disabled:cursor-not-allowed bg-transparent text-[9px] ${!risk.tasks ? 'text-slate-400 italic' : 'text-slate-700 italic font-bold'}`}
                      value={risk.tasks}
                      title="Seleccionar tarea"
                      aria-label="Seleccionar tarea"
                      onChange={(e) => handleCellChange(risk.id, 'tasks', e.target.value)}
                    >
                      <option value="" disabled>Seleccionar tarea...</option>
                      {Array.from(new Set(getTasksForScope(risk.audit_scope || ''))).map(task => (
                        <option key={task} value={task}>{task}</option>
                      ))}
                    </select>
                  </td>

                  <td className="p-0 border border-slate-300">
                    <input
                      disabled={readOnly}
                      type="text"
                      className="w-full h-full px-1 py-0.5 font-black text-[#0a192f] border-none focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none placeholder:text-slate-300 disabled:cursor-not-allowed disabled:text-slate-500 bg-transparent text-[9px]"
                      placeholder="Proceso..."
                      aria-label="Proceso"
                      value={risk.process}
                      onChange={(e) => handleCellChange(risk.id, 'process', e.target.value)}
                    />
                  </td>
                  <td className="p-0 border border-slate-300">
                    <select
                      disabled={readOnly}
                      className="w-full h-full px-1 py-0.5 text-slate-600 font-bold border-none focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none cursor-pointer disabled:cursor-not-allowed bg-transparent text-[9px]"
                      value={risk.area}
                      aria-label="Seleccionar área"
                      onChange={(e) => handleAreaChange(risk.id, e.target.value)}
                    >
                      <option value="" disabled>Seleccionar área...</option>
                      {areas.map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                      {!readOnly && <option value="__add__" className="text-blue-600 font-bold">+ Añadir nueva área...</option>}
                    </select>
                  </td>
                  <td className="p-0 border border-slate-300 min-w-[250px]">
                    <textarea
                      disabled={readOnly}
                      rows={1}
                      className="w-full h-full px-1 py-0.5 text-slate-700 border-none focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none resize-none leading-tight placeholder:text-slate-300 disabled:cursor-not-allowed disabled:text-slate-500 bg-transparent text-[9px]"
                      placeholder="Descripción del riesgo..."
                      aria-label="Descripción del riesgo"
                      value={risk.risk_description}
                      onChange={(e) => handleCellChange(risk.id, 'risk_description', e.target.value)}
                    />
                  </td>

                  <td className="p-0 border border-slate-300">
                    <select
                      disabled={readOnly}
                      className="w-full h-full px-1 py-0.5 font-bold text-slate-700 border-none focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none cursor-pointer disabled:cursor-not-allowed bg-transparent text-[9px]"
                      value={risk.impact}
                      aria-label="Nivel de impacto"
                      onChange={(e) => handleCellChange(risk.id, 'impact', parseInt(e.target.value))}
                    >
                      {IMPACT_LEVELS.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.value} - {level.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="p-0 border border-slate-300">
                    <select
                      disabled={readOnly}
                      className="w-full h-full px-1 py-0.5 font-bold text-slate-700 border-none focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none cursor-pointer disabled:cursor-not-allowed bg-transparent text-[9px]"
                      value={risk.probability}
                      aria-label="Nivel de probabilidad"
                      onChange={(e) => handleCellChange(risk.id, 'probability', parseInt(e.target.value))}
                    >
                      {PROBABILITY_LEVELS.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.value} - {level.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="p-1 px-2 text-center text-[10px] font-black text-[#0a192f] bg-blue-50/50 border border-slate-300 tabular-nums">
                    {risk.inherent_risk}
                  </td>

                  <td className="p-0 border border-slate-300">
                    <textarea
                      disabled={readOnly}
                      rows={1}
                      className="w-full h-full px-1 py-0.5 bg-transparent border-none focus:ring-1 focus:ring-blue-500 outline-none resize-none disabled:cursor-not-allowed disabled:text-slate-500 text-[9px] leading-tight"
                      value={risk.existing_controls}
                      aria-label="Controles existentes"
                      onChange={(e) => handleCellChange(risk.id, 'existing_controls', e.target.value)}
                    />
                  </td>

                  <td className="p-0 border border-slate-300">
                    <select
                      disabled={readOnly}
                      className="w-full h-full px-1 py-0.5 font-bold text-slate-700 border-none focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none cursor-pointer disabled:cursor-not-allowed bg-transparent text-[9px]"
                      value={risk.control_effectiveness}
                      aria-label="Efectividad del control"
                      onChange={(e) => handleCellChange(risk.id, 'control_effectiveness', parseInt(e.target.value) || 1)}
                    >
                      {EFFECTIVENESS_LEVELS.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.value} - {level.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="p-1 px-2 text-center text-[10px] font-black text-[#0a192f] bg-indigo-50/30 border border-slate-300 tabular-nums">
                    {risk.residual_risk}
                  </td>

                  <td className="p-1 text-center border border-slate-300 bg-inherit">
                    <div className={`px-1.5 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-wider inline-block min-w-[70px] border ${getTrafficLightColor(risk.traffic_light_level)}`}>
                      {risk.traffic_light_level}
                    </div>
                    <div className="text-[8px] text-slate-400 mt-0.5 font-bold tabular-nums">
                      ({risk.residual_risk})
                    </div>
                  </td>

                  <td className="p-0 border border-slate-300 bg-inherit group-hover:bg-blue-50/50 transition-colors">
                    <select
                      disabled={readOnly}
                      className={`w-full h-full px-1 py-0.5 text-[9px] font-black uppercase tracking-wider bg-transparent border-none focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer disabled:cursor-not-allowed ${getStatusColor(risk.status)}`}
                      value={risk.status}
                      aria-label="Estado del riesgo"
                      onChange={(e) => handleCellChange(risk.id, 'status', e.target.value)}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt} value={opt} className="bg-white text-slate-800 normal-case font-medium">{opt}</option>
                      ))}
                    </select>
                  </td>

                  <td className="p-0 border border-slate-300">
                    <select
                      disabled={readOnly}
                      className="w-full h-full px-1 py-0.5 text-slate-800 font-bold bg-transparent border-none focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none cursor-pointer disabled:cursor-not-allowed disabled:text-slate-500 text-[9px]"
                      value={risk.responsible}
                      aria-label="Responsable del riesgo"
                      onChange={(e) => handleCellChange(risk.id, 'responsible', e.target.value)}
                    >
                      <option value="" disabled>Asignar responsable...</option>
                      {people.map(person => (
                        <option key={person.id} value={person.full_name}>{person.full_name}</option>
                      ))}
                      {risk.responsible && !people.some(p => p.full_name === risk.responsible) && (
                        <option value={risk.responsible}>{risk.responsible}</option>
                      )}
                    </select>
                  </td>
                  <td className="p-0 border border-slate-300">
                    <input
                      disabled={readOnly}
                      type="date"
                      className="w-full h-full px-1 py-0.5 text-[9px] text-slate-500 bg-transparent border-none focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none font-bold disabled:cursor-not-allowed"
                      value={risk.implementation_date}
                      aria-label="Fecha de implementación"
                      onChange={(e) => handleCellChange(risk.id, 'implementation_date', e.target.value)}
                    />
                  </td>
                  <td className="p-0 border border-slate-300">
                    <textarea
                      disabled={readOnly}
                      rows={1}
                      className="w-full h-full px-1 py-0.5 text-slate-600 italic leading-tight bg-transparent border-none focus:ring-1 focus:ring-blue-500 focus:bg-white outline-none resize-none placeholder:text-slate-300 disabled:cursor-not-allowed disabled:text-slate-500 text-[9px]"
                      placeholder="Recomendación..."
                      aria-label="Recomendación"
                      value={risk.recommendation}
                      onChange={(e) => handleCellChange(risk.id, 'recommendation', e.target.value)}
                    />
                  </td>

                  <td className="p-1 text-center border border-slate-300">
                    {!readOnly && (
                      <button
                        onClick={() => removeRow(risk.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        aria-label="Eliminar riesgo"
                      >
                        <span className="material-icons-outlined text-sm">delete</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
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

      {isModalOpen && (
        <RiskEditModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveRisk}
          risk={editingRisk}
          entities={entities}
          allTasks={plannerData}
          availableAreas={areas}
          onAddArea={onAddArea}
          people={people}
        />
      )}
    </div>
  );
};

export default RiskMatrix;
