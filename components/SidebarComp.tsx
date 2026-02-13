import React from 'react';
import { ViewType } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isCollapsed, onToggle }) => {
  const { user, signOut } = useAuth();
  const isAdmin = user?.email === 'ccp@qtc-solutions.com';

  const mainItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'schedule', label: 'Calendario', icon: 'calendar_month' },
  ];

  const configItems = [
    { id: 'entidades', label: 'Entidades', icon: 'business' },
    { id: 'personas', label: 'Equipo', icon: 'people' },
    { id: 'areas', label: 'Áreas', icon: 'category' },
    { id: 'planner', label: 'Planificador', icon: 'task_alt' },
  ];

  const workItems = [
    { id: 'matrix', label: 'Matriz R-C', icon: 'grid_view' },
    { id: 'cla', label: 'Criterios CLA', icon: 'fact_check' },
  ];

  const NavButton = ({ item }: { item: { id: string, label: string, icon: string } }) => (
    <button
      onClick={() => onViewChange(item.id as ViewType)}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative ${activeView === item.id
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        } ${isCollapsed ? 'justify-center' : ''}`}
      title={isCollapsed ? item.label : ''}
    >
      <span className="material-icons-outlined text-[22px] shrink-0 transition-transform duration-300 group-hover:scale-110">{item.icon}</span>
      {!isCollapsed && (
        <span className="text-xs font-bold tracking-tight whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300 overflow-hidden">
          {item.label}
        </span>
      )}
      {isCollapsed && activeView === item.id && (
        <div className="absolute left-0 w-1 h-8 bg-blue-500 rounded-r-full"></div>
      )}
    </button>
  );

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    !isCollapsed ? (
      <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] animate-in fade-in duration-300 mb-3">
        {children}
      </p>
    ) : (
      <div className="h-px bg-slate-800 mx-5 my-6 opacity-30"></div>
    )
  );

  return (
    <aside className={`bg-[#0a192f] text-white flex flex-col shrink-0 hidden md:flex shadow-2xl border-r border-white/5 transition-all duration-500 ease-in-out relative ${isCollapsed ? 'w-20' : 'w-64'}`}>

      {/* Brand Header & Toggle Section */}
      <div className={`h-24 flex items-center px-5 transition-all relative ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className={`flex items-center transition-all duration-500 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          {/* Logo Isotype */}
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg p-1 group cursor-pointer hover:rotate-3 transition-transform">
            <img
              src="https://raw.githubusercontent.com/google/material-design-icons/master/png/action/search/materialicons/48dp/1x/baseline_search_black_48dp.png"
              className="w-full h-full object-contain hidden"
              alt="Icon"
            />
            {/* Simulación del Logo proporcionado usando Material Icons como base de isotipo */}
            <div className="relative w-full h-full flex items-center justify-center">
              <span className="material-icons-outlined text-blue-900 text-3xl">manage_search</span>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-3 h-3 rounded-full border-2 border-white flex items-center justify-center">
                <span className="material-icons-outlined text-[8px] text-white font-black">check</span>
              </div>
            </div>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500">
              <span className="text-lg font-black tracking-tighter leading-none text-white">CONTROLPRO</span>
              <span className="text-[9px] font-bold tracking-[0.3em] text-blue-500 uppercase">Audit Systems</span>
            </div>
          )}
        </div>

        {/* Tab-style Toggle Button */}
        <button
          onClick={onToggle}
          className={`absolute flex items-center justify-center bg-[#1a365d] hover:bg-blue-600 text-white transition-all duration-300 shadow-xl border border-white/10 z-50
            ${isCollapsed
              ? '-right-4 w-8 h-12 rounded-r-xl'
              : '-right-3 w-7 h-10 rounded-xl'}`}
          title={isCollapsed ? "Expandir Menú" : "Contraer Menú"}
        >
          <span className={`material-icons-outlined text-lg transition-transform duration-500 ${isCollapsed ? '' : 'rotate-180'}`}>
            keyboard_tab
          </span>
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-10 mt-4 overflow-y-auto hide-scrollbar">
        {/* Navigation Groups */}
        <div>
          <SectionTitle>Principal</SectionTitle>
          <div className="space-y-1.5">
            {mainItems.map((item) => <NavButton key={item.id} item={item} />)}
          </div>
        </div>

        <div>
          <SectionTitle>Ejecución</SectionTitle>
          <div className="space-y-1.5">
            {workItems.map((item) => <NavButton key={item.id} item={item} />)}
          </div>
        </div>

        <div>
          <SectionTitle>Ajustes</SectionTitle>
          <div className="space-y-1.5">
            {configItems.map((item) => <NavButton key={item.id} item={item} />)}
            {isAdmin && (
              <NavButton item={{ id: 'users', label: 'Gestión Usuarios', icon: 'admin_panel_settings' }} />
            )}
          </div>
        </div>
      </nav>

      {/* Footer / Profile Section - Cleared as per request */}
      <div className={`p-4 mt-auto bg-black/20 border-t border-white/5 transition-all duration-500 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <button
          onClick={() => signOut()}
          className="w-full py-2 bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <span className="material-icons-outlined text-sm">logout</span>
          {!isCollapsed && "Cerrar Sesión"}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
