
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Users, FileText, CheckCircle, Clock, Edit3, Award, Camera, Save, Mail, User as UserIcon, X, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ASSESSMENT_DATA_FOR_CHARTS, MOCK_TASKS } from '../constants';
import type { Patient, User } from '../types';

interface DashboardProps {
  patients: Patient[];
  user: User;
  onUpdateProfile?: (updatedUser: Partial<User>) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ patients, user, onUpdateProfile }) => {
  const [profileInfo, setProfileInfo] = useState(user);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfileInfo(user);
  }, [user]);

  const availableCredits = user.maxReports - (user.usedReports || 0);
  const pendingReportsCount = Math.max(0, patients.length - 1);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUpdateProfile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatar = reader.result as string;
        onUpdateProfile({ avatar: newAvatar });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    if (onUpdateProfile) {
      onUpdateProfile({
        name: profileInfo.name,
        crp: profileInfo.crp
      });
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      
      {/* Personalized Welcome & Profile Section */}
      <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-r from-primary/10 via-light-card to-light-card dark:from-primary/20 dark:via-dark-card dark:to-dark-card">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative group cursor-pointer" onClick={() => user.role !== 'ADMIN' && fileInputRef.current?.click()}>
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="h-28 w-28 rounded-2xl object-cover ring-4 ring-white dark:ring-dark-bg shadow-2xl transition-transform group-hover:scale-105"
              />
              {user.role !== 'ADMIN' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity">
                  <Camera className="text-white h-8 w-8" />
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-green-500 h-5 w-5 rounded-full border-4 border-white dark:border-dark-bg"></div>
              <input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <h1 className="text-3xl font-extrabold text-light-text dark:text-dark-text">Olá, {user.name.split(' ')[0]}!</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary uppercase tracking-tighter">
                  {user.role}
                </span>
              </div>
              <p className="text-secondary font-medium flex items-center justify-center md:justify-start gap-2 italic">
                <Award className="h-4 w-4 text-primary" /> {user.title} • {user.crp}
              </p>
              <div className="text-xs text-secondary pt-1 flex items-center justify-center md:justify-start gap-2">
                <Mail className="h-3 w-3" /> {user.email}
              </div>
            </div>

            {user.role !== 'ADMIN' && (
              <div className="flex flex-col gap-2">
                <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? 'primary' : 'secondary'} size="sm" className="gap-2 shadow-sm">
                  {isEditing ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />} 
                  {isEditing ? 'Cancelar' : 'Editar Perfil'}
                </Button>
              </div>
            )}
          </div>

          {/* Inline Profile Editor */}
          {isEditing && user.role !== 'ADMIN' && (
            <div className="mt-8 pt-6 border-t border-primary/10 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4 duration-300">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-secondary">Nome Profissional</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary outline-none"
                    value={profileInfo.name}
                    onChange={(e) => setProfileInfo({...profileInfo, name: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-secondary">Registro Profissional (CRP)</label>
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary outline-none"
                    value={profileInfo.crp}
                    onChange={(e) => setProfileInfo({...profileInfo, crp: e.target.value})}
                  />
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button onClick={handleSaveProfile} className="gap-2 bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4" /> Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-secondary">Pacientes</p>
              <p className="text-2xl font-bold">{patients.length}</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className={`border-l-4 ${availableCredits <= 3 ? 'border-l-red-500' : 'border-l-indigo-500'}`}>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-secondary">Saldo de Créditos</p>
              <p className={`text-2xl font-bold ${availableCredits <= 3 ? 'text-red-600 animate-pulse' : ''}`}>{availableCredits}</p>
            </div>
            <div className={`p-3 rounded-lg ${availableCredits <= 3 ? 'bg-red-500/10' : 'bg-indigo-500/10'}`}>
              <Zap className={`h-6 w-6 ${availableCredits <= 3 ? 'text-red-500' : 'text-indigo-500'}`} fill="currentColor" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-secondary">Pendentes</p>
              <p className="text-2xl font-bold">{pendingReportsCount}</p>
            </div>
            <div className="bg-yellow-500/10 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

         <Card className="border-l-4 border-l-sky-500">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-secondary">Laudos Gerados</p>
              <p className="text-2xl font-bold">{user.usedReports}</p>
            </div>
            <div className="bg-sky-500/10 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-sky-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Volume de Atendimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ASSESSMENT_DATA_FOR_CHARTS.datasets[0].data.map((_, i) => ({
                    name: ASSESSMENT_DATA_FOR_CHARTS.labels[i],
                    "Volume": Math.round(ASSESSMENT_DATA_FOR_CHARTS.datasets[0].data[i] * (patients.length / 5 + 0.2)),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="Volume" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-secondary">Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        {patients.slice(0, 4).map(patient => (
                            <li key={patient.id} className="flex items-center space-x-3 group cursor-pointer">
                                <img src={patient.avatar} alt={patient.name} className="h-10 w-10 rounded-full border-2 border-transparent group-hover:border-primary transition-all"/>
                                <div className="overflow-hidden text-left">
                                    <p className="font-semibold text-sm truncate">{patient.name}</p>
                                    <p className="text-[10px] text-secondary truncate">{patient.email}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-secondary">Agenda IA</CardTitle>
                </CardHeader>
                <CardContent>
                     <ul className="space-y-3">
                        {MOCK_TASKS.slice(0, 2).map(task => (
                            <li key={task.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                                <div className="mt-1 h-6 w-6 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <Clock className="h-3 w-3" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-sm leading-none mb-1">{task.description}</p>
                                    <p className="text-[10px] text-secondary font-bold uppercase">Prazo: {task.dueDate}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};
