import React, { useState, useMemo } from 'react';
import { AuditEntity } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { GoogleGenAI } from "@google/genai";
import ExecutiveReportModal from './ExecutiveReportModal';

interface DashboardProps {
  entities: AuditEntity[];
}

const Dashboard: React.FC<DashboardProps> = ({ entities }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  const stats = [
    { label: 'Total Entidades', value: entities.length, icon: 'business', color: 'bg-blue-500' },
    { label: 'En Progreso', value: entities.filter(e => e.status === 'Execution').length, icon: 'pending_actions', color: 'bg-amber-500' },
    { label: 'Completadas', value: entities.filter(e => e.status === 'Completed').length, icon: 'check_circle', color: 'bg-emerald-500' },
    { label: 'Riesgos Críticos', value: 8, icon: 'warning', color: 'bg-red-500' },
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
    const tasks = e.tasks || [];
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const progressPerc = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      name: e.name,
      start_date: e.start_date,
      total,
      completed,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      pending: tasks.filter(t => t.status === 'Pending').length,
      progressPerc
    };
  });

  const handleGenerateReport = async () => {
    setIsLoadingReport(true);
    setIsModalOpen(true);

    try {
      // Note: Make sure API_KEY is available in environment variables
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''; // Use VITE_ prefix for client-side
      if (!apiKey) throw new Error("API Key not found");

      const ai = new GoogleGenAI({ apiKey });

      const dataString = entities.map(e =>
        `- ${e.name}: Progreso ${e.progress}%, Estado ${e.status}, Tareas: ${(e.tasks || []).length}`
      ).join('\n');

      const alertsString = planningAlerts.length > 0
        ? `Alertas de planificación detectadas:\n${planningAlerts.map(a => `- ${a.entityName} (${a.phaseName}): ${a.note}`).join('\n')}`
        : "No hay desviaciones en los tiempos de planificación estándar.";

      const prompt = `Como consultor experto en auditoría y control interno, genera un resumen ejecutivo profesional y estratégico basado en los siguientes datos de un programa de auditoría:\n\n${dataString}\n\n${alertsString}\n\nIncluye:\n1. Una evaluación general del estado del programa.\n2. Identificación de áreas críticas o retrasos significativos (especialmente si hay cambios en la duración de las fases).\n3. Recomendaciones de alta gerencia para optimizar el cumplimiento.\n\nEl tono debe ser ejecutivo, formal y constructivo. Limítate a unos 3-4 párrafos.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash', // Updated model name if applicable, or keep as is
        contents: prompt,
      });

      setAiSummary(response.text || 'No se pudo generar el resumen automáticamente.');
    } catch (error) {
      console.error('Error generating AI report:', error);
      setAiSummary('Error al conectar con el motor de inteligencia artificial. Por favor, verifique su conexión e intente nuevamente.');
    } finally {
      setIsLoadingReport(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider">{stat.label}</span>
              <div className={`${stat.color} p-2 rounded-xl text-white group-hover:scale-110 transition-transform`}>
                <span className="material-icons-outlined">{stat.icon}</span>
              </div>
            </div>
            <div className="text-3xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="material-icons-outlined text-blue-600">analytics</span>
              Progreso por Entidad
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={detailedStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="progressPerc" radius={[8, 8, 0, 0]}>
                    {detailedStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.progressPerc > 80 ? '#10b981' : entry.progressPerc > 40 ? '#3b82f6' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Métricas Detalladas de Ejecución</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4">Entidad</th>
                    <th className="p-4 text-center">F. Inicio</th>
                    <th className="p-4 text-center">Tareas Totales</th>
                    <th className="p-4 text-center">Completadas</th>
                    <th className="p-4 text-center">En Curso</th>
                    <th className="p-4 text-center">Pendientes</th>
                    <th className="p-4 text-right">Avance (%)</th>
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
          {/* Panel de Alertas de Planificación */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
              <span className="material-icons-outlined text-amber-500">history_edu</span>
              Alertas de Planificación
            </h3>
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 hide-scrollbar">
              {planningAlerts.length > 0 ? (
                planningAlerts.map((alert, idx) => (
                  <div key={idx} className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-[10px] font-black uppercase text-amber-600 tracking-tighter">
                        {alert.entityName}
                      </p>
                      <span className="text-[8px] font-bold text-amber-400 uppercase">{alert.phaseName}</span>
                    </div>
                    <p className="text-[11px] font-medium text-amber-800 italic leading-tight">
                      "{alert.note}"
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <span className="material-icons-outlined text-slate-300 mb-2">check_circle_outline</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">
                    Sin desviaciones del estándar (2, 2, 3, 2, 2)
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="material-icons-outlined text-blue-600">list_alt</span>
              Resumen de Actividad
            </h3>
            <div className="space-y-4 flex-1">
              {detailedStats.map((e, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sm text-slate-800 group-hover:text-blue-600 transition-colors">{e.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Inicio: {formatDate(e.start_date)} | {e.total} tareas</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${e.progressPerc === 100 ? 'bg-emerald-100 text-emerald-700' :
                        e.progressPerc > 0 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                      {e.progressPerc === 100 ? 'Finalizada' : 'Activa'}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600" style={{ width: `${e.progressPerc}%` }}></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{e.progressPerc}%</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleGenerateReport}
              className="mt-6 w-full py-3 text-sm font-bold text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span className="material-icons-outlined text-sm">auto_awesome</span>
              Generar Reporte Ejecutivo con IA
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
