
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import type { Theme } from '../types';
import { Sun, Moon } from 'lucide-react';

interface ConfiguracoesProps {
  theme: Theme;
  toggleTheme: () => void;
}

export const Configuracoes: React.FC<ConfiguracoesProps> = ({ theme, toggleTheme }) => {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-light-text dark:text-dark-text">Configurações</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Tema do Aplicativo</p>
              <p className="text-sm text-secondary">
                Selecione o tema claro ou escuro.
              </p>
            </div>
            <div className="flex items-center space-x-2 p-1 bg-light-bg dark:bg-dark-bg rounded-lg">
                <Button 
                    variant={theme === 'light' ? 'primary' : 'ghost'} 
                    size="sm" 
                    onClick={() => theme !== 'light' && toggleTheme()}
                    className="flex items-center gap-2"
                >
                   <Sun className="h-4 w-4"/> Claro
                </Button>
                 <Button 
                    variant={theme === 'dark' ? 'primary' : 'ghost'} 
                    size="sm" 
                    onClick={() => theme !== 'dark' && toggleTheme()}
                    className="flex items-center gap-2"
                 >
                   <Moon className="h-4 w-4"/> Escuro
                </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notificações por Email</p>
              <p className="text-sm text-secondary">Receba lembretes de tarefas e atualizações.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" value="" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/50 dark:peer-focus:ring-primary/80 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Lembretes de Tarefas</p>
              <p className="text-sm text-secondary">Mostra notificações no app para tarefas pendentes.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" value="" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/50 dark:peer-focus:ring-primary/80 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
