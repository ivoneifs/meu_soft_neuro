
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { BrainCircuit, Mail, Lock, User as UserIcon, Clock, MapPin, Phone, CreditCard, Award, Briefcase, Key } from 'lucide-react';
import type { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [regType, setRegType] = useState<'fisica' | 'juridica'>('fisica');
  
  const [formData, setFormData] = useState({
    name: '', // Nome completo ou Razão Social
    fantasyName: '', // Nome Fantasia (PJ)
    email: '',
    password: '',
    confirmPassword: '',
    crp: '',
    cpf: '', // CPF ou CNPJ
    birthDate: '',
    phone: '',
    profession: 'Psicólogo',
    regulatoryBody: 'CRP',
    uf: 'SP',
    cep: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    number: '',
    complement: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      onLogin({
        email: formData.email,
        password: formData.password,
      } as User);
    } else {
      if (formData.password !== formData.confirmPassword) {
        alert("As senhas não conferem.");
        return;
      }

      const isSuperAdmin = formData.email.toLowerCase() === 'ivonei.admin@neuro.com';
      if (isSuperAdmin) {
        alert("Este e-mail é reservado para o administrador.");
        return;
      }

      const newUser: User = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        avatar: `https://picsum.photos/seed/${formData.email}/150`,
        title: regType === 'fisica' ? formData.profession : 'Clínica/PJ',
        crp: formData.crp || 'PJ-CONSULTA',
        role: 'USER',
        maxReports: 5,
        usedReports: 0,
        status: 'Pendente'
      };

      setIsPendingApproval(true);
      onLogin(newUser);
    }
  };

  if (isPendingApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg p-4 text-center">
        <Card className="max-w-md w-full p-8 space-y-6 shadow-2xl border-none animate-in zoom-in duration-300">
          <div className="flex justify-center">
            <div className="p-4 bg-yellow-500/10 rounded-full animate-pulse">
              <Clock className="h-12 w-12 text-yellow-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-light-text dark:text-dark-text">Solicitação Enviada!</h2>
            <p className="text-secondary text-sm">
              Seus dados foram recebidos. <br/>
              <b>O Administrador Ivonei</b> analisará seu perfil para validar sua conta corporativa.
            </p>
          </div>
          <Button onClick={() => { setIsPendingApproval(false); setIsLogin(true); }} className="w-full">
            Voltar para Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl space-y-8 animate-in fade-in duration-700">
        
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-2xl shadow-lg">
              <BrainCircuit className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-light-text dark:text-white">Laudo Equilíbrio</h1>
          <p className="mt-1 text-secondary font-bold uppercase tracking-widest text-[10px]">Sistema de Gestão Neuropsicológica</p>
        </div>

        <Card className="shadow-2xl border-none overflow-hidden bg-white dark:bg-dark-card">
          <div className="h-1.5 w-full bg-primary"></div>
          
          {!isLogin && (
            <div className="flex border-b border-light-border dark:border-dark-border">
              <button 
                type="button"
                onClick={() => setRegType('fisica')}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${regType === 'fisica' ? 'bg-[#1abc9c] text-white' : 'text-secondary hover:bg-gray-50 dark:hover:bg-slate-800'}`}
              >
                Pessoa Física
              </button>
              <button 
                type="button"
                onClick={() => setRegType('juridica')}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${regType === 'juridica' ? 'bg-[#1abc9c] text-white' : 'text-secondary hover:bg-gray-50 dark:hover:bg-slate-800'}`}
              >
                Pessoa Jurídica
              </button>
            </div>
          )}

          <CardHeader className="pt-8 text-center">
            <CardTitle className="text-2xl font-bold">
              {isLogin ? 'Acessar Plataforma' : 'Cadastrar'}
            </CardTitle>
            {!isLogin && <p className="text-xs text-secondary mt-1">Faça laudos psicológicos em até 1 hora e sem perder a qualidade!</p>}
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {isLogin ? (
                <div className="max-w-sm mx-auto space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-secondary mb-1">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input 
                        required type="email" 
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-dark-bg border outline-none focus:ring-1 focus:ring-primary text-sm"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-secondary mb-1">Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input 
                        required type="password" 
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-dark-bg border outline-none focus:ring-1 focus:ring-primary text-sm"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full py-2.5 font-bold mt-2">Entrar</Button>
                </div>
              ) : (
                /* Registration Form - Detailed View */
                <div className="space-y-4">
                  
                  {/* Common Fields Based on regType */}
                  {regType === 'fisica' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold uppercase text-secondary mb-1">Nome Completo</label>
                        <input required type="text" className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-dark-bg text-sm" placeholder="Digite seu nome completo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-secondary mb-1">CPF</label>
                        <input required type="text" className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-dark-bg text-sm" placeholder="000.000.000-00" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-secondary mb-1">Data de Nascimento</label>
                        <input required type="date" className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-dark-bg text-sm" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-secondary mb-1">Razão Social</label>
                          <input required type="text" className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-dark-bg text-sm" placeholder="Razão Social" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-secondary mb-1">Nome Fantasia</label>
                          <input required type="text" className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-dark-bg text-sm" placeholder="Nome Fantasia" value={formData.fantasyName} onChange={e => setFormData({...formData, fantasyName: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-secondary mb-1">CNPJ</label>
                          <input required type="text" className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-dark-bg text-sm" placeholder="CNPJ" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-secondary mb-1">E-mail</label>
                      <input required type="email" className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-dark-bg text-sm" placeholder="seuemail@com.br" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-secondary mb-1">Telefone {regType === 'juridica' ? 'Comercial' : 'Celular'}</label>
                      <input required type="text" className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-dark-bg text-sm" placeholder="(00) 00000-0000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-secondary mb-1">CEP</label>
                      <input type="text" className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-dark-bg text-sm" placeholder="CEP" value={formData.cep} onChange={e => setFormData({...formData, cep: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-secondary mb-1">UF</label>
                      <select className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-dark-bg text-sm" value={formData.uf} onChange={e => setFormData({...formData, uf: e.target.value})}>
                        <option>SP</option><option>RJ</option><option>MG</option><option>PR</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-secondary mb-1">Cidade</label>
                      <input type="text" className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-dark-bg text-sm" placeholder="Cidade" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-secondary mb-1">Endereço</label>
                      <input type="text" className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-dark-bg text-sm" placeholder="Endereço" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-secondary mb-1">Bairro</label>
                      <input type="text" className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-dark-bg text-sm" placeholder="Bairro" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-secondary mb-1">Complemento</label>
                      <input type="text" className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-dark-bg text-sm" placeholder="Complemento" value={formData.complement} onChange={e => setFormData({...formData, complement: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-secondary mb-1">Número</label>
                      <input type="text" className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-dark-bg text-sm" placeholder="Número" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} />
                    </div>
                  </div>

                  {/* Password Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-secondary mb-1">Senha</label>
                      <input required type="password" underline="false" className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-dark-bg text-sm" placeholder="Senha" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-secondary mb-1">Confirmar Senha</label>
                      <input required type="password" underline="false" className="w-full px-3 py-2 rounded border bg-gray-50 dark:bg-dark-bg text-sm" placeholder="Repita sua senha" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-4">
                    <div className="flex items-center gap-2">
                      <input required type="checkbox" id="terms" className="rounded text-primary focus:ring-primary" />
                      <label htmlFor="terms" className="text-[10px] text-secondary">
                        Li e concordo com os <a href="#" className="text-primary underline">Termos de uso e Privacidade</a> da plataforma
                      </label>
                    </div>
                    <Button type="submit" className="px-6 py-2.5 font-bold bg-[#f39c12] hover:bg-[#e67e22] border-none text-white gap-2 flex items-center">
                      Cadastrar <Key className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </form>

            <div className="mt-8 text-center">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-primary hover:text-primary-hover font-bold flex items-center justify-center gap-2 mx-auto"
              >
                {isLogin ? (
                  <>Não tem uma conta? <span className="underline">Cadastre-se</span></>
                ) : (
                  <>Já possui cadastro? <span className="underline">Fazer Login</span></>
                )}
              </button>
            </div>
          </CardContent>
          <div className="p-4 bg-gray-50 dark:bg-dark-bg/50 border-t border-light-border dark:border-dark-border text-[9px] text-center text-secondary">
             Copyright © 2021 - 2026 • Laudo Equilíbrio • Responsável Técnica: Emanuela Bastos de Souza CRP 03/11614 • Todos os direitos reservados.
          </div>
        </Card>
      </div>
    </div>
  );
};
