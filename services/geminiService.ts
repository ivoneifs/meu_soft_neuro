import type { Patient } from '../types';

export const generateNeuroReport = async (
    patient: Patient,
    reportData: any
): Promise<string> => {
  try {
    const res = await fetch('/api/openai/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient, reportData }),
    });
    const data = await res.json();
    return data.text || 'Erro na geração.';
  } catch (error) {
    return 'Erro ao gerar laudo.';
  }
};

export const generateLifeHistory = async (
  patient: Patient,
  anamnesisText: string,
  imageFiles?: { data: string; mimeType: string }[]
): Promise<string> => {
  try {
    const res = await fetch('/api/openai/life-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient, anamnesisText, imageFiles }),
    });
    const data = await res.json();
    return data.text || 'Não foi possível gerar a história de vida.';
  } catch (error) {
    console.error('Erro ao gerar história de vida:', error);
    return 'Erro ao processar documentos com a IA.';
  }
};
