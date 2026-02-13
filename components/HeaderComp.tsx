
import React from 'react';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  viewTitle: string;
  onNewAudit: () => void;
  showCreateButton?: boolean;
  showNotifications?: boolean;
  entities?: string[];
}

const Header: React.FC<HeaderProps> = ({ 
  searchTerm, 
  onSearchChange, 
  viewTitle, 
  onNewAudit, 
  showCreateButton = true,
  showNotifications = true,
  entities = []
}) => {
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">{viewTitle}</h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative group">
          <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">search</span>
          <select
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-72 transition-all text-sm font-medium appearance-none cursor-pointer"
          >
            <option value="">Todas las Entidades</option>
            {entities.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <span className="material-icons-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
        </div>

        {showNotifications && (
          <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
            <span className="material-icons-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
          </button>
        )}

        <div className="h-8 w-px bg-slate-200"></div>

        {showCreateButton && (
          <button 
            onClick={onNewAudit}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            <span className="material-icons-outlined text-sm">add</span>
            Crear
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
