import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  buildLearningSummary,
  getContestStorageScope,
  getStudyDateKey,
  HEARTBEAT_INTERVAL_MS,
  HEARTBEAT_STALE_MS,
  loadTimerSession,
  readStudyLog,
  recordStudyInterval,
  recoverTimerCheckpoint,
} from './studyData.js';
import { writeAppLocalValue } from './localData.js';
import { createUsernameAccount, generateRecoveryCode, leaveUsernameAccount, recoverUsernameAccount, validateUsername } from './accountAccess.js';
import { auth, authReady } from './firebaseClient.js';
import { subscribeAccountSync } from './firebaseSync.js';
import { publishRankingEntry, subscribeGlobalRanking } from './rankingSync.js';
import './index.css';

const INITIAL_NOW = Date.now();

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
const etapasEstudoCIVIL = [
  { id: 'teoria', label: 'Teoria' },
  { id: 'resumo', label: 'Resumo' },
  { id: 'questoes', label: 'Questões' },
  { id: 'revisao-1', label: 'Revisão 1' },
  { id: 'revisao-2', label: 'Revisão 2' },
  { id: 'simulado', label: 'Simulado' },
];

const initialDisciplinasCIVIL = [
  { cod: 'CB01', nome: 'Língua Portuguesa', meta: 20, feitas: 0 },
  { cod: 'CE01', nome: 'Direito Constitucional', meta: 15, feitas: 0 },
  { cod: 'CE02', nome: 'Direito Administrativo', meta: 15, feitas: 0 },
  { cod: 'CE03', nome: 'Direito Penal', meta: 25, feitas: 0 },
  { cod: 'CE04', nome: 'Processo Penal', meta: 20, feitas: 0 },
  { cod: 'CE05', nome: 'Legislação Penal Especial', meta: 15, feitas: 0 },
  { cod: 'CE06', nome: 'Direitos Humanos', meta: 10, feitas: 0 },
  { cod: 'CB02', nome: 'Informática', meta: 10, feitas: 0 },
  { cod: 'CB03', nome: 'Raciocínio Lógico', meta: 10, feitas: 0 },
  { cod: 'CE07', nome: 'Legislação específica da Polícia Civil', meta: 15, feitas: 0 },
].map(d => ({ ...d, etapas: etapasEstudoCIVIL.map(e => ({ ...e, concluida: false })) }));

