
import React, { useState } from 'react';
import { LayoutDashboard, Users, FileText, Settings, UserCircle, ChevronsLeft, ChevronsRight, BrainCircuit, BookUser, LogOut, ShieldCheck, ShoppingCart, Zap } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onLogout: () => void;
  userRole: 'ADMIN' | 'USER';
  creditUsage?: { used: number; max: number };
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onLogout, userRole, creditUsage }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Reordered navigation items according to user request
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Pacientes', icon: Users },
    { name: 'História de Vida', icon: BookUser },
    { name: 'Laudos', icon: FileText },
    { name: 'Planos', icon: ShoppingCart },
    { name: 'Configurações', icon: Settings },
    { name: 'Administração', icon: ShieldCheck, adminOnly: true },
    { name: 'Conta', icon: UserCircle, adminOnly: true },
  ];
  
  // For standard users, they manage profile on Dashboard. We filter out the "Conta" tab for them.
  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly && userRole !== 'ADMIN') return false;
    if (item.name === 'Conta' && userRole === 'USER') return false;
    return true;
  });

  const availableCredits = creditUsage ? creditUsage.max - creditUsage.used : 0;

  return (
    <aside className={`relative bg-light-card dark:bg-dark-card h-screen flex flex-col border-r border-light-border dark:border-dark-border transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex items-center justify-between p-4 border-b border-light-border dark:border-dark-border">
          <div className="flex items-center">
            <BrainCircuit className="h-8 w-8 text-primary" />
            {!isCollapsed && <h1 className="ml-2 text-xl font-bold text-light-text dark:text-dark-text">Laudo Equilíbrio</h1>}
          </div>
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-dark-border hidden md:block">
            {isCollapsed ? <ChevronsRight className="h-5 w-5 text-secondary" /> : <ChevronsLeft className="h-5 w-5 text-secondary" />}
          </button>
        </div>
      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="h-full flex flex-col">
          {filteredNavItems.map((item) => (
            <li key={item.name}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveView(item.name);
                }}
                className={`flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${
                  activeView === item.name
                    ? 'bg-primary text-white'
                    : 'text-secondary hover:bg-gray-200 dark:hover:bg-dark-border'
                }`}
              >
                <item.icon className="h-6 w-6" />
                {!isCollapsed && <span className="ml-4 font-medium">{item.name}</span>}
              </a>
            </li>
          ))}
          
          <div className="flex-1"></div>

          {/* Credit Balance Card - Updated to show remaining balance only */}
          {!isCollapsed && creditUsage && userRole !== 'ADMIN' && (
            <div className="mx-2 mb-4 p-4 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-2">
                <Zap className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Saldo Atual</span>
              </div>
              <div className="text-3xl font-extrabold">{availableCredits}</div>
              <p className="text-[10px] opacity-80 mb-3">Créditos disponíveis para uso</p>
              <button 
                onClick={() => setActiveView('Planos')}
                className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-all border border-white/30"
              >
                Comprar Mais
              </button>
            </div>
          )}

          <li>
            <button
              onClick={onLogout}
              className="w-full flex items-center p-3 my-1 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors duration-200"
            >
              <LogOut className="h-6 w-6" />
              {!isCollapsed && <span className="ml-4 font-medium">Sair</span>}
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
};
