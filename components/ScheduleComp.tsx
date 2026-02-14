import React, { useState, useMemo } from 'react';
import { AuditEntity, AuditStatus, Phase } from '../types';
import EditPhaseModal from './EditPhaseModal';

interface ScheduleProps {
  entities: AuditEntity[];
  onUpdatePhaseStatus: (entityId: string, phaseId: string, nextStatus: AuditStatus) => void;
  onUpdatePhase: (entityId: string, updatedPhase: Phase) => void;
  onEditEntity?: (entity: AuditEntity) => void;
}

const COLUMN_WIDTH = 120; // Ancho fijo en píxeles para cada semana
const ENTITY_COLUMN_WIDTH = 288; // w-72 en Tailwind es 288px

const Schedule: React.FC<ScheduleProps> = ({ entities, onUpdatePhaseStatus, onUpdatePhase, onEditEntity }) => {
  // Referencia global del proyecto
  // Referencia global del proyecto: Usamos la fecha de inicio más temprana o la actual
  const BASE_DATE = useMemo(() => {
    const validDates = entities
      .map(e => new Date(e.start_date).getTime())
      .filter(t => !isNaN(t));

    if (validDates.length === 0) {
      const now = new Date();
      // Lunes de la semana actual
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(now.setDate(diff));
    }

    const minDate = new Date(Math.min(...validDates));
    // Ajustar al lunes de esa semana
    const day = minDate.getDay();
    const diff = minDate.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(minDate.setDate(diff));
  }, [entities]);
  const [selectedPhaseInfo, setSelectedPhaseInfo] = useState<{ entityId: string, phase: Phase } | null>(null);
  const [alert, setAlert] = useState<{ show: boolean, message: string } | null>(null);

  // Generar 16 semanas de visualización
  const weeks = useMemo(() => {
    let date = new Date(BASE_DATE);
    const generatedWeeks = [];
    for (let i = 0; i < 16; i++) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 4); // Viernes

      const format = (d: Date) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;

      generatedWeeks.push({
        label: `Sem. ${i + 1}`,
        dates: `${format(start)} - ${format(end)}`,
        fullDate: start
      });
      date.setDate(date.getDate() + 7);
    }
    return generatedWeeks;
  }, [BASE_DATE]);

  const totalWidth = weeks.length * COLUMN_WIDTH;

  const getStatusLabel = (status: AuditStatus) => {
    switch (status) {
      case 'Completed': return 'Completado';
      case 'Execution': return 'En Curso';
      case 'Planning': return 'Pendiente';
      default: return 'Pendiente';
    }
  };

  // Función para calcular la posición X de una fase basándose en la start_date de la entidad
  const calculatePhaseLayout = (entity: AuditEntity, phase: Phase) => {
    const entityStart = new Date(entity.start_date);
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;

    // Diferencia en semanas entre el inicio global y el inicio de la entidad
    const entityOffsetWeeks = Math.max(0, (entityStart.getTime() - BASE_DATE.getTime()) / msPerWeek);

    // La posición final es el offset de la entidad + el start_week propio de la fase
    const absoluteStartWeek = entityOffsetWeeks + (phase.start_week - 1);

    return {
      left: `${absoluteStartWeek * COLUMN_WIDTH}px`,
      width: `${phase.duration_weeks * COLUMN_WIDTH}px`,
    };
  };

  const handleSavePhase = (phase: Phase) => {
    if (selectedPhaseInfo) {
      // Alerta si cambió la duración
      if (phase.duration_weeks !== selectedPhaseInfo.phase.duration_weeks) {
        setAlert({
          show: true,
          message: `La planificación de "${selectedPhaseInfo.phase.name}" ha sido modificada a ${phase.duration_weeks} semanas.`
        });
      }
      onUpdatePhase(selectedPhaseInfo.entityId, phase);
      setSelectedPhaseInfo(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-700">
      {/* Banner de Alerta Temporal */}
      {alert?.show && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl flex items-center justify-between shadow-sm animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <span className="material-icons-outlined text-amber-600">warning_amber</span>
            <div>
              <p className="text-sm font-bold text-amber-900">Planificación Actualizada</p>
              <p className="text-xs text-amber-700 font-medium">{alert.message}</p>
            </div>
          </div>
          <button
            onClick={() => setAlert({ ...alert, show: false })}
            className="p-1 hover:bg-amber-100 rounded-full text-amber-600 transition-colors"
          >
            <span className="material-icons-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Referencia Global:</span>
              <span className="text-xs font-bold text-slate-700">
                {BASE_DATE.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase hidden md:block">Las fases se posicionan según la fecha de inicio de cada entidad</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Completado
              </div>
              <div className="flex items-center gap-1.5 text-blue-600">
                <span className="w-2.5 h-2.5 rounded bg-blue-500"></span> En Curso
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded bg-slate-200"></span> Pendiente
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto hide-scrollbar">
          <div style={{ minWidth: `${ENTITY_COLUMN_WIDTH + totalWidth}px` }}>
            <div className="flex border-b border-slate-100 sticky top-0 z-30">
              <div className="w-72 p-6 bg-slate-50 border-r border-slate-200 font-bold text-xs uppercase text-slate-500 tracking-wider sticky left-0 z-40 h-16 flex items-center">
                Entidad Auditada
              </div>
              <div className="flex bg-white">
                {weeks.map((w, idx) => (
                  <div
                    key={idx}
                    style={{ width: `${COLUMN_WIDTH}px` }}
                    className="shrink-0 p-3 text-center border-r border-slate-100 flex flex-col justify-center h-16 bg-slate-50/30"
                  >
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{w.label}</p>
                    <p className="text-[9px] font-semibold text-slate-500 whitespace-nowrap">{w.dates}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              {entities.map((entity) => {
                const formatDateShort = (d: string) => {
                  const date = new Date(d);
                  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                };

                return (
                  <div key={entity.id} className="flex group hover:bg-slate-50/30 transition-colors">
                    <div className="w-72 p-6 border-r border-slate-200 bg-white sticky left-0 z-20 flex flex-col justify-center shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)] h-28">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-sm text-slate-800 truncate">{entity.name}</p>
                        <button
                          onClick={() => onEditEntity?.(entity)}
                          className="shrink-0 p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Editar fecha de inicio"
                        >
                          <span className="material-icons-outlined text-sm">edit_calendar</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="material-icons-outlined text-[10px] text-blue-500">calendar_today</span>
                        <span className="text-[9px] font-extrabold text-blue-600 uppercase">Inicia: {formatDateShort(entity.start_date)}</span>
                      </div>
                    </div>

                    <div className="flex relative h-28" style={{ width: `${totalWidth}px` }}>
                      {weeks.map((_, idx) => (
                        <div
                          key={idx}
                          style={{ width: `${COLUMN_WIDTH}px` }}
                          className="shrink-0 border-r border-slate-100 pointer-events-none h-full"
                        ></div>
                      ))}

                      <div className="absolute inset-0 pointer-events-none flex items-center">
                        <div className="w-full relative h-14">
                          {entity.phases?.map((phase) => {
                            const layout = calculatePhaseLayout(entity, phase);
                            return (
                              <button
                                key={phase.id}
                                onClick={() => setSelectedPhaseInfo({ entityId: entity.id, phase })}
                                className={`absolute h-14 rounded-xl px-3 flex flex-col justify-center overflow-hidden shadow-sm border-l-4 group/bar transition-all hover:scale-[1.01] hover:brightness-95 active:scale-[0.98] pointer-events-auto z-10 ${phase.status === 'Completed' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' :
                                  phase.status === 'Execution' ? 'bg-blue-50 border-blue-500 text-blue-700' :
                                    'bg-slate-50 border-slate-300 text-slate-500'
                                  }`}
                                style={layout}
                                title={phase.alert_note}
                              >
                                <div className="flex flex-col text-left gap-0.5 relative">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[9px] font-extrabold uppercase tracking-tight truncate">
                                      {phase.name}
                                    </span>
                                    {phase.alert_note && (
                                      <span className="material-icons-outlined text-[12px] text-amber-500 animate-pulse">priority_high</span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[7px] opacity-70 font-bold whitespace-nowrap">{phase.duration_weeks} {phase.duration_weeks === 1 ? 'Semana' : 'Semanas'}</span>
                                    <span className={`text-[7px] font-extrabold px-1 rounded ml-2 ${phase.status === 'Completed' ? 'bg-emerald-100' :
                                      phase.status === 'Execution' ? 'bg-blue-100' : 'bg-slate-200'
                                      }`}>
                                      {getStatusLabel(phase.status)}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {selectedPhaseInfo && (
          <EditPhaseModal
            entityId={selectedPhaseInfo.entityId}
            phase={selectedPhaseInfo.phase}
            onClose={() => setSelectedPhaseInfo(null)}
            onSave={handleSavePhase}
          />
        )}

        <div className="p-4 bg-slate-50 border-t border-slate-200 text-[10px] font-bold text-slate-400 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-icons-outlined text-sm text-amber-500">priority_high</span>
            <span>Un icono pulsante indica que la fase fue modificada del estándar planificado.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="uppercase tracking-widest text-primary">ControlPro Schedule Engine v2.5</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
