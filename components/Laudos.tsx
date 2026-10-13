
import React, { useState, useCallback, useRef } from 'react';
import { MOCK_REPORTS } from '../constants';
import type { Patient, Report, User } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { FilePlus, Printer, Download, Bot, AlertCircle, Upload, X, FileText, Image as ImageIcon, FileJson, FileSpreadsheet } from 'lucide-react';
import { generateNeuroReport } from '../services/geminiService';

const ReportGenerator: React.FC<{ 
    onClose: () => void; 
    patients: Patient[]; 
    currentUser: User;
    onReportGenerated: () => void;
}> = ({ onClose, patients, currentUser, onReportGenerated }) => {
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [reportInputs, setReportInputs] = useState({
        solicitante: '',
        finalidade: 'Avaliação Neuropsicológica Breve',
        demanda: '',
        procedimentos: '',
        instrumentos: '',
        medicacoes: '',
        condicoes: '',
        analiseInstrumentos: '',
        conclusaoGlobal: '',
        conclusaoTDAH: '',
        impressaoDiagnostica: '',
        sugestoes: '',
        recomendacoes: '',
    });
    const [generatedReport, setGeneratedReport] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isLimitReached = currentUser.usedReports >= currentUser.maxReports;
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setReportInputs(prev => ({...prev, [name]: value}));
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFiles(prev => [...prev, ...Array.from(event.target.files!)]);
        }
    };

    const handleRemoveFile = (fileName: string) => {
        setFiles(prev => prev.filter(f => f.name !== fileName));
    };

    const handleGenerateReport = useCallback(async () => {
        if (isLimitReached) {
            alert("Limite de laudos atingido para o seu plano atual.");
            return;
        }
        if (!selectedPatient) {
            alert("Por favor, selecione um paciente.");
            return;
        }
        setIsLoading(true);
        setGeneratedReport('');

        try {
            // In a real scenario, we'd process files here and send them to the API.
            // For this UI, we simulate reading local text files and notifying Gemini service.
            let contextFromFiles = "";
            for (const file of files) {
              if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.json')) {
                const text = await file.text();
                contextFromFiles += `\n[Conteúdo extraído de ${file.name}]: ${text}`;
              } else {
                contextFromFiles += `\n[Referência a arquivo: ${file.name}]`;
              }
            }

            const reportText = await generateNeuroReport(selectedPatient, { 
              ...reportInputs, 
              analiseInstrumentos: reportInputs.analiseInstrumentos + contextFromFiles 
            });
            
            setGeneratedReport(reportText);
            onReportGenerated();
        } catch (error) {
            console.error("Failed to generate report:", error);
            setGeneratedReport("Ocorreu um erro ao gerar o laudo.");
        } finally {
            setIsLoading(false);
        }
    }, [selectedPatient, reportInputs, files, isLimitReached, onReportGenerated]);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Laudo Neuropsicológico</title></head><body>');
            const formattedReport = generatedReport.replace(/\n/g, '<br/>');
            printWindow.document.write(formattedReport);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        }
    };

    const handleDownload = () => {
        if (!generatedReport || !selectedPatient) return;
        const filename = `laudo_${selectedPatient.name.toLowerCase().replace(/\s+/g, '_')}.txt`;
        const blob = new Blob([generatedReport], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-blue-500" />;
        if (file.name.endsWith('.json')) return <FileJson className="h-4 w-4 text-yellow-600" />;
        if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
        return <FileText className="h-4 w-4 text-gray-500" />;
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-light-card dark:bg-dark-card rounded-xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center"><Bot className="mr-2"/> Gerador de Laudo com IA</CardTitle>
                        <div className="flex items-center gap-4">
                           <div className="hidden md:block text-right">
                              <p className="text-xs text-secondary">Uso do Plano</p>
                              <p className={`text-sm font-bold ${isLimitReached ? 'text-red-500' : 'text-primary'}`}>
                                {currentUser.usedReports} / {currentUser.maxReports} laudos
                              </p>
                           </div>
                           <Button variant="ghost" onClick={onClose}>Fechar</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden p-4">
                    {isLimitReached && (
                        <div className="absolute inset-0 z-50 bg-white/80 dark:bg-dark-bg/80 flex items-center justify-center p-6 text-center">
                            <div className="max-w-md space-y-4">
                                <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
                                <h2 className="text-2xl font-bold">Limite Atingido!</h2>
                                <p className="text-secondary">Você já utilizou todos os {currentUser.maxReports} laudos permitidos no seu plano. Entre em contato com o administrador para aumentar seu limite.</p>
                                <Button onClick={onClose}>Voltar</Button>
                            </div>
                        </div>
                    )}
                    
                    <div className="md:w-1/2 overflow-y-auto pr-4 space-y-4 text-left">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-secondary mb-1">Paciente</label>
                                <select
                                    value={selectedPatient?.id ?? ''}
                                    onChange={(e) => setSelectedPatient(patients.find(p => p.id === e.target.value) || null)}
                                    className="w-full p-2.5 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-1 focus:ring-primary outline-none text-sm"
                                >
                                    <option value="">Selecione um paciente</option>
                                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-secondary mb-1">Solicitante</label>
                                <input name="solicitante" type="text" value={reportInputs.solicitante} onChange={handleInputChange} className="w-full p-2.5 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-1 focus:ring-primary outline-none text-sm" placeholder="Ex: Escola X" />
                            </div>
                        </div>

                        {/* File Upload Section */}
                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold uppercase text-secondary">Importar Documentos para Análise</label>
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-light-border dark:border-dark-border rounded-xl p-6 text-center hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group"
                            >
                                <Upload className="h-8 w-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                <p className="text-xs font-bold">Clique para upload ou arraste arquivos</p>
                                <p className="text-[9px] text-secondary mt-1">PDF, DOC, JPG, PNG, XLS, TXT, JSON</p>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.txt,.json" />
                            </div>

                            {files.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                    {files.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between bg-light-bg dark:bg-dark-bg p-2 rounded-lg border border-light-border dark:border-dark-border group text-[10px]">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                {getFileIcon(file)}
                                                <span className="font-medium truncate max-w-[100px]">{file.name}</span>
                                            </div>
                                            <button onClick={() => handleRemoveFile(file.name)} className="text-gray-400 hover:text-red-500">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-secondary mb-1">Descrição da Demanda</label>
                            <textarea name="demanda" rows={2} value={reportInputs.demanda} onChange={handleInputChange} className="w-full p-2.5 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-1 focus:ring-primary outline-none text-sm" placeholder="Motivo do encaminhamento / queixa principal..." />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase text-secondary mb-1">Procedimentos</label>
                            <textarea name="procedimentos" rows={2} value={reportInputs.procedimentos} onChange={handleInputChange} className="w-full p-2.5 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-1 focus:ring-primary outline-none text-sm" placeholder="Entrevista, aplicação de testes, etc..." />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase text-secondary mb-1">Análise de Instrumentos (Observações Manuais)</label>
                            <textarea name="analiseInstrumentos" rows={5} value={reportInputs.analiseInstrumentos} onChange={handleInputChange} className="w-full p-2.5 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-1 focus:ring-primary outline-none text-sm" placeholder="Descreva observações que não estão nos arquivos..." />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-secondary mb-1">Medicacões</label>
                                <input name="medicacoes" type="text" value={reportInputs.medicacoes} onChange={handleInputChange} className="w-full p-2.5 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-1 focus:ring-primary outline-none text-sm" placeholder="Ex: Ritalina 10mg" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-secondary mb-1">Finalidade</label>
                                <input name="finalidade" type="text" value={reportInputs.finalidade} onChange={handleInputChange} className="w-full p-2.5 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-1 focus:ring-primary outline-none text-sm" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase text-secondary mb-1">Impressão Diagnóstica</label>
                            <textarea name="impressaoDiagnostica" rows={2} value={reportInputs.impressaoDiagnostica} onChange={handleInputChange} className="w-full p-2.5 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border focus:ring-1 focus:ring-primary outline-none text-sm" placeholder="Impressão diagnóstica formal (opcional, a IA também pode sugerir)..." />
                        </div>

                        <div className="sticky bottom-0 bg-light-card dark:bg-dark-card py-4 flex flex-col gap-2 border-t mt-4">
                            <Button onClick={handleGenerateReport} isLoading={isLoading} className="w-full py-4 font-bold shadow-lg" disabled={isLimitReached || !selectedPatient}>
                                <Bot className="mr-2 h-5 w-5"/> {isLoading ? 'A IA está redigindo...' : 'Gerar Laudo Profissional'}
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="secondary" className="flex-1 gap-2 text-xs" onClick={handleDownload} disabled={!generatedReport}>
                                    <Download className="h-4 w-4" /> Baixar .txt
                                </Button>
                                <Button variant="secondary" className="flex-1 gap-2 text-xs" onClick={handlePrint} disabled={!generatedReport}>
                                    <Printer className="h-4 w-4" /> Imprimir
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="md:w-1/2 bg-gray-50 dark:bg-dark-bg rounded-xl border border-light-border dark:border-dark-border p-6 overflow-y-auto text-left shadow-inner">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                            {generatedReport || 'O laudo estruturado aparecerá aqui após o processamento dos dados e arquivos...'}
                        </pre>
                    </div>
                </CardContent>
            </div>
        </div>
    );
};

export const Laudos: React.FC<{ patients: Patient[]; currentUser: User; onReportGenerated: () => void }> = ({ patients, currentUser, onReportGenerated }) => {
    const [showGenerator, setShowGenerator] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="text-left">
                    <h1 className="text-3xl font-bold">Laudos</h1>
                    <p className="text-secondary text-sm">Cota: {currentUser.usedReports} de {currentUser.maxReports} utilizados.</p>
                </div>
                <Button onClick={() => setShowGenerator(true)}>
                    <FilePlus className="mr-2 h-5 w-5" />
                    Novo Laudo com IA
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-light-bg dark:bg-dark-bg text-secondary text-[10px] uppercase font-bold border-b">
                                <tr>
                                    <th className="p-4">Paciente</th>
                                    <th className="p-4">Data de Emissão</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {MOCK_REPORTS.map(report => (
                                    <tr key={report.id} className="border-b border-light-border dark:border-dark-border last:border-b-0 hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-bold text-sm">{report.patientName}</td>
                                        <td className="p-4 text-sm text-secondary">{report.date}</td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-full bg-green-100 text-green-800">
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <Button variant="ghost" size="sm" className="text-primary font-bold">Ver Documento</Button>
                                        </td>
                                    </tr>
                                ))}
                                {MOCK_REPORTS.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-secondary italic">Nenhum laudo encontrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {showGenerator && (
                <ReportGenerator 
                    onClose={() => setShowGenerator(false)} 
                    patients={patients} 
                    currentUser={currentUser}
                    onReportGenerated={onReportGenerated}
                />
            )}
        </div>
    );
};
