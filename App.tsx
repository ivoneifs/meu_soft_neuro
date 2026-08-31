
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
import { api } from './services/api';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('Dashboard');
  const [theme, setTheme] = useState<Theme>('light');

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('neuro_token'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Restaura a sessão a partir do token salvo, e carrega pacientes (e usuários, se admin).
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        const { user } = await api.me(token);
        setCurrentUser(user);
        const patients = await api.listPatients(token);
        setAllPatients(patients);
        if (user.role === 'ADMIN') {
          setAllUsers(await api.listUsers(token));
        }
      } catch {
        localStorage.removeItem('neuro_token');
        setToken(null);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token]);

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

  const handleLoggedIn = async (user: User, newToken: string) => {
    localStorage.setItem('neuro_token', newToken);
    setToken(newToken);
    setCurrentUser(user);
    setAllPatients(await api.listPatients(newToken));
    if (user.role === 'ADMIN') setAllUsers(await api.listUsers(newToken));
    setActiveView('Dashboard');
  };

  const handleLogout = async () => {
    if (token) await api.logout(token).catch(() => {});
    localStorage.removeItem('neuro_token');
    setToken(null);
    setCurrentUser(null);
    setAllUsers([]);
    setAllPatients([]);
  };

  const handleUpdateProfile = async (updates: Partial<User>) => {
    if (!token) return;
    const { user } = await api.updateProfile(updates, token);
    setCurrentUser(user);
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    if (!token) throw new Error('Não autenticado');
    await api.changePassword(currentPassword, newPassword, token);
  };

  const handleCreateUser = async (newUser: User) => {
    if (!token) return;
    const created = await api.createUser(newUser, token);
    setAllUsers((prev) => [...prev, created]);
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    if (!token) return;
    const updated = await api.updateUser(userId, updates, token);
    setAllUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    if (currentUser?.id === userId) setCurrentUser(updated);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!token) return;
    if (!confirm('Isso removerá permanentemente o usuário e TODOS os seus pacientes. Confirmar?')) return;
    await api.deleteUser(userId, token);
    setAllUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const userPatients = useMemo(() => allPatients, [allPatients]);

  const handleAddPatient = async (patient: Patient) => {
    if (!token) return;
    const created = await api.createPatient(patient, token);
    setAllPatients((prev) => [created, ...prev]);
  };

  const handleUpdatePatient = async (updatedPatient: Patient) => {
    if (!token) return;
    const saved = await api.updatePatient(updatedPatient.id, updatedPatient, token);
    setAllPatients((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
  };

  const handleDeletePatient = async (id: string) => {
    if (!token) return;
    await api.deletePatient(id, token);
    setAllPatients((prev) => prev.filter((p) => p.id !== id));
  };

  const incrementUsedReports = async () => {
    if (!token) return;
    const { user } = await api.incrementUsage(token);
    setCurrentUser(user);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg text-secondary">Carregando...</div>;
  }

  if (!currentUser) {
    return <Auth onLoggedIn={handleLoggedIn} />;
  }

  const renderContent = () => {
    switch (activeView) {
      case 'Dashboard':
        return <Dashboard patients={userPatients} user={currentUser} onUpdateProfile={handleUpdateProfile} />;
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
            token={token || ''}
          /> : <Dashboard patients={userPatients} user={currentUser} onUpdateProfile={handleUpdateProfile} />;
      case 'Configurações': return <Configuracoes theme={theme} toggleTheme={toggleTheme} />;
      case 'Conta':
        return <Conta user={currentUser} onUpdateProfile={handleUpdateProfile} onChangePassword={handleChangePassword} />;
      default: return <Dashboard patients={userPatients} user={currentUser} onUpdateProfile={handleUpdateProfile} />;
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
