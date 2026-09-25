import React, { useState } from 'react';
import './index.css';

// ─── DADOS ABIN ──────────────────────────────────────────────────────────────
const initialDisciplinasABIN = [
  { cod: 'CB01', nome: 'Língua Portuguesa', meta: 20, feitas: 0 },
  { cod: 'CB02', nome: 'Atividade de Inteligência e Legislação', meta: 30, feitas: 0 },
  { cod: 'CE01', nome: 'Direito Administrativo', meta: 25, feitas: 0 },
  { cod: 'CE02', nome: 'Direito Constitucional', meta: 25, feitas: 0 },
  { cod: 'CE05', nome: 'Raciocínio Lógico-Matemático', meta: 15, feitas: 0 },
];

const initialDocumentosABIN = [
  { id: 'dp1', nome: 'RG', grupo: 'DOCUMENTOS PESSOAIS', req: 'Legal', momento: 'Permanente', actionable: true, pronto: false },
  { id: 'dp2', nome: 'CPF', grupo: 'DOCUMENTOS PESSOAIS', req: 'Legal', momento: 'Permanente', actionable: true, pronto: false },
  { id: 'dp3', nome: 'Título de Eleitor', grupo: 'DOCUMENTOS PESSOAIS', req: 'Legal', momento: 'Permanente', actionable: true, pronto: false },
  { id: 'dp4', nome: 'Certidão de Quitação Eleitoral', grupo: 'DOCUMENTOS PESSOAIS', req: 'Legal', momento: 'Permanente', actionable: true, pronto: false },
  { id: 'dp5', nome: 'Documento Militar (se masc.)', grupo: 'DOCUMENTOS PESSOAIS', req: 'Legal', momento: 'Permanente', actionable: true, pronto: false },
  { id: 'esc1', nome: 'Diploma / Certificado', grupo: 'ESCOLARIDADE', req: 'Legal', momento: 'Antes da Posse', actionable: true, pronto: false },
  { id: 'esc2', nome: 'Histórico Escolar', grupo: 'ESCOLARIDADE', req: 'Legal', momento: 'Antes da Posse', actionable: true, pronto: false },
  { id: 'esc3', nome: 'Habilitação Específica', grupo: 'ESCOLARIDADE', req: 'Legal', momento: 'Se Aplicável', actionable: false, pronto: false, statusFixo: 'SE APLIC.' },
  { id: 'is1', nome: 'Certidão Justiça Federal', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Último Edital', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'is2', nome: 'Certidão Justiça Estadual', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Último Edital', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'is3', nome: 'Certidão Justiça Militar (Estadual)', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Último Edital', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'is4', nome: 'Certidão Justiça Militar da União', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Último Edital', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'is5', nome: 'Certidão Justiça Eleitoral', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Último Edital', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'is6', nome: 'Certidão Polícia Federal', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Último Edital', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'is7', nome: 'Certidão Polícia Civil', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Último Edital', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'is8', nome: 'Cartórios de Protestos', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Último Edital', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'is9', nome: 'Distribuição Cível', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Último Edital', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'is10', nome: 'Assentamentos Funcionais', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'Último Edital', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'SE APLIC.' },
  { id: 'is11', nome: 'FIP — Ficha de Informações Pessoais', grupo: 'INVESTIGAÇÃO SOCIAL', req: 'A Confirmar', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'am1', nome: 'Exames Laboratoriais (Sangue / Urina)', grupo: 'AVALIAÇÃO MÉDICA', req: 'Último Edital', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'am2', nome: 'Toxicológico (Larga Janela — 180 dias)', grupo: 'AVALIAÇÃO MÉDICA', req: 'Último Edital', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'am3', nome: 'ECG + Ecocardiograma', grupo: 'AVALIAÇÃO MÉDICA', req: 'Último Edital', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'am4', nome: 'Radiografia de Tórax + Espirometria', grupo: 'AVALIAÇÃO MÉDICA', req: 'Último Edital', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'am5', nome: 'Avaliação Oftalmológica Completa', grupo: 'AVALIAÇÃO MÉDICA', req: 'Último Edital', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'am6', nome: 'Audiometria Tonal', grupo: 'AVALIAÇÃO MÉDICA', req: 'Último Edital', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'am7', nome: 'Avaliação Psiquiátrica', grupo: 'AVALIAÇÃO MÉDICA', req: 'Último Edital', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'cf1', nome: 'CPF e Identidade', grupo: 'CURSO DE FORMAÇÃO (CFI)', req: 'Último CFI', momento: 'Matrícula', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'cf2', nome: '3 Fotos 3×4 (fundo branco)', grupo: 'CURSO DE FORMAÇÃO (CFI)', req: 'Último CFI', momento: 'Matrícula', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'cf3', nome: 'CNH Categoria B (se aplicável ao cargo)', grupo: 'CURSO DE FORMAÇÃO (CFI)', req: 'Último CFI', momento: 'Conforme Edital', actionable: false, pronto: false, statusFixo: 'SE CARGO' },
  { id: 'cf4', nome: 'Atestado Médico de Aptidão Física', grupo: 'CURSO DE FORMAÇÃO (CFI)', req: 'Último CFI', momento: 'Matrícula', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'cf5', nome: 'Currículo e Ficha de Cadastro', grupo: 'CURSO DE FORMAÇÃO (CFI)', req: 'Último CFI', momento: 'Matrícula', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
];

const cargosABIN = [
  { id: 'oi', nome: 'Oficial de Inteligência', nivel: 'Superior' },
  { id: 'oti', nome: 'Oficial Técnico de Inteligência', nivel: 'Superior' },
  { id: 'ai', nome: 'Agente de Inteligência', nivel: 'Médio' },
  { id: 'ati', nome: 'Agente Técnico de Inteligência', nivel: 'Médio' },
];

// ─── DADOS PRF ADM ────────────────────────────────────────────────────────────
const initialDisciplinasPRF = [
  { cod: 'CB01', nome: 'Língua Portuguesa', meta: 25, feitas: 0 },
  { cod: 'CB02', nome: 'Informática Básica', meta: 15, feitas: 0 },
  { cod: 'CE01', nome: 'Direito Administrativo', meta: 30, feitas: 0 },
  { cod: 'CE02', nome: 'Arquivologia', meta: 20, feitas: 0 },
];

const initialDocumentosPRF = [
  { id: 'dp1', nome: 'RG e CPF', grupo: 'DOCUMENTOS PESSOAIS', req: 'Legal', momento: 'Permanente', actionable: true, pronto: false },
  { id: 'dp2', nome: 'Título de Eleitor + Quitação Eleitoral', grupo: 'DOCUMENTOS PESSOAIS', req: 'Legal', momento: 'Permanente', actionable: true, pronto: false },
  { id: 'dp3', nome: 'Documento Militar (se masc.)', grupo: 'DOCUMENTOS PESSOAIS', req: 'Legal', momento: 'Permanente', actionable: true, pronto: false },
  { id: 'esc1', nome: 'Certificado de Conclusão do Ensino Médio', grupo: 'ESCOLARIDADE', req: 'Legal', momento: 'Antes da Posse', actionable: true, pronto: false },
];

const cargosPRF = [
  { id: 'aa', nome: 'Agente Administrativo', nivel: 'Médio' },
];

// ─── DADOS ATA-MF ─────────────────────────────────────────────────────────────
const initialDisciplinasATAMF = [
  { cod: 'CB01', nome: 'Língua Portuguesa', meta: 30, feitas: 0 },
  { cod: 'CB02', nome: 'Raciocínio Lógico e Quantitativo', meta: 20, feitas: 0 },
  { cod: 'CB03', nome: 'Noções de Informática', meta: 15, feitas: 0 },
  { cod: 'CE01', nome: 'Direito Administrativo', meta: 30, feitas: 0 },
  { cod: 'CE02', nome: 'Administração Financeira e Orçamentária', meta: 35, feitas: 0 },
  { cod: 'CE03', nome: 'Contabilidade Geral', meta: 25, feitas: 0 },
  { cod: 'CE04', nome: 'Legislação Tributária Federal', meta: 25, feitas: 0 },
];

const initialDocumentosATAMF = [
  { id: 'dp1', nome: 'RG e CPF', grupo: 'DOCUMENTOS PESSOAIS', req: 'Legal', momento: 'Permanente', actionable: true, pronto: false },
  { id: 'dp2', nome: 'Título de Eleitor + Quitação Eleitoral', grupo: 'DOCUMENTOS PESSOAIS', req: 'Legal', momento: 'Permanente', actionable: true, pronto: false },
  { id: 'dp3', nome: 'Documento Militar (se masc.)', grupo: 'DOCUMENTOS PESSOAIS', req: 'Legal', momento: 'Permanente', actionable: true, pronto: false },
  { id: 'esc1', nome: 'Diploma de Nível Superior', grupo: 'ESCOLARIDADE', req: 'Legal', momento: 'Antes da Posse', actionable: true, pronto: false },
  { id: 'esc2', nome: 'Histórico Escolar', grupo: 'ESCOLARIDADE', req: 'Legal', momento: 'Antes da Posse', actionable: true, pronto: false },
  { id: 'is1', nome: 'Certidões de Antecedentes Criminais', grupo: 'INVESTIGAÇÃO / SINDICÂNCIA', req: 'A Confirmar', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
  { id: 'is2', nome: 'Certidão Negativa da Justiça Federal', grupo: 'INVESTIGAÇÃO / SINDICÂNCIA', req: 'A Confirmar', momento: 'Convocação', actionable: false, pronto: false, statusFixo: 'AGUARDAR' },
];

const cargosATAMF = [
  { id: 'ata', nome: 'Analista Técnico Administrativo', nivel: 'Superior' },
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

// ─── DADOS ESFCEX ────────────────────────────────────────────────────────────
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
    nome: 'Analista Técnico Adm. — Ministério da Fazenda',
    status: 'AGUARDANDO EDITAL',
    badgeVariant: 'badge-amber',
    focoAtual: 'Analista Técnico Administrativo (Superior)',
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
            const metaTotal = c.disciplinas.reduce((a, d) => a + d.meta, 0);
            const feitasTotal = c.disciplinas.reduce((a, d) => a + d.feitas, 0);
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
function PainelConcurso({ id, onBack }) {
  const cfg = concursosConfig[id];
  const [activeTab, setActiveTab] = useState('visao');
  const [cargoSel, setCargoSel] = useState(cfg.cargos[0]);
  const [disciplinas, setDisciplinas] = useState(() => cfg.disciplinas.map(d => ({ ...d })));
  const [docs, setDocs] = useState(() => cfg.documentos.map(d => ({ ...d })));

  const toggleDoc = docId => setDocs(ds => ds.map(d => d.id === docId && d.actionable ? { ...d, pronto: !d.pronto } : d));

  const updateHoras = (i, amt) => setDisciplinas(ds => {
    const next = [...ds];
    next[i] = { ...next[i], feitas: Math.max(0, Math.min(next[i].meta, next[i].feitas + amt)) };
    return next;
  });

  const totalMeta = disciplinas.reduce((a, d) => a + d.meta, 0);
  const totalFeitas = disciplinas.reduce((a, d) => a + d.feitas, 0);
  const pctEstudos = totalMeta > 0 ? Math.round((totalFeitas / totalMeta) * 100) : 0;

  const actionableDocs = docs.filter(d => d.actionable);
  const docsOk = actionableDocs.filter(d => d.pronto).length;
  const docsTotal = actionableDocs.length;

  const gruposDocs = [...new Set(docs.map(d => d.grupo))];

  const tabLabel = { visao: 'VISÃO GERAL', trilha: 'TRILHA DE ESTUDOS', documentacao: 'DOCUMENTAÇÃO', taf: 'CONTROLE FÍSICO' };

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

        <div style={{ padding: '12px 0' }}>
          <div className="nav-section-label">Navegação</div>
          {['visao', 'trilha', 'documentacao', ...(cfg.hasTAF ? ['taf'] : [])].map(t => (
            <div key={t} className={`nav-item ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
              {tabLabel[t]}
            </div>
          ))}
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <span className="page-title">{tabLabel[activeTab]}</span>
          <span className={`badge ${cfg.badgeVariant}`}>{cfg.status}</span>
        </header>

        <div className="content-area">

          {/* ── VISÃO GERAL ── */}
          {activeTab === 'visao' && (
            <>
              <div className="grid-4" style={{ marginBottom: 16 }}>
                <div className="metric-card">
                  <span className="metric-label">Carga Horária</span>
                  <span className="metric-value" style={{ color: pctEstudos === 100 ? 'var(--status-success)' : 'var(--brand-blue)' }}>
                    {totalFeitas}h / {totalMeta}h
                  </span>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${pctEstudos}%`, background: 'var(--brand-blue)' }} />
                  </div>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Docs Imediatos</span>
                  <span className="metric-value" style={{ color: docsOk === docsTotal ? 'var(--status-success)' : 'var(--status-warning)' }}>
                    {docsOk} / {docsTotal}
                  </span>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: docsTotal > 0 ? `${Math.round(docsOk / docsTotal * 100)}%` : '0%', background: 'var(--status-success)' }} />
                  </div>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Simulados</span>
                  <span className="metric-value" style={{ color: 'var(--text-secondary)' }}>0 realizados</span>
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
          {activeTab === 'trilha' && (
            <div className="panel">
              <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="panel-title">Acompanhamento por Disciplina</h3>
                <span className="badge badge-blue">META TOTAL: {totalMeta}h</span>
              </div>
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
          )}

          {/* ── DOCUMENTAÇÃO ── */}
          {activeTab === 'documentacao' && (
            <div className="panel">
              <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="panel-title">Matriz Documental — {cfg.titulo}</h3>
                <span className="badge badge-blue">IMEDIATOS: {docsOk}/{docsTotal}</span>
              </div>

              {gruposDocs.map(grupo => (
                <div key={grupo} style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4da3e8', borderBottom: '1px solid var(--border-default)', paddingBottom: 8, marginBottom: 12 }}>
                    {grupo}
                  </div>
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
                            {d.actionable
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
                            {d.actionable
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
