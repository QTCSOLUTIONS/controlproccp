
import React, { useState } from 'react';

interface AreasConfigProps {
  areas: string[];
  onUpdateAreas: (newAreas: string[]) => void;
}

const AreasConfig: React.FC<AreasConfigProps> = ({ areas, onUpdateAreas }) => {
  const [newAreaName, setNewAreaName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleAddArea = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newAreaName.trim();
    if (trimmed && !areas.includes(trimmed)) {
      onUpdateAreas([...areas, trimmed]);
      setNewAreaName('');
    }
  };

  const handleRemoveArea = (index: number) => {
    const updated = areas.filter((_, i) => i !== index);
    onUpdateAreas(updated);
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditValue(areas[index]);
  };

  const saveEdit = () => {
    if (editingIndex !== null) {
      const trimmed = editValue.trim();
      if (trimmed && !areas.includes(trimmed)) {
        const updated = [...areas];
        updated[editingIndex] = trimmed;
        onUpdateAreas(updated);
      }
      setEditingIndex(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <span className="material-icons-outlined text-3xl">category</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Catálogo de Áreas</h3>
            <p className="text-sm text-slate-400 font-medium">Gestione los departamentos y áreas funcionales para las auditorías</p>
          </div>
        </div>

        <form onSubmit={handleAddArea} className="flex gap-4 mb-10">
          <div className="flex-1 relative group">
            <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">add_circle_outline</span>
            <input 
              type="text" 
              placeholder="Nombre de la nueva área (Ej: Logística, IT...)" 
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
          >
            <span className="material-icons-outlined text-sm">add</span>
            Añadir
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {areas.map((area, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-blue-200 hover:bg-white hover:shadow-md transition-all group">
              <div className="flex items-center gap-3 flex-1 mr-4">
                <span className="material-icons-outlined text-slate-300 group-hover:text-blue-400 transition-colors">business_center</span>
                {editingIndex === index ? (
                  <input 
                    autoFocus
                    className="flex-1 bg-white border border-blue-200 rounded-lg px-2 py-1 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                  />
                ) : (
                  <span className="font-bold text-slate-700 text-sm">{area}</span>
                )}
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => startEditing(index)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  title="Editar nombre"
                >
                  <span className="material-icons-outlined text-sm">edit</span>
                </button>
                <button 
                  onClick={() => handleRemoveArea(index)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  title="Eliminar área"
                >
                  <span className="material-icons-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {areas.length === 0 && (
          <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
            <span className="material-icons-outlined text-5xl text-slate-200 mb-4">inventory_2</span>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No hay áreas configuradas</p>
          </div>
        )}
      </div>

      <div className="p-6 bg-blue-600 rounded-3xl text-white flex items-center justify-between shadow-xl shadow-blue-600/20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="material-icons-outlined">info</span>
          </div>
          <p className="text-sm font-medium opacity-90">Estas áreas estarán disponibles automáticamente en la Matriz de Riesgos y Criterios CLA.</p>
        </div>
      </div>
    </div>
  );
};

export default AreasConfig;
