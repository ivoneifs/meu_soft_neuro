
import React, { useState, useEffect } from 'react';
import type { Patient, AppliedTest } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { PlusCircle, Edit, Trash2, Mail, Phone, MapPin, Users, GraduationCap, BriefcaseMedical, Save, TestTube2, Search, XCircle, Plus, Table as TableIcon, Sparkles, Loader2, Info, History, Clock } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Comprehensive subtest definitions for specialized batteries
const TEST_SUBTESTS: Record<string, string[]> = {
    // Escalas Wechsler
    'WISC-IV': ['Cubos', 'Semelhanças', 'Dígitos', 'Matrizes', 'Vocabulário', 'Aritmética', 'Busca de Símbolos', 'Raciocínio Visual', 'Informação', 'Código'],
    'WISC-V': ['Semelhanças', 'Vocabulário', 'Cubos', 'Quebra-Cabeças', 'Matrizes', 'Balanças', 'Dígitos', 'Span de Imagens', 'Código', 'Procurar Símbolos'],
    'WAIS-IV': ['Cubos', 'Semelhanças', 'Dígitos', 'Matrizes', 'Vocabulário', 'Aritmética', 'Busca de Símbolos', 'Raciocínio Visual', 'Informação', 'Código'],
    
    // Autismo (TEA)
    'CARS': ['Relação com Pessoas', 'Imitação', 'Resposta Emocional', 'Uso do Corpo', 'Uso de Objetos', 'Adaptação à Mudança', 'Resposta Visual', 'Resposta Auditiva', 'Resposta Olfato/Tato/Paladar', 'Medo/Nervosismo', 'Comunicação Verbal', 'Comunicação Não-Verbal', 'Nível de Atividade', 'Nível e Consistência Intelectual', 'Impressões Gerais'],
    'PROTEA-R': ['Interação Social', 'Comunicação Não-Verbal', 'Brincar', 'Comportamentos Estereotipados'],
    'SRS-2': ['Consciência Social', 'Cognição Social', 'Comunicação Social', 'Motivação Social', 'Maneirismos Restritos e Repetitivos'],
    'SSRS': ['Responsabilidade', 'Empatia', 'Assertividade', 'Autocontrole'],
    
    // TDAH e Atenção
    'ETDAH': ['Atenção', 'Impulsividade', 'Hiperatividade', 'Regulação Emocional'],
    'ETDAH-AD': ['Déficit de Atenção', 'Hiperatividade/Impulsividade', 'Fator Combinado'],
    'SNAP-IV': ['Desatenção (1-9)', 'Hiperatividade/Impulsividade (10-18)', 'Oposição/Desafio (19-26)'],
    'TENA': ['Atenção Concentrada', 'Atenção Dividida', 'Atenção Alternada'],
    'TAVIS-4': ['Seletividade', 'Alternância', 'Sustentação', 'Tempo de Reação (Média)', 'Desvio Padrão do Tempo', 'Omissões', 'Ações Indevidas'],
    
    // Memória e Linguagem
    'RAVLT': ['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'A6', 'A7 (Tardia)', 'Reconhecimento'],
    'FDT': ['Leitura', 'Contagem', 'Escolha', 'Alternância'],
    'IDADI': ['Cognitivo', 'Socioemocional', 'Linguagem Receptiva', 'Linguagem Expressiva', 'Motricidade Ampla', 'Motricidade Fina'],
    
    // Outros
    'SON-R': ['Categorias', 'Analogias', 'Situações', 'Mosaicos', 'Padrões', 'Desenho'],
    'TIME-R': ['Atenção', 'Memória', 'Raciocínio', 'Fluidez'],
    'BENDER': ['Erro de Distorção', 'Erro de Rotação', 'Erro de Integração', 'Erro de Perseveração'],
    'TDE-II': ['Escrita', 'Aritmética', 'Leitura'],
    'BPA': ['Atenção Concentrada', 'Atenção Dividida', 'Atenção Alternada']
};

interface PacientesProps {
  patients: Patient[];
  onAddPatient: (patient: Patient) => void;
  onUpdatePatient: (patient: Patient) => void;
  onDeletePatient: (id: number) => void;
}

const PatientFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Patient) => void;
  patient?: Patient | null;
}> = ({ isOpen, onClose, onSave, patient }) => {
  const [formData, setFormData] = useState<Partial<Patient>>({});

  useEffect(() => {
    if (patient) {
      setFormData(patient);
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        cpf: '',
        birthDate: '',
        gender: 'Feminino',
        address: { street: '', city: '', state: '', zip: '' },
        insurance: { provider: '', policyNumber: '' },
        lateralidade: 'Destro',
        escolaridade: '',
        filiacao: '',
        appliedTests: [],
      });
    }
  }, [patient, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as Patient);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-2xl bg-light-card dark:bg-dark-card rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>{patient ? 'Editar Paciente' : 'Adicionar Novo Paciente'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Nome Completo</label><input name="name" value={formData.name || ''} onChange={handleChange} className="w-full mt-1 p-2 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border" required /></div>
              <div><label className="text-sm font-medium">Email</label><input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="w-full mt-1 p-2 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border" required /></div>
              <div><label className="text-sm font-medium">Telefone</label><input name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full mt-1 p-2 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border" /></div>
              <div><label className="text-sm font-medium">CPF</label><input name="cpf" value={formData.cpf || ''} onChange={handleChange} className="w-full mt-1 p-2 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border" /></div>
              <div><label className="text-sm font-medium">Data de Nascimento</label><input type="date" name="birthDate" value={formData.birthDate || ''} onChange={handleChange} className="w-full mt-1 p-2 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border" /></div>
              <div>
                <label className="text-sm font-medium">Gênero</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full mt-1 p-2 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border">
                    <option>Feminino</option><option>Masculino</option><option>Outro</option>
                </select>
              </div>
            </div>
          </CardContent>
          <div className="p-6 flex justify-end gap-2 bg-light-bg dark:bg-dark-bg/50 rounded-b-lg">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Salvar Paciente</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PatientDetail: React.FC<{ 
    patient: Patient | null; 
    onClose: () => void;
    onEdit: (patient: Patient) => void;
    onDelete: (id: number) => void;
    onUpdateNotes: (id: number, notes: string) => void;
    onUpdateTests: (id: number, tests: AppliedTest[]) => void;
}> = ({ patient, onClose, onEdit, onDelete, onUpdateNotes, onUpdateTests }) => {
    if (!patient) return null;
    
    const [notes, setNotes] = useState(patient.notes || '');
    const [isEditingTests, setIsEditingTests] = useState(false);
    const [editedTests, setEditedTests] = useState<AppliedTest[]>([]);
    const [testScores, setTestScores] = useState<Record<number, Record<string, string>>>({});
    const [interpretingIndex, setInterpretingIndex] = useState<number | null>(null);

    useEffect(() => {
        setNotes(patient.notes || '');
        // When opening the detail, we initialize editedTests with an empty slot or previous work
        setEditedTests(patient.appliedTests ? [...patient.appliedTests] : []);
        setIsEditingTests(false);
    }, [patient]);

    const handleSaveNotes = () => {
        onUpdateNotes(patient.id, notes);
    };

    const handleTestChange = (index: number, field: keyof AppliedTest, value: string) => {
        const updatedTests = [...editedTests];
        updatedTests[index] = { ...updatedTests[index], [field]: value };
        setEditedTests(updatedTests);
    };

    const handleScoreChange = (testIndex: number, subtest: string, score: string) => {
        const newScores = { ...testScores };
        if (!newScores[testIndex]) newScores[testIndex] = {};
        newScores[testIndex][subtest] = score;
        setTestScores(newScores);

        const testName = editedTests[testIndex].testName.toUpperCase().trim();
        let subtestList: string[] | null = null;
        
        if (TEST_SUBTESTS[testName]) {
            subtestList = TEST_SUBTESTS[testName];
        } else {
            const knownKey = Object.keys(TEST_SUBTESTS).find(k => testName.includes(k));
            if (knownKey) subtestList = TEST_SUBTESTS[knownKey];
        }

        if (subtestList) {
            let tableText = `DADOS BRUTOS (${testName}):\n`;
            subtestList.forEach(st => {
                const s = newScores[testIndex][st] || "-";
                tableText += `${st}: ${s}\n`;
            });
            
            const updatedTests = [...editedTests];
            updatedTests[testIndex].result = tableText;
            setEditedTests(updatedTests);
        }
    };

    const handleInterpretIA = async (index: number) => {
        const test = editedTests[index];
        if (!test.testName || !test.result) {
            alert("Preencha o nome do instrumento e os dados brutos para interpretação.");
            return;
        }

        setInterpretingIndex(index);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const prompt = `
                Como neuropsicólogo, interprete os dados brutos do teste ${test.testName}.
                Paciente: ${patient.name} (${patient.birthDate}).
                DADOS:
                ${test.result}
                
                HISTÓRICO:
                ${notes}

                Gere um texto clínico rico e conciso. Se houver tempos de reação (TAVIS-4), analise a velocidade psicomotora e variabilidade atencional.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: { temperature: 0.3 }
            });

            const updatedTests = [...editedTests];
            const interpretation = response.text || "Sem retorno da IA.";
            updatedTests[index].result = test.result + "\n\n--- INTERPRETAÇÃO IA ---\n" + interpretation;
            setEditedTests(updatedTests);
        } catch (error) {
            console.error(error);
            alert("Falha na interpretação IA.");
        } finally {
            setInterpretingIndex(null);
        }
    };

    const addNewTest = () => {
        setEditedTests([...editedTests, { testName: '', result: '' }]);
    };

    const removeTest = (index: number) => {
        setEditedTests(editedTests.filter((_, i) => i !== index));
    };

    const handleSaveTests = () => {
        onUpdateTests(patient.id, editedTests);
        setIsEditingTests(false);
        alert("Avaliações gravadas no prontuário com sucesso!");
    };

    const handleCancelEditTests = () => {
        setEditedTests(patient.appliedTests ? [...patient.appliedTests] : []);
        setIsEditingTests(false);
    };

    const InfoItem: React.FC<{ icon: React.ElementType, label: string, value?: string }> = ({ icon: Icon, label, value }) => (
        <div className="flex items-start text-left">
            <Icon className="h-5 w-5 text-secondary mt-1 mr-3 flex-shrink-0" />
            <div>
                <p className="text-[10px] font-bold uppercase text-secondary">{label}</p>
                <p className="font-medium text-light-text dark:text-dark-text">{value || 'Não informado'}</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 z-40 flex justify-end" onClick={onClose}>
            <div className="w-full max-w-xl bg-light-card dark:bg-dark-card h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-light-border dark:border-dark-border text-left">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                            <img src={patient.avatar} alt={patient.name} className="h-16 w-16 rounded-full object-cover shadow-sm"/>
                            <div>
                                <h2 className="text-xl font-bold">{patient.name}</h2>
                                <p className="text-sm text-secondary">{patient.gender} • {patient.birthDate}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                            <XCircle className="h-6 w-6 text-gray-400" />
                        </button>
                    </div>
                    <div className="flex space-x-2">
                        <Button size="sm" variant="secondary" onClick={() => onEdit(patient)} className="flex-1"><Edit className="h-4 w-4 mr-2" /> Editar Cadastro</Button>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-500/10 flex-1" onClick={() => onDelete(patient.id)}><Trash2 className="h-4 w-4 mr-2" /> Excluir Paciente</Button>
                    </div>
                </div>

                <div className="p-6 space-y-6 text-left">
                    {/* SECTION: NEW EVALUATION */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between py-3">
                            <CardTitle className="text-md flex items-center"><PlusCircle className="h-5 w-5 mr-2 text-primary"/> Nova Avaliação</CardTitle>
                            {!isEditingTests && (
                                <Button variant="primary" size="sm" onClick={() => setIsEditingTests(true)}>
                                    <Plus className="h-4 w-4 mr-1" /> Aplicar Teste
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {isEditingTests ? (
                                <div className="space-y-6">
                                    {editedTests.map((test, index) => {
                                        const testNameUpper = test.testName.toUpperCase().trim();
                                        const knownTestKey = Object.keys(TEST_SUBTESTS).find(k => testNameUpper.includes(k));
                                        const subtests = knownTestKey ? TEST_SUBTESTS[knownTestKey] : null;

                                        return (
                                            <div key={index} className="p-5 border border-light-border dark:border-dark-border rounded-xl space-y-4 relative bg-gray-50/50 dark:bg-dark-bg/30">
                                                <button onClick={() => removeTest(index)} className="absolute top-3 right-3 text-red-400 hover:text-red-600">
                                                    <XCircle className="h-5 w-5" />
                                                </button>
                                                
                                                <div>
                                                    <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-1">Nome do Instrumento</label>
                                                    <input 
                                                        value={test.testName}
                                                        onChange={(e) => handleTestChange(index, 'testName', e.target.value)}
                                                        className="w-full p-2.5 text-sm rounded-lg bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-1 focus:ring-primary font-bold shadow-sm"
                                                        placeholder="Ex: WISC-IV, TAVIS-4, BENDER..."
                                                    />
                                                </div>

                                                {subtests && (
                                                    <div className="bg-white dark:bg-dark-card p-4 rounded-lg border border-primary/10 shadow-inner animate-in fade-in duration-300">
                                                        <label className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-2 mb-3">
                                                            <TableIcon className="h-3.5 w-3.5" /> Pontuações Brutas / Tempos de Reação
                                                        </label>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                            {subtests.map(st => (
                                                                <div key={st} className="space-y-1">
                                                                    <p className="text-[9px] text-secondary truncate font-semibold" title={st}>{st}</p>
                                                                    <input 
                                                                        type="text"
                                                                        placeholder="PB/ms"
                                                                        value={testScores[index]?.[st] || ''}
                                                                        onChange={(e) => handleScoreChange(index, st, e.target.value)}
                                                                        className="w-full p-2 text-xs rounded border border-primary/20 bg-gray-50 dark:bg-dark-bg focus:ring-1 focus:ring-primary text-center font-bold"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Resultado Consolidado / Notas</label>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-7 text-[10px] gap-1.5 text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20"
                                                            onClick={() => handleInterpretIA(index)}
                                                            isLoading={interpretingIndex === index}
                                                        >
                                                            {interpretingIndex === index ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                                            Interpretar com IA
                                                        </Button>
                                                    </div>
                                                    <textarea 
                                                        value={test.result}
                                                        onChange={(e) => handleTestChange(index, 'result', e.target.value)}
                                                        className="w-full p-3 text-[11px] font-mono rounded-lg bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-1 focus:ring-primary"
                                                        placeholder="Interpretacão clínica consolidada..."
                                                        rows={6}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <Button variant="secondary" size="sm" className="w-full border-dashed border-2 py-4" onClick={addNewTest}>
                                        <Plus className="h-4 w-4 mr-2" /> Adicionar Outro Teste
                                    </Button>
                                    <div className="flex gap-2 pt-2">
                                        <Button variant="secondary" className="flex-1" onClick={handleCancelEditTests}>Cancelar</Button>
                                        <Button className="flex-1" onClick={handleSaveTests}><Save className="h-4 w-4 mr-2"/> Salvar no Prontuário</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 opacity-40 italic text-sm">
                                    Nenhuma aplicação ativa. Clique em "Aplicar Teste" para começar.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* SECTION: SAVED HISTORY (ABA TODOS OS TESTES REALIZADOS) */}
                    <Card className="border-t-4 border-t-primary">
                        <CardHeader className="py-3 flex flex-row items-center gap-2">
                            <History className="h-5 w-5 text-primary" />
                            <CardTitle className="text-md">Histórico: Testes Realizados</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                {patient.appliedTests && patient.appliedTests.length > 0 ? (
                                    patient.appliedTests.map((test, index) => (
                                        <div key={index} className="border-l-4 border-primary pl-4 py-3 bg-primary/5 rounded-r-xl shadow-sm relative group">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-black text-primary uppercase tracking-tighter">{test.testName}</p>
                                                    <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">Gravado</span>
                                                </div>
                                                <Button variant="ghost" size="sm" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                                                    const updated = patient.appliedTests!.filter((_, i) => i !== index);
                                                    onUpdateTests(patient.id, updated);
                                                }}>
                                                    <Trash2 className="h-3 w-3 text-red-500" />
                                                </Button>
                                            </div>
                                            <div className="text-[11px] text-secondary whitespace-pre-wrap font-mono leading-snug bg-white/60 dark:bg-black/20 p-3 rounded-lg border border-primary/10">
                                                {test.result}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12">
                                        <History className="h-10 w-10 text-secondary/10 mx-auto mb-3" />
                                        <p className="text-xs text-secondary italic">Nenhum teste gravado no histórico deste paciente.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* SECTION: CLINICAL NOTES */}
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-md flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary" /> Observações Clínicas / Humor
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                                className="w-full p-3 text-sm rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-1 focus:ring-primary shadow-inner"
                                placeholder="Descreva aqui o comportamento, engajamento e humor do paciente durante as sessões..."
                            />
                            <Button onClick={handleSaveNotes} size="sm" className="w-full"><Save className="h-4 w-4 mr-2" /> Atualizar Observações</Button>
                        </CardContent>
                    </Card>

                    {/* PATIENT INFO FOOTER */}
                    <Card className="bg-gray-50/50 dark:bg-dark-bg/20">
                        <CardContent className="p-5 space-y-4">
                            <InfoItem icon={Mail} label="E-mail" value={patient.email} />
                            <InfoItem icon={Phone} label="Telefone" value={patient.phone} />
                            <InfoItem icon={MapPin} label="Localidade" value={patient.address.city ? `${patient.address.city}, ${patient.address.state}` : undefined} />
                            <InfoItem icon={BriefcaseMedical} label="Convênio" value={patient.insurance.provider} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export const Pacientes: React.FC<PacientesProps> = ({ patients, onAddPatient, onUpdatePatient, onDeletePatient }) => {
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const [filter, setFilter] = useState('');

    const handleOpenForm = (patient: Patient | null = null) => {
        setEditingPatient(patient);
        setIsFormOpen(true);
    };

    const handleSavePatient = (patientToSave: Patient) => {
        if (editingPatient) {
            onUpdatePatient({ ...editingPatient, ...patientToSave });
        } else {
            onAddPatient(patientToSave);
        }
        setIsFormOpen(false);
        setEditingPatient(null);
    };

    const handleDeletePatient = (id: number) => {
        if (confirm("Deseja realmente excluir este paciente? Esta ação removerá todo o histórico clínico.")) {
            onDeletePatient(id);
            setSelectedPatient(null);
        }
    };

    const handleUpdateNotes = (id: number, notes: string) => {
        const p = patients.find(p => p.id === id);
        if (p) {
            onUpdatePatient({ ...p, notes });
        }
    };

    const handleUpdateTests = (id: number, tests: AppliedTest[]) => {
        const p = patients.find(p => p.id === id);
        if (p) {
            onUpdatePatient({ ...p, appliedTests: tests });
        }
    };
    
    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(filter.toLowerCase()) ||
        p.cpf.includes(filter)
    );

    return (
        <div className="space-y-6 text-left animate-in fade-in duration-500">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-black text-light-text dark:text-dark-text tracking-tighter">Pacientes</h1>
                    <p className="text-secondary text-sm">Prontuários eletrônicos com histórico de testes e suporte de IA.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                       <input 
                          type="text"
                          placeholder="Buscar por nome ou CPF..."
                          value={filter}
                          onChange={(e) => setFilter(e.target.value)}
                          className="pl-10 pr-4 py-2.5 rounded-xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary text-sm w-72 shadow-lg"
                       />
                    </div>
                    <Button onClick={() => handleOpenForm()} className="shadow-lg font-bold">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Novo Paciente
                    </Button>
                </div>
            </div>
            
            <Card className="overflow-hidden border-none shadow-2xl">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-dark-bg/80 text-secondary text-[10px] uppercase font-black tracking-widest border-b">
                                <tr>
                                    <th className="p-6">Identificação</th>
                                    <th className="p-6">Contato</th>
                                    <th className="p-6">Avaliações Gravadas</th>
                                    <th className="p-6 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-light-border dark:divide-dark-border">
                                {filteredPatients.map(patient => (
                                    <tr key={patient.id} className="hover:bg-primary/5 dark:hover:bg-primary/10 transition-all cursor-pointer" onClick={() => setSelectedPatient(patient)}>
                                        <td className="p-6">
                                            <div className="flex items-center space-x-4">
                                                <img src={patient.avatar} alt={patient.name} className="h-12 w-12 rounded-full border-2 border-white dark:border-dark-border shadow-xl object-cover"/>
                                                <div>
                                                    <p className="font-black text-light-text dark:text-dark-text leading-tight mb-1">{patient.name}</p>
                                                    <p className="text-[10px] text-secondary font-bold tracking-wider">{patient.cpf || 'Documento pendente'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-xs font-bold text-light-text dark:text-dark-text">{patient.phone || 'S/N'}</p>
                                            <p className="text-[11px] text-secondary">{patient.email}</p>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-wrap gap-2">
                                                {patient.appliedTests && patient.appliedTests.length > 0 ? (
                                                    patient.appliedTests.slice(0, 3).map((t, i) => (
                                                        <span key={i} className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-[9px] font-black uppercase border border-primary/20">
                                                            {t.testName.substring(0, 10)}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-[10px] text-secondary/40 font-bold uppercase italic">Sem testes</span>
                                                )}
                                                {(patient.appliedTests?.length || 0) > 3 && (
                                                    <span className="text-[10px] text-primary font-black">+{patient.appliedTests!.length - 3}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <Button variant="ghost" size="sm" className="font-black text-[10px] uppercase tracking-tighter bg-primary/5 hover:bg-primary/10 border border-primary/5" onClick={(e) => { e.stopPropagation(); setSelectedPatient(patient); }}>
                                                Prontuário
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredPatients.length === 0 && (
                            <div className="p-24 text-center">
                                <Users className="h-16 w-16 text-secondary/10 mx-auto mb-4" />
                                <p className="text-secondary font-bold text-sm tracking-widest uppercase">Base de dados vazia</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <PatientDetail 
              patient={selectedPatient} 
              onClose={() => setSelectedPatient(null)} 
              onEdit={(p) => { setSelectedPatient(null); handleOpenForm(p); }}
              onDelete={handleDeletePatient}
              onUpdateNotes={handleUpdateNotes}
              onUpdateTests={handleUpdateTests}
            />
            
            <PatientFormModal 
              isOpen={isFormOpen}
              onClose={() => { setIsFormOpen(false); setEditingPatient(null); }}
              onSave={handleSavePatient}
              patient={editingPatient}
            />
        </div>
    );
};
