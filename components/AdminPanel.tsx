
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import {
  ShieldCheck, Search, Plus, Minus, Clock,
  UserPlus, Trash2, X, Zap, Users as UsersIcon, History, FileText, Bot, Upload
} from 'lucide-react';
import type { User } from '../types';
import { api } from '../services/api';

interface AdminPanelProps {
  users: User[];
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onDeleteUser: (userId: string) => void;
  onCreateUser: (user: User) => void;
  onLogout?: () => void;
  token: string;
}

const AI_DOC_TYPE_LABELS: Record<string, string> = {
  style_model: 'Laudo-modelo (estilo)',
  knowledge_base: 'Material clínico de apoio',
};

const AiDocsManager: React.FC<{ token: string }> = ({ token }) => {
  const [docs, setDocs] = useState<any[]>([]);
  const [type, setType] = useState('style_model');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      setDocs(await api.listAiDocs(token));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const file = fileInputRef.current?.files?.[0];
    if (!file) { setError('Selecione um arquivo'); return; }
    setBusy(true);
    try {
      await api.uploadAiDoc(file, type, token);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await load();
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar arquivo');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError('');
    try {
      await api.deleteAiDoc(id, token);
      await load();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card>
        <CardHeader>
          <CardTitle className="text-md flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> Documentos de Referência da IA</CardTitle>
          <p className="text-xs text-secondary mt-1">
            Envie laudos-modelo (estilo/estrutura) e material clínico de apoio (critérios, manuais).
            Aceita .docx, .pdf, .txt, .xls/.xlsx/.xlsm, .jpg/.jpeg/.png e outros formatos de texto.
            Usado automaticamente ao gerar laudos com IA.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-bold uppercase text-secondary mb-1">Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 rounded-lg border dark:bg-dark-bg text-sm">
                <option value="style_model">Laudo-modelo (estilo)</option>
                <option value="knowledge_base">Material clínico de apoio</option>
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-bold uppercase text-secondary mb-1">Arquivo</label>
              <input type="file" ref={fileInputRef} accept=".docx,.pdf,.txt,.xls,.xlsx,.xlsm,.jpg,.jpeg,.png,.csv" className="w-full p-1.5 rounded-lg border dark:bg-dark-bg text-sm" required />
            </div>
            <Button type="submit" disabled={busy} className="gap-2"><Upload className="h-4 w-4" /> {busy ? 'Enviando...' : 'Enviar'}</Button>
          </form>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-md">Documentos cadastrados</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-4 text-secondary">Carregando...</p>
          ) : docs.length === 0 ? (
            <p className="p-4 text-secondary italic">Nenhum documento enviado ainda.</p>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-light-bg dark:bg-dark-bg/50 text-secondary text-[10px] uppercase font-bold">
                <tr><th className="p-4">Arquivo</th><th className="p-4">Tipo</th><th className="p-4">Enviado em</th><th className="p-4 text-right">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-light-border dark:divide-dark-border">
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td className="p-4 text-sm">{d.filename}</td>
                    <td className="p-4 text-sm">{AI_DOC_TYPE_LABELS[d.type] ?? d.type}</td>
                    <td className="p-4 text-sm text-secondary">{new Date(d.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(d.id)} className="text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const CreditManager: React.FC<{ user: User; onUpdate: (val: number) => void }> = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState((user.maxReports - (user.usedReports || 0)).toString());
  const balance = user.maxReports - (user.usedReports || 0);

  const handleAdjust = (delta: number) => {
    onUpdate(user.maxReports + delta);
  };

  const handleManualSubmit = () => {
    const newVal = parseInt(tempValue);
    if (!isNaN(newVal)) {
      onUpdate(newVal + (user.usedReports || 0));
    }
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center bg-gray-100 dark:bg-dark-bg rounded-lg p-1 border border-light-border dark:border-dark-border shadow-sm">
        <button 
          onClick={() => handleAdjust(-1)}
          className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-red-500 transition-colors"
          title="Remover 1 crédito"
        >
          <Minus className="h-4 w-4" />
        </button>
        
        {isEditing ? (
          <input 
            autoFocus
            type="number"
            className="w-16 text-center bg-transparent font-bold text-primary outline-none"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={handleManualSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
          />
        ) : (
          <div 
            onClick={() => { setTempValue(balance.toString()); setIsEditing(true); }}
            className="w-16 text-center font-bold text-primary cursor-pointer hover:bg-white dark:hover:bg-slate-700 rounded py-1 transition-all"
            title="Clique para editar valor exato"
          >
            {balance}
          </div>
        )}

        <button 
          onClick={() => handleAdjust(1)}
          className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-green-500 transition-colors"
          title="Adicionar 1 crédito"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const CreateUserModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (user: User) => void }> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    crp: '',
    role: 'USER' as const,
    maxReports: 20,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-in zoom-in duration-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Criar Novo Profissional</CardTitle>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X className="h-5 w-5"/></button>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <input className="w-full p-2 rounded-lg border dark:bg-dark-bg" placeholder="Nome" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <input className="w-full p-2 rounded-lg border dark:bg-dark-bg" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <input className="w-full p-2 rounded-lg border dark:bg-dark-bg" type="password" placeholder="Senha" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          <input className="w-full p-2 rounded-lg border dark:bg-dark-bg" placeholder="CRP" value={formData.crp} onChange={e => setFormData({...formData, crp: e.target.value})} />
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-secondary">Créditos Iniciais</label>
            <input className="w-full p-2 rounded-lg border dark:bg-dark-bg" type="number" placeholder="Saldo de Créditos" value={formData.maxReports} onChange={e => setFormData({...formData, maxReports: parseInt(e.target.value) || 0})} />
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" onClick={() => { onSave({...formData, avatar: `https://i.pravatar.cc/150?u=${formData.email}`, title: 'Psicólogo(a)', usedReports: 0, status: 'Ativo' } as User); onClose(); }}>Criar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ users, onUpdateUser, onDeleteUser, onCreateUser, token }) => {
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'history' | 'ai'>('users');

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  const pendingUsers = filteredUsers.filter(u => u.status === 'Pendente');
  const activeUsers = filteredUsers.filter(u => u.status !== 'Pendente');

  const totalAvailableCredits = users.reduce((acc, u) => acc + (u.maxReports - (u.usedReports || 0)), 0);
  const totalUsers = users.length;

  const mockLogs = users
    .filter(u => u.usedReports > 0)
    .flatMap(u => 
      Array.from({ length: Math.min(u.usedReports, 3) }).map((_, i) => ({
        id: `${u.id}-${i}`,
        userName: u.name,
        userAvatar: u.avatar,
        action: i % 2 === 0 ? 'Geração de Laudo' : 'História de Vida',
        timestamp: new Date(Date.now() - (i * 3600000 + Math.random() * 86400000)).toLocaleString('pt-BR'),
      }))
    ).sort((a, b) => b.id.localeCompare(a.id));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-light-text dark:text-dark-text">
            <ShieldCheck className="text-primary h-8 w-8" /> Administração Mestre
          </h1>
          <p className="text-secondary text-sm">Gerencie o saldo de créditos e acompanhe o consumo dos profissionais.</p>
        </div>
        <div className="flex gap-2">
           <Button 
            variant={activeTab === 'users' ? 'primary' : 'secondary'} 
            onClick={() => setActiveTab('users')}
            size="sm"
            className="gap-2"
          >
            <UsersIcon className="h-4 w-4" /> Usuários
          </Button>
          <Button 
            variant={activeTab === 'history' ? 'primary' : 'secondary'} 
            onClick={() => setActiveTab('history')}
            size="sm"
            className="gap-2"
          >
            <History className="h-4 w-4" /> Histórico
          </Button>
          <Button
            variant={activeTab === 'ai' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('ai')}
            size="sm"
            className="gap-2"
          >
            <Bot className="h-4 w-4" /> IA
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="gap-2"><UserPlus className="h-4 w-4" /> Novo Usuário</Button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <>
          {pendingUsers.length > 0 && (
            <Card className="border-l-4 border-l-yellow-500 animate-in slide-in-from-left duration-300">
              <CardHeader>
                <CardTitle className="text-md flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" /> Solicitações Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-left">
                  <thead className="bg-yellow-50 dark:bg-yellow-900/10 text-secondary text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-4">Profissional</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-border dark:divide-dark-border">
                    {pendingUsers.map(user => (
                      <tr key={user.id} className="hover:bg-yellow-50/50 dark:hover:bg-yellow-900/5 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <img src={user.avatar} className="h-9 w-9 rounded-full" />
                          <div><p className="font-bold text-sm">{user.name}</p><p className="text-[10px] text-secondary">{user.email}</p></div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" className="text-green-600 hover:bg-green-50" onClick={() => onUpdateUser(user.id!, { status: 'Ativo' })}>
                              Aprovar
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => onDeleteUser(user.id!)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
              <CardTitle className="text-md font-bold">Controle de Profissionais</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border dark:bg-dark-bg" placeholder="Buscar profissional..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-light-bg dark:bg-dark-bg/50 text-secondary text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-4">Usuário</th>
                      <th className="p-4">Saldo de Créditos</th>
                      <th className="p-4">Consumo Total</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-border dark:divide-dark-border">
                    {activeUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <img src={user.avatar} className="h-9 w-9 rounded-full" />
                          <div><p className="font-bold text-sm text-light-text dark:text-dark-text">{user.name}</p><p className="text-[10px] text-secondary">{user.email}</p></div>
                        </td>
                        <td className="p-4">
                           <CreditManager user={user} onUpdate={(val) => onUpdateUser(user.id!, { maxReports: val })} />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg w-fit">
                            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                              {user.usedReports} <span className="text-[10px] font-normal opacity-80">ações</span>
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <button 
                            disabled={user.id === 'super_admin'}
                            onClick={() => onUpdateUser(user.id!, { status: user.status === 'Ativo' ? 'Bloqueado' : 'Ativo' })}
                            className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase transition-all ${user.status === 'Ativo' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                          >
                            {user.status}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          {user.id !== 'super_admin' && (
                            <button onClick={() => onDeleteUser(user.id!)} className="text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"><Trash2 className="h-4 w-4" /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : activeTab === 'ai' ? (
        <AiDocsManager token={token} />
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                   <p className="text-sm font-medium text-secondary">Créditos Totais na Rede</p>
                   <Zap className="h-4 w-4 text-primary" />
                </div>
                <p className="text-3xl font-bold text-primary mt-1">{totalAvailableCredits}</p>
                <p className="text-xs text-secondary mt-2">Saldo somado de todos os profissionais</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                 <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-secondary">Base de Usuários</p>
                    <UsersIcon className="h-4 w-4 text-indigo-500" />
                 </div>
                 <p className="text-3xl font-bold mt-1">{totalUsers}</p>
                 <p className="text-xs text-secondary mt-2">Profissionais cadastrados no sistema</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <CardTitle className="text-md flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Atividade em Tempo Real
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-left">
                     <thead className="bg-light-bg dark:bg-dark-bg/50 text-secondary text-[10px] uppercase font-bold sticky top-0">
                        <tr>
                           <th className="p-4">Profissional</th>
                           <th className="p-4">Ação</th>
                           <th className="p-4 text-right">Data/Hora</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-light-border dark:divide-dark-border text-xs">
                        {mockLogs.map(log => (
                           <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                              <td className="p-4 flex items-center gap-2">
                                 <img src={log.userAvatar} className="h-6 w-6 rounded-full border" />
                                 <span className="font-semibold">{log.userName.split(' ')[0]}</span>
                              </td>
                              <td className="p-4 italic text-secondary">Consumiu 1 crédito: {log.action}</td>
                              <td className="p-4 text-right text-[10px] text-secondary">{log.timestamp}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <CreateUserModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSave={onCreateUser} />
    </div>
  );
};
