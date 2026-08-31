
export interface AppliedTest {
  testName: string;
  result: string;
}

export interface Patient {
  id: string;
  userId?: string;
  name: string;
  avatar: string;
  birthDate: string;
  gender: 'Masculino' | 'Feminino' | 'Outro';
  cpf: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  insurance: {
    provider: string;
    policyNumber: string;
  };
  school?: {
    name: string;
    grade: string;
  };
  notes?: string;
  lateralidade?: 'Destro' | 'Canhoto' | 'Ambidestro';
  escolaridade?: string;
  filiacao?: string;
  appliedTests?: AppliedTest[];
}

export interface Assessment {
  id: string;
  name: string;
  date: string;
  score: number;
  interpretation: string;
  observations: string;
}

export interface Report {
  id: number;
  patientId: number;
  patientName: string;
  date: string;
  status: 'Pendente' | 'Concluído';
}

export interface Task {
  id: number;
  description: string;
  patientName: string;
  dueDate: string;
}

export type Theme = 'light' | 'dark';

export interface User {
  id?: string;
  name: string;
  email: string;
  crp: string;
  avatar: string;
  title: string;
  password?: string;
  role: 'ADMIN' | 'USER';
  maxReports: number;
  usedReports: number;
  status: 'Ativo' | 'Bloqueado' | 'Pendente';
}

// Added NeuroTest interface to fix "Module '"./types"' has no exported member 'NeuroTest'" error
export interface NeuroTest {
  id: string;
  name: string;
  category: 'Adulto' | 'Infanto-Adolescente' | 'Geral';
}
