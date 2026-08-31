
import React, { useState, useCallback, useRef } from 'react';
import type { Patient, User } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Bot, Download, Printer, Upload, Trash2, X, AlertCircle, FileText, Image as ImageIcon, FileJson, FileSpreadsheet, LayoutList, Sparkles, Wand2, Loader2 } from 'lucide-react';
import { generateLifeHistory } from '../services/geminiService';

interface HistoriaDeVidaProps {
    patients: Patient[];
    currentUser: User;
    onReportGenerated: () => void;
}

export const HistoriaDeVida: React.FC<HistoriaDeVidaProps> = ({ patients, currentUser, onReportGenerated }) => {
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [anamnesisText, setAnamnesisText] = useState('');
    const [generatedHistory, setGeneratedHistory] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcriptionProgress, setTranscriptionProgress] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isLimitReached = currentUser.usedReports >= currentUser.maxReports;

    const readFileAsBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const transcribeWithAI = async (file: File) => {
        if (!selectedPatient) throw new Error("Selecione um paciente.");
        
        let context = "";
        const imageParts: { data: string; mimeType: string }[] = [];

        if (file.type.startsWith('image/')) {
            const b64 = await readFileAsBase64(file);
            imageParts.push({ data: b64, mimeType: file.type });
        } else {
            context = await file.text();
        }

        // Prompt de OCR Avançado focado em documentos clínicos
        const ocrPrompt = `
            Aja como um especialista em OCR Clínico e Transcrição de Documentos Médicos.
            Sua tarefa é extrair TODO o texto visível deste documento com 100% de precisão.
            
            REGRAS DE EXTRAÇÃO:
            1. Transcreva fielmente nomes, datas, diagnósticos e medicações citadas.
            2. Se houver caligrafia manual difícil, tente decifrar pelo contexto clínico ou indique [ilegível].
            3. Preserve a estrutura de listas ou tabelas se houver resultados de exames.
            4. Ignore ruídos de digitalização (sombras, manchas).
            5. Não resuma. Apenas extraia o conteúdo bruto.
        `;

        return await generateLifeHistory(selectedPatient, ocrPrompt + "\nDOCUMENTO: " + file.name + "\n" + context, imageParts);
    };

    const handleTranscribeFile = async (file: File) => {
        if (!selectedPatient) return alert("Selecione um paciente primeiro.");
        setIsTranscribing(true);
        setTranscriptionProgress(`Lendo ${file.name}...`);
        try {
            const transcription = await transcribeWithAI(file);
            setAnamnesisText(prev => prev + `\n\n--- TRANSCRICÃO IA: ${file.name} ---\n` + transcription);
            setActiveTab('manual');
            alert(`Documento "${file.name}" transcrito com sucesso!`);
        } catch (error) {
            alert("Erro ao transcrever arquivo.");
        } finally {
            setIsTranscribing(false);
            setTranscriptionProgress('');
        }
    };

    const handleTranscribeAll = async () => {
        if (!selectedPatient) return alert("Selecione um paciente primeiro.");
        if (files.length === 0) return;
        
        setIsTranscribing(true);
        let combinedTranscription = "";

        try {
            for (const file of files) {
                setTranscriptionProgress(`Processando OCR: ${file.name}...`);
                const result = await transcribeWithAI(file);
                combinedTranscription += `\n\n--- TRANSCRICÃO IA: ${file.name} ---\n${result}`;
            }
            
            setAnamnesisText(prev => prev + combinedTranscription);
            setActiveTab('manual');
            alert(`${files.length} arquivos processados com OCR avançado!`);
        } catch (error) {
            console.error(error);
            alert("Ocorreu um erro no processamento em lote.");
        } finally {
            setIsTranscribing(false);
            setTranscriptionProgress('');
        }
    };

    const handleGenerate = useCallback(async () => {
        if (isLimitReached) {
            alert("Limite de geração atingido para o seu plano.");
            return;
        }
        if (!selectedPatient) {
            alert("Por favor, selecione um paciente.");
            return;
        }

        setIsLoading(true);
        setGeneratedHistory('');

        try {
            const imageParts: { data: string; mimeType: string }[] = [];
            let extraText = anamnesisText;

            // Envia apenas o que ainda não foi transcrito manualmente para evitar duplicidade 
            // ou envia tudo como contexto consolidado
            const historyText = await generateLifeHistory(selectedPatient, extraText, []);
            setGeneratedHistory(historyText);
            onReportGenerated();
        } catch (error) {
            console.error("Failed to generate life history:", error);
            setGeneratedHistory("Ocorreu um erro ao estruturar o laudo. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    }, [selectedPatient, anamnesisText, isLimitReached, onReportGenerated]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFiles(prev => [...prev, ...Array.from(event.target.files!)]);
        }
    };

    const handleRemoveFile = (fileName: string) => {
        setFiles(prev => prev.filter(f => f.name !== fileName));
    };

    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-blue-500" />;
        if (file.name.endsWith('.json')) return <FileJson className="h-4 w-4 text-yellow-600" />;
        if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
        return <FileText className="h-4 w-4 text-gray-500" />;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-light-text dark:text-dark-text">História de Vida</h1>
                    <p className="text-secondary text-sm">Estruturação inteligente com OCR de alta precisão.</p>
                </div>
                <div className="bg-primary/5 px-4 py-2 rounded-lg border border-primary/20 flex flex-col items-end">
                    <span className="text-[10px] uppercase font-bold text-secondary">Créditos Disponíveis</span>
                    <span className={`text-lg font-bold ${isLimitReached ? 'text-red-500' : 'text-primary'}`}>
                        {currentUser.maxReports - currentUser.usedReports}
                    </span>
                </div>
            </div>

            <div className="flex border-b border-light-border dark:border-dark-border">
                <button 
                    onClick={() => setActiveTab('manual')}
                    className={`px-6 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'manual' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-light-text'}`}
                >
                    <LayoutList className="h-4 w-4" /> Texto Manual
                </button>
                <button 
                    onClick={() => setActiveTab('import')}
                    className={`px-6 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'import' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-light-text'}`}
                >
                    <Upload className="h-4 w-4" /> Importar Documentos
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Entrada de Dados</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1">
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-secondary mb-1">Paciente Alvo</label>
                            <select
                                value={selectedPatient?.id ?? ''}
                                onChange={(e) => setSelectedPatient(patients.find(p => p.id === e.target.value) || null)}
                                className="w-full p-2.5 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-1 focus:ring-primary outline-none"
                            >
                                <option value="">Selecione para quem é a história...</option>
                                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        {activeTab === 'manual' ? (
                            <div className="animate-in fade-in duration-300 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-secondary mb-1">Conteúdo da Anamnese (Consolidado)</label>
                                    <textarea 
                                        rows={12}
                                        value={anamnesisText}
                                        onChange={e => setAnamnesisText(e.target.value)}
                                        className="w-full p-3 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-1 focus:ring-primary outline-none text-sm font-mono"
                                        placeholder="Digite aqui ou utilize o OCR na aba de importação para extrair textos de documentos..."
                                    />
                                </div>
                                <Button 
                                    onClick={handleGenerate} 
                                    isLoading={isLoading} 
                                    className="w-full py-4 text-md font-bold shadow-lg gap-2" 
                                    disabled={isLimitReached || !selectedPatient || !anamnesisText.trim()}
                                >
                                    <Sparkles className="h-5 w-5" />
                                    {isLoading ? 'IA Estruturando Laudo...' : 'Gerar História de Vida Estruturada'}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-light-border dark:border-dark-border rounded-xl p-8 text-center hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group"
                                >
                                    <Upload className="h-10 w-10 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                                    <p className="text-sm font-bold">Importar Laudos e Exames</p>
                                    <p className="text-[10px] text-secondary mt-1">Imagens digitalizadas serão processadas com OCR por IA</p>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.txt,.json" />
                                </div>

                                {files.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] font-bold uppercase text-secondary">Fila de Processamento ({files.length})</p>
                                            <Button 
                                                variant="secondary" 
                                                size="sm" 
                                                className="text-[10px] h-7 px-3 gap-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                                                onClick={handleTranscribeAll}
                                                disabled={isTranscribing || !selectedPatient}
                                            >
                                                {isTranscribing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                                                OCR em Todos
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2">
                                            {files.map((file, index) => (
                                                <div key={index} className="flex items-center justify-between bg-light-bg dark:bg-dark-bg p-3 rounded-lg border border-light-border dark:border-dark-border group">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        {getFileIcon(file)}
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold truncate max-w-[150px]">{file.name}</span>
                                                            <span className="text-[9px] text-secondary">{(file.size / 1024).toFixed(0)} KB</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => handleTranscribeFile(file)}
                                                            className="text-primary hover:bg-primary/10 p-1.5 rounded-md transition-all flex items-center gap-1 text-[10px] font-bold border border-transparent hover:border-primary/30"
                                                            title="OCR Individual"
                                                            disabled={isTranscribing}
                                                        >
                                                            <Wand2 className="h-3.5 w-3.5" />
                                                            <span className="hidden sm:inline">OCR</span>
                                                        </button>
                                                        <button onClick={() => handleRemoveFile(file.name)} className="text-gray-400 hover:text-red-500 p-1.5">
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="pt-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                                    <h4 className="text-[10px] font-bold uppercase text-primary mb-2 flex items-center gap-2">
                                        <Bot className="h-3 w-3" /> Como Funciona o OCR
                                    </h4>
                                    <p className="text-[10px] text-secondary leading-relaxed">
                                        Nossa IA lê fotos de relatórios manuais, cadernos escolares e exames digitalizados. Clique em <b>OCR</b> para extrair o texto de cada documento para a sua área de rascunho antes de gerar o laudo final.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between py-4">
                        <CardTitle className="text-md">Resultado da IA</CardTitle>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => {}} disabled={!generatedHistory}><Download className="h-4 w-4"/></Button>
                            <Button variant="ghost" size="sm" onClick={() => {}} disabled={!generatedHistory}><Printer className="h-4 w-4"/></Button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-dark-bg/30 p-0">
                        <div className="p-6 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                            {(isLoading || isTranscribing) ? (
                                <div className="flex flex-col items-center justify-center h-64 text-secondary gap-4">
                                    <div className="relative">
                                        <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                        <Bot className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-primary animate-pulse">
                                            {isTranscribing ? 'Executando OCR Avançado...' : 'Organizando História de Vida...'}
                                        </p>
                                        <p className="text-[10px] mt-1">{transcriptionProgress}</p>
                                    </div>
                                </div>
                            ) : generatedHistory ? (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 prose dark:prose-invert max-w-none">
                                    {generatedHistory}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-secondary/40 text-center px-8">
                                    <div className="bg-light-bg dark:bg-dark-bg p-6 rounded-full mb-4">
                                        <FileText className="h-12 w-12 opacity-20" />
                                    </div>
                                    <p className="text-sm font-medium">Pronto para estruturar</p>
                                    <p className="text-[10px] max-w-xs mt-1">Após extrair os textos dos seus documentos via OCR ou digitar o rascunho, clique em "Gerar" para obter a versão estruturada.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
