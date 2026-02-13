
import React from 'react';
import { AuditEntity } from '../types';

interface ExecutiveReportModalProps {
  entities: AuditEntity[];
  aiSummary: string;
  onClose: () => void;
  isLoading: boolean;
}

const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({ entities, aiSummary, onClose, isLoading }) => {
  const totalTasks = entities.reduce((acc, e) => acc + e.tasks.length, 0);
  const completedTasks = entities.reduce((acc, e) => acc + e.tasks.filter(t => t.status === 'Completed').length, 0);
  const avgProgress = entities.length > 0 
    ? Math.round(entities.reduce((acc, e) => acc + e.progress, 0) / entities.length) 
    : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="material-icons-outlined text-blue-600">article</span>
              Reporte Ejecutivo de Auditoría
            </h3>
            <p className="text-xs text-slate-400 font-medium">Análisis consolidado del programa de control interno</p>
          </div>
          <div className="flex gap-2">
            {!isLoading && (
              <button 
                onClick={handlePrint}
                className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                title="Imprimir Reporte"
              >
                <span className="material-icons-outlined">print</span>
              </button>
            )}
            <button onClick={onClose} className="p-2.5 hover:bg-slate-200 rounded-xl text-slate-400 transition-colors">
              <span className="material-icons-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100/30 print:bg-white hide-scrollbar">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
              <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-800">Generando análisis con IA...</p>
                <p className="text-sm text-slate-400">Procesando métricas de {entities.length} entidades</p>
              </div>
            </div>
          ) : (
            <div id="report-content" className="bg-white p-12 shadow-sm rounded-2xl min-h-full print:shadow-none print:p-0">
              {/* Report Header */}
              <div className="flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-8">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Informe Gerencial</h1>
                  <p className="text-slate-500 font-bold mt-1">ControlPro Audit System v2.5</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">Confidencial</p>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-8 mb-12">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase mb-1">Avance Global</p>
                  <p className="text-3xl font-black text-blue-600">{avgProgress}%</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase mb-1">Tareas Ejecutadas</p>
                  <p className="text-3xl font-black text-slate-800">{completedTasks} / {totalTasks}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase mb-1">Entidades Auditadas</p>
                  <p className="text-3xl font-black text-slate-800">{entities.length}</p>
                </div>
              </div>

              {/* AI Analysis Section */}
              <div className="mb-12">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 mb-4 flex items-center gap-2">
                  <span className="material-icons-outlined text-sm">psychology</span>
                  Análisis Estratégico (Gemini AI)
                </h4>
                <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                  {aiSummary}
                </div>
              </div>

              {/* Table of Entities */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-4">Desglose por Entidad</h4>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                      <th className="py-2">Entidad</th>
                      <th className="py-2">Estado</th>
                      <th className="py-2 text-right">Avance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {entities.map(e => (
                      <tr key={e.id}>
                        <td className="py-3 font-bold text-slate-800 text-sm">{e.name}</td>
                        <td className="py-3">
                          <span className={`text-[10px] font-bold uppercase ${e.status === 'Completed' ? 'text-emerald-600' : 'text-blue-600'}`}>
                            {e.status}
                          </span>
                        </td>
                        <td className="py-3 text-right font-black text-slate-900 text-sm">{e.progress}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-end italic">
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generado por</p>
                    <p className="text-xs font-bold text-slate-800">Sistema Inteligente ControlPro</p>
                 </div>
                 <p className="text-[9px] text-slate-300 font-bold uppercase tracking-tighter">Este documento es una síntesis automatizada para fines informativos.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
          >
            Cerrar Reporte
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveReportModal;
