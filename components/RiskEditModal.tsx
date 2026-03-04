import React, { useState, useEffect } from 'react';
import { RiskControl, AuditEntity, Task, Person } from '../types';

interface RiskEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (risk: RiskControl) => void;
    risk?: RiskControl;
    entities: AuditEntity[];
    allTasks: any[]; // Changed to any to match TaskPlannerEntry or Task
    availableAreas: string[];
    onAddArea: (area: string) => void;
    people: Person[];
}

const RiskEditModal: React.FC<RiskEditModalProps> = ({
    isOpen,
    onClose,
    onSave,
    risk,
    entities,
    allTasks,
    availableAreas,
    onAddArea,
    people,
}) => {
    const [formData, setFormData] = useState<Partial<RiskControl>>({
        process: '',
        area: '',
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
        recommendation: '',
        tasks: '',
        ...risk
    });

    const [activeTab, setActiveTab] = useState<'analysis' | 'controls' | 'action'>('analysis');

    useEffect(() => {
        if (risk) {
            setFormData({ ...risk });
        } else {
            setFormData({
                process: '',
                area: '',
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
                recommendation: '',
                tasks: '',
            });
        }
    }, [risk, isOpen]);

    // Recalculate risks
    useEffect(() => {
        const impact = Number(formData.impact) || 0;
        const prob = Number(formData.probability) || 0;
        const inherent = impact * prob;

        const eff = Number(formData.control_effectiveness) || 0;
        const residual = Math.max(0, inherent - eff);

        let level: RiskControl['traffic_light_level'] = 'Bajo';
        if (residual >= 20) level = 'Crítico';
        else if (residual >= 12) level = 'Alto';
        else if (residual >= 6) level = 'Medio';

        if (formData.inherent_risk !== inherent || formData.residual_risk !== residual || formData.traffic_light_level !== level) {
            setFormData(prev => ({
                ...prev,
                inherent_risk: inherent,
                residual_risk: residual,
                traffic_light_level: level
            }));
        }
    }, [formData.impact, formData.probability, formData.control_effectiveness]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        if (!formData.audit_id || !formData.process) {
            alert("Por favor complete la entidad y el proceso.");
            return;
        }
        onSave(formData as RiskControl);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {risk?.id ? 'Editar Riesgo' : 'Nuevo Riesgo en Matriz'}
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">Gestión integral de riesgos y controles</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <span className="material-icons-outlined text-slate-400">close</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-8 border-b border-slate-100 bg-white">
                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={`py-4 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'analysis' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        <span className="material-icons-outlined text-sm">analytics</span>
                        Análisis de Riesgo
                    </button>
                    <button
                        onClick={() => setActiveTab('controls')}
                        className={`py-4 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'controls' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        <span className="material-icons-outlined text-sm">security</span>
                        Controles
                    </button>
                    <button
                        onClick={() => setActiveTab('action')}
                        className={`py-4 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'action' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        <span className="material-icons-outlined text-sm">event_available</span>
                        Plan de Acción
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto flex-1 bg-slate-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {activeTab === 'analysis' && (
                            <>
                                <div className="space-y-2 col-span-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Entidad Auditada</label>
                                    <select
                                        name="audit_id"
                                        title="Seleccionar Entidad"
                                        value={formData.audit_id || ''}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    >
                                        <option value="">Seleccionar entidad...</option>
                                        {(entities || []).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Área / Proceso</label>
                                    <div className="flex gap-2">
                                        <select
                                            name="area"
                                            title="Seleccionar Área"
                                            value={formData.area || ''}
                                            onChange={(e) => {
                                                if (e.target.value === '__add__') {
                                                    const newArea = window.prompt('Nombre de la nueva área:');
                                                    if (newArea) onAddArea(newArea);
                                                } else {
                                                    handleChange(e);
                                                }
                                            }}
                                            className="w-1/3 p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none"
                                        >
                                            <option value="">Área...</option>
                                            {(availableAreas || []).map(a => <option key={a} value={a}>{a}</option>)}
                                            <option value="__add__" className="text-blue-600 font-bold">+ Nueva...</option>
                                        </select>
                                        <input
                                            type="text"
                                            name="process"
                                            placeholder="Nombre del Proceso..."
                                            value={formData.process || ''}
                                            onChange={handleChange}
                                            className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Descripción del Riesgo</label>
                                    <textarea
                                        name="risk_description"
                                        title="Descripción del Riesgo"
                                        rows={3}
                                        placeholder="Escriba el riesgo detectado..."
                                        value={formData.risk_description || ''}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none resize-none"
                                    />
                                </div>
                                <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
                                    <h4 className="text-[11px] font-bold text-slate-800 border-b pb-2 mb-2 flex items-center gap-2">
                                        <span className="p-1 bg-amber-100 text-amber-600 rounded-md scale-75">1</span>
                                        Evaluación Inherente
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-slate-500">Impacto (1-5)</label>
                                            <input type="number" name="impact" title="Nivel de Impacto" min="1" max="5" value={formData.impact || 1} onChange={handleChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-slate-500">Probabilidad (1-5)</label>
                                            <input type="number" name="probability" title="Nivel de Probabilidad" min="1" max="5" value={formData.probability || 1} onChange={handleChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50" />
                                        </div>
                                    </div>
                                    <div className="pt-2 flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl">
                                        <span className="text-[10px] font-bold text-slate-600">RIESGO INHERENTE</span>
                                        <span className="text-sm font-black text-slate-900">{formData.inherent_risk}</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-blue-600 rounded-2xl shadow-lg flex flex-col justify-center items-center text-white relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-2">Resultado Final</span>
                                    <div className={`px-4 py-1 rounded-full text-[10px] font-black mb-1 border border-white/30 ${formData.traffic_light_level === 'Crítico' ? 'bg-red-500' :
                                        formData.traffic_light_level === 'Alto' ? 'bg-orange-500' :
                                            formData.traffic_light_level === 'Medio' ? 'bg-amber-400' : 'bg-emerald-500'
                                        }`}>
                                        {formData.traffic_light_level?.toUpperCase()}
                                    </div>
                                    <div className="text-4xl font-black">{formData.residual_risk}</div>
                                    <span className="text-[9px] font-medium opacity-70 mt-1 italic">Riesgo Residual Calculado</span>
                                </div>
                            </>
                        )}

                        {activeTab === 'controls' && (
                            <>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Controles Existentes</label>
                                    <textarea
                                        name="existing_controls"
                                        rows={4}
                                        placeholder="Describa los controles aplicados actualmente por la entidad..."
                                        value={formData.existing_controls || ''}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none resize-none"
                                    />
                                </div>
                                <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4 col-span-1">
                                    <h4 className="text-[11px] font-bold text-slate-800 border-b pb-2 mb-2 flex items-center gap-2">
                                        <span className="p-1 bg-emerald-100 text-emerald-600 rounded-md scale-75">2</span>
                                        Efectividad del Control
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-[9px] font-bold text-slate-500">Valor de Mitigación (0-25)</label>
                                                <span className="text-xs font-bold text-blue-600">{formData.control_effectiveness} pts</span>
                                            </div>
                                            <input
                                                type="range"
                                                name="control_effectiveness"
                                                title="Efectividad del Control"
                                                min="0"
                                                max="25"
                                                value={formData.control_effectiveness || 0}
                                                onChange={handleChange}
                                                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                            <p className="text-[9px] text-slate-400 italic mt-1">Representa cuánto reduce este control el riesgo inherente.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 border border-dashed border-slate-200 rounded-2xl flex flex-col justify-center items-center text-center">
                                    <span className="material-icons-outlined text-slate-300 text-4xl mb-2">verified_user</span>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-tight">
                                        El riesgo residual se calcula restando la efectividad al riesgo inherente.
                                    </p>
                                </div>
                            </>
                        )}

                        {activeTab === 'action' && (
                            <>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Tareas / Acción de Auditoría</label>
                                    <select
                                        name="tasks"
                                        title="Seleccionar Tarea Relacionada"
                                        value={formData.tasks || ''}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none"
                                    >
                                        <option value="">Seleccionar tarea...</option>
                                        {(allTasks || []).map(t => <option key={t.id} value={t.title}>{t.title}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Recomendación</label>
                                    <textarea
                                        name="recommendation"
                                        title="Recomendación"
                                        rows={2}
                                        placeholder="Acción recomendada para mitigar el riesgo..."
                                        value={formData.recommendation || ''}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none resize-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Responsable</label>
                                    <input type="text" name="responsible" placeholder="Persona o área..." value={formData.responsible || ''} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Fecha Implementación</label>
                                    <input type="date" name="implementation_date" value={formData.implementation_date || ''} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none text-slate-600" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Estado de Avance</label>
                                    <div className="flex bg-slate-100 p-1 rounded-xl">
                                        {['Pendiente', 'En curso', 'Completado'].map(s => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, status: s as any }))}
                                                className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${formData.status === s ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <p className="text-[10px] font-medium text-slate-400">Campos obligatorios marcados con *</p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-8 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 transition-all flex items-center gap-2"
                        >
                            <span className="material-icons-outlined text-sm">save</span>
                            Guardar Riesgo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiskEditModal;
