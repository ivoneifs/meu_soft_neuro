
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Check, Zap, Crown, Rocket, MessageSquare } from 'lucide-react';

export const Planos: React.FC = () => {
  const packages = [
    {
      name: 'Pack Inicial',
      price: 'R$ 49',
      credits: '5 Laudos',
      description: 'Ideal para profissionais que estão começando.',
      icon: Zap,
      color: 'bg-blue-500',
      features: ['Suporte via Email', 'Exportação em PDF', 'IA Gemini 3.0 Pro']
    },
    {
      name: 'Pack Profissional',
      price: 'R$ 149',
      credits: '20 Laudos',
      description: 'O melhor custo-benefício para sua clínica.',
      icon: Rocket,
      color: 'bg-indigo-600',
      popular: true,
      features: ['Prioridade na Fila', 'Suporte WhatsApp', 'História de Vida Ilimitada', '20 Créditos de Laudo']
    },
    {
      name: 'Pack Clínica Premium',
      price: 'R$ 299',
      credits: '50 Laudos',
      description: 'Para alta demanda e grandes fluxos.',
      icon: Crown,
      color: 'bg-purple-600',
      features: ['Consultoria VIP', 'Treinamento de Equipe', 'Cota alta de Créditos', 'Personalização de Layout']
    }
  ];

  const handleBuy = (packName: string) => {
    // Updated WhatsApp number as requested
    const phoneNumber = '5574988259925';
    const message = encodeURIComponent(`Olá! Gostaria de adquirir o ${packName} para o sistema Laudo Equilíbrio.`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold text-light-text dark:text-dark-text">Planos e Recargas</h1>
        <p className="text-secondary">Escolha o pacote que melhor se adapta à sua demanda clínica. Nossos créditos não expiram e garantem acesso total à inteligência artificial.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
        {packages.map((pkg) => (
          <Card key={pkg.name} className={`relative flex flex-col h-full transform transition-all hover:scale-105 ${pkg.popular ? 'border-2 border-primary ring-4 ring-primary/10 shadow-2xl' : ''}`}>
            {pkg.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                Mais Vendido
              </div>
            )}
            
            <CardHeader className="text-center pt-8">
              <div className={`mx-auto p-3 rounded-2xl ${pkg.color} text-white w-fit mb-4`}>
                <pkg.icon className="h-8 w-8" />
              </div>
              <CardTitle className="text-xl font-bold">{pkg.name}</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-extrabold">{pkg.price}</span>
                <span className="text-secondary text-sm font-medium ml-1">/ pacote</span>
              </div>
              <p className="text-primary font-bold mt-2 uppercase text-xs tracking-widest">{pkg.credits}</p>
            </CardHeader>

            <CardContent className="flex-1 space-y-6 flex flex-col">
              <p className="text-sm text-center text-secondary">{pkg.description}</p>
              
              <ul className="space-y-3 flex-1">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-secondary">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button 
                onClick={() => handleBuy(pkg.name)}
                className={`w-full py-4 text-lg font-bold shadow-lg ${pkg.popular ? 'bg-primary' : 'bg-slate-800 hover:bg-slate-900'}`}
              >
                Comprar Agora
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-primary/5 border-primary/20 p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="p-4 bg-primary/10 rounded-full">
            <MessageSquare className="h-10 w-10 text-primary" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold">Precisa de um plano personalizado?</h3>
            <p className="text-secondary text-sm">Se você é uma clínica com múltiplos profissionais, podemos criar uma solução sob medida com faturamento mensal.</p>
          </div>
          <Button variant="secondary" onClick={() => handleBuy('Plano Sob Medida')}>Falar com Consultor</Button>
        </div>
      </Card>
    </div>
  );
};
