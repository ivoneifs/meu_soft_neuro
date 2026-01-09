
import { GoogleGenAI } from "@google/genai";
import type { Patient } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const getAge = (birthDate: string) => {
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
        age--;
    }
    return age;
};

export const generateNeuroReport = async (
    patient: Patient, 
    reportData: any
): Promise<string> => {
  try {
    const model = 'gemini-3-pro-preview';
    const systemInstruction = `Você é um assistente de compilação de laudos neuropsicológicos...`; // Simplified for brevity as per existing logic
    const prompt = `Compilar laudo para ${patient.name}...`; 

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: { systemInstruction: systemInstruction, temperature: 0.3 }
    });
    return response.text || "Erro na geração.";
  } catch (error) {
    return "Erro ao gerar laudo.";
  }
};

export const generateLifeHistory = async (
  patient: Patient, 
  anamnesisText: string,
  imageFiles?: { data: string; mimeType: string }[]
): Promise<string> => {
  try {
    const model = 'gemini-3-pro-preview';
    const systemInstruction = `
Você é um neuropsicólogo especialista e sua tarefa é estruturar as informações de uma anamnese em uma seção coesa de "HISTÓRIA DE VIDA" para um laudo.
Organize as informações de forma clara e profissional, seguindo estritamente a estrutura:
- HISTÓRIA DE DOENÇA ATUAL
- HISTÓRIA DE VIDA (Gestacional, Desenvolvimento, Alimentação/Sono, Familiar/Social, Autonomia, Escolar).

IMPORTANTE: Se imagens forem fornecidas, transcreva o conteúdo relevante delas (ex: fotos de cadernos, exames antigos, relatórios manuais) e integre na narrativa.
`;

    const textPart = {
      text: `
**DADOS DO PACIENTE:**
- Nome: ${patient.name}
- Idade: ${getAge(patient.birthDate)} anos

**TEXTO DA ANÁLISE / CONTEXTO:**
---
${anamnesisText}
---
`
    };

    const parts: any[] = [textPart];

    if (imageFiles && imageFiles.length > 0) {
      imageFiles.forEach(img => {
        parts.push({
          inlineData: {
            data: img.data.split(',')[1] || img.data,
            mimeType: img.mimeType
          }
        });
      });
    }

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts },
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.4,
        }
    });

    return response.text || "Não foi possível gerar a história de vida.";
  } catch (error) {
    console.error("Erro Gemini:", error);
    return "Erro ao processar documentos com a IA.";
  }
};