const initialDocumentosCIVIL = [
  { id: 'dp1', nome: 'RG / documento oficial', grupo: 'DOCUMENTOS PESSOAIS', req: 'Base pessoal', momento: 'Manter atualizado', actionable: true, pronto: false, statusCivil: 'PREPARAR' },
  { id: 'dp2', nome: 'CPF', grupo: 'DOCUMENTOS PESSOAIS', req: 'Base pessoal', momento: 'Manter atualizado', actionable: true, pronto: false, statusCivil: 'PREPARAR' },
  { id: 'dp3', nome: 'Título de eleitor', grupo: 'DOCUMENTOS PESSOAIS', req: 'Base pessoal', momento: 'Manter atualizado', actionable: true, pronto: false, statusCivil: 'PREPARAR' },
  { id: 'dp4', nome: 'Quitação eleitoral', grupo: 'DOCUMENTOS PESSOAIS', req: 'Base pessoal', momento: 'Manter atualizada', actionable: true, pronto: false, statusCivil: 'PREPARAR' },
  { id: 'dp5', nome: 'Documento militar, quando aplicável', grupo: 'DOCUMENTOS PESSOAIS', req: 'Quando aplicável', momento: 'Manter atualizado', actionable: true, pronto: false, statusCivil: 'PREPARAR' },
  { id: 'dp6', nome: 'Comprovante de residência', grupo: 'DOCUMENTOS PESSOAIS', req: 'Conforme edital', momento: 'Conferir validade', actionable: true, pronto: false, statusCivil: 'PREPARAR' },
  { id: 'esc1', nome: 'Diploma / certificado de escolaridade', grupo: 'ESCOLARIDADE E HABILITAÇÃO', req: 'Conforme cargo', momento: 'Requisito do cargo', actionable: true, pronto: false, statusCivil: 'PREPARAR' },
  { id: 'esc2', nome: 'Histórico escolar', grupo: 'ESCOLARIDADE E HABILITAÇÃO', req: 'Conforme cargo', momento: 'Manter disponível', actionable: true, pronto: false, statusCivil: 'PREPARAR' },
  { id: 'esc3', nome: 'CNH, quando exigida pelo cargo', grupo: 'ESCOLARIDADE E HABILITAÇÃO', req: 'Conforme cargo', momento: 'Confirmar categoria no edital', actionable: true, pronto: false, statusCivil: 'AGUARDAR EDITAL' },
  { id: 'is1', nome: 'Certidões criminais', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Conforme edital', momento: 'Não emitir antes da convocação', actionable: true, pronto: false, statusCivil: 'AGUARDAR EDITAL' },
  { id: 'is2', nome: 'Certidões da Justiça Federal', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Conforme edital', momento: 'Não emitir antes da convocação', actionable: true, pronto: false, statusCivil: 'AGUARDAR EDITAL' },
  { id: 'is3', nome: 'Certidões da Justiça Estadual', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Conforme edital', momento: 'Não emitir antes da convocação', actionable: true, pronto: false, statusCivil: 'AGUARDAR EDITAL' },
  { id: 'is4', nome: 'Certidão da Justiça Eleitoral', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Conforme edital', momento: 'Não emitir antes da convocação', actionable: true, pronto: false, statusCivil: 'AGUARDAR EDITAL' },
  { id: 'is5', nome: 'Certidão da Justiça Militar, quando aplicável', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Conforme edital', momento: 'Não emitir antes da convocação', actionable: true, pronto: false, statusCivil: 'AGUARDAR EDITAL' },
  { id: 'is6', nome: 'Certidão da Polícia Federal', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Conforme edital', momento: 'Não emitir antes da convocação', actionable: true, pronto: false, statusCivil: 'AGUARDAR EDITAL' },
  { id: 'is7', nome: 'Certidão da Polícia Civil', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Conforme edital', momento: 'Não emitir antes da convocação', actionable: true, pronto: false, statusCivil: 'AGUARDAR EDITAL' },
  { id: 'is8', nome: 'Certidões de protesto, se exigidas', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Conforme edital', momento: 'Aguardar instruções', actionable: true, pronto: false, statusCivil: 'AGUARDAR EDITAL' },
  { id: 'is9', nome: 'Documentação da investigação social', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Conforme edital', momento: 'Aguardar convocação', actionable: true, pronto: false, statusCivil: 'AGUARDAR EDITAL' },
  { id: 'am1', nome: 'Documentação médica', grupo: 'ETAPAS E POSSE', req: 'Conforme edital', momento: 'Aguardar convocação', actionable: true, pronto: false, statusCivil: 'AGUARDAR EDITAL' },
  { id: 'am2', nome: 'Documentação para TAF', grupo: 'ETAPAS E POSSE', req: 'Se previsto', momento: 'Aguardar convocação', actionable: true, pronto: false, statusCivil: 'AGUARDAR EDITAL' },
  { id: 'ap1', nome: 'Documentação para avaliação psicológica', grupo: 'ETAPAS E POSSE', req: 'Conforme edital', momento: 'Aguardar convocação', actionable: true, pronto: false, statusCivil: 'AGUARDAR EDITAL' },
  { id: 'ps1', nome: 'Documentação para posse', grupo: 'ETAPAS E POSSE', req: 'Conforme convocação', momento: 'Após resultado e convocação', actionable: true, pronto: false, statusCivil: 'AGUARDAR EDITAL' },
  { id: 'pc1', nome: 'Documentação de cotas, se aplicável', grupo: 'DOCUMENTAÇÃO CONDICIONAL', req: 'Se aplicável', momento: 'Confirmar regras no edital', actionable: true, pronto: false, statusCivil: 'AGUARDAR EDITAL' },
  { id: 'pc2', nome: 'Documentação PcD, se aplicável', grupo: 'DOCUMENTAÇÃO CONDICIONAL', req: 'Se aplicável', momento: 'Confirmar regras no edital', actionable: true, pronto: false, statusCivil: 'AGUARDAR EDITAL' },
];

const cargosCIVIL = [
  { id: 'a-definir', nome: 'A definir conforme o cargo', nivel: 'Conferir requisito no edital estadual' },
  { id: 'del', nome: 'Delegado de Polícia', nivel: 'Superior (Direito)' },
  { id: 'inv', nome: 'Investigador de Polícia', nivel: 'Médio' },
  { id: 'esc', nome: 'Escrivão de Polícia', nivel: 'Médio/Superior' },
  { id: 'per', nome: 'Perito Criminal', nivel: 'Superior (Área Específica)' },
  { id: 'ins', nome: 'Inspetor de Polícia', nivel: 'Médio' },
];

const etapasConcursoCIVIL = [
  { id: 'prova-objetiva', label: 'Prova objetiva' },
  { id: 'prova-discursiva', label: 'Prova discursiva, se prevista' },
  { id: 'taf', label: 'TAF, se previsto' },
  { id: 'exame-medico', label: 'Exame médico' },
  { id: 'avaliacao-psicologica', label: 'Avaliação psicológica' },
  { id: 'investigacao-social', label: 'Investigação social' },
  { id: 'curso-formacao', label: 'Curso de formação' },
  { id: 'titulos', label: 'Avaliação de títulos, se prevista' },
  { id: 'posse', label: 'Posse' },
].map(etapa => ({ ...etapa, concluida: false }));

const etapasEstudoESFCEX = [
  { id: 'teoria', label: 'Teoria' },
  { id: 'resumo', label: 'Resumo' },
  { id: 'questoes', label: 'Questões' },
  { id: 'revisao-1', label: 'Revisão 1' },
  { id: 'revisao-2', label: 'Revisão 2' },
  { id: 'simulado', label: 'Simulado' },
];

const initialDisciplinasESFCEX = [
  { cod: 'CG01', nome: 'Língua Portuguesa', meta: 0, feitas: 0 },
  { cod: 'CG02', nome: 'História do Brasil', meta: 0, feitas: 0 },
  { cod: 'CG03', nome: 'Geografia do Brasil', meta: 0, feitas: 0 },
  { cod: 'CG04', nome: 'Língua Inglesa', meta: 0, feitas: 0 },
  { cod: 'ESP-DIR', cargoId: 'qc_dir', nome: 'Conhecimentos específicos — Direito', meta: 0, feitas: 0 },
  { cod: 'ESP-ADM', cargoId: 'qc_adm', nome: 'Conhecimentos específicos — Administração', meta: 0, feitas: 0 },
  { cod: 'ESP-INF', cargoId: 'qc_inf', nome: 'Conhecimentos específicos — Informática', meta: 0, feitas: 0 },
  { cod: 'ESP-PSI', cargoId: 'qc_psi', nome: 'Conhecimentos específicos — Psicologia', meta: 0, feitas: 0 },
  { cod: 'ESP-MAG', cargoId: 'qc_mag', nome: 'Conhecimentos específicos — Magistério', meta: 0, feitas: 0 },
  { cod: 'ESP-CAP', cargoId: 'qc_capelao', nome: 'Conhecimentos específicos — Capelania', meta: 0, feitas: 0 },
].map(d => ({ ...d, etapas: etapasEstudoESFCEX.map(e => ({ ...e, concluida: false })) }));

const initialDocumentosESFCEX = [
  { id: 'dp1', nome: 'Documento de identidade', grupo: 'DOCUMENTOS PESSOAIS', req: 'Base pessoal', momento: 'Manter atualizado', actionable: true, pronto: false, statusEsfcex: 'PREPARAR' },
  { id: 'dp2', nome: 'CPF', grupo: 'DOCUMENTOS PESSOAIS', req: 'Base pessoal', momento: 'Manter atualizado', actionable: true, pronto: false, statusEsfcex: 'PREPARAR' },
  { id: 'dp3', nome: 'Certidão de nascimento ou casamento', grupo: 'DOCUMENTOS PESSOAIS', req: 'Base pessoal', momento: 'Manter disponível', actionable: true, pronto: false, statusEsfcex: 'PREPARAR' },
  { id: 'dp4', nome: 'Título de eleitor', grupo: 'DOCUMENTOS PESSOAIS', req: 'Base pessoal', momento: 'Manter atualizado', actionable: true, pronto: false, statusEsfcex: 'PREPARAR' },
  { id: 'dp5', nome: 'Quitação eleitoral', grupo: 'DOCUMENTOS PESSOAIS', req: 'Base pessoal', momento: 'Manter atualizada', actionable: true, pronto: false, statusEsfcex: 'PREPARAR' },
  { id: 'dp6', nome: 'Documento de situação militar, quando aplicável', grupo: 'DOCUMENTOS PESSOAIS', req: 'Quando aplicável', momento: 'Manter atualizado', actionable: true, pronto: false, statusEsfcex: 'PREPARAR' },
  { id: 'esc1', nome: 'Diploma de nível superior', grupo: 'FORMAÇÃO E REGISTRO', req: 'Formação específica', momento: 'Requisito da área', actionable: true, pronto: false, statusEsfcex: 'PREPARAR' },
  { id: 'esc2', nome: 'Histórico escolar', grupo: 'FORMAÇÃO E REGISTRO', req: 'Formação específica', momento: 'Manter disponível', actionable: true, pronto: false, statusEsfcex: 'PREPARAR' },
  { id: 'esc3', nome: 'Registro no conselho profissional, quando exigido', grupo: 'FORMAÇÃO E REGISTRO', req: 'Conforme área', momento: 'Confirmar exigência no edital', actionable: true, pronto: false, statusEsfcex: 'AGUARDAR EDITAL' },
  { id: 'is1', nome: 'Certidões exigidas na Investigação Social', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Conforme edital', momento: 'Aguardar convocação', actionable: true, pronto: false, statusEsfcex: 'AGUARDAR EDITAL' },
  { id: 'am1', nome: 'Documentação médica', grupo: 'INSPEÇÃO DE SAÚDE', req: 'Conforme edital', momento: 'Aguardar convocação', actionable: true, pronto: false, statusEsfcex: 'AGUARDAR EDITAL' },
  { id: 'am2', nome: 'Exames complementares', grupo: 'INSPEÇÃO DE SAÚDE', req: 'Conforme edital', momento: 'Aguardar convocação', actionable: true, pronto: false, statusEsfcex: 'AGUARDAR EDITAL' },
  { id: 'ap1', nome: 'Documentação para avaliação psicológica', grupo: 'ETAPAS E MATRÍCULA', req: 'Conforme edital', momento: 'Aguardar convocação', actionable: true, pronto: false, statusEsfcex: 'AGUARDAR EDITAL' },
  { id: 'cf1', nome: 'Documentação para matrícula', grupo: 'ETAPAS E MATRÍCULA', req: 'Conforme edital', momento: 'Aguardar convocação', actionable: true, pronto: false, statusEsfcex: 'AGUARDAR EDITAL' },
  { id: 'pc1', nome: 'Documentação de cotas, se aplicável', grupo: 'DOCUMENTAÇÃO CONDICIONAL', req: 'Se aplicável', momento: 'Confirmar regras no edital', actionable: true, pronto: false, statusEsfcex: 'AGUARDAR EDITAL' },
  { id: 'pc2', nome: 'Documentação PcD, se aplicável', grupo: 'DOCUMENTAÇÃO CONDICIONAL', req: 'Se aplicável', momento: 'Confirmar regras no edital', actionable: true, pronto: false, statusEsfcex: 'AGUARDAR EDITAL' },
];

const etapasConcursoESFCEX = [
  { id: 'ei', label: 'Exame Intelectual (EI)' },
  { id: 'inspecao-saude', label: 'Inspeção de Saúde' },
  { id: 'eaf', label: 'Exame de Aptidão Física (EAF)' },
  { id: 'avaliacao-psicologica', label: 'Avaliação Psicológica' },
  { id: 'investigacao-social', label: 'Investigação Social' },
  { id: 'heteroidentificacao', label: 'Heteroidentificação / verificação documental, se aplicável' },
  { id: 'matricula', label: 'Matrícula em 2027' },
  { id: 'curso-formacao', label: 'Curso de Formação' },
].map(etapa => ({ ...etapa, concluida: false }));

const cargosESFCEX = [
  { id: 'qc_dir', nome: 'CFO/QC — Direito', nivel: 'Superior (Direito / OAB)', limiteEtario: 'Até 32 anos — confirmar no edital' },
  { id: 'qc_adm', nome: 'CFO/QC — Administração', nivel: 'Superior (Administração)', limiteEtario: 'Até 32 anos — confirmar no edital' },
  { id: 'qc_inf', nome: 'CFO/QC — Informática', nivel: 'Superior (TI)', limiteEtario: 'Até 32 anos — confirmar no edital' },
  { id: 'qc_psi', nome: 'CFO/QC — Psicologia', nivel: 'Superior (Psicologia)', limiteEtario: 'Até 32 anos — confirmar no edital' },
  { id: 'qc_mag', nome: 'CFO/QC — Magistério', nivel: 'Superior (Licenciatura)', limiteEtario: 'Até 32 anos — confirmar no edital' },
  { id: 'qc_capelao', nome: 'Capelão Militar', nivel: 'Formação religiosa exigida em edital', limiteEtario: 'De 30 a 40 anos — confirmar no edital' },
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
    focoAtual: 'PC-RJ — cargo a definir conforme edital',
    cargoPadrao: 'a-definir',
    disciplinas: initialDisciplinasCIVIL,
    documentos: initialDocumentosCIVIL,
    cargos: cargosCIVIL,
    hasTAF: true,
  },
  esfcex: {
    logo: '/ESFCEX.png',
    titulo: 'EsFCEx',
    nome: 'EsFCEx — concurso 2026, matrícula prevista em 2027',
    status: 'EDITAL PUBLICADO',
    badgeVariant: 'badge-green',
    focoAtual: 'CFO/QC — área a definir',
    cargoPadrao: 'qc_dir',
    disciplinas: initialDisciplinasESFCEX,
    documentos: initialDocumentosESFCEX,
    cargos: cargosESFCEX,
    hasTAF: true,
    tafInfo: {
      prova: 'Concurso 2026 — matrícula prevista em 2027',
      banca: 'Fundação VUNESP',
      vagas: 'Diversas áreas do QC',
      etapas: 'EI → Inspeção de Saúde → EAF → Avaliação Psicológica → Investigação Social → Matrícula 2027 → CFO',
    },
  },
};

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
function AccessScreen({ onRecoveryPending }) {
  const [username, setUsername] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recovering, setRecovering] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async event => {
    event.preventDefault();
    const normalizedUsername = username.trim().toLowerCase();
    if (!validateUsername(normalizedUsername)) {
      setMessage('Use de 3 a 24 caracteres: letras, números, ponto, hífen ou sublinhado.');
      return;
    }
    if (recovering && recoveryCode.replace(/[^a-z0-9]/gi, '').length < 24) {
      setMessage('Confira o código de recuperação completo.');
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      await authReady;
      if (recovering) {
        await recoverUsernameAccount(normalizedUsername, recoveryCode);
        return;
      }

      const generatedCode = generateRecoveryCode();
      onRecoveryPending({ username: normalizedUsername, code: generatedCode });
      await createUsernameAccount(normalizedUsername, generatedCode);
    } catch (error) {
      onRecoveryPending(null);
      if (error.code === 'auth/email-already-in-use') {
        setMessage('Esse username já tem um perfil. Use a opção de código de recuperação.');
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setMessage('Username ou código não conferem.');
      } else if (error.code === 'auth/operation-not-allowed') {
        setMessage('Ative o provedor Email/Senha no Firebase Authentication para habilitar a recuperação segura.');
      } else {
        setMessage('Não foi possível conectar ao Firebase. Verifique a conexão e tente novamente.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="secure-access-screen">
      <div className="secure-access-grid" />
      <section className="secure-access-panel">
        <div className="secure-access-mark" aria-hidden="true"><span>CT</span></div>
        <span className="secure-access-classification">AMBIENTE PESSOAL · SINCRONIZAÇÃO ATIVA</span>
        <h1>Central Tática</h1>
        <p className="secure-access-subtitle">Acesse seu acompanhamento de estudos</p>

        <form className="secure-access-form" onSubmit={submit}>
          <label htmlFor="account-username">Username</label>
          <input
            id="account-username"
            autoComplete="username"
            maxLength={24}
            value={username}
            onChange={event => setUsername(event.target.value)}
            placeholder="seu-username"
            required
          />
          {recovering && <>
            <label htmlFor="account-recovery-code">Código de recuperação</label>
            <input
              id="account-recovery-code"
              autoComplete="one-time-code"
              value={recoveryCode}
              onChange={event => setRecoveryCode(event.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX..."
              required
            />
          </>}
          {message && <p className="secure-access-message" role="alert">{message}</p>}
          <button className="secure-access-submit" type="submit" disabled={busy}>
            {busy ? 'Conectando...' : recovering ? 'Recuperar e entrar' : 'Entrar'}
            <span aria-hidden="true">↗</span>
          </button>
        </form>

        <button className="secure-access-switch" onClick={() => { setRecovering(value => !value); setMessage(''); }}>
          {recovering ? 'Primeiro acesso? Criar username' : 'Já tenho um código de recuperação'}
        </button>
        <p className="secure-access-footnote">Seus dados ficam vinculados ao seu perfil e sincronizados entre dispositivos.</p>
      </section>
    </main>
  );
}

function RecoveryCodeScreen({ recovery, ready, onContinue }) {
  const [copied, setCopied] = useState(false);
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(recovery.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="secure-access-screen">
      <div className="secure-access-grid" />
      <section className="secure-access-panel recovery-panel">
        <div className="secure-access-mark" aria-hidden="true"><span>CT</span></div>
        <span className="secure-access-classification">CÓDIGO PESSOAL DE RECUPERAÇÃO</span>
        <h1>Guarde este código</h1>
        <p className="secure-access-subtitle">Ele é necessário para recuperar <strong>{recovery.username}</strong> em outro dispositivo.</p>
        <output className="recovery-code">{recovery.code}</output>
        <button className="secure-access-submit" onClick={copyCode}>{copied ? 'Código copiado' : 'Copiar código'}</button>
        <p className="secure-access-message">Este código não pode ser consultado novamente. Sem ele, não será possível recuperar o perfil em outro aparelho.</p>
        <button className="secure-access-confirm" onClick={onContinue} disabled={!ready}>Já guardei, entrar</button>
        {!ready && <span className="secure-access-wait">Preparando perfil seguro...</span>}
      </section>
    </main>
  );
}

export default function App() {
  const [selected, setSelected] = useState(null);
  const [startStudyOnOpen, setStartStudyOnOpen] = useState(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [recoveryPending, setRecoveryPending] = useState(null);
  const [username, setUsername] = useState('');
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudStatus, setCloudStatus] = useState('connecting');

  useEffect(() => {
    let unsubscribe = () => {};
    let disposed = false;
    authReady.then(() => {
      if (disposed) return;
      unsubscribe = onAuthStateChanged(auth, user => {
        setSessionUser(user);
        setAuthResolved(true);
        setCloudReady(false);
      });
    }).catch(() => setAuthResolved(true));
    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!sessionUser) return undefined;
    const unsubscribe = subscribeAccountSync(
      sessionUser,
      recoveryPending?.username || username,
      status => {
        setCloudStatus(status);
        if (['synced', 'offline', 'error'].includes(status)) setCloudReady(true);
      },
      setUsername,
    );
    return unsubscribe;
  }, [sessionUser, username, recoveryPending?.username]);

  // ─── Publish to global ranking on login + after every study save ──────────
  useEffect(() => {
    if (!sessionUser || !username || !cloudReady) return;

    let debounceTimer = null;

    const publish = () => {
      const summary = buildLearningSummary(window.localStorage, concursosConfig, Date.now());
      // Only chronometer-recorded hours count — prevents cheating
      publishRankingEntry(
        sessionUser.uid,
        username,
        summary.recordedHours,
        summary.currentStreak,
        summary.studyDays,
      ).catch(() => {});
    };

    // Publish immediately on login / sync ready
    publish();

    // Also re-publish (debounced) whenever local study data changes
    const handleLocalChange = () => {
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(publish, 2000);
    };

    window.addEventListener('panel-local-data-changed', handleLocalChange);
    return () => {
      window.clearTimeout(debounceTimer);
      window.removeEventListener('panel-local-data-changed', handleLocalChange);
    };
  }, [sessionUser, username, cloudReady]);

  const startStudy = id => {
    const now = Date.now();
    const contest = concursosConfig[id];
    const timer = loadTimerSession(window.localStorage, {
      contestId: id,
      subjectCode: contest.disciplinas[0]?.cod || '',
      initialDisciplines: contest.disciplinas,
      now,
    });
    if (!timer.startedAt) {
      const scope = getContestStorageScope(id);
      writeAppLocalValue(window.localStorage, `${scope}:timer`, JSON.stringify({
        ...timer,
        cod: timer.cod || contest.disciplinas[0]?.cod || '',
        startedAt: now,
        lastHeartbeatAt: now,
        focusId: timer.focusId || `${id}-${now}-${Math.random().toString(36).slice(2)}`,
      }));
    }
    setStartStudyOnOpen(now);
    setSelected(id);
  };

  const returnToHub = () => {
    setSelected(null);
    setStartStudyOnOpen(false);
  };

  if (!authResolved) return <div className="secure-access-loading">Estabelecendo conexão segura...</div>;
  if (recoveryPending) {
    return <RecoveryCodeScreen recovery={recoveryPending} ready={Boolean(sessionUser && cloudReady)} onContinue={() => setRecoveryPending(null)} />;
  }
  if (!sessionUser) return <AccessScreen onRecoveryPending={setRecoveryPending} />;
  if (!cloudReady) return <div className="secure-access-loading">Sincronizando seus dados de estudo...</div>;

  const signOut = async () => {
    await leaveUsernameAccount();
    setSessionUser(null);
    setUsername('');
    setSelected(null);
  };

  return (
    <div className="app-container">
      {!selected
        ? <HubInicial onSelect={setSelected} onStartStudy={startStudy} username={username} cloudStatus={cloudStatus} onSignOut={signOut} sessionUser={sessionUser} />
        : <PainelConcurso id={selected} onBack={returnToHub} autoStartStudy={startStudyOnOpen} />
      }
    </div>
  );
}

const learningChartColors = ['#43c59e', '#4da3e8', '#e5ad48', '#df7474', '#a4a2ed'];

function LearningRadarChart({ contests, onOpenContest }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const size = 240;
  const center = size / 2;
  const radius = 72;
  const maxHours = Math.max(...contests.map(contest => contest.hours), 0);
  const pointsFor = level => contests.map((contest, index) => {
    const angle = (Math.PI * 2 * index) / contests.length - Math.PI / 2;
    const value = maxHours ? (contest.hours / maxHours) * level : 0;
    return { x: center + Math.cos(angle) * radius * value / 100, y: center + Math.sin(angle) * radius * value / 100 };
  });
  const polygon = points => points.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  const values = pointsFor(100);

  return (
    <section className="panel learning-chart-panel">
      <header className="learning-panel-heading">
        <div>
          <h2 className="panel-title">Radar por concurso</h2>
          <p>Comparação relativa ao concurso com mais horas.</p>
        </div>
      </header>
      <div className="learning-radar-layout">
        <svg className="learning-radar-svg" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Radar comparando horas estudadas por concurso">
          {[25, 50, 75, 100].map(level => (
            <polygon key={level} points={polygon(pointsFor(level))} className="learning-radar-grid" />
          ))}
          {contests.map((contest, index) => {
            const angle = (Math.PI * 2 * index) / contests.length - Math.PI / 2;
            const endX = center + Math.cos(angle) * radius;
            const endY = center + Math.sin(angle) * radius;
            return <line key={contest.id} x1={center} y1={center} x2={endX} y2={endY} className="learning-radar-axis" />;
          })}
          {maxHours > 0 && <polygon points={polygon(values)} className="learning-radar-area" />}
          {contests.map((contest, index) => {
            const point = values[index];
            return (
              <circle
                key={contest.id}
                cx={point.x}
                cy={point.y}
                r={hoveredIndex === index ? 6 : 4}
                className="learning-radar-point"
                style={{ '--chart-color': learningChartColors[index % learningChartColors.length] }}
                tabIndex="0"
                role="button"
                aria-label={`${contest.title}: ${formatStudyHours(contest.hours)}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
                onClick={() => onOpenContest(contest.id)}
              />
            );
          })}
        </svg>
        <div className="learning-radar-legend">
          {contests.map((contest, index) => {
            const relative = maxHours ? Math.round(contest.hours / maxHours * 100) : 0;
            return (
              <button className={hoveredIndex === index ? 'active' : ''} key={contest.id} onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)} onClick={() => onOpenContest(contest.id)}>
                <i style={{ '--chart-color': learningChartColors[index % learningChartColors.length] }} />
                <span>{contest.title}</span>
                <strong>{formatStudyHours(contest.hours)}</strong>
                <small>{relative}%</small>
              </button>
            );
          })}
        </div>
      </div>
      {!maxHours && <p className="learning-chart-empty">As comparações aparecem após registrar estudos.</p>}
    </section>
  );
}

function LearningDonutChart({ contests, totalHours, onOpenContest }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const segments = contests.reduce((result, contest, index) => {
    const share = totalHours ? contest.hours / totalHours : 0;
    const length = share * circumference;
    const previousOffset = result.length ? result[result.length - 1].offset + result[result.length - 1].length : 0;
    if (length > 0) result.push({ ...contest, index, share, length, offset: previousOffset });
    return result;
  }, []);
  const selected = hoveredIndex === null ? null : segments.find(segment => segment.index === hoveredIndex);

  return (
    <section className="panel learning-chart-panel">
      <header className="learning-panel-heading">
        <div>
          <h2 className="panel-title">Rosca de distribuição</h2>
          <p>Participação de cada concurso na carga acumulada.</p>
        </div>
      </header>
      <div className="learning-donut-layout">
        <div className="learning-donut-wrap">
          <svg className="learning-donut-svg" viewBox="0 0 180 180" role="img" aria-label="Distribuição das horas acumuladas entre concursos">
            <circle cx="90" cy="90" r={radius} className="learning-donut-track" />
            {segments.map(segment => (
              <circle
                key={segment.id}
                cx="90"
                cy="90"
                r={radius}
                className={`learning-donut-segment${hoveredIndex === segment.index ? ' active' : ''}`}
                style={{
                  '--chart-color': learningChartColors[segment.index % learningChartColors.length],
                  strokeDasharray: `${segment.length} ${circumference - segment.length}`,
                  strokeDashoffset: -segment.offset,
                }}
                tabIndex="0"
                role="button"
                aria-label={`${segment.title}: ${Math.round(segment.share * 100)}%`}
                onMouseEnter={() => setHoveredIndex(segment.index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(segment.index)}
                onBlur={() => setHoveredIndex(null)}
                onClick={() => onOpenContest(segment.id)}
              />
            ))}
          </svg>
          <div className="learning-donut-center" aria-live="polite">
            <strong>{selected ? `${Math.round(selected.share * 100)}%` : formatStudyHours(totalHours)}</strong>
            <span>{selected ? selected.title : 'TOTAL'}</span>
          </div>
        </div>
        <div className="learning-donut-legend">
          {contests.map((contest, index) => {
            const share = totalHours ? contest.hours / totalHours * 100 : 0;
            return (
              <button className={hoveredIndex === index ? 'active' : ''} key={contest.id} onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)} onClick={() => onOpenContest(contest.id)}>
                <i style={{ '--chart-color': learningChartColors[index % learningChartColors.length] }} />
                <span>{contest.title}</span>
                <strong>{Math.round(share)}%</strong>
              </button>
            );
          })}
        </div>
      </div>
      {!totalHours && <p className="learning-chart-empty">A distribuição será calculada conforme as sessões forem salvas.</p>}
    </section>
  );
}

function CerebroAprendizagem({ summary, onOpenContest }) {
  const maxWeekHours = Math.max(...summary.week.map(day => day.hours), 0.25);
  const subjects = summary.contests.flatMap(contest => contest.subjects.map(subject => ({
    ...subject,
    contestId: contest.id,
    contestTitle: contest.title,
  }))).sort((a, b) => b.hours - a.hours).slice(0, 8);

  return (
    <section className="learning-dashboard">
      <header className="learning-dashboard-header">
        <div>
          <span className="learning-eyebrow">DADOS DOS SEUS CRONÔMETROS</span>
          <h1>Cérebro de aprendizagem</h1>
          <p>Um retrato geral do seu ritmo, constância e distribuição de estudo.</p>
        </div>
        <span className="learning-live-status"><i /> DADOS LOCAIS ATUALIZADOS</span>
      </header>

      {summary.legacyHours > 0 && (
        <div className="learning-data-note">
          <strong>Histórico preservado:</strong> {formatStudyHours(summary.legacyHours)} de estudos anteriores foram mantidas no total, mas não possuem datas detalhadas. Os gráficos mostram apenas sessões registradas pelo cronômetro.
        </div>
      )}

      <div className="grid-4 learning-metrics">
        <article className="metric-card">
          <span className="metric-label">Carga acumulada</span>
          <strong className="metric-value learning-metric-blue">{formatStudyHours(summary.totalHours)}</strong>
          <span className="metric-detail">Histórico preservado + cronômetro</span>
        </article>
        <article className="metric-card">
          <span className="metric-label">Cronometradas</span>
          <strong className="metric-value learning-metric-green">{formatStudyHours(summary.recordedHours)}</strong>
          <span className="metric-detail">Sessões com data e matéria</span>
        </article>
        <article className="metric-card">
          <span className="metric-label">Dias estudados</span>
          <strong className="metric-value">{summary.studyDays}</strong>
          <span className="metric-detail">{summary.studyDaysThisWeek} nos últimos 7 dias</span>
        </article>
        <article className="metric-card">
          <span className="metric-label">Sequência atual</span>
          <strong className="metric-value learning-metric-amber">{summary.currentStreak}</strong>
          <span className="metric-detail">Dias consecutivos com registro</span>
        </article>
      </div>

      <div className="learning-charts-grid">
        <section className="panel learning-chart-panel learning-week-panel">
          <header className="learning-panel-heading">
            <div>
              <h2 className="panel-title">Ritmo semanal</h2>
              <p>Horas registradas em cada dia, nos últimos sete dias.</p>
            </div>
            <span className="learning-chart-total">{formatStudyHours(summary.week.reduce((total, day) => total + day.hours, 0))}</span>
          </header>
          <div className="learning-week-chart" role="img" aria-label="Horas cronometradas por dia nos últimos sete dias">
            {summary.week.map(day => {
              const height = day.hours ? Math.max(8, Math.round(day.hours / maxWeekHours * 100)) : 0;
              return (
                <div className="learning-week-column" key={day.dateKey} title={`${day.day} · ${formatStudyHours(day.hours)}`}>
                  <span className="learning-week-value">{day.hours ? formatStudyHours(day.hours) : '—'}</span>
                  <div className="learning-week-track">
                    <div className={`learning-week-bar${day.hours ? ' has-hours' : ''}`} style={{ height: `${height}%` }} />
                  </div>
                  <span className="learning-week-label">{day.label}</span>
                  <span className="learning-week-date">{day.day}</span>
                </div>
              );
            })}
          </div>
        </section>

        <LearningRadarChart contests={summary.contests} onOpenContest={onOpenContest} />
        <LearningDonutChart contests={summary.contests} totalHours={summary.totalHours} onOpenContest={onOpenContest} />
      </div>

      <div className="learning-dashboard-grid">
        <section className="panel learning-contests-panel">
          <header className="learning-panel-heading">
            <div>
              <h2 className="panel-title">Por concurso</h2>
              <p>Carga acumulada por painel.</p>
            </div>
          </header>
          <div className="learning-contest-list">
            {summary.contests.map(contest => {
              const width = summary.totalHours ? Math.min(100, contest.hours / summary.totalHours * 100) : 0;
              return (
                <button className="learning-contest-row" key={contest.id} onClick={() => onOpenContest(contest.id)}>
                  <span className="learning-contest-name">{contest.title}</span>
                  <span className="learning-contest-hours">{formatStudyHours(contest.hours)}</span>
                  <span className="learning-contest-track"><i style={{ width: `${width}%` }} /></span>
                  <span className="learning-contest-detail">{contest.days} {contest.days === 1 ? 'dia' : 'dias'} · {contest.focusCount} {contest.focusCount === 1 ? 'sessão' : 'sessões'}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel learning-subject-panel">
          <header className="learning-panel-heading">
            <div>
              <h2 className="panel-title">Matérias com mais tempo</h2>
              <p>Somente horas associadas a uma matéria.</p>
            </div>
          </header>
          {subjects.length ? (
            <div className="learning-subject-list">
              {subjects.map(subject => (
                <button className="learning-subject-row" key={`${subject.contestId}-${subject.code}`} onClick={() => onOpenContest(subject.contestId)}>
                  <span className="learning-subject-code">{subject.code}</span>
                  <span className="learning-subject-name"><strong>{subject.name}</strong><small>{subject.contestTitle}</small></span>
                  <span className="learning-subject-hours">{formatStudyHours(subject.hours)}</span>
                </button>
              ))}
            </div>
          ) : <p className="learning-empty-state">As matérias aparecerão aqui conforme você registrar sessões no cronômetro.</p>}
        </section>

        <section className="panel learning-activity-panel">
          <header className="learning-panel-heading">
            <div>
              <h2 className="panel-title">Sessões recentes</h2>
              <p>{summary.focusCount} sessões registradas no total.</p>
            </div>
          </header>
          {summary.recentSessions.length ? (
            <div className="learning-activity-list">
              {summary.recentSessions.map(session => (
                <button className="learning-activity-row" key={session.id} onClick={() => onOpenContest(session.contestId)}>
                  <span className="learning-activity-date">{new Date(session.startedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                  <span className="learning-activity-main"><strong>{session.contestTitle}</strong><small>{session.subjectCode || 'Matéria não identificada'}</small></span>
                  <span className="learning-activity-time">{formatStudyHours(session.durationMs / 3600000)}</span>
                </button>
              ))}
            </div>
          ) : <p className="learning-empty-state">Nenhuma sessão foi registrada pelo cronômetro ainda.</p>}
        </section>
      </div>
    </section>
  );
}

// ─── GLOBAL RANKING ───────────────────────────────────────────────────────────
function formatStudyHoursShort(hours) {
  const totalMinutes = Math.floor(hours * 60);
  const fullHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  if (fullHours === 0) return `${remainingMinutes}min`;
  return remainingMinutes ? `${fullHours}h ${remainingMinutes}min` : `${fullHours}h`;
}

function GlobalPodium({ entries, currentUserId }) {
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div className="ranking-podium">
      {[1, 0, 2].map(i => {
        const entry = entries[i];
        if (!entry) return null;
        const isMe = entry.uid === currentUserId;
        return (
          <div key={entry.uid} className={`ranking-podium-slot ranking-podium-${i === 0 ? 'first' : i === 1 ? 'second' : 'third'}${isMe ? ' ranking-podium-me' : ''}`}>
            <div className="ranking-podium-avatar">{entry.username.slice(0, 2).toUpperCase()}</div>
            <span className="ranking-podium-medal">{medals[i]}</span>
            <span className="ranking-podium-name">{entry.username}{isMe ? ' (você)' : ''}</span>
            <span className="ranking-podium-hours">{formatStudyHoursShort(entry.totalHours)}</span>
            <div className={`ranking-podium-base ranking-podium-base-pos-${i}`} />
          </div>
        );
      })}
    </div>
  );
}

function Top3RankingSummary({ currentUserId, onOpenRanking }) {
  const [entries, setEntries] = useState([]);
  useEffect(() => {
    return subscribeGlobalRanking(setEntries);
  }, []);
  const top3 = entries.slice(0, 3);
  if (top3.length === 0) return null;
  
  const medals = ['🥇', '🥈', '🥉'];
  
  return (
    <section className="hub-study-overview" style={{ paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '2rem', background: 'transparent' }}>
      <div className="hub-study-intro" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏆</span> Top 3 Global
          </h2>
        </div>
        <button className="hub-signout" onClick={onOpenRanking} style={{ margin: 0, fontSize: '0.8rem', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          Ver ranking completo
        </button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        {top3.map((entry, index) => {
          const isMe = entry.uid === currentUserId;
          return (
            <div key={entry.uid} style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', 
              background: isMe ? 'rgba(245, 197, 24, 0.1)' : 'rgba(255,255,255,0.03)', 
              border: `1px solid ${isMe ? 'rgba(245, 197, 24, 0.3)' : 'rgba(255,255,255,0.05)'}`,
              padding: '12px 16px', borderRadius: '12px',
              transition: 'transform 0.2s'
            }}>
              <div style={{ fontSize: '1.2rem' }}>{medals[index]}</div>
              <div style={{ 
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                background: isMe ? '#f5c518' : 'rgba(255,255,255,0.1)', color: isMe ? '#000' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontWeight: 'bold', fontSize: '0.9rem' 
              }}>
                {entry.username.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: isMe ? '#f5c518' : '#eee', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {entry.username} {isMe && '(você)'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#888' }}>
                  {formatStudyHoursShort(entry.totalHours)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function GlobalRanking({ currentUserId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeGlobalRanking(data => {
      setEntries(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const sorted = [...entries].sort((a, b) => b.totalHours - a.totalHours || b.currentStreak - a.currentStreak);

  const maxHours = sorted[0]?.totalHours || 1;

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="ranking-wrapper">
      <img
        className="ranking-giveaway-banner"
        src="/banner-sorteio-ranking.png"
        alt="Sorteio especial: iPhone 17 Pro Max para o primeiro lugar do ranking. Estude mais e concorra."
        loading="lazy"
      />

      {/* Podium top 3 */}
      {sorted.length >= 3 && (
        <GlobalPodium entries={sorted} currentUserId={currentUserId} />
      )}

      {/* Filter tabs */}
      <div className="ranking-filter-bar">
        <span className="ranking-filter-label">Ordenar por:</span>
        <div className="ranking-filter-tabs">
          <button className="active">⏱ Horas totais</button>
        </div>
      </div>

      {/* Full list */}
      <div className="ranking-list-panel">
        {loading ? (
          <div className="ranking-loading">
            <div className="ranking-loading-spinner" />
            <span>Carregando ranking global...</span>
          </div>
        ) : sorted.length === 0 ? (
          <div className="ranking-empty">
            <span className="ranking-empty-icon">🏆</span>
            <strong>Nenhum dado ainda</strong>
            <p>Seja o primeiro do ranking! Registre uma sessão de estudos.</p>
          </div>
        ) : (
          <div className="ranking-list">
            {sorted.map((entry, index) => {
              const isMe = entry.uid === currentUserId;
              const isTop3 = index < 3;
              const barWidth = maxHours > 0 ? Math.max(2, (entry.totalHours / maxHours) * 100) : 0;
              return (
                <div
                  key={entry.uid}
                  className={`ranking-row${isMe ? ' ranking-row-me' : ''}${isTop3 ? ' ranking-row-top' : ''}`}
                >
                  <span className="ranking-row-position">
                    {isTop3 ? medals[index] : `#${index + 1}`}
                  </span>
                  <div className="ranking-row-avatar">
                    {entry.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="ranking-row-info">
                    <span className="ranking-row-name">
                      {entry.username}
                      {isMe && <span className="ranking-row-you-badge">você</span>}
                    </span>
                    <div className="ranking-row-bar-wrap">
                      <div className="ranking-row-bar" style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>
                  <div className="ranking-row-stats">
                    <span className="ranking-row-hours">{formatStudyHoursShort(entry.totalHours)}</span>
                    <span className="ranking-row-meta">
                      {`🔥 ${entry.currentStreak}d`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="ranking-note">O ranking é atualizado em tempo real com base nas horas registradas pelo cronômetro.</p>
    </div>
  );
}

// ─── HUB INICIAL ─────────────────────────────────────────────────────────────
function HubInicial({ onSelect, onStartStudy, username, cloudStatus, onSignOut, sessionUser }) {
  const [activeHubView, setActiveHubView] = useState('concursos');
  const [summaryNow, setSummaryNow] = useState(INITIAL_NOW);
  useEffect(() => {
    const interval = window.setInterval(() => setSummaryNow(Date.now()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const learningSummary = useMemo(
    () => buildLearningSummary(window.localStorage, concursosConfig, summaryNow),
    [summaryNow],
  );
  const concursosOrdenados = Object.entries(concursosConfig)
    .map(([id, c], order) => {
      const storageScope = getContestStorageScope(id);
      const selectedCargoId = readSavedState(`${storageScope}:cargo`, c.cargoPadrao);
      const selectedCargo = c.cargos.find(cargo => cargo.id === selectedCargoId) || c.cargos[0];
      const disciplinas = readSavedState(`${storageScope}:disciplinas`, c.disciplinas)
        .filter(d => !d.cargoId || d.cargoId === selectedCargoId);
      const metaTotal = disciplinas.reduce((a, d) => a + d.meta, 0);
      const feitasTotal = learningSummary.contests.find(contest => contest.id === id)?.hours || 0;
      const pct = metaTotal > 0 ? Math.min(100, Math.round((feitasTotal / metaTotal) * 100)) : 0;
      return { id, c, order, selectedCargo, metaTotal, feitasTotal, pct };
    })
    .sort((a, b) => b.feitasTotal - a.feitasTotal || a.order - b.order);
  const focoPrincipal = concursosOrdenados[0];
  const todayKey = getStudyDateKey(new Date());
  const studiedToday = learningSummary.week.some(day => day.dateKey === todayKey && day.studied)
    || concursosOrdenados.some(({ id }) => {
      const timer = readSavedState(`${getContestStorageScope(id)}:timer`, null);
      return Boolean(timer?.startedAt && getStudyDateKey(new Date(timer.startedAt)) === todayKey);
    });

  return (
    <div className="hub-wrapper">
      <header className="hub-topbar">
        <span className="hub-title">Central Tática de Concursos</span>
        <nav className="hub-view-tabs" aria-label="Seções principais">
          <button className={activeHubView === 'concursos' ? 'active' : ''} onClick={() => setActiveHubView('concursos')}>Concursos</button>
          <button className={activeHubView === 'cerebro' ? 'active' : ''} onClick={() => setActiveHubView('cerebro')}>Cérebro de aprendizagem</button>
          <button
            className={`hub-tab-ranking${activeHubView === 'ranking' ? ' active' : ''}`}
            onClick={() => setActiveHubView('ranking')}
          >🏆 Ranking Global</button>
        </nav>
        <div className="hub-account-tools">
          <span className={`hub-cloud-status hub-cloud-${cloudStatus}`}><i />{cloudStatus === 'synced' ? 'Sincronizado' : cloudStatus === 'saving' ? 'Salvando' : cloudStatus === 'offline' ? 'Offline' : cloudStatus === 'error' ? 'Falha ao sincronizar' : 'Conectando'}</span>
          <span className="hub-account-name">{username || 'Perfil'}</span>
          <button className="hub-signout" onClick={onSignOut} title="Sair do perfil">Sair</button>
        </div>
      </header>

      <div className="hub-content">
        {activeHubView === 'ranking' ? (
          <GlobalRanking currentUserId={sessionUser?.uid} />
        ) : activeHubView === 'cerebro' ? (
          <CerebroAprendizagem summary={learningSummary} onOpenContest={onSelect} />
        ) : <>
        <Top3RankingSummary currentUserId={sessionUser?.uid} onOpenRanking={() => setActiveHubView('ranking')} />
        <section className="hub-study-overview">
          <div className="hub-study-intro">
            <h1>Seu acompanhamento de estudos</h1>
            <p>Escolha um concurso e mantenha sua constância.</p>
          </div>

          <aside className={`hub-study-alert${studiedToday ? ' hub-study-alert-complete' : ''}`} aria-live="polite">
            <span className="hub-study-alert-icon" aria-hidden="true">{studiedToday ? '✓' : '!'}</span>
            <div className="hub-study-alert-copy">
              <span className="hub-study-alert-label">{studiedToday ? 'ESTUDO DE HOJE' : 'LEMBRETE DE ESTUDO'}</span>
              <strong>{studiedToday ? 'Sua sessão de hoje já foi registrada.' : 'Você ainda não estudou hoje.'}</strong>
              <span>{studiedToday ? 'Mantenha o ritmo, uma sessão de cada vez.' : `Comece pelo seu foco: ${focoPrincipal.c.titulo}.`}</span>
            </div>
            <button
              className="hub-study-alert-action"
              onClick={() => studiedToday ? onSelect(focoPrincipal.id) : onStartStudy(focoPrincipal.id)}
            >
              {studiedToday ? 'Ver painel' : 'Começar sessão'}
              <span aria-hidden="true">↗</span>
            </button>
          </aside>

          <div className="hub-focus-row">
            <div>
              <span className="hub-focus-label">FOCO MAIS ESTUDADO</span>
              <strong>{focoPrincipal.c.titulo}</strong>
              <span>{formatStudyHours(focoPrincipal.feitasTotal)} de estudo acumulado</span>
            </div>
            <button className="hub-focus-action" onClick={() => onSelect(focoPrincipal.id)}>
              Abrir painel <span aria-hidden="true">↗</span>
            </button>
          </div>

          <nav className="hub-competition-shortcuts" aria-label="Acesso aos concursos">
            {concursosOrdenados.map(({ id, c }) => (
              <button key={id} onClick={() => onSelect(id)} title={`Abrir ${c.titulo}`}>
                {c.titulo}
              </button>
            ))}
          </nav>
        </section>

        <div className="hub-heading-row">
          <div>
            <h2 className="hub-heading">Painéis de concurso</h2>
            <p className="hub-subheading">Organizados pela carga de estudo acumulada.</p>
          </div>
          <span className="hub-sort-note">MAIOR CARGA ACUMULADA</span>
        </div>

        <div className="hub-card-grid">
          {concursosOrdenados.map(({ id, c, selectedCargo, metaTotal, feitasTotal, pct }, index) => {
            const priority = index === 0 && feitasTotal > 0;
            return (
              <div key={id} className={`hub-card${priority ? ' hub-card-priority' : ''}`} onClick={() => onSelect(id)}>
                <div className="hub-card-header">
                  <div className="hub-card-identity">
                    <img src={c.logo} alt={c.titulo} className="hub-card-logo" />
                    <div>
                      <div className="hub-card-name">{c.titulo}</div>
                      <div className="hub-card-sub">{c.nome}</div>
                    </div>
                  </div>
                  <div className="hub-card-badges">
                    {priority && <span className="hub-priority-badge">PRIORIDADE</span>}
                    <span className={`badge ${c.badgeVariant}`}>{c.status.split(' ')[0]}</span>
                  </div>
                </div>

                <hr className="hub-card-divider" />

                <div className="hub-card-row">
                  <span className="hub-card-label">Cargo alvo</span>
                  <span className="hub-card-value">{id === 'esfcex' ? selectedCargo.nome : c.focoAtual}</span>
                </div>
                <div className="hub-card-row">
                  <span className="hub-card-label">Meta de estudos</span>
                  <span className="hub-card-value">{id === 'esfcex' && metaTotal === 0 ? 'Definir por área' : `${metaTotal}h`}</span>
                </div>
                <div className="hub-card-row">
                  <span className="hub-card-label">Situação</span>
                  <span className="hub-card-value" style={{ color: 'var(--status-warning)' }}>{c.status}</span>
                </div>

                <div className="hub-card-progress">
                  <div className="hub-card-progress-label">
                    <span>Progresso de Estudos</span>
                    <span>{id === 'esfcex' && metaTotal === 0 ? 'Metas configuráveis por matéria' : `${formatStudyHours(feitasTotal)} / ${metaTotal}h — ${pct}%`}</span>
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
        </>}
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

function readSavedDateString(key, fallback) {
  const stored = localStorage.getItem(key);
  if (!stored) return fallback;
  try {
    const value = JSON.parse(stored);
    return typeof value === 'string' ? value : fallback;
  } catch {
    return /^\d{4}-\d{2}-\d{2}$/.test(stored) ? stored : fallback;
  }
}

function formatStudyHours(hours) {
  const totalSeconds = Math.round(hours * 3600);
  if (totalSeconds > 0 && totalSeconds < 60) return `${totalSeconds}s`;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const fullHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return remainingMinutes ? `${fullHours}h ${remainingMinutes}min` : `${fullHours}h`;
}

function formatTimer(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function getStudyDateKeys(startedAt, endedAt) {
  const dates = [];
  const cursor = new Date(startedAt);
  while (cursor.getTime() < endedAt) {
    dates.push(getStudyDateKey(cursor));
    cursor.setHours(24, 0, 0, 0);
  }
  return dates;
}

function PainelConcurso({ id, onBack, autoStartStudy = false }) {
  const cfg = concursosConfig[id];
  const storageScope = getContestStorageScope(id);
  const hasStudyChecklist = ['abin', 'prf', 'atamf', 'civil', 'esfcex'].includes(id);
  const [activeTab, setActiveTab] = useState(autoStartStudy ? 'trilha' : 'visao');
  const contentRef = useRef(null);
  const [cargoSel, setCargoSel] = useState(() => {
    const selectedCargoId = readSavedState(`${storageScope}:cargo`, cfg.cargoPadrao);
    return cfg.cargos.find(c => c.id === selectedCargoId) || cfg.cargos[0];
  });
  const [disciplinas, setDisciplinas] = useState(() => readSavedState(`${storageScope}:disciplinas`, cfg.disciplinas.map(d => ({ ...d }))));
  const [timerSession, setTimerSession] = useState(() => loadTimerSession(window.localStorage, {
    contestId: id,
    subjectCode: cfg.disciplinas[0]?.cod || '',
    initialDisciplines: cfg.disciplinas,
  }));
  const [timerNow, setTimerNow] = useState(timerSession.startedAt || INITIAL_NOW);
  const [learningSummaryNow, setLearningSummaryNow] = useState(timerSession.startedAt || INITIAL_NOW);
  const [studySaveError, setStudySaveError] = useState(false);
  const [studyDays, setStudyDays] = useState(() => readSavedState(`${storageScope}:study-days`, []));
  const [trackingStart] = useState(() => readSavedDateString(`${storageScope}:tracking-start`, getStudyDateKey(new Date(INITIAL_NOW))));
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date(INITIAL_NOW).getFullYear(), new Date(INITIAL_NOW).getMonth(), 1));
  const [docs, setDocs] = useState(() => readSavedState(`${storageScope}:documentos`, cfg.documentos.map(d => ({ ...d }))));
  const [etapasConcurso, setEtapasConcurso] = useState(() => readSavedState(`${storageScope}:etapas`, id === 'civil' ? etapasConcursoCIVIL : id === 'esfcex' ? etapasConcursoESFCEX : []));
  const disciplinasAtivas = id === 'esfcex' ? disciplinas.filter(d => !d.cargoId || d.cargoId === cargoSel.id) : disciplinas;

  const saveTimerSession = useCallback(nextSession => {
    setTimerSession(nextSession);
    setLearningSummaryNow(Date.now());
    try {
      writeAppLocalValue(localStorage, `${storageScope}:timer`, JSON.stringify(nextSession));
      setStudySaveError(false);
    } catch {
      setStudySaveError(true);
    }
  }, [storageScope]);

  useEffect(() => {
    const interval = window.setInterval(() => setLearningSummaryNow(Date.now()), 15000);
    return () => window.clearInterval(interval);
  }, []);

  const recordStudyPeriod = useCallback((startedAt, endedAt, focusId, subjectCode) => {
    if (!startedAt || endedAt <= startedAt) return true;
    const savedLog = recordStudyInterval(window.localStorage, { contestId: id, subjectCode, focusId, startedAt, endedAt });
    if (!savedLog) {
      setStudySaveError(true);
      return false;
    }
    const nextDays = [...new Set([...studyDays, ...getStudyDateKeys(startedAt, endedAt)])].sort();
    setStudyDays(nextDays);
    try {
      writeAppLocalValue(localStorage, `${storageScope}:study-days`, JSON.stringify(nextDays));
    } catch {
      setStudySaveError(true);
    }
    return true;
  }, [id, storageScope, studyDays]);

  const checkpointTimer = useCallback((now = Date.now(), pause = false) => {
    if (!timerSession.startedAt) return timerSession;
    if (timerSession.lastHeartbeatAt && now - timerSession.lastHeartbeatAt > HEARTBEAT_STALE_MS) {
      const recovery = recoverTimerCheckpoint(timerSession, now);
      if (recovery.interruptedInterval) {
        const saved = recordStudyPeriod(recovery.interruptedInterval.startedAt, recovery.interruptedInterval.endedAt, timerSession.focusId, timerSession.cod);
        if (!saved) return timerSession;
      }
      saveTimerSession(recovery.timer);
      return recovery.timer;
    }

    const elapsedMs = Math.max(0, now - timerSession.startedAt);
    if (elapsedMs > 0 && !recordStudyPeriod(timerSession.startedAt, now, timerSession.focusId, timerSession.cod)) return timerSession;
    const nextSession = {
      ...timerSession,
      elapsedMs: timerSession.elapsedMs + elapsedMs,
      creditedMs: (timerSession.creditedMs || 0) + elapsedMs,
      startedAt: pause ? null : now,
      lastHeartbeatAt: pause ? null : now,
    };
    setTimerNow(now);
    saveTimerSession(nextSession);
    return nextSession;
  }, [timerSession, recordStudyPeriod, saveTimerSession]);

  useEffect(() => {
    if (!timerSession.startedAt) {
      const interval = window.setInterval(() => setTimerNow(Date.now()), 60000);
      return () => window.clearInterval(interval);
    }
    const interval = window.setInterval(() => {
      const now = Date.now();
      setTimerNow(now);
      if (now - timerSession.startedAt >= HEARTBEAT_INTERVAL_MS) checkpointTimer(now);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerSession.startedAt, checkpointTimer]);

  const elapsedTimerMs = timerSession.elapsedMs + (timerSession.startedAt ? Math.max(0, timerNow - timerSession.startedAt) : 0);
  const timerSubjectCod = disciplinasAtivas.some(d => d.cod === timerSession.cod)
    ? timerSession.cod
    : disciplinasAtivas[0]?.cod || '';
  const toggleTimer = () => {
    if (timerSession.startedAt) {
      checkpointTimer(Date.now(), true);
    } else {
      const now = Date.now();
      setTimerNow(now);
      saveTimerSession({
        ...timerSession,
        cod: timerSubjectCod,
        startedAt: now,
        lastHeartbeatAt: now,
        focusId: timerSession.focusId || `${id}-${now}-${Math.random().toString(36).slice(2)}`,
      });
    }
  };

  const finishTimer = () => {
    const current = timerSession.startedAt ? checkpointTimer(Date.now(), true) : timerSession;
    if (current.startedAt) return;
    saveTimerSession({ ...current, cod: timerSubjectCod, elapsedMs: 0, creditedMs: 0, startedAt: null, lastHeartbeatAt: null, focusId: null });
  };

  const today = new Date(timerNow);
  const ledgerStudyDays = readStudyLog(window.localStorage)
    .filter(entry => entry.contestId === id)
    .map(entry => entry.studyDate);
  const visibleStudyDays = timerSession.startedAt
    ? [...new Set([...studyDays, ...ledgerStudyDays, ...getStudyDateKeys(timerSession.startedAt, timerNow + 1)])]
    : [...new Set([...studyDays, ...ledgerStudyDays])];
  const studyDaySet = new Set(visibleStudyDays);
  const studyDaysLastSeven = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    return getStudyDateKey(date);
  }).filter(date => studyDaySet.has(date)).length;
  const streakDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!studyDaySet.has(getStudyDateKey(streakDate))) streakDate.setDate(streakDate.getDate() - 1);
  let currentStudyStreak = 0;
  while (studyDaySet.has(getStudyDateKey(streakDate))) {
    currentStudyStreak += 1;
    streakDate.setDate(streakDate.getDate() - 1);
  }
  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();
  const calendarDaysInMonth = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();
  const calendarOffset = (new Date(calendarYear, calendarMonthIndex, 1).getDay() + 6) % 7;
  const calendarCells = [
    ...Array.from({ length: calendarOffset }, (_, index) => ({ key: `empty-${index}` })),
    ...Array.from({ length: calendarDaysInMonth }, (_, index) => {
      const day = index + 1;
      const date = new Date(calendarYear, calendarMonthIndex, day);
      const dateKey = getStudyDateKey(date);
      const status = studyDaySet.has(dateKey)
        ? 'studied'
        : dateKey >= trackingStart && dateKey < getStudyDateKey(today)
          ? 'missed'
          : 'upcoming';
      return { key: dateKey, day, dateKey, status };
    }),
  ];
  while (calendarCells.length % 7 !== 0) calendarCells.push({ key: `empty-end-${calendarCells.length}` });
  const calendarMonthLabel = calendarMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const calendarMonthStudied = calendarCells.filter(cell => cell.status === 'studied').length;
  const calendarMonthMissed = calendarCells.filter(cell => cell.status === 'missed').length;

  const changeCalendarMonth = amount => setCalendarMonth(current => new Date(current.getFullYear(), current.getMonth() + amount, 1));

  const renderStudyTimer = () => (
    <div className="study-timer">
      <div className="study-timer-info">
        <span className="study-timer-label">CRONÔMETRO DE ESTUDO</span>
        <strong className="study-timer-clock" aria-live="off">{formatTimer(elapsedTimerMs)}</strong>
        <span className="study-timer-subject">{timerSession.startedAt ? 'Sessão em andamento' : elapsedTimerMs ? 'Sessão pausada' : 'Pronto para estudar'}</span>
      </div>
      <label className="study-timer-select-wrap">
        <span>Matéria</span>
        <select
          className="select-control study-timer-select"
          value={timerSubjectCod}
          disabled={Boolean(timerSession.startedAt) || elapsedTimerMs > 0 || disciplinasAtivas.length === 0}
          onChange={e => saveTimerSession({ ...timerSession, cod: e.target.value })}
        >
          {disciplinasAtivas.map(d => <option key={d.cod} value={d.cod}>{d.nome}</option>)}
        </select>
      </label>
      <div className="study-timer-actions">
        <button className="hub-access-btn timer-toggle-btn" onClick={toggleTimer} disabled={!timerSubjectCod}>
          {timerSession.startedAt ? 'Pausar' : elapsedTimerMs ? 'Retomar' : 'Iniciar estudo'}
        </button>
        <button className="ctrl-btn timer-finish-btn" onClick={finishTimer} disabled={!elapsedTimerMs}>
          Concluir e salvar
        </button>
      </div>
      {studySaveError && <p className="study-save-error" role="alert">Não foi possível confirmar o salvamento desta sessão. O cronômetro continuará tentando.</p>}
    </div>
  );

  useEffect(() => {
    try {
      writeAppLocalValue(localStorage, `${storageScope}:disciplinas`, JSON.stringify(disciplinas));
      writeAppLocalValue(localStorage, `${storageScope}:documentos`, JSON.stringify(docs));
      writeAppLocalValue(localStorage, `${storageScope}:etapas`, JSON.stringify(etapasConcurso));
      writeAppLocalValue(localStorage, `${storageScope}:study-days`, JSON.stringify(studyDays));
      writeAppLocalValue(localStorage, `${storageScope}:tracking-start`, JSON.stringify(trackingStart));
      writeAppLocalValue(localStorage, `${storageScope}:cargo`, JSON.stringify(cargoSel.id));
    } catch {
      return;
    }
  }, [storageScope, disciplinas, docs, etapasConcurso, studyDays, trackingStart, cargoSel]);

  const toggleDoc = docId => setDocs(ds => ds.map(d => d.id === docId && d.actionable ? { ...d, pronto: !d.pronto } : d));

  const updateDocStatus = (docId, status) => setDocs(ds => ds.map(d => (
    d.id === docId
      ? id === 'atamf'
        ? { ...d, statusATA: status, pronto: status === 'ENTREGUE' }
        : id === 'civil'
          ? { ...d, statusCivil: status, pronto: status === 'ENTREGUE' }
          : { ...d, statusEsfcex: status, pronto: status === 'ENTREGUE' }
      : d
  )));

  const toggleEtapaConcurso = etapaId => setEtapasConcurso(es => es.map(e => (
    e.id === etapaId ? { ...e, concluida: !e.concluida } : e
  )));

  const updateMeta = (cod, value) => setDisciplinas(ds => ds.map(d => {
    if (d.cod !== cod) return d;
    const meta = Math.max(0, Number(value) || 0);
    return { ...d, meta };
  }));

  const toggleEtapa = (cod, etapaId) => setDisciplinas(ds => ds.map(d => (
    d.cod === cod
      ? { ...d, etapas: d.etapas.map(e => e.id === etapaId ? { ...e, concluida: !e.concluida } : e) }
      : d
  )));

  const learningSummary = useMemo(
    () => buildLearningSummary(window.localStorage, concursosConfig, learningSummaryNow),
    [learningSummaryNow],
  );
  const contestLearning = learningSummary.contests.find(contest => contest.id === id);
  const studyHoursByCode = new Map((contestLearning?.subjects || []).map(subject => [subject.code, subject.hours]));
  const getSubjectStudyHours = code => studyHoursByCode.get(code) || 0;
  const totalMeta = disciplinasAtivas.reduce((a, d) => a + d.meta, 0);
  const totalFeitas = disciplinasAtivas.reduce((total, discipline) => total + getSubjectStudyHours(discipline.cod), 0);
  const pctHoras = totalMeta > 0 ? Math.min(100, Math.round((totalFeitas / totalMeta) * 100)) : 0;
  const etapasTotal = disciplinasAtivas.reduce((total, d) => total + (d.etapas?.length || 0), 0);
  const etapasConcluidas = disciplinasAtivas.reduce((total, d) => total + (d.etapas?.filter(e => e.concluida).length || 0), 0);
  const materiasConcluidas = disciplinasAtivas.filter(d => d.etapas?.length && d.etapas.every(e => e.concluida)).length;
  const etapasConcursoConcluidas = etapasConcurso.filter(etapa => etapa.concluida).length;
  const pctEtapasConcurso = etapasConcurso.length ? Math.round((etapasConcursoConcluidas / etapasConcurso.length) * 100) : 0;

  const actionableDocs = docs.filter(d => d.actionable);
  const docsOk = actionableDocs.filter(d => ['atamf', 'civil', 'esfcex'].includes(id)
    ? (id === 'atamf' ? d.statusATA : id === 'civil' ? d.statusCivil : d.statusEsfcex) === 'ENTREGUE'
    : d.pronto).length;
  const docsTotal = actionableDocs.length;

  const gruposDocs = [...new Set(docs.map(d => d.grupo))];

  const tabLabel = { visao: 'VISÃO GERAL', trilha: 'TRILHA DE ESTUDOS', documentacao: 'DOCUMENTAÇÃO', etapas: 'ETAPAS DO CONCURSO', taf: 'CONTROLE FÍSICO' };
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
            {['visao', 'trilha', 'documentacao', ...(['civil', 'esfcex'].includes(id) ? ['etapas'] : []), ...(cfg.hasTAF ? ['taf'] : [])].map(t => (
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
                  <span className="metric-label">Horas estudadas</span>
                  <span className="metric-value" style={{ fontSize: id === 'esfcex' && totalMeta === 0 ? '0.9rem' : undefined, color: pctHoras === 100 ? 'var(--status-success)' : 'var(--brand-blue)' }}>
                    {id === 'esfcex' && totalMeta === 0 ? 'Defina as metas na trilha' : `${formatStudyHours(totalFeitas)} / ${totalMeta}h`}
                  </span>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${pctHoras}%`, background: 'var(--brand-blue)' }} />
                  </div>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Dias estudados</span>
                  <span className="metric-value" style={{ color: 'var(--status-success)' }}>{studyDaySet.size}</span>
                  <span className="metric-detail">Dias com sessão registrada</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Últimos 7 dias</span>
                  <span className="metric-value" style={{ color: 'var(--brand-blue)' }}>{studyDaysLastSeven} / 7</span>
                  <span className="metric-detail">Dias com estudo</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Sequência atual</span>
                  <span className="metric-value" style={{ color: 'var(--status-warning)' }}>{currentStudyStreak}</span>
                  <span className="metric-detail">Dias consecutivos</span>
                </div>
              </div>

              <section className="panel study-calendar" aria-label={`Calendário de estudos de ${cfg.titulo}`}>
                <header className="study-calendar-header">
                  <div>
                    <h3 className="panel-title">Consistência dos estudos</h3>
                    <p className="study-calendar-summary">
                      {calendarMonthStudied} {calendarMonthStudied === 1 ? 'dia estudado' : 'dias estudados'} · {calendarMonthMissed} {calendarMonthMissed === 1 ? 'dia sem estudo' : 'dias sem estudo'} em {calendarMonthLabel}
                    </p>
                  </div>
                  <div className="study-calendar-navigation">
                    <button className="calendar-nav-btn" aria-label="Mês anterior" title="Mês anterior" onClick={() => changeCalendarMonth(-1)}>‹</button>
                    <strong>{calendarMonthLabel}</strong>
                    <button className="calendar-nav-btn" aria-label="Próximo mês" title="Próximo mês" onClick={() => changeCalendarMonth(1)}>›</button>
                    {(calendarMonth.getFullYear() !== today.getFullYear() || calendarMonth.getMonth() !== today.getMonth()) && (
                      <button className="calendar-today-btn" onClick={() => setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>Hoje</button>
                    )}
                  </div>
                </header>
                <div className="study-calendar-grid" role="grid" aria-label={calendarMonthLabel}>
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
                    <span className="study-calendar-weekday" role="columnheader" key={day}>{day}</span>
                  ))}
                  {calendarCells.map(cell => (
                    <div className="study-calendar-cell" role="gridcell" key={cell.key}>
                      {cell.day && (
                        <span
                          className={`study-calendar-day study-calendar-day-${cell.status}${cell.dateKey === getStudyDateKey(today) ? ' study-calendar-day-today' : ''}`}
                          aria-label={`${cell.day} de ${calendarMonthLabel}: ${cell.status === 'studied' ? 'estudou' : cell.status === 'missed' ? 'sem estudo' : 'sem registro'}`}
                          title={cell.status === 'studied' ? 'Estudou neste dia' : cell.status === 'missed' ? 'Nenhum estudo registrado' : 'Data futura ou fora do período acompanhado'}
                        >
                          <span>{cell.day}</span>
                          {cell.status === 'studied' && <span className="study-calendar-mark" aria-hidden="true">✓</span>}
                          {cell.status === 'missed' && <span className="study-calendar-mark" aria-hidden="true">×</span>}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="study-calendar-legend" aria-label="Legenda">
                  <span><i className="calendar-legend-dot calendar-legend-studied" />Estudou</span>
                  <span><i className="calendar-legend-dot calendar-legend-missed" />Sem estudo</span>
                  <span><i className="calendar-legend-dot calendar-legend-upcoming" />Futuro / sem acompanhamento</span>
                </div>
              </section>

              {id === 'esfcex' && (
                <div className="panel study-area-panel">
                  <label className="study-area-select">
                    <span className="panel-title">Área de preparação</span>
                    <select className="select-control" value={cargoSel.id} disabled={Boolean(timerSession.startedAt) || elapsedTimerMs > 0} onChange={e => setCargoSel(cfg.cargos.find(c => c.id === e.target.value))}>
                      {cfg.cargos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </label>
                </div>
              )}
            </>
          )}

          {/* ── TRILHA DE ESTUDOS ── */}
          {activeTab === 'trilha' && hasStudyChecklist && (
            <section className="study-plan">
              <div className="study-plan-header">
                <div>
                  <h3 className="panel-title">{id === 'atamf' ? 'Plano de estudos — ATA-MF' : id === 'prf' ? 'Plano de estudos — PRF Administrativo' : id === 'civil' ? 'Plano de estudos — PC-RJ' : id === 'esfcex' ? 'Plano de estudos — EsFCEx' : 'Plano de estudos por matéria'}</h3>
                  <p className="study-plan-summary">{materiasConcluidas} de {disciplinasAtivas.length} matérias concluídas · {etapasConcluidas} de {etapasTotal} etapas</p>
                </div>
                <span className="badge badge-blue">{id === 'esfcex' && totalMeta === 0 ? 'METAS POR ÁREA' : `META PLANEJADA: ${totalMeta}H`}</span>
              </div>
              {renderStudyTimer()}
              <div className="study-notice">
                {id === 'prf'
                  ? <><strong>Base de preparação:</strong> matérias e metas são editáveis e servem como planejamento inicial de 120h; não representam o conteúdo oficial de um novo edital. A PRF informa ensino médio completo para o cargo de Agente Administrativo. Confirme os requisitos e o programa no edital vigente.</>
                  : id === 'atamf'
                    ? <><strong>Referência histórica:</strong> o último concurso para ATA-MF foi realizado em 2009. A lista é uma base de organização, não o conteúdo oficial de um próximo edital. Consulte o edital histórico no repositório da ENAP e confirme futuras regras em publicação oficial.</>
                    : id === 'civil'
                      ? <><strong>Base de preparação PC-RJ:</strong> as matérias e a meta inicial de 155h são estimativas editáveis para organização, não conteúdo ou carga horária oficial. Editais, requisitos e disciplinas variam entre estados, cargos e seleções; confirme tudo na publicação vigente.</>
                      : id === 'esfcex'
                        ? <><strong>Concurso 2026 / matrícula 2027:</strong> as quatro matérias comuns e o conteúdo específico da área seguem a base informada do edital 2026. Defina as metas de estudo por matéria; o sistema inicia em 0h porque elas não representam a carga oficial do curso. O conteúdo específico depende da área selecionada.</>
                        : <><strong>Referência de planejamento:</strong> conteúdo-base do edital de 2018. As 115h são uma meta inicial do sistema, não uma carga horária oficial da ABIN. Conhecimentos específicos variam conforme cargo e área.</>}
              </div>
              <div className="study-subject-list">
                {disciplinasAtivas.map(d => {
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
                        {['prf', 'atamf', 'civil', 'esfcex'].includes(id)
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
                              <span>h · estudadas {formatStudyHours(getSubjectStudyHours(d.cod))}</span>
                            </div>
                          : <span>meta {d.meta}h · estudadas {formatStudyHours(getSubjectStudyHours(d.cod))}</span>}
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
                        <strong>{formatStudyHours(getSubjectStudyHours(d.cod))}</strong>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {activeTab === 'trilha' && !hasStudyChecklist && (
            <div className="panel">
              {renderStudyTimer()}
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
                      <th style={{ textAlign: 'center' }}>HORAS ESTUDADAS</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disciplinasAtivas.map(d => {
                      const subjectHours = getSubjectStudyHours(d.cod);
                      const pct = d.meta > 0 ? Math.min(100, (subjectHours / d.meta) * 100) : 0;
                      return (
                        <tr key={d.cod}>
                          <td style={{ fontWeight: 700, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{d.cod}</td>
                          <td style={{ color: '#f1f5f9' }}>{d.nome}</td>
                          <td>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 5 }}>
                              <span>{formatStudyHours(subjectHours)} executadas</span>
                              <span>meta {d.meta}h</span>
                            </div>
                            <div className="progress-container">
                              <div className="progress-bar" style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--status-success)' : 'var(--brand-blue)' }} />
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>{formatStudyHours(subjectHours)}</td>
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
                  {id === 'abin' ? 'Documentos e alertas — ABIN' : id === 'prf' ? 'Documentos — PRF Administrativo' : id === 'atamf' ? 'Documentação — ATA-MF' : id === 'civil' ? 'Documentação — PC-RJ' : id === 'esfcex' ? 'Documentação — EsFCEx' : `Matriz Documental — ${cfg.titulo}`}
                </h3>
                <span className="badge badge-blue">{['atamf', 'civil', 'esfcex'].includes(id) ? 'ENTREGUES' : hasStudyChecklist ? 'PREPARADOS' : 'IMEDIATOS'}: {docsOk}/{docsTotal}</span>
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
                  </> : id === 'atamf' ? <>
                    <div className="study-notice">
                      <strong>Referência histórica:</strong> o último concurso para ATA-MF ocorreu em 2009. Prepare documentos pessoais e escolares, mas confirme requisitos e validade no próximo edital.
                    </div>
                    <div className="study-notice study-notice-warning">
                      <strong>Certidões e documentos condicionais:</strong> aguarde o edital ou a convocação antes de solicitar certidões e providenciar documentação de posse, cotas ou deficiência.
                    </div>
                  </> : id === 'civil' ? <>
                    <div className="study-notice">
                      <strong>Concurso estadual:</strong> este painel está organizado como referência para PC-RJ. A lista não substitui o edital; requisitos e documentos variam por estado e cargo.
                    </div>
                    <div className="study-notice study-notice-warning">
                      <strong>Certidões e avaliações:</strong> deixe certidões, exames médicos, TAF, avaliação psicológica e documentos de posse como “AGUARDAR EDITAL” até a convocação oficial.
                    </div>
                  </> : <>
                    <div className="study-notice">
                      <strong>Concurso 2026:</strong> use os documentos listados como organização prévia; a exigência final depende da área e da convocação oficial.
                    </div>
                    <div className="study-notice study-notice-warning">
                      <strong>Etapas seletivas:</strong> certidões, exames e documentos de matrícula devem seguir as instruções e prazos do edital/convocação. Limites etários variam entre QC e Capelães.
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
                              {['atamf', 'civil', 'esfcex'].includes(id)
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
                              {['atamf', 'civil', 'esfcex'].includes(id)
                                ? <select
                                    className="select-control doc-status-control"
                                    aria-label={`Status de ${d.nome}`}
                                    value={id === 'atamf' ? d.statusATA : id === 'civil' ? d.statusCivil : d.statusEsfcex}
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

          {activeTab === 'etapas' && ['civil', 'esfcex'].includes(id) && (
            <section className="study-plan">
              <div className="study-plan-header">
                <div>
                  <h3 className="panel-title">Etapas do concurso — {id === 'esfcex' ? 'EsFCEx 2026' : 'PC-RJ'}</h3>
                  <p className="study-plan-summary">
                    {etapasConcursoConcluidas} de {etapasConcurso.length} etapas concluídas
                  </p>
                </div>
                <span className="badge badge-blue">ACOMPANHAMENTO</span>
              </div>
              <div className="progress-container stage-progress">
                <div className="progress-bar" style={{ width: `${pctEtapasConcurso}%`, background: 'var(--brand-blue)' }} />
              </div>
              <div className="study-notice">
                {id === 'esfcex'
                  ? <><strong>Edital 2026:</strong> EI, Inspeção de Saúde, EAF, Avaliação Psicológica e Investigação Social constam entre as fases. Heteroidentificação/verificação documental depende da situação do candidato. A matrícula está prevista para 2027; siga os atos oficiais para confirmar datas e sequência.</>
                  : <><strong>Etapas variáveis:</strong> prova discursiva, TAF e avaliação de títulos dependem do cargo e do edital. A referência PC-RJ pode incluir psicotécnico, provas de conhecimento, exame médico, capacidade física, investigação social e curso de formação. Confirme a sequência oficial quando o edital for publicado.</>}
              </div>
              <div className="stage-list">
                {etapasConcurso.map(etapa => (
                  <label className="stage-item" key={etapa.id}>
                    <input
                      type="checkbox"
                      className="task-checkbox"
                      checked={etapa.concluida}
                      onChange={() => toggleEtapaConcurso(etapa.id)}
                    />
                    <span>{etapa.label}</span>
                    <span className={`badge ${etapa.concluida ? 'badge-green' : 'badge-neutral'}`}>
                      {etapa.concluida ? 'CONCLUÍDA' : 'PENDENTE'}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* ── TAF / EAF ── */}
          {activeTab === 'taf' && cfg.hasTAF && (
            <div className="panel">
              <div className="panel-header"><h3 className="panel-title">{id === 'esfcex' ? 'Exame de Aptidão Física (EAF) — EsFCEx' : 'Controle Físico — TAF'}</h3></div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                {id === 'esfcex'
                  ? 'O EAF consta entre as etapas do concurso 2026. Exercícios, índices, critérios e padrões por categoria devem ser conferidos no edital e na convocação da área escolhida.'
                  : 'O TAF é etapa eliminatória. O condicionamento físico deve ser iniciado concomitantemente ao estudo teórico.'}
              </p>

              {id === 'esfcex' && cfg.tafInfo && (
                <div className="panel" style={{ marginBottom: 20, background: 'var(--bg-surface-elevated)' }}>
                  <div className="grid-2">
                    <div>
                      <div className="info-row">
                        <span className="info-label">Concurso / matrícula prevista</span>
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

              {id === 'esfcex' ? (
                <div className="study-notice study-notice-warning">
                  <strong>Índices do EAF:</strong> consultar o edital 2026 e as instruções oficiais da convocação. Não use índices de seleções anteriores como padrão para esta área.
                </div>
              ) : <div className="grid-2">
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
              </div>}
            </div>
          )}

        </div>
      </main>
    </>
  );
}
