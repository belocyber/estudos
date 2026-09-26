import React, { useEffect, useRef, useState } from 'react';
import './index.css';

// ─── DADOS ABIN ──────────────────────────────────────────────────────────────
const etapasEstudoABIN = [
  { id: 'teoria', label: 'Teoria estudada' },
  { id: 'resumo', label: 'Resumo e revisão' },
  { id: 'questoes', label: 'Questões realizadas' },
  { id: 'erros', label: 'Revisão dos erros' },
  { id: 'revisao-final', label: 'Revisão final' },
  { id: 'simulado', label: 'Simulado' },
];

const initialDisciplinasABIN = [
  { cod: 'CB01', nome: 'Língua Portuguesa', meta: 18, feitas: 0 },
  { cod: 'CB02', nome: 'Atividade de Inteligência e Legislação', meta: 20, feitas: 0 },
  { cod: 'CE01', nome: 'Direito Administrativo', meta: 12, feitas: 0 },
  { cod: 'CE02', nome: 'Direito Constitucional', meta: 12, feitas: 0 },
  { cod: 'CE03', nome: 'Inglês ou Espanhol', meta: 10, feitas: 0 },
  { cod: 'CE04', nome: 'Raciocínio Lógico', meta: 12, feitas: 0 },
  { cod: 'CE05', nome: 'Conhecimentos específicos do cargo/área', meta: 31, feitas: 0, nota: 'Conteúdo variável conforme o cargo e a área.' },
].map(d => ({ ...d, etapas: etapasEstudoABIN.map(e => ({ ...e, concluida: false })) }));

