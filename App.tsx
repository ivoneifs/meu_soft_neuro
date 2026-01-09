
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Pacientes } from './components/Pacientes';
import { Laudos } from './components/Laudos';
import { Configuracoes } from './components/Configuracoes';
import { Conta } from './components/Conta';
import { HistoriaDeVida } from './components/HistoriaDeVida';
import { Planos } from './components/Planos';
import { Auth } from './components/Auth';
import { AdminPanel } from './components/AdminPanel';
import type { Patient, Theme, User } from './types';
import { MOCK_PATIENTS } from './constants';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('Dashboard');
  const [theme, setTheme] = useState<Theme>('light');
  
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('neuro_all_users');
    let users: User[] = saved ? JSON.parse(saved) : [];
    
    const adminEmail = 'ivonei.admin@neuro.com';
    const adminExists = users.find(u => u.email === adminEmail);
    
    if (!adminExists) {
      users.push({ 
        id: 'super_admin', 
        name: 'Ivonei - Administrador Mestre', 
        email: adminEmail, 
        crp: 'MASTER-01', 
        avatar: 'https://i.pravatar.cc/150?u=ivonei', 
        title: 'Super Usuário / Admin', 
        role: 'ADMIN', 
        maxReports: 99999, 
        usedReports: 0, 
        status: 'Ativo',
        password: '151230'
      });
    }
    return users;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('neuro_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [allPatients, setAllPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('neuro_patients');
    if (saved) return JSON.parse(saved);
    return MOCK_PATIENTS.map(p => ({ ...p, userId: 'super_admin' }));
  });

  useEffect(() => {
    localStorage.setItem('neuro_all_users', JSON.stringify(allUsers));
    if (currentUser) {
      const updatedCurrent = allUsers.find(u => u.id === currentUser.id);
      if (updatedCurrent) setCurrentUser(updatedCurrent);
    }
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('neuro_patients', JSON.stringify(allPatients));
  }, [allPatients]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('neuro_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('neuro_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  const handleLogin = (credentials: User) => {
    if (credentials.status === 'Pendente') {
      const exists = allUsers.find(u => u.email.toLowerCase() === credentials.email.toLowerCase());
      if (!exists) {
        setAllUsers(prev => [...prev, { ...credentials, id: 'u_' + Date.now() }]);
      }
      return;
    }

    const user = allUsers.find(u => u.email.toLowerCase() === credentials.email?.toLowerCase());
    
    if (user) {
      if (credentials.password && user.password !== credentials.password) {
        alert("Senha incorreta.");
        return;
      }
      if (user.status === 'Bloqueado') {
        alert("Sua conta está bloqueada. Contate o administrador.");
        return;
      }
      if (user.status === 'Pendente') {
        alert("Sua conta aguarda aprovação do administrador.");
        return;
      }
      setCurrentUser(user);
    } else {
      alert("Usuário não encontrado.");
    }
    setActiveView('Dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleCreateUser = (newUser: User) => {
    setAllUsers(prev => [...prev, { ...newUser, id: 'u_' + Date.now() }]);
  };

  const handleUpdateUser = (userId: string, updates: Partial<User>) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === 'super_admin') return;
    if (confirm("Isso removerá permanentemente o usuário e TODOS os seus pacientes. Confirmar?")) {
      setAllUsers(prev => prev.filter(u => u.id !== userId));
      setAllPatients(prev => prev.filter(p => p.userId !== userId));
    }
  };

  const userPatients = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'ADMIN') return allPatients;
    return allPatients.filter(p => p.userId === currentUser.id);
  }, [allPatients, currentUser]);

  const handleAddPatient = (patient: Patient) => {
    const newPatient: Patient = {
      ...patient,
      id: Date.now(),
      userId: currentUser?.id,
      avatar: `https://picsum.photos/seed/${Date.now()}/200`,
      appliedTests: patient.appliedTests || []
    };
    setAllPatients(prev => [newPatient, ...prev]);
  };

  const handleUpdatePatient = (updatedPatient: Patient) => {
    setAllPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };

  const handleDeletePatient = (id: number) => {
    setAllPatients(prev => prev.filter(p => p.id !== id));
  };

  const incrementUsedReports = () => {
    if (currentUser) {
      handleUpdateUser(currentUser.id!, { usedReports: (currentUser.usedReports || 0) + 1 });
    }
  };

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeView) {
      case 'Dashboard': 
        return <Dashboard 
          patients={userPatients} 
          user={currentUser} 
          onUpdateProfile={(u) => handleUpdateUser(currentUser.id!, u)} 
        />;
      case 'Pacientes': return <Pacientes patients={userPatients} onAddPatient={handleAddPatient} onUpdatePatient={handleUpdatePatient} onDeletePatient={handleDeletePatient} />;
      case 'Laudos': return <Laudos patients={userPatients} currentUser={currentUser} onReportGenerated={incrementUsedReports} />;
      case 'História de Vida': return <HistoriaDeVida patients={userPatients} currentUser={currentUser} onReportGenerated={incrementUsedReports} />;
      case 'Planos': return <Planos />;
      case 'Administração': 
        return currentUser.role === 'ADMIN' ? 
          <AdminPanel 
            users={allUsers} 
            onUpdateUser={handleUpdateUser} 
            onDeleteUser={handleDeleteUser} 
            onCreateUser={handleCreateUser}
            onLogout={handleLogout} 
          /> : <Dashboard patients={userPatients} user={currentUser} onUpdateProfile={(u) => handleUpdateUser(currentUser.id!, u)} />;
      case 'Configurações': return <Configuracoes theme={theme} toggleTheme={toggleTheme} />;
      case 'Conta': 
        return <Conta user={currentUser} onUpdateProfile={(u) => handleUpdateUser(currentUser.id!, u)} />;
      default: return <Dashboard patients={userPatients} user={currentUser} onUpdateProfile={(u) => handleUpdateUser(currentUser.id!, u)} />;
    }
  };

  return (
    <div className="flex h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text font-sans">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        onLogout={handleLogout} 
        userRole={currentUser.role} 
        creditUsage={currentUser ? { used: currentUser.usedReports, max: currentUser.maxReports } : undefined}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={currentUser} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
