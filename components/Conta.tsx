import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import type { User } from '../types';

interface ContaProps {
    user: User;
    onUpdateProfile: (updatedUser: Partial<User>) => void;
    onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const Conta: React.FC<ContaProps> = ({ user, onUpdateProfile, onChangePassword }) => {
  const [profileInfo, setProfileInfo] = useState(user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfileInfo(user);
  }, [user]);

  const [passwordInfo, setPasswordInfo] = useState({
      currentPassword: '',
      newPassword: ''
  });

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatar = reader.result as string;
        setProfileInfo(prev => ({ ...prev, avatar: newAvatar })); 
        onUpdateProfile({ avatar: newAvatar });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      setProfileInfo(prev => ({ ...prev, [id]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      setPasswordInfo(prev => ({ ...prev, [id]: value }));
  };

  const handleProfileSave = () => {
      onUpdateProfile({
          name: profileInfo.name,
          email: profileInfo.email,
          crp: profileInfo.crp
      });
  };

  const handlePasswordSave = async () => {
      if (!passwordInfo.currentPassword || !passwordInfo.newPassword) {
          alert('Por favor, preencha os campos de senha atual e nova senha.');
          return;
      }
      try {
          await onChangePassword(passwordInfo.currentPassword, passwordInfo.newPassword);
          alert('Senha alterada com sucesso!');
          setPasswordInfo({ currentPassword: '', newPassword: '' });
      } catch (err: any) {
          alert(err.message || 'Não foi possível alterar a senha.');
      }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-light-text dark:text-dark-text">Minha Conta</h1>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <img src={profileInfo.avatar} alt="User Avatar" className="h-20 w-20 rounded-full object-cover" />
            <Button variant="secondary" onClick={handleButtonClick}>Alterar Foto</Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              className="hidden"
              accept="image/*"
            />
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium">Nome</label>
            <input type="text" id="name" value={profileInfo.name} onChange={handleProfileChange} className="mt-1 block w-full p-2 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <input type="email" id="email" value={profileInfo.email} onChange={handleProfileChange} className="mt-1 block w-full p-2 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
           <div>
            <label htmlFor="crp" className="block text-sm font-medium">CRP</label>
            <input type="text" id="crp" value={profileInfo.crp} onChange={handleProfileChange} className="mt-1 block w-full p-2 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="text-right">
            <Button onClick={handleProfileSave}>Salvar Alterações</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="currentPassword"  className="block text-sm font-medium">Senha Atual</label>
            <input type="password" id="currentPassword" value={passwordInfo.currentPassword} onChange={handlePasswordChange} className="mt-1 block w-full p-2 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="newPassword"  className="block text-sm font-medium">Nova Senha</label>
            <input type="password" id="newPassword" value={passwordInfo.newPassword} onChange={handlePasswordChange} className="mt-1 block w-full p-2 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="text-right">
            <Button onClick={handlePasswordSave}>Alterar Senha</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};