const initialDocumentosABIN = [
  { id: 'dp1', nome: 'RG / documento oficial', grupo: 'DOCUMENTOS PESSOAIS', req: 'Base pessoal', momento: 'Manter atualizado', actionable: true, pronto: false },
  { id: 'dp2', nome: 'CPF', grupo: 'DOCUMENTOS PESSOAIS', req: 'Base pessoal', momento: 'Manter atualizado', actionable: true, pronto: false },
  { id: 'dp3', nome: 'Título de eleitor', grupo: 'DOCUMENTOS PESSOAIS', req: 'Base pessoal', momento: 'Manter atualizado', actionable: true, pronto: false },
  { id: 'dp4', nome: 'Certidão de quitação eleitoral', grupo: 'DOCUMENTOS PESSOAIS', req: 'Base pessoal', momento: 'Manter atualizada', actionable: true, pronto: false },
  { id: 'dp5', nome: 'Documento militar, quando aplicável', grupo: 'DOCUMENTOS PESSOAIS', req: 'Quando aplicável', momento: 'Manter atualizado', actionable: true, pronto: false },
  { id: 'dp6', nome: 'Foto 3×4', grupo: 'DOCUMENTOS PESSOAIS', req: 'Edital anterior', momento: 'Conferir padrão no edital', actionable: true, pronto: false },
  { id: 'esc1', nome: 'Diploma ou certificado de escolaridade', grupo: 'ESCOLARIDADE', req: 'Requisito do cargo', momento: 'Antes da posse', actionable: true, pronto: false },
  { id: 'esc2', nome: 'Histórico escolar', grupo: 'ESCOLARIDADE', req: 'Requisito do cargo', momento: 'Antes da posse', actionable: true, pronto: false },
  { id: 'is1', nome: 'Certidões da Justiça Federal', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Exigida no último concurso', momento: 'Aguardar convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'is2', nome: 'Certidões da Justiça Estadual / DF', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Exigida no último concurso', momento: 'Aguardar convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'is3', nome: 'Certidão da Justiça Militar', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Exigida no último concurso', momento: 'Aguardar convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'is4', nome: 'Certidão da Justiça Eleitoral', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Exigida no último concurso', momento: 'Aguardar convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'is5', nome: 'Certidão da Polícia Federal', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Exigida no último concurso', momento: 'Aguardar convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'is6', nome: 'Certidão da Polícia Civil', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Exigida no último concurso', momento: 'Aguardar convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'is7', nome: 'Certidões de protesto', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Exigida no último concurso', momento: 'Aguardar convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'is8', nome: 'Distribuição cível', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Exigida no último concurso', momento: 'Aguardar convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'is9', nome: 'Assentamento funcional, se aplicável', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Último concurso', momento: 'Aguardar convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'is10', nome: 'FIP — Ficha de Informações Pessoais', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Último concurso', momento: 'Aguardar convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'is11', nome: 'Declarações da investigação social', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Último concurso', momento: 'Conforme convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'am1', nome: 'Hemograma', grupo: 'EXAMES — ALERTA', req: 'Avaliação médica anterior', momento: 'Aguardar convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'am2', nome: 'Glicemia', grupo: 'EXAMES — ALERTA', req: 'Avaliação médica anterior', momento: 'Aguardar convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'am3', nome: 'Colesterol', grupo: 'EXAMES — ALERTA', req: 'Avaliação médica anterior', momento: 'Aguardar convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'am4', nome: 'Triglicerídeos', grupo: 'EXAMES — ALERTA', req: 'Avaliação médica anterior', momento: 'Aguardar convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'am5', nome: 'Ureia / creatinina', grupo: 'EXAMES — ALERTA', req: 'Avaliação médica anterior', momento: 'Aguardar convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'am6', nome: 'TGO / TGP', grupo: 'EXAMES — ALERTA', req: 'Avaliação médica anterior', momento: 'Aguardar convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'am7', nome: 'Urina', grupo: 'EXAMES — ALERTA', req: 'Avaliação médica anterior', momento: 'Aguardar convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'am8', nome: 'Toxicológico', grupo: 'EXAMES — ALERTA', req: 'Avaliação médica anterior', momento: 'Aguardar convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'am9', nome: 'ECG', grupo: 'EXAMES — ALERTA', req: 'Avaliação médica anterior', momento: 'Aguardar convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'am10', nome: 'Ecocardiograma', grupo: 'EXAMES — ALERTA', req: 'Avaliação médica anterior', momento: 'Aguardar convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'am11', nome: 'Raio-X', grupo: 'EXAMES — ALERTA', req: 'Avaliação médica anterior', momento: 'Aguardar convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'am12', nome: 'Espirometria', grupo: 'EXAMES — ALERTA', req: 'Avaliação médica anterior', momento: 'Aguardar convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'am13', nome: 'Exames oftalmológicos', grupo: 'EXAMES — ALERTA', req: 'Avaliação médica anterior', momento: 'Aguardar convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'am14', nome: 'Audiometria', grupo: 'EXAMES — ALERTA', req: 'Avaliação médica anterior', momento: 'Aguardar convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'am15', nome: 'Avaliação psiquiátrica', grupo: 'EXAMES — ALERTA', req: 'Avaliação médica anterior', momento: 'Aguardar convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
];

const cargosABIN = [
  { id: 'oi', nome: 'Oficial de Inteligência', nivel: 'Superior' },
  { id: 'oti', nome: 'Oficial Técnico de Inteligência', nivel: 'Superior' },
  { id: 'ai', nome: 'Agente de Inteligência', nivel: 'Médio' },
  { id: 'ati', nome: 'Agente Técnico de Inteligência', nivel: 'Médio' },
];

const etapasEstudoPRF = [
  { id: 'teoria', label: 'Teoria' },
  { id: 'resumo', label: 'Resumo' },
  { id: 'questoes', label: 'Questões' },
  { id: 'revisao-1', label: 'Revisão 1' },
  { id: 'revisao-2', label: 'Revisão 2' },
  { id: 'simulado', label: 'Simulado' },
];

const initialDisciplinasPRF = [
  { cod: 'CB01', nome: 'Língua Portuguesa', meta: 20, feitas: 0 },
  { cod: 'CB02', nome: 'Raciocínio Lógico', meta: 15, feitas: 0 },
  { cod: 'CB03', nome: 'Informática', meta: 15, feitas: 0 },
  { cod: 'CE01', nome: 'Direito Constitucional', meta: 10, feitas: 0 },
  { cod: 'CE02', nome: 'Direito Administrativo', meta: 15, feitas: 0 },
  { cod: 'CE03', nome: 'Administração Pública', meta: 15, feitas: 0 },
  { cod: 'CE04', nome: 'Legislação de Trânsito', meta: 10, feitas: 0 },
  { cod: 'CE05', nome: 'Legislação específica da PRF', meta: 10, feitas: 0 },
  { cod: 'CE06', nome: 'Ética no Serviço Público', meta: 5, feitas: 0 },
  { cod: 'CE07', nome: 'Atualidades / conhecimentos gerais', meta: 5, feitas: 0 },
].map(d => ({ ...d, etapas: etapasEstudoPRF.map(e => ({ ...e, concluida: false })) }));

// ─── DOCUMENTOS PRF ───────────────────────────────────────────────────────────
const initialDocumentosPRF = [
  { id: 'dp1', nome: 'RG / documento oficial', grupo: 'DOCUMENTOS PESSOAIS', req: 'Base pessoal', momento: 'Manter atualizado', actionable: true, pronto: false },
  { id: 'dp2', nome: 'CPF', grupo: 'DOCUMENTOS PESSOAIS', req: 'Base pessoal', momento: 'Manter atualizado', actionable: true, pronto: false },
  { id: 'dp3', nome: 'Título de eleitor', grupo: 'DOCUMENTOS PESSOAIS', req: 'Base pessoal', momento: 'Manter atualizado', actionable: true, pronto: false },
  { id: 'dp4', nome: 'Quitação eleitoral', grupo: 'DOCUMENTOS PESSOAIS', req: 'Base pessoal', momento: 'Manter atualizada', actionable: true, pronto: false },
  { id: 'dp5', nome: 'Documento militar, quando aplicável', grupo: 'DOCUMENTOS PESSOAIS', req: 'Quando aplicável', momento: 'Manter atualizado', actionable: true, pronto: false },
  { id: 'dp6', nome: 'Comprovante de residência', grupo: 'DOCUMENTOS PESSOAIS', req: 'Base pessoal', momento: 'Conferir validade no edital', actionable: true, pronto: false },
  { id: 'esc1', nome: 'Certificado de conclusão do ensino médio', grupo: 'ESCOLARIDADE', req: 'Ensino médio completo', momento: 'Requisito do cargo', actionable: true, pronto: false },
  { id: 'esc2', nome: 'Histórico escolar', grupo: 'ESCOLARIDADE', req: 'Escolaridade', momento: 'Manter disponível', actionable: true, pronto: false },
  { id: 'ed1', nome: 'Certidões exigidas no edital', grupo: 'EDITAL E CONVOCAÇÃO', req: 'Conforme edital', momento: 'Não emitir antecipadamente', actionable: false, pronto: false, statusFixo: 'AGUARDAR EDITAL / CONVOCAÇÃO' },
  { id: 'ed2', nome: 'Documentação para posse', grupo: 'EDITAL E CONVOCAÇÃO', req: 'Conforme convocação', momento: 'Após resultado e convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR CONVOCAÇÃO' },
  { id: 'ed3', nome: 'Documentação para cotas, se aplicável', grupo: 'DOCUMENTAÇÃO CONDICIONAL', req: 'Se aplicável', momento: 'Conferir requisitos no edital', actionable: false, pronto: false, statusFixo: 'AGUARDAR EDITAL' },
  { id: 'ed4', nome: 'Documentação de deficiência, se aplicável', grupo: 'DOCUMENTAÇÃO CONDICIONAL', req: 'Se aplicável', momento: 'Conferir requisitos no edital', actionable: false, pronto: false, statusFixo: 'AGUARDAR EDITAL' },
];

const cargosPRF = [
  { id: 'aa', nome: 'Agente Administrativo', nivel: 'Médio' },
];

// ─── DADOS ATA-MF ─────────────────────────────────────────────────────────────
const etapasEstudoATAMF = [
  { id: 'teoria', label: 'Teoria estudada' },
  { id: 'resumo', label: 'Resumo' },
  { id: 'questoes', label: 'Questões' },
  { id: 'revisao-1', label: 'Revisão 1' },
  { id: 'revisao-2', label: 'Revisão 2' },
  { id: 'simulado', label: 'Simulado' },
];

const initialDisciplinasATAMF = [
  { cod: 'CB01', nome: 'Língua Portuguesa', meta: 20, feitas: 0 },
  { cod: 'CB02', nome: 'Raciocínio Lógico', meta: 15, feitas: 0 },
  { cod: 'CE01', nome: 'Direito Constitucional', meta: 15, feitas: 0 },
  { cod: 'CE02', nome: 'Direito Administrativo', meta: 15, feitas: 0 },
  { cod: 'CE03', nome: 'Administração Pública', meta: 15, feitas: 0 },
  { cod: 'CB03', nome: 'Informática', meta: 15, feitas: 0 },
  { cod: 'CB04', nome: 'Atualidades', meta: 5, feitas: 0 },
  { cod: 'CE04', nome: 'Conhecimentos específicos', meta: 20, feitas: 0, nota: 'A confirmar conforme o próximo edital.' },
].map(d => ({ ...d, etapas: etapasEstudoATAMF.map(e => ({ ...e, concluida: false })) }));

const initialDocumentosATAMF = [
  { id: 'dp1', nome: 'RG / documento oficial', grupo: 'DOCUMENTOS PESSOAIS', req: 'Base pessoal', momento: 'Manter atualizado', actionable: true, pronto: false, statusATA: 'PREPARAR' },
  { id: 'dp2', nome: 'CPF', grupo: 'DOCUMENTOS PESSOAIS', req: 'Base pessoal', momento: 'Manter atualizado', actionable: true, pronto: false, statusATA: 'PREPARAR' },
  { id: 'dp3', nome: 'Título de eleitor', grupo: 'DOCUMENTOS PESSOAIS', req: 'Base pessoal', momento: 'Manter atualizado', actionable: true, pronto: false, statusATA: 'PREPARAR' },
  { id: 'dp4', nome: 'Quitação eleitoral', grupo: 'DOCUMENTOS PESSOAIS', req: 'Base pessoal', momento: 'Manter atualizada', actionable: true, pronto: false, statusATA: 'PREPARAR' },
  { id: 'dp5', nome: 'Documento militar, quando aplicável', grupo: 'DOCUMENTOS PESSOAIS', req: 'Quando aplicável', momento: 'Manter atualizado', actionable: true, pronto: false, statusATA: 'PREPARAR' },
  { id: 'dp6', nome: 'Comprovante de residência', grupo: 'DOCUMENTOS PESSOAIS', req: 'Base pessoal', momento: 'Conferir validade no edital', actionable: true, pronto: false, statusATA: 'PREPARAR' },
  { id: 'esc1', nome: 'Certificado de ensino médio', grupo: 'ESCOLARIDADE', req: 'Nível médio', momento: 'Requisito do cargo', actionable: true, pronto: false, statusATA: 'PREPARAR' },
  { id: 'esc2', nome: 'Histórico escolar', grupo: 'ESCOLARIDADE', req: 'Escolaridade', momento: 'Manter disponível', actionable: true, pronto: false, statusATA: 'PREPARAR' },
  { id: 'ed1', nome: 'Certidões exigidas para posse', grupo: 'EDITAL E POSSE', req: 'Conforme edital', momento: 'Não emitir antes do edital', actionable: false, pronto: false, statusATA: 'AGUARDAR EDITAL' },
  { id: 'ed2', nome: 'Documentação de cotas, se aplicável', grupo: 'DOCUMENTAÇÃO CONDICIONAL', req: 'Se aplicável', momento: 'Conferir regras no edital', actionable: false, pronto: false, statusATA: 'AGUARDAR EDITAL' },
  { id: 'ed3', nome: 'Documentação de deficiência, se aplicável', grupo: 'DOCUMENTAÇÃO CONDICIONAL', req: 'Se aplicável', momento: 'Conferir regras no edital', actionable: false, pronto: false, statusATA: 'AGUARDAR EDITAL' },
];

const cargosATAMF = [
  { id: 'ata', nome: 'Assistente Técnico-Administrativo (ATA)', nivel: 'Médio' },
];

// ─── DADOS CIVIL RJ ───────────────────────────────────────────────────────────
const initialDisciplinasCIVIL = [
  { cod: 'CB01', nome: 'Língua Portuguesa', meta: 25, feitas: 0 },
  { cod: 'CB02', nome: 'Raciocínio Lógico', meta: 20, feitas: 0 },
  { cod: 'CB03', nome: 'Noções de Informática', meta: 10, feitas: 0 },
  { cod: 'CE01', nome: 'Direito Penal', meta: 30, feitas: 0 },
  { cod: 'CE02', nome: 'Direito Processual Penal', meta: 25, feitas: 0 },
  { cod: 'CE03', nome: 'Direito Constitucional', meta: 20, feitas: 0 },
  { cod: 'CE04', nome: 'Direito Administrativo', meta: 20, feitas: 0 },
  { cod: 'CE05', nome: 'Criminologia e Medicina Legal', meta: 20, feitas: 0 },
];

const initialDocumentosCIVIL = [
  { id: 'dp1', nome: 'RG e CPF', grupo: 'DOCUMENTOS PESSOAIS', req: 'Legal', momento: 'Permanente', actionable: true, pronto: false },
  { id: 'dp2', nome: 'Título de Eleitor + Quitação Eleitoral', grupo: 'DOCUMENTOS PESSOAIS', req: 'Legal', momento: 'Permanente', actionable: true, pronto: false },
  { id: 'dp3', nome: 'Documento Militar (se masc.)', grupo: 'DOCUMENTOS PESSOAIS', req: 'Legal', momento: 'Permanente', actionable: true, pronto: false },
  { id: 'esc1', nome: 'Diploma de Nível Superior (Direito)', grupo: 'ESCOLARIDADE', req: 'Legal', momento: 'Antes da Posse', actionable: true, pronto: false },
  { id: 'esc2', nome: 'Histórico Escolar', grupo: 'ESCOLARIDADE', req: 'Legal', momento: 'Antes da Posse', actionable: true, pronto: false },
  { id: 'esc3', nome: 'OAB ou habilitação (se exigida)', grupo: 'ESCOLARIDADE', req: 'A Confirmar', momento: 'Conforme Edital', actionable: false, pronto: false, statusFixo: 'A CONFIRMAR' },
  { id: 'is1', nome: 'Antecedentes Criminais (Federal)', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'A Confirmar', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'is2', nome: 'Antecedentes Criminais (Estadual)', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'A Confirmar', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'is3', nome: 'Antecedentes Criminais (Polícia Civil)', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'A Confirmar', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'am1', nome: 'Avaliação Médica (Aptidão Física e Mental)', grupo: 'AVALIAÇÃO MÉDICA', req: 'A Confirmar', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'am2', nome: 'Exame Toxicológico', grupo: 'AVALIAÇÃO MÉDICA', req: 'A Confirmar', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
];

const cargosCIVIL = [
  { id: 'del', nome: 'Delegado de Polícia', nivel: 'Superior (Direito)' },
  { id: 'inv', nome: 'Investigador de Polícia', nivel: 'Médio' },
  { id: 'esc', nome: 'Escrivão de Polícia', nivel: 'Médio/Superior' },
  { id: 'per', nome: 'Perito Criminal', nivel: 'Superior (Área Específica)' },
  { id: 'ins', nome: 'Inspetor de Polícia', nivel: 'Médio' },
];

const initialDisciplinasESFCEX = [
  { cod: 'CG01', nome: 'Língua Portuguesa', meta: 20, feitas: 0 },
  { cod: 'CG02', nome: 'História do Brasil', meta: 15, feitas: 0 },
  { cod: 'CG03', nome: 'Geografia do Brasil', meta: 15, feitas: 0 },
  { cod: 'CE01', nome: 'Direito Administrativo', meta: 25, feitas: 0 },
  { cod: 'CE02', nome: 'Direito Constitucional', meta: 25, feitas: 0 },
  { cod: 'CE03', nome: 'Direito Civil', meta: 20, feitas: 0 },
  { cod: 'CE04', nome: 'Direito Processual Civil', meta: 20, feitas: 0 },
];

const initialDocumentosESFCEX = [
  { id: 'dp1', nome: 'RG e CPF', grupo: 'DOCUMENTOS PESSOAIS', req: 'Legal', momento: 'Permanente', actionable: true, pronto: false },
  { id: 'dp2', nome: 'Título de Eleitor + Quitação Eleitoral', grupo: 'DOCUMENTOS PESSOAIS', req: 'Legal', momento: 'Permanente', actionable: true, pronto: false },
  { id: 'dp3', nome: 'Certidão de Nascimento ou Casamento', grupo: 'DOCUMENTOS PESSOAIS', req: 'Legal', momento: 'Permanente', actionable: true, pronto: false },
  { id: 'dp4', nome: 'Documento Militar (Reservista)', grupo: 'DOCUMENTOS PESSOAIS', req: 'Legal', momento: 'Permanente', actionable: true, pronto: false },
  { id: 'esc1', nome: 'Diploma de Nível Superior', grupo: 'ESCOLARIDADE', req: 'Legal', momento: 'Antes da Matrícula', actionable: true, pronto: false },
  { id: 'esc2', nome: 'Histórico Escolar', grupo: 'ESCOLARIDADE', req: 'Legal', momento: 'Antes da Matrícula', actionable: true, pronto: false },
  { id: 'esc3', nome: 'Registro Profissional (OAB, CRM etc.)', grupo: 'ESCOLARIDADE', req: 'Edital', momento: 'Conforme área', actionable: false, pronto: false, statusFixo: 'SE EXIGIDO' },
  { id: 'is1', nome: 'Certidão de Antecedentes Criminais (Federal)', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Edital', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'is2', nome: 'Certidão de Antecedentes Criminais (Estadual)', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Edital', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'is3', nome: 'Certidão da Justiça Militar da União', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Edital', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'is4', nome: 'Certidão Negativa do SERASA / SPC', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Edital', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'am1', nome: 'Inspeção de Saúde (Padrão Exército)', grupo: 'INSPEÇÃO DE SAÚDE', req: 'Edital', momento: 'Após Classificação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'am2', nome: 'Exames Laboratoriais Completos', grupo: 'INSPEÇÃO DE SAÚDE', req: 'Edital', momento: 'Após Classificação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'am3', nome: 'Avaliação Psicológica', grupo: 'INSPEÇÃO DE SAÚDE', req: 'Edital', momento: 'Após Classificação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'cf1', nome: '3 Fotos 3×4 (fundo branco)', grupo: 'CURSO DE FORMAÇÃO (CFO)', req: 'Edital', momento: 'Matrícula', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'cf2', nome: 'Atestado Médico de Aptidão Física', grupo: 'CURSO DE FORMAÇÃO (CFO)', req: 'Edital', momento: 'Matrícula', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
];

const cargosESFCEX = [
  { id: 'qc_dir', nome: 'CFO/QC — Direito', nivel: 'Superior (Direito / OAB)' },
  { id: 'qc_adm', nome: 'CFO/QC — Administração', nivel: 'Superior (Administração)' },
  { id: 'qc_inf', nome: 'CFO/QC — Informática', nivel: 'Superior (TI)' },
  { id: 'qc_psi', nome: 'CFO/QC — Psicologia', nivel: 'Superior (Psicologia)' },
  { id: 'qc_mag', nome: 'CFO/QC — Magistério', nivel: 'Superior (Licenciatura)' },
];

// ─── CONCURSOS CONFIG ─────────────────────────────────────────────────────────
const concursosConfig = {
  abin: {
    logo: '/ABIN.png',
    titulo: 'ABIN',
    nome: 'Agência Brasileira de Inteligência',
    status: 'AGUARDANDO AUTORIZAÇÃO',
    badgeVariant: 'badge-amber',
    focoAtual: 'Agente Técnico de Inteligência (Médio)',
    cargoPadrao: 'ati',
    disciplinas: initialDisciplinasABIN,
    documentos: initialDocumentosABIN,
    cargos: cargosABIN,
    hasTAF: true,
  },
  prf: {
    logo: '/PRF.png',
    titulo: 'PRF — ADM',
    nome: 'Polícia Rodoviária Federal (Administrativo)',
    status: 'AUTORIZAÇÃO SOLICITADA',
    badgeVariant: 'badge-amber',
    focoAtual: 'Agente Administrativo (Médio)',
    disciplinas: initialDisciplinasPRF,
    documentos: initialDocumentosPRF,
    cargos: cargosPRF,
    hasTAF: false,
  },
  atamf: {
    logo: '/ATAMF.png',
    titulo: 'ATA-MF',
    nome: 'Assistente Técnico-Administrativo — Ministério da Fazenda',
    status: 'AGUARDANDO EDITAL',
    badgeVariant: 'badge-amber',
    focoAtual: 'Assistente Técnico-Administrativo (ATA) — nível médio',
    cargoPadrao: 'ata',
    disciplinas: initialDisciplinasATAMF,
    documentos: initialDocumentosATAMF,
    cargos: cargosATAMF,
    hasTAF: false,
  },
  civil: {
    logo: '/CIVIL_RJ.png',
    titulo: 'CIVIL — RJ',
    nome: 'Polícia Civil do Estado do Rio de Janeiro',
    status: 'AGUARDANDO EDITAL',
    badgeVariant: 'badge-amber',
    focoAtual: 'A definir conforme edital',
    disciplinas: initialDisciplinasCIVIL,
    documentos: initialDocumentosCIVIL,
    cargos: cargosCIVIL,
    hasTAF: true,
  },
  esfcex: {
    logo: '/ESFCEX.png',
    titulo: 'EsFCEx',
    nome: 'Escola de Saúde e Formação Complementar do Exército',
    status: 'EDITAL PUBLICADO',
    badgeVariant: 'badge-green',
    focoAtual: 'CFO/QC — Direito (Tenente)',
    disciplinas: initialDisciplinasESFCEX,
    documentos: initialDocumentosESFCEX,
    cargos: cargosESFCEX,
    hasTAF: true,
    tafInfo: {
      prova: '12 de julho de 2026',
      banca: 'Fundação VUNESP',
      vagas: 'Diversas áreas do QC',
      etapas: 'EI → Inspeção de Saúde → EAF → Avaliação Psicológica → CFO',
    },
  },
};

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="app-container">
      {!selected
        ? <HubInicial onSelect={setSelected} />
        : <PainelConcurso id={selected} onBack={() => setSelected(null)} />
      }
    </div>
  );
}

// ─── HUB INICIAL ─────────────────────────────────────────────────────────────
function HubInicial({ onSelect }) {
  return (
    <div className="hub-wrapper">
      <header className="hub-topbar">
        <span className="hub-title">Central Tática de Concursos</span>
      </header>

      <div className="hub-content">
        <h2 className="hub-heading">Bases Operacionais</h2>
        <p className="hub-subheading">Selecione um concurso para entrar no monitoramento específico.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {Object.entries(concursosConfig).map(([id, c]) => {
            const storageScope = `painel-concursos:${id}${['prf', 'atamf'].includes(id) ? ':v2' : ''}`;
            const disciplinas = readSavedState(`${storageScope}:disciplinas`, c.disciplinas);
            const metaTotal = disciplinas.reduce((a, d) => a + d.meta, 0);
            const feitasTotal = disciplinas.reduce((a, d) => a + d.feitas, 0);
            const pct = metaTotal > 0 ? Math.round((feitasTotal / metaTotal) * 100) : 0;
            return (
              <div key={id} className="hub-card" onClick={() => onSelect(id)}>
                <div className="hub-card-header">
                  <div className="hub-card-identity">
                    <img src={c.logo} alt={c.titulo} className="hub-card-logo" />
                    <div>
                      <div className="hub-card-name">{c.titulo}</div>
                      <div className="hub-card-sub">{c.nome}</div>
                    </div>
                  </div>
                  <span className={`badge ${c.badgeVariant}`}>{c.status.split(' ')[0]}</span>
                </div>

                <hr className="hub-card-divider" />

                <div className="hub-card-row">
                  <span className="hub-card-label">Cargo alvo</span>
                  <span className="hub-card-value">{c.focoAtual}</span>
                </div>
                <div className="hub-card-row">
                  <span className="hub-card-label">Meta de estudos</span>
                  <span className="hub-card-value">{metaTotal}h</span>
                </div>
                <div className="hub-card-row">
                  <span className="hub-card-label">Situação</span>
                  <span className="hub-card-value" style={{ color: 'var(--status-warning)' }}>{c.status}</span>
                </div>

                <div className="hub-card-progress">
                  <div className="hub-card-progress-label">
                    <span>Progresso de Estudos</span>
                    <span>{feitasTotal}h / {metaTotal}h — {pct}%</span>
                  </div>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${pct}%`, background: 'var(--brand-blue)' }} />
                  </div>
                </div>

                <button className="hub-access-btn" onClick={e => { e.stopPropagation(); onSelect(id); }}>
                  Acessar Painel Tático →
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── PAINEL DO CONCURSO ───────────────────────────────────────────────────────
function readSavedState(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function PainelConcurso({ id, onBack }) {
  const cfg = concursosConfig[id];
  const storageScope = `painel-concursos:${id}${['prf', 'atamf'].includes(id) ? ':v2' : ''}`;
  const hasStudyChecklist = ['abin', 'prf', 'atamf'].includes(id);
  const [activeTab, setActiveTab] = useState('visao');
  const contentRef = useRef(null);
  const [cargoSel, setCargoSel] = useState(() => cfg.cargos.find(c => c.id === cfg.cargoPadrao) || cfg.cargos[0]);
  const [disciplinas, setDisciplinas] = useState(() => readSavedState(`${storageScope}:disciplinas`, cfg.disciplinas.map(d => ({ ...d }))));
  const [docs, setDocs] = useState(() => readSavedState(`${storageScope}:documentos`, cfg.documentos.map(d => ({ ...d }))));

  useEffect(() => {
    try {
      localStorage.setItem(`${storageScope}:disciplinas`, JSON.stringify(disciplinas));
      localStorage.setItem(`${storageScope}:documentos`, JSON.stringify(docs));
    } catch {
      return;
    }
  }, [storageScope, disciplinas, docs]);

  const toggleDoc = docId => setDocs(ds => ds.map(d => d.id === docId && d.actionable ? { ...d, pronto: !d.pronto } : d));

  const updateDocStatus = (docId, statusATA) => setDocs(ds => ds.map(d => (
    d.id === docId ? { ...d, statusATA, pronto: statusATA === 'ENTREGUE' } : d
  )));

  const updateHoras = (i, amt) => setDisciplinas(ds => {
    const next = [...ds];
    next[i] = { ...next[i], feitas: Math.max(0, Math.min(next[i].meta, next[i].feitas + amt)) };
    return next;
  });

  const updateMeta = (cod, value) => setDisciplinas(ds => ds.map(d => {
    if (d.cod !== cod) return d;
    const meta = Math.max(0, Number(value) || 0);
    return { ...d, meta, feitas: Math.min(d.feitas, meta) };
  }));

  const toggleEtapa = (cod, etapaId) => setDisciplinas(ds => ds.map(d => (
    d.cod === cod
      ? { ...d, etapas: d.etapas.map(e => e.id === etapaId ? { ...e, concluida: !e.concluida } : e) }
      : d
  )));

  const totalMeta = disciplinas.reduce((a, d) => a + d.meta, 0);
  const totalFeitas = disciplinas.reduce((a, d) => a + d.feitas, 0);
  const pctHoras = totalMeta > 0 ? Math.round((totalFeitas / totalMeta) * 100) : 0;
  const etapasTotal = disciplinas.reduce((total, d) => total + (d.etapas?.length || 0), 0);
  const etapasConcluidas = disciplinas.reduce((total, d) => total + (d.etapas?.filter(e => e.concluida).length || 0), 0);
  const materiasConcluidas = disciplinas.filter(d => d.etapas?.length && d.etapas.every(e => e.concluida)).length;
  const pctEtapas = etapasTotal > 0 ? Math.round((etapasConcluidas / etapasTotal) * 100) : 0;

  const actionableDocs = docs.filter(d => d.actionable);
  const docsOk = actionableDocs.filter(d => id === 'atamf' ? d.statusATA === 'ENTREGUE' : d.pronto).length;
  const docsTotal = actionableDocs.length;

  const gruposDocs = [...new Set(docs.map(d => d.grupo))];

  const tabLabel = { visao: 'VISÃO GERAL', trilha: 'TRILHA DE ESTUDOS', documentacao: 'DOCUMENTAÇÃO', taf: 'CONTROLE FÍSICO' };
  const selectTab = tab => {
    setActiveTab(tab);
    contentRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  };

  return (
    <>
      <aside className="sidebar">
        <div className="brand" style={{ cursor: 'pointer' }} onClick={onBack}>
          <img src={cfg.logo} alt={cfg.titulo} className="brand-logo" />
          <div className="brand-text">
            <h1>{cfg.titulo}</h1>
            <p>← Voltar ao Hub</p>
          </div>
        </div>

        <div className="sidebar-navigation">
          <div className="nav-section-label">Navegação</div>
          <div className="sidebar-tabs">
            {['visao', 'trilha', 'documentacao', ...(cfg.hasTAF ? ['taf'] : [])].map(t => (
              <div key={t} className={`nav-item ${activeTab === t ? 'active' : ''}`} onClick={() => selectTab(t)}>
                {tabLabel[t]}
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <span className="page-title">{tabLabel[activeTab]}</span>
          <span className={`badge ${cfg.badgeVariant}`}>{cfg.status}</span>
        </header>

        <div className="content-area" ref={contentRef}>

          {/* ── VISÃO GERAL ── */}
          {activeTab === 'visao' && (
            <>
              <div className="grid-4" style={{ marginBottom: 16 }}>
                <div className="metric-card">
                  <span className="metric-label">Carga Horária</span>
                  <span className="metric-value" style={{ color: pctHoras === 100 ? 'var(--status-success)' : 'var(--brand-blue)' }}>
                    {totalFeitas}h / {totalMeta}h
                  </span>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${pctHoras}%`, background: 'var(--brand-blue)' }} />
                  </div>
                </div>
                <div className="metric-card">
                  <span className="metric-label">{id === 'atamf' ? 'Docs entregues' : hasStudyChecklist ? 'Docs preparados' : 'Docs Imediatos'}</span>
                  <span className="metric-value" style={{ color: docsOk === docsTotal ? 'var(--status-success)' : 'var(--status-warning)' }}>
                    {docsOk} / {docsTotal}
                  </span>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: docsTotal > 0 ? `${Math.round(docsOk / docsTotal * 100)}%` : '0%', background: 'var(--status-success)' }} />
                  </div>
                </div>
                <div className="metric-card">
                  <span className="metric-label">{hasStudyChecklist ? 'Etapas do plano' : 'Simulados'}</span>
                  <span className="metric-value" style={{ color: 'var(--text-secondary)' }}>
                    {hasStudyChecklist ? `${etapasConcluidas} / ${etapasTotal}` : '0 realizados'}
                  </span>
                  {hasStudyChecklist && <>
                    <div className="progress-container">
                      <div className="progress-bar" style={{ width: `${pctEtapas}%`, background: 'var(--brand-blue)' }} />
                    </div>
                    <span className="metric-detail">{materiasConcluidas} de {disciplinas.length} matérias concluídas</span>
                  </>}
                </div>
                <div className="metric-card">
                  <span className="metric-label">Próximo Marco</span>
                  <span className="metric-value" style={{ fontSize: '0.875rem', color: 'var(--status-danger)' }}>{cfg.status}</span>
                </div>
              </div>

              <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>{cfg.nome}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 3 }}>Monitoramento Tático Individualizado</div>
                </div>
                <select className="select-control" value={cargoSel.id} onChange={e => setCargoSel(cfg.cargos.find(c => c.id === e.target.value))}>
                  {cfg.cargos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>

              <div className="panel">
                <div className="panel-header"><h3 className="panel-title">Situação do Cargo</h3></div>
                <div className="grid-2">
                  <div>
                    <div className="info-row">
                      <span className="info-label">Cargo Alvo</span>
                      <span className="info-value" style={{ color: '#4da3e8' }}>{cargoSel.nome}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Nível Exigido</span>
                      <span className="info-value">{cargoSel.nivel}</span>
                    </div>
                  </div>
                  <div>
                    <div className="info-row">
                      <span className="info-label">Carga Horária de Trabalho</span>
                      <span className="info-value">40h semanais</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Situação do Edital</span>
                      <span className="info-value" style={{ color: 'var(--status-warning)' }}>{cfg.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── TRILHA DE ESTUDOS ── */}
          {activeTab === 'trilha' && hasStudyChecklist && (
            <section className="study-plan">
              <div className="study-plan-header">
                <div>
                  <h3 className="panel-title">{id === 'atamf' ? 'Plano de estudos — ATA-MF' : id === 'prf' ? 'Plano de estudos — PRF Administrativo' : 'Plano de estudos por matéria'}</h3>
                  <p className="study-plan-summary">{materiasConcluidas} de {disciplinas.length} matérias concluídas · {etapasConcluidas} de {etapasTotal} etapas</p>
                </div>
                <span className="badge badge-blue">META PLANEJADA: {totalMeta}H</span>
              </div>
              <div className="study-notice">
                {id === 'prf'
                  ? <><strong>Base de preparação:</strong> matérias e metas são editáveis e servem como planejamento inicial de 120h; não representam o conteúdo oficial de um novo edital. A PRF informa ensino médio completo para o cargo de Agente Administrativo. Confirme os requisitos e o programa no edital vigente.</>
                  : id === 'atamf'
                    ? <><strong>Referência histórica:</strong> o último concurso para ATA-MF foi realizado em 2009. A lista é uma base de organização, não o conteúdo oficial de um próximo edital. Consulte o edital histórico no repositório da ENAP e confirme futuras regras em publicação oficial.</>
                    : <><strong>Referência de planejamento:</strong> conteúdo-base do edital de 2018. As 115h são uma meta inicial do sistema, não uma carga horária oficial da ABIN. Conhecimentos específicos variam conforme cargo e área.</>}
              </div>
              <div className="study-subject-list">
                {disciplinas.map((d, i) => {
                  const concluidas = d.etapas.filter(e => e.concluida).length;
                  const materiaConcluida = concluidas === d.etapas.length;
                  const pct = d.etapas.length ? Math.round((concluidas / d.etapas.length) * 100) : 0;
                  return (
                    <article className="study-subject" key={d.cod}>
                      <div className="study-subject-header">
                        <div className="study-subject-title">
                          <span className="study-subject-code">{d.cod}</span>
                          <div>
                            <h4>{d.nome}</h4>
                            {d.nota && <p>{d.nota}</p>}
                          </div>
                        </div>
                        <span className={`badge ${materiaConcluida ? 'badge-green' : concluidas ? 'badge-amber' : 'badge-neutral'}`}>
                          {materiaConcluida ? 'CONCLUÍDA' : concluidas ? 'EM ANDAMENTO' : 'PENDENTE'}
                        </span>
                      </div>
                      <div className="study-subject-progress">
                        <span>{concluidas} de {d.etapas.length} etapas</span>
                        {id === 'prf' || id === 'atamf'
                          ? <div className="study-meta-entry">
                              <label htmlFor={`meta-${d.cod}`}>Meta</label>
                              <input
                                id={`meta-${d.cod}`}
                                className="study-meta-input"
                                aria-label={`Meta de ${d.nome} em horas`}
                                type="number"
                                min="0"
                                step="1"
                                value={d.meta}
                                onChange={e => updateMeta(d.cod, e.target.value)}
                              />
                              <span>h · registradas {d.feitas}h</span>
                            </div>
                          : <span>meta {d.meta}h · registradas {d.feitas}h</span>}
                      </div>
                      <div className="progress-container">
                        <div className="progress-bar" style={{ width: `${pct}%`, background: materiaConcluida ? 'var(--status-success)' : 'var(--brand-blue)' }} />
                      </div>
                      <div className="study-checklist">
                        {d.etapas.map(etapa => (
                          <label className="study-task" key={etapa.id}>
                            <input
                              type="checkbox"
                              className="task-checkbox"
                              checked={etapa.concluida}
                              onChange={() => toggleEtapa(d.cod, etapa.id)}
                            />
                            <span>{etapa.label}</span>
                          </label>
                        ))}
                      </div>
                      <div className="study-hours">
                        <span>Horas estudadas</span>
                        <div>
                          <button className="ctrl-btn ctrl-btn-minus" onClick={() => updateHoras(i, -1)} disabled={d.feitas === 0}>−1h</button>
                          <button className="ctrl-btn ctrl-btn-plus" onClick={() => updateHoras(i, 1)} disabled={d.feitas === d.meta}>+1h</button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {activeTab === 'trilha' && !hasStudyChecklist && (
            <div className="panel">
              <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="panel-title">Acompanhamento por Disciplina</h3>
                <span className="badge badge-blue">META TOTAL: {totalMeta}h</span>
              </div>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>CÓD.</th>
                      <th>DISCIPLINA</th>
                      <th style={{ width: '38%' }}>PROGRESSO</th>
                      <th style={{ textAlign: 'center' }}>REGISTRAR</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disciplinas.map((d, i) => {
                      const pct = d.meta > 0 ? (d.feitas / d.meta) * 100 : 0;
                      return (
                        <tr key={i}>
                          <td style={{ fontWeight: 700, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{d.cod}</td>
                          <td style={{ color: '#f1f5f9' }}>{d.nome}</td>
                          <td>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 5 }}>
                              <span>{d.feitas}h executadas</span>
                              <span>meta {d.meta}h</span>
                            </div>
                            <div className="progress-container">
                              <div className="progress-bar" style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--status-success)' : 'var(--brand-blue)' }} />
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <button className="ctrl-btn ctrl-btn-minus" onClick={() => updateHoras(i, -1)}>−1h</button>
                            <button className="ctrl-btn ctrl-btn-plus" onClick={() => updateHoras(i, 1)}>+1h</button>
                          </td>
                          <td>
                            {pct >= 100
                              ? <span className="badge badge-green">CONCLUÍDO</span>
                              : pct > 0
                              ? <span className="badge badge-amber">ANDAMENTO</span>
                              : <span className="badge badge-red">PENDENTE</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── DOCUMENTAÇÃO ── */}
          {activeTab === 'documentacao' && (
            <div className="panel">
              <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="panel-title">
                  {id === 'abin' ? 'Documentos e alertas — ABIN' : id === 'prf' ? 'Documentos — PRF Administrativo' : id === 'atamf' ? 'Documentação — ATA-MF' : `Matriz Documental — ${cfg.titulo}`}
                </h3>
                <span className="badge badge-blue">{id === 'atamf' ? 'ENTREGUES' : hasStudyChecklist ? 'PREPARADOS' : 'IMEDIATOS'}: {docsOk}/{docsTotal}</span>
              </div>

              {hasStudyChecklist && (
                <div className="notice-stack">
                  {id === 'abin' ? <>
                    <div className="study-notice">
                      <strong>Investigação social:</strong> as certidões desta lista foram exigidas no último concurso. Não solicite certidões com validade limitada antes da convocação; confirme a relação e o prazo no próximo edital.
                    </div>
                    <div className="study-notice study-notice-warning">
                      <strong>Avaliação médica:</strong> exames listados como alerta com base na seleção anterior. Status padrão: aguardar convocação e confirmar exames, prazos e locais na publicação vigente.
                    </div>
                  </> : id === 'prf' ? <>
                    <div className="study-notice">
                      <strong>Certidões:</strong> não emita nem solicite certidões antecipadamente. A lista e a validade dependem do edital e da convocação.
                    </div>
                    <div className="study-notice study-notice-warning">
                      <strong>Posse e documentação condicional:</strong> providencie somente quando houver orientação oficial; cotas e documentação de deficiência dependem da situação do candidato e das regras do edital.
                    </div>
                  </> : <>
                    <div className="study-notice">
                      <strong>Referência histórica:</strong> o último concurso para ATA-MF ocorreu em 2009. Prepare documentos pessoais e escolares, mas confirme requisitos e validade no próximo edital.
                    </div>
                    <div className="study-notice study-notice-warning">
                      <strong>Certidões e documentos condicionais:</strong> aguarde o edital ou a convocação antes de solicitar certidões e providenciar documentação de posse, cotas ou deficiência.
                    </div>
                  </>}
                </div>
              )}

              {gruposDocs.map(grupo => (
                <div key={grupo} style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4da3e8', borderBottom: '1px solid var(--border-default)', paddingBottom: 8, marginBottom: 12 }}>
                    {grupo}
                  </div>
                  <div className="table-scroll">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: 40 }}></th>
                          <th>DOCUMENTO</th>
                          <th style={{ width: 130 }}>ORIGEM</th>
                          <th style={{ width: 150 }}>QUANDO PROVIDENCIAR</th>
                          <th style={{ width: 120 }}>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {docs.filter(d => d.grupo === grupo).map(d => (
                          <tr key={d.id}>
                            <td style={{ textAlign: 'center' }}>
                              {id === 'atamf'
                                ? <span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>—</span>
                                : d.actionable
                                ? <input type="checkbox" className="task-checkbox" checked={d.pronto} onChange={() => toggleDoc(d.id)} />
                                : <span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>—</span>}
                            </td>
                            <td style={{ color: d.actionable ? '#f1f5f9' : 'var(--text-secondary)' }}>{d.nome}</td>
                            <td>
                              <span className={d.req === 'Legal' ? 'badge badge-green' : 'badge badge-neutral'} style={{ fontSize: '0.65rem' }}>
                                {d.req}
                              </span>
                            </td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{d.momento}</td>
                            <td>
                              {id === 'atamf'
                                ? <select
                                    className="select-control doc-status-control"
                                    aria-label={`Status de ${d.nome}`}
                                    value={d.statusATA}
                                    onChange={e => updateDocStatus(d.id, e.target.value)}
                                  >
                                    <option value="PREPARAR">PREPARAR</option>
                                    <option value="AGUARDAR EDITAL">AGUARDAR EDITAL</option>
                                    <option value="ENTREGUE">ENTREGUE</option>
                                  </select>
                                : d.actionable
                                ? d.pronto
                                  ? <span className="badge badge-green">PREPARADO</span>
                                  : <span className="badge badge-red">PENDENTE</span>
                                : <span className="badge badge-neutral">{d.statusFixo}</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── TAF / EAF ── */}
          {activeTab === 'taf' && cfg.hasTAF && (
            <div className="panel">
              <div className="panel-header"><h3 className="panel-title">{id === 'esfcex' ? 'Exame de Aptidão Física (EAF) — EsFCEx' : 'Controle Físico — TAF'}</h3></div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                {id === 'esfcex'
                  ? 'O EAF é etapa eliminatória do concurso. Inclui corrida de 12 minutos e flexão de braços. O condicionamento deve ser iniciado imediatamente.'
                  : 'O TAF é etapa eliminatória. O condicionamento físico deve ser iniciado concomitantemente ao estudo teórico.'}
              </p>

              {id === 'esfcex' && cfg.tafInfo && (
                <div className="panel" style={{ marginBottom: 20, background: 'var(--bg-surface-elevated)' }}>
                  <div className="grid-2">
                    <div>
                      <div className="info-row">
                        <span className="info-label">Data da Prova (EI)</span>
                        <span className="info-value" style={{ color: '#4da3e8' }}>{cfg.tafInfo.prova}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Banca Organizadora</span>
                        <span className="info-value">{cfg.tafInfo.banca}</span>
                      </div>
                    </div>
                    <div>
                      <div className="info-row">
                        <span className="info-label">Vagas</span>
                        <span className="info-value">{cfg.tafInfo.vagas}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Etapas do Concurso</span>
                        <span className="info-value" style={{ fontSize: '0.78rem' }}>{cfg.tafInfo.etapas}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid-2">
                <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, padding: 20 }}>
                  <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 12 }}>Corrida — 12 minutos</div>
                  <div className="info-row">
                    <span className="info-label">Meta Masculina</span>
                    <span className="info-value">{id === 'esfcex' ? '2.800m' : '2.400m'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Meta Feminina</span>
                    <span className="info-value">{id === 'esfcex' ? '2.200m' : '2.000m'}</span>
                  </div>
                </div>
                <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, padding: 20 }}>
                  <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 12 }}>{id === 'esfcex' ? 'Flexão de Braços' : 'Natação — 50m'}</div>
                  {id === 'esfcex' ? (
                    <>
                      <div className="info-row">
                        <span className="info-label">Masculino (mín.)</span>
                        <span className="info-value">21 repetições</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Feminino (mín.)</span>
                        <span className="info-value">12 repetições</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="info-row">
                        <span className="info-label">Modalidade</span>
                        <span className="info-value">Nado livre</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Exigência</span>
                        <span className="info-value">Concluir o percurso</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
