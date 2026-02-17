import React, { useState, useRef, useEffect } from 'react';
import { Person } from '../types';

interface MultiSelectUserProps {
    users: Person[];
    selectedUserIds: string[];
    onChange: (selectedIds: string[]) => void;
    label?: string;
}

const MultiSelectUser: React.FC<MultiSelectUserProps> = ({ users, selectedUserIds, onChange, label = "Asignar Auditores" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const toggleUser = (userId: string) => {
        if (selectedUserIds.includes(userId)) {
            onChange(selectedUserIds.filter(id => id !== userId));
        } else {
            onChange([...selectedUserIds, userId]);
        }
    };

    const removeUser = (userId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selectedUserIds.filter(id => id !== userId));
    };

    const filteredUsers = users.filter(user =>
        user.full_name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    );

    const selectedUsersObjects = users.filter(u => selectedUserIds.includes(u.id));

    return (
        <div className="space-y-2 relative" ref={wrapperRef}>
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                {label}
            </label>

            <div
                className={`w-full bg-slate-50 border transition-all rounded-xl min-h-[50px] cursor-text
                    ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white' : 'border-slate-200 hover:bg-slate-100'}
                `}
                onClick={() => setIsOpen(true)}
            >
                <div className="flex flex-wrap gap-2 p-2">
                    {selectedUsersObjects.map(user => (
                        <span key={user.id} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold animate-in zoom-in duration-200">
                            <img src={user.avatar_url} alt="" className="w-4 h-4 rounded-full" />
                            {user.full_name}
                            <button
                                onClick={(e) => removeUser(user.id, e)}
                                className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                            >
                                <span className="material-icons-outlined text-[10px] block">close</span>
                            </button>
                        </span>
                    ))}

                    <input
                        type="text"
                        className="bg-transparent outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400 min-w-[120px] flex-1 py-1"
                        placeholder={selectedUserIds.length === 0 ? "Buscar usuarios..." : ""}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onFocus={() => setIsOpen(true)}
                    />
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-1">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map(user => {
                                const isSelected = selectedUserIds.includes(user.id);
                                return (
                                    <div
                                        key={user.id}
                                        onClick={() => toggleUser(user.id)}
                                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors
                                            ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'}
                                        `}
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
                                            ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}
                                        `}>
                                            {isSelected && <span className="material-icons-outlined text-white text-[10px] font-bold">check</span>}
                                        </div>
                                        <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full border border-slate-100" />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold">{user.full_name}</span>
                                            <span className="text-[10px] text-slate-400">{user.role}</span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-4 text-center text-slate-400 text-xs">
                                No se encontraron usuarios
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MultiSelectUser;
