
import type { Patient, Assessment, Report, Task, NeuroTest } from './types';

export const NEURO_TESTS: NeuroTest[] = [
    { id: 'wais-iv', name: 'Escala Wechsler de Inteligência para Adultos (WAIS-IV)', category: 'Adulto' },
    { id: 'bai', name: 'Inventário de Ansiedade de Beck (BAI)', category: 'Adulto' },
    { id: 'wisc-v', name: 'Escala Wechsler de Inteligência para Crianças (WISC-V)', category: 'Infanto-Adolescente' },
    { id: 'tac', name: 'Teste de Atenção por Cancelamento (TAC)', category: 'Geral' },
];

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 1,
    name: 'Ana Beatriz Costa',
    avatar: 'https://picsum.photos/seed/patient1/200',
    birthDate: '1995-03-15',
    gender: 'Feminino',
    cpf: '123.456.789-01',
    email: 'anabeatriz@example.com',
    phone: '(11) 98765-4321',
    address: { street: 'Rua das Flores, 123', city: 'São Paulo', state: 'SP', zip: '01234-567' },
    insurance: { provider: 'Amil', policyNumber: 'POL98765' },
    notes: 'Paciente colaborativa e engajada. Apresenta queixas relacionadas à ansiedade.',
    appliedTests: [
        { 
            testName: 'Escala Wechsler de Inteligência para Adultos (WAIS-IV)', 
            result: 'QI Total: 115 (Médio Superior)' 
        },
        { 
            testName: 'Inventário de Ansiedade de Beck (BAI)', 
            result: 'Escore: 28 (Ansiedade Moderada)' 
        }
    ]
  },
  {
    id: 2,
    name: 'Carlos Eduardo Lima',
    avatar: 'https://picsum.photos/seed/patient2/200',
    birthDate: '2010-08-20',
    gender: 'Masculino',
    cpf: '234.567.890-12',
    email: 'carlos.edu@example.com',
    phone: '(21) 91234-5678',
    address: { street: 'Avenida Copacabana, 456', city: 'Rio de Janeiro', state: 'RJ', zip: '22345-678' },
    insurance: { provider: 'Bradesco Saúde', policyNumber: 'POL54321' },
    appliedTests: []
  }
];

export const MOCK_REPORTS: Report[] = [
    { id: 1, patientId: 1, patientName: 'Ana Beatriz Costa', date: '2023-10-25', status: 'Concluído' },
];

export const MOCK_TASKS: Task[] = [
    { id: 1, description: 'Gerar laudo final', patientName: 'Carlos Eduardo Lima', dueDate: '2023-11-15' },
];

export const ASSESSMENT_DATA_FOR_CHARTS = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [
        { name: 'WAIS-IV', data: [12, 19, 10, 15, 12, 13] },
        { name: 'WISC-V', data: [8, 10, 14, 7, 11, 9] },
        { name: 'Stroop Test', data: [20, 22, 18, 25, 21, 23] },
    ],
};
