import React, { useState, useMemo } from 'react';
import { AuditEntity, RiskControl, CLACriterion } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { GoogleGenAI } from "@google/genai";
import ExecutiveReportModal from './ExecutiveReportModal';

interface DashboardProps {
  entities: AuditEntity[];
  risks: RiskControl[];
  claCriteria?: CLACriterion[];
}

const Dashboard: React.FC<DashboardProps> = ({ entities, risks, claCriteria = [] }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // 1. Calculate Core Metrics
  const globalProgress = useMemo(() => {
    if (entities.length === 0) return 0;
    const totalProgress = entities.reduce((acc, curr) => acc + (curr.progress || 0), 0);
    return Math.round(totalProgress / entities.length);
  }, [entities]);

  const totalPendingTasks = useMemo(() => {
    // Tasks from entities
    const entityPending = entities.reduce((acc, e) =>
      acc + (e.tasks || []).filter(t => t.status !== 'Completed').length, 0);

    // Tasks from risk matrix
    const riskPending = risks.filter(r => r.status !== 'Completado').length;

    return entityPending + riskPending;
  }, [entities, risks]);

  const stats = [
    { label: 'Total Auditorías', value: entities.length, icon: 'business', color: 'bg-blue-500' },
    { label: 'Avance Global', value: `${globalProgress}%`, icon: 'insights', color: 'bg-emerald-500' },
    { label: 'Tareas Pendientes', value: totalPendingTasks, icon: 'assignment_late', color: 'bg-amber-500' },
    { label: 'Riesgos Críticos', value: risks.filter(r => r.traffic_light_level === 'Alto' || r.traffic_light_level === 'Crítico').length, icon: 'warning', color: 'bg-red-500' },
  ];

  const planningAlerts = useMemo(() => {
    const alerts: { entityName: string, phaseName: string, note: string }[] = [];
    entities.forEach(entity => {
      entity.phases?.forEach(phase => {
        if (phase.alert_note) {
          alerts.push({
            entityName: entity.name,
            phaseName: phase.name,
            note: phase.alert_note
          });
        }
      });
    });
    return alerts;
  }, [entities]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const detailedStats = entities.map(e => {
    const entityTasks = e.tasks || [];
    const matrixTasks = risks
      .filter(r => r.audit_id === e.id && r.tasks)
      .map(r => ({
        id: r.id,
        title: r.tasks || '',
        status: r.status === 'Completado' ? 'Completed' :
          r.status === 'En curso' ? 'In Progress' : 'Pending'
      }));

    const allTasks = [...entityTasks, ...matrixTasks];
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.status === 'Completed').length;
    const progressPerc = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      name: e.name,
      start_date: e.start_date,
      total,
      completed,
      inProgress: allTasks.filter(t => t.status === 'In Progress').length,
      pending: allTasks.filter(t => t.status === 'Pending').length,
      progressPerc
    };
  });

  // 2. Group CLA Data by Area
  const claByArea = useMemo(() => {
    const groups: Record<string, { criteria: CLACriterion[], count: number, complies: number }> = {};
    claCriteria.forEach(item => {
      const area = item.area || 'Sin Área';
      if (!groups[area]) {
        groups[area] = { criteria: [], count: 0, complies: 0 };
      }
      groups[area].criteria.push(item);
      groups[area].count++;
      if (item.complies === 'Sí') groups[area].complies++;
    });
    return groups;
  }, [claCriteria]);

  const handleGenerateReport = async () => {
    setIsLoadingReport(true);
    setIsModalOpen(true);
    try {
      const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || '';
      if (!apiKey) throw new Error("API Key not found");
      const ai = new GoogleGenAI({ apiKey });
      const dataString = entities.map(e =>
        `- ${e.name}: Progreso ${e.progress}%, Estado ${e.status}, Tareas: ${(e.tasks || []).length}`
      ).join('\n');
      const alertsString = planningAlerts.length > 0
        ? `Alertas de planificación detectadas:\n${planningAlerts.map(a => `- ${a.entityName} (${a.phaseName}): ${a.note}`).join('\n')}`
        : "No hay desviaciones en los tiempos de planificación estándar.";
      const prompt = `Como consultor experto en auditoría y control interno, genera un resumen ejecutivo profesional y estratégico basado en los siguientes datos de un programa de auditoría:\n\n${dataString}\n\n${alertsString}\n\nIncluye:\n1. Una evaluación general del estado del programa.\n2. Identificación de áreas críticas o retrasos significativos.\n3. Recomendaciones de alta gerencia.\n\nTono ejecutivo, 3-4 párrafos.`;
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
      });
      setAiSummary(response.text || 'No se pudo generar el resumen.');
    } catch (error) {
      console.error('Error report:', error);
      setAiSummary('Error al conectar con el motor de IA.');
    } finally {
      setIsLoadingReport(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-500 text-[10px] font-extrabold uppercase tracking-widest">{stat.label}</span>
              <div className={`${stat.color} p-2 rounded-xl text-white group-hover:scale-110 transition-transform shadow-lg shadow-current/20`}>
                <span className="material-icons-outlined text-lg">{stat.icon}</span>
              </div>
            </div>
            <div className="text-3xl font-black text-slate-800 tracking-tight">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Gráfico de Progreso */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <span className="material-icons-outlined text-blue-600">analytics</span>
                Progreso de Auditoría por Entidad
              </h3>
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {`>80%`}
                </div>
                <div className="flex items-center gap-1.5 text-blue-600">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> {`40-80%`}
                </div>
                <div className="flex items-center gap-1.5 text-amber-600">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> {`<40%`}
                </div>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={detailedStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  />
                  <Bar dataKey="progressPerc" radius={[6, 6, 0, 0]} barSize={40}>
                    {detailedStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.progressPerc > 80 ? '#10b981' : entry.progressPerc > 40 ? '#3b82f6' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabla de Métricas Detalladas (Restaurada) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Métricas Detalladas de Ejecución</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1a5f7a] text-white">
                    <th className="p-4 text-[10px] font-bold uppercase tracking-wider border-r border-white/10">Entidad</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-wider border-r border-white/10 text-center">F. Inicio</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-wider border-r border-white/10 text-center">Tareas Totales</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-wider border-r border-white/10 text-center">Completadas</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-wider border-r border-white/10 text-center">En Curso</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-wider border-r border-white/10 text-center">Pendientes</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-right">Avance (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detailedStats.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 text-sm font-bold text-slate-800">{item.name}</td>
                      <td className="p-4 text-xs font-bold text-slate-500 text-center">{formatDate(item.start_date)}</td>
                      <td className="p-4 text-sm font-medium text-slate-600 text-center">{item.total}</td>
                      <td className="p-4 text-sm font-bold text-emerald-600 text-center">{item.completed}</td>
                      <td className="p-4 text-sm font-bold text-blue-600 text-center">{item.inProgress}</td>
                      <td className="p-4 text-sm font-bold text-amber-600 text-center">{item.pending}</td>
                      <td className="p-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm font-extrabold text-slate-900">{item.progressPerc}%</span>
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${item.progressPerc}%` }}></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <div className="space-y-6">
          {/* Panel de Alertas */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black mb-4 flex items-center gap-2 text-slate-800 uppercase tracking-widest">
              <span className="material-icons-outlined text-amber-500">history_edu</span>
              Alertas de Planificación
            </h3>
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
              {planningAlerts.length > 0 ? (
                planningAlerts.map((alert, idx) => (
                  <div key={idx} className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl transition-all hover:bg-amber-50 cursor-default">
                    <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-1">
                      {alert.entityName}
                    </p>
                    <p className="text-xs font-bold text-slate-800 leading-snug">
                      {alert.note}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <span className="material-icons-outlined text-slate-200 text-3xl mb-3">check_circle</span>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-6">
                    Cronograma Alineado
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Cumplimiento CLA por Área (Movido al Sidebar) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <span className="material-icons-outlined text-indigo-600 bg-indigo-50 p-1.5 rounded-lg text-sm">checklist_rtl</span>
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Cumplimiento CLA</h3>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
              {Object.keys(claByArea).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(claByArea).map(([area, data]) => {
                    const perc = Math.round((data.complies / data.count) * 100);
                    return (
                      <div key={area} className="p-3 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-[9px] font-black text-slate-700 uppercase tracking-widest truncate max-w-[100px]">{area}</h4>
                          <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black ${perc > 80 ? 'bg-emerald-100 text-emerald-700' : perc > 50 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                            {perc}%
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {data.criteria.map((c, idx) => (
                            <div
                              key={idx}
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black border transition-transform hover:scale-110 cursor-help
                                ${c.complies === 'Sí' ? 'bg-emerald-500 text-white border-emerald-600' : c.complies === 'No' ? 'bg-red-500 text-white border-red-600' : 'bg-slate-200 text-slate-500 border-slate-300'}`}
                              title={`${c.criterion}: ${c.complies}`}
                            >
                              {c.complies === 'Sí' ? 'S' : c.complies === 'No' ? 'N' : '-'}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sin datos CLA</p>
                </div>
              )}
            </div>
          </div>

          {/* Generación de Reporte (Compactado) */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-2xl shadow-xl shadow-blue-900/20 text-white space-y-3">
            <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-wide">
              <span className="material-icons-outlined text-base">auto_awesome</span>
              Reporte Ejecutivo
            </h3>
            <p className="text-blue-100 text-[10px] font-medium leading-tight">
              Síntesis estratégica basada en el progreso real y controles detectados.
            </p>
            <button
              onClick={handleGenerateReport}
              className="w-full py-3 bg-white text-blue-700 rounded-xl text-[11px] font-black hover:bg-blue-50 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              Generar Síntesis de IA
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <ExecutiveReportModal
          entities={entities}
          aiSummary={aiSummary}
          isLoading={isLoadingReport}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
