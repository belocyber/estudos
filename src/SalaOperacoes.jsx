import { useState } from 'react';
import { writeAppLocalValue } from './localData.js';
import './salaOperacoes.css';

const PROGRESS_KEY = 'painel-concursos:learning-operations:v1';

const RANKS = [
  { title: 'Recruta', threshold: 0, unit: 'FORMAÇÃO INICIAL' },
  { title: 'Agente de campo', threshold: 120, unit: 'COMUNICAÇÃO OPERACIONAL' },
  { title: 'Analista', threshold: 300, unit: 'ANÁLISE E INTERPRETAÇÃO' },
  { title: 'Oficial de operações', threshold: 550, unit: 'COORDENAÇÃO DE OPERAÇÕES' },
  { title: 'Especialista regional', threshold: 850, unit: 'REDE INTERNACIONAL' },
  { title: 'Comando global', threshold: 1250, unit: 'ARTICULAÇÃO GLOBAL' },
  { title: 'Diretoria global', threshold: 1750, unit: 'LIDERANÇA GLOBAL' },
];

const OPERATIONS = [
  {
    id: 'english-signal',
    agency: 'Rede de Campo',
    channel: 'COMUNICAÇÃO DE CAMPO',
    minimumRank: 0,
    symbol: '◉',
    subject: 'Inglês',
    code: 'EN',
    division: 'DIVISÃO DE IDIOMAS',
    title: 'Sinal de localização',
    operation: 'COMMUNICATION CHANNEL',
    level: 'INTRODUTÓRIO',
    duration: '8 MIN',
    topics: ['Vocabulário em contexto', 'Compreensão de texto', 'Interpretação', 'Comunicação profissional'],
    agent: 'AGENTE MORGAN',
    briefing: 'Uma mensagem foi interceptada durante uma operação. Interprete o conteúdo e responda ao agente de campo em inglês.',
    messages: [
      'The meeting has been moved to Friday.',
      'Same place. Bring the documents.',
      'Please confirm that you understand the new schedule and will attend.',
    ],
    prompt: 'Interprete a mensagem em inglês: informe que a reunião foi transferida para sexta-feira e confirme sua presença.',
    expected: 'The meeting has been moved to Friday. I will be there.',
    validate: answer => [
      'the meeting has been moved to friday i will be there',
      'the meeting has been moved to friday i ll be there',
      'the meeting was moved to friday i will be there',
      'the meeting was moved to friday i ll be there',
      'understood the meeting is on friday i will be there',
      'understood i ll be there on friday',
    ].includes(normalizeAnswer(answer)),
    responseFeedback: '“Has been moved to Friday” significa que a reunião foi remarcada para sexta-feira. “I will be there” confirma presença; “I’ll be there” é a contração natural.',
    evidence: [
      { label: 'INTERCEPTAÇÃO 01', text: '“The meeting has been moved to Friday.” A reunião foi transferida para sexta-feira.' },
      { label: 'NOTA LINGUÍSTICA', text: '“Has been moved” usa a voz passiva no present perfect: o foco está na mudança de data, não em quem a realizou.' },
    ],
    challengePrompt: 'Na mensagem seguinte, o agente informa: “The meeting has been moved to Friday.” Qual é o significado?',
    answers: [
      { label: 'A reunião foi transferida para sexta-feira.', correct: true },
      { label: 'A reunião começou na sexta-feira passada.', correct: false },
      { label: 'A reunião foi cancelada permanentemente.', correct: false },
    ],
    challengeFeedback: '“Has been moved to” indica que algo foi remarcado para outra data. “Friday” significa sexta-feira.',
  },
  {
    id: 'spanish-signal',
    agency: 'Unidade Continental',
    channel: 'REDE CONTINENTAL',
    minimumRank: 1,
    requiredOperationId: 'english-signal',
    symbol: '◎',
    subject: 'Espanhol',
    code: 'ES',
    division: 'DIVISÃO DE IDIOMAS',
    title: 'Alteração de agenda',
    operation: 'FIELD COMMUNICATION',
    level: 'INTRODUTÓRIO',
    duration: '8 MIN',
    topics: ['Vocabulário em contexto', 'Compreensão escrita', 'Futuro simples', 'Dias da semana'],
    agent: 'AGENTE VEGA',
    briefing: 'Uma comunicação informa a mudança de horário de uma reunião. Transmita a atualização em espanhol e confirme o novo dia.',
    messages: ['La reunión se ha trasladado al viernes.', 'Por favor, confirma que recibiste el cambio de horario.'],
    prompt: 'Responda em espanhol: confirme que recebeu a alteração para sexta-feira.',
    expected: 'Recibido. La reunión será el viernes.',
    validate: answer => [
      'recibido la reunion sera el viernes',
      'entendido la reunion sera el viernes',
      'la reunion tendra lugar el viernes',
      'la reunion sera el viernes',
      'la reunion es el viernes',
    ].includes(normalizeAnswer(answer)),
    responseFeedback: '“Viernes” significa sexta-feira. “La reunión tendrá lugar...” é uma forma natural de dizer que a reunião acontecerá.',
    evidence: [
      { label: 'INTERCEPTAÇÃO 02', text: '“La reunión se ha trasladado al viernes.” A expressão “se ha trasladado” indica que foi transferida ou remarcada.' },
      { label: 'NOTA LINGUÍSTICA', text: 'Os dias da semana em espanhol são escritos com inicial minúscula: lunes, martes, miércoles, jueves, viernes.' },
    ],
    challengePrompt: 'Qual expressão em espanhol significa “a reunião foi remarcada para sexta-feira”?',
    answers: [
      { label: 'La reunión se ha trasladado al viernes.', correct: true },
      { label: 'La reunión empieza el lunes.', correct: false },
      { label: 'La reunión está cerca de la oficina.', correct: false },
    ],
    challengeFeedback: '“Se ha trasladado al viernes” informa que a reunião foi transferida para sexta-feira.',
  },
  {
    id: 'math-resources',
    agency: 'Análise Central',
    channel: 'ANÁLISE CENTRAL',
    minimumRank: 2,
    requiredOperationId: 'spanish-signal',
    symbol: 'Σ',
    subject: 'Matemática',
    code: 'Σ',
    division: 'ANÁLISE QUANTITATIVA',
    title: 'Distribuição de recursos',
    operation: 'RESOURCE ALLOCATION',
    level: 'FUNDAMENTAL',
    duration: '7 MIN',
    topics: ['Multiplicação', 'Propriedade distributiva', 'Resolução de problemas', 'Raciocínio quantitativo'],
    agent: 'ANALISTA COSTA',
    briefing: 'Uma equipe de 24 agentes precisa receber 15 unidades de suprimento por pessoa. Calcule o total necessário antes da liberação.',
    messages: ['A equipe tem 24 agentes.', 'Cada agente precisa receber 15 unidades. Confirme o total do pedido.'],
    prompt: 'Informe ao analista o total de unidades necessárias.',
    expected: '360',
    validate: answer => Number(normalizeAnswer(answer).replace(/[^\d]/g, '')) === 360,
    responseFeedback: 'Multiplique o número de agentes pela quantidade por pessoa: 24 × 15 = 360 unidades.',
    evidence: [
      { label: 'REQUISIÇÃO 24-A', text: 'Efetivo informado: 24 agentes.' },
      { label: 'TABELA DE CARGA', text: 'Cota individual: 15 unidades por agente. O total pode ser calculado por multiplicação ou decomposição.' },
    ],
    challengePrompt: 'Qual decomposição confirma o cálculo 24 × 15?',
    answers: [
      { label: '24 × (10 + 5) = 240 + 120 = 360', correct: true },
      { label: '24 + 15 = 39', correct: false },
      { label: '24 × 10 + 5 = 245', correct: false },
    ],
    challengeFeedback: 'A propriedade distributiva permite decompor 15 em 10 + 5: 24 × 10 + 24 × 5 = 240 + 120.',
  },
  {
    id: 'geography-coordinates',
    agency: 'Observatório Global',
    channel: 'OBSERVATÓRIO GLOBAL',
    minimumRank: 3,
    requiredOperationId: 'math-resources',
    symbol: '⊕',
    subject: 'Geografia',
    code: 'GEO',
    division: 'ANÁLISE GEOGRÁFICA',
    title: 'Leitura de coordenadas',
    operation: 'GLOBAL POSITION',
    level: 'FUNDAMENTAL',
    duration: '9 MIN',
    topics: ['Coordenadas geográficas', 'Latitude e longitude', 'Hemisférios', 'Cartografia'],
    agent: 'ANALISTA LIMA',
    briefing: 'Um relatório indica as coordenadas aproximadas 15°47′ S, 47°52′ O. Identifique o país associado ao ponto e interprete sua posição.',
    messages: ['Coordenadas registradas: 15°47′ S, 47°52′ O.', 'O relatório solicita o país que abriga a capital nessa posição.'],
    prompt: 'Responda ao analista com o nome do país.',
    expected: 'Brasil',
    validate: answer => ['brasil', 'o brasil'].includes(normalizeAnswer(answer)),
    responseFeedback: 'As coordenadas apontam para Brasília, capital do Brasil. “S” indica latitude ao sul do Equador; “O” indica longitude a oeste de Greenwich.',
    evidence: [
      { label: 'RELATÓRIO GEO 15-S', text: 'Latitude aproximada: 15°47′ S. Longitude aproximada: 47°52′ O.' },
      { label: 'REFERÊNCIA CARTOGRÁFICA', text: 'Brasília está no Planalto Central brasileiro. Coordenadas com S ficam ao sul do Equador.' },
    ],
    challengePrompt: 'O que a letra “S” informa na coordenada 15°47′ S?',
    answers: [
      { label: 'A latitude está ao sul da Linha do Equador.', correct: true },
      { label: 'A longitude está a sudeste de Greenwich.', correct: false },
      { label: 'O ponto fica no hemisfério norte.', correct: false },
    ],
    challengeFeedback: 'A letra S marca latitude sul. A longitude é identificada por L (leste) ou O (oeste) em português.',
  },
  {
    id: 'history-1945',
    agency: 'Arquivo Internacional',
    channel: 'ARQUIVO INTERNACIONAL',
    minimumRank: 4,
    requiredOperationId: 'geography-coordinates',
    symbol: '▤',
    subject: 'História',
    code: 'HIS',
    division: 'ARQUIVO HISTÓRICO',
    title: 'Cronologia de 1945',
    operation: 'HISTORICAL ARCHIVE',
    level: 'INTERMEDIÁRIO',
    duration: '10 MIN',
    topics: ['Segunda Guerra Mundial', 'Cronologia histórica', 'Rendição alemã', 'Rendição japonesa'],
    agent: 'ARQUIVISTA NUNES',
    briefing: 'Dois documentos registram rendições distintas em 1945. Analise o recorte cronológico e diferencie o fim da guerra na Europa do encerramento global.',
    messages: ['O arquivo contém dois registros de rendição, em maio e setembro de 1945.', 'Identifique qual deles encerrou as hostilidades na Europa.'],
    prompt: 'Responda com o país responsável pela rendição na Europa.',
    expected: 'Alemanha',
    validate: answer => ['alemanha', 'germany', 'germania'].includes(normalizeAnswer(answer)),
    responseFeedback: 'A Alemanha assinou a rendição em maio de 1945, encerrando as hostilidades na Europa. A guerra terminou globalmente após a rendição japonesa, em setembro.',
    evidence: [
      { label: 'DOCUMENTO A — 08 MAI 1945', text: 'Rendição alemã: encerramento das hostilidades na Europa.' },
      { label: 'DOCUMENTO B — 02 SET 1945', text: 'Rendição formal do Japão: marco do fim da Segunda Guerra Mundial em escala global.' },
    ],
    challengePrompt: 'Qual documento marca o encerramento global da Segunda Guerra Mundial?',
    answers: [
      { label: 'A rendição formal do Japão, em 2 de setembro de 1945.', correct: true },
      { label: 'A rendição alemã, em 8 de maio de 1945.', correct: false },
      { label: 'A assinatura do Tratado de Versalhes, em 1919.', correct: false },
    ],
    challengeFeedback: 'A rendição alemã encerrou a guerra na Europa. O conflito mundial terminou após a rendição japonesa, formalizada em 2 de setembro de 1945.',
  },
  {
    id: 'global-briefing',
    agency: 'Conselho Global',
    channel: 'CONSELHO GLOBAL',
    minimumRank: 6,
    requiredOperationId: 'history-1945',
    symbol: '◎',
    subject: 'Geografia',
    code: 'GLB',
    division: 'CENTRO DE ANÁLISE GLOBAL',
    title: 'Panorama intercontinental',
    operation: 'GLOBAL SITUATION ROOM',
    level: 'AVANÇADO',
    duration: '12 MIN',
    topics: ['Fusos horários', 'Continentes', 'Coordenadas globais', 'Síntese de informação'],
    agent: 'CONSELHEIRA NOOR',
    briefing: 'Uma equipe distribuída em diferentes fusos precisa sincronizar uma reunião global. Cruze as evidências geográficas e informe a janela de horário comum.',
    messages: [
      'A equipe de Brasília opera em UTC−3 e a de Londres em UTC+0.',
      'A reunião começa às 14:00 em Londres. Informe o horário correspondente em Brasília.',
      'Confirme também qual cidade está mais a oeste.',
    ],
    prompt: 'Responda ao Conselho: em Brasília serão 11:00, e a cidade mais a oeste é Brasília?',
    expected: 'Em Brasília serão 11:00. Brasília fica mais a oeste.',
    validate: answer => {
      const normalized = normalizeAnswer(answer);
      return normalized.includes('11') && normalized.includes('brasilia') && (normalized.includes('oeste') || normalized.includes('west'));
    },
    responseFeedback: 'Londres está três horas à frente de Brasília. Portanto, 14:00 em Londres corresponde a 11:00 em Brasília, que também está mais a oeste.',
    evidence: [
      { label: 'BOLETIM DE FUSOS', text: 'Brasília: UTC−3. Londres: UTC+0. A diferença entre as cidades é de três horas.' },
      { label: 'REFERÊNCIA ESPACIAL', text: 'Brasília está próxima de 48° O; Londres, próxima de 0°. A longitude oeste aumenta para oeste de Greenwich.' },
    ],
    challengePrompt: 'Se são 14:00 em Londres (UTC+0), que horas são em Brasília (UTC−3)?',
    answers: [
      { label: '11:00 — subtraem-se três horas.', correct: true },
      { label: '17:00 — somam-se três horas.', correct: false },
      { label: '14:00 — as cidades têm o mesmo fuso.', correct: false },
    ],
    challengeFeedback: 'Brasília está três horas atrás de Londres: 14:00 − 3 horas = 11:00.',
  },
];

const FLOW_STEPS = ['Briefing', 'Conversa', 'Evidências', 'Desafio', 'Relatório'];

function normalizeAnswer(value) {
  return value.trim().toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,!?'"“”]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readProgress() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PROGRESS_KEY) || '{}');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return { data: parsed, error: '' };
    return { data: {}, error: 'O formato do registro de operações é inválido. A evolução será exibida após um novo salvamento.' };
  } catch {
    return { data: {}, error: 'Não foi possível ler o registro de operações salvo neste dispositivo.' };
  }
}

function getConversationFeedback(operation, answer) {
  return operation.validate(answer)
    ? { correct: true, text: operation.responseFeedback }
    : { correct: false, text: `Revise a resposta. Uma forma adequada seria: “${operation.expected}” ${operation.responseFeedback}` };
}

function getOperationXp(record) {
  if (!record) return 0;
  if (Number.isFinite(record.xp)) return Math.max(0, record.xp);
  return Math.max(0, Number(record.attempts) || 0) * 30;
}

function getOperationLockRequirements(operation, currentRankIndex, progress) {
  const requirements = [];
  const requiredRank = RANKS[operation.minimumRank];
  if (operation.minimumRank > currentRankIndex) {
    requirements.push(`Alcance a patente ${requiredRank.title} (${requiredRank.threshold} XP).`);
  }
  if (operation.requiredOperationId && !(progress[operation.requiredOperationId]?.attempts > 0)) {
    const requiredOperation = OPERATIONS.find(item => item.id === operation.requiredOperationId);
    requirements.push(`Conclua ${requiredOperation?.agency || 'a operação anterior'}.`);
  }
  return requirements;
}

function SubjectMark({ code }) {
  return <span className="ops-subject-mark" aria-hidden="true">{code}</span>;
}

function SalaOperacoes({ username, cloudStatus, onNavigate, onSignOut }) {
  const [progressState, setProgressState] = useState(readProgress);
  const progress = progressState.data;
  const [selectedId, setSelectedId] = useState(OPERATIONS[0].id);
  const [lockedPreviewId, setLockedPreviewId] = useState('');
  const [contactFilter, setContactFilter] = useState('');
  const [stage, setStage] = useState(0);
  const [answer, setAnswer] = useState('');
  const [conversationResult, setConversationResult] = useState(null);
  const [challengeResult, setChallengeResult] = useState(null);
  const [saveError, setSaveError] = useState('');
  const selectedOperation = OPERATIONS.find(operation => operation.id === selectedId) || OPERATIONS[0];
  const xp = Object.values(progress).reduce((total, record) => total + getOperationXp(record), 0);
  const currentRankIndex = RANKS.reduce((rankIndex, rank, index) => (xp >= rank.threshold ? index : rankIndex), 0);
  const isOperationUnlocked = operation => operation.minimumRank <= currentRankIndex
    && (!operation.requiredOperationId || (progress[operation.requiredOperationId]?.attempts || 0) > 0);
  const lockedPreview = OPERATIONS.find(operation => operation.id === lockedPreviewId && !isOperationUnlocked(operation));
  const displayOperation = lockedPreview || selectedOperation;
  const currentRank = RANKS[currentRankIndex];
  const nextRank = RANKS[currentRankIndex + 1] || null;
  const xpIntoRank = xp - currentRank.threshold;
  const xpToNextRank = nextRank ? nextRank.threshold - currentRank.threshold : 0;
  const rankProgress = nextRank ? Math.min(100, Math.round((xpIntoRank / xpToNextRank) * 100)) : 100;
  const filteredOperations = OPERATIONS.filter(operation => `${operation.agency} ${operation.subject} ${operation.title}`.toLocaleLowerCase('pt-BR').includes(contactFilter.trim().toLocaleLowerCase('pt-BR')));

  const completedCount = OPERATIONS.filter(operation => progress[operation.id]?.attempts > 0).length;
  const averageScore = completedCount
    ? Math.round(OPERATIONS.reduce((total, operation) => total + (progress[operation.id]?.percent || 0), 0) / completedCount)
    : 0;
  const storedOperation = progress[selectedOperation.id];
  const displayStoredOperation = progress[displayOperation.id];
  const currentScore = stage === 4
    ? (conversationResult?.correct ? 50 : 0) + (challengeResult?.correct ? 50 : 0)
    : (conversationResult?.correct ? 50 : 0);
  const operationDifficulty = displayOperation.level === 'INTRODUTÓRIO' ? 2 : displayOperation.level === 'FUNDAMENTAL' ? 3 : displayOperation.level === 'AVANÇADO' ? 5 : 4;
  const initials = (username || 'AGENTE 07').slice(0, 2).toLocaleUpperCase('pt-BR');
  const agencyInitials = (displayOperation.agency || 'AG').split(' ').map(part => part[0]).join('').slice(0, 2);
  const unlockedCount = OPERATIONS.filter(isOperationUnlocked).length;
  const lockRequirement = lockedPreview ? RANKS[lockedPreview.minimumRank] : null;
  const lockRequirements = lockedPreview ? getOperationLockRequirements(lockedPreview, currentRankIndex, progress) : [];

  const selectOperation = operationId => {
    const operation = OPERATIONS.find(item => item.id === operationId);
    if (!operation) return;
    if (!isOperationUnlocked(operation)) {
      setLockedPreviewId(operationId);
      setStage(0);
      setAnswer('');
      setConversationResult(null);
      setChallengeResult(null);
      setSaveError('');
      return;
    }
    setSelectedId(operationId);
    setLockedPreviewId('');
    setStage(0);
    setAnswer('');
    setConversationResult(null);
    setChallengeResult(null);
    setSaveError('');
  };

  const submitConversation = event => {
    event.preventDefault();
    const cleanAnswer = answer.trim();
    if (!cleanAnswer) return;
    setConversationResult(getConversationFeedback(selectedOperation, cleanAnswer));
    setAnswer(cleanAnswer);
    setStage(1);
  };

  const submitChallenge = choice => {
    const isCorrect = choice.correct;
    setChallengeResult({ correct: isCorrect, selected: choice.label, explanation: selectedOperation.challengeFeedback });
    const score = (conversationResult?.correct ? 50 : 0) + (isCorrect ? 50 : 0);
    const earnedXp = (conversationResult?.correct ? 40 : 10) + (isCorrect ? 60 : 20);
    const previousXp = getOperationXp(progress[selectedOperation.id]);
    const nextProgress = {
      ...progress,
      [selectedOperation.id]: {
        attempts: (progress[selectedOperation.id]?.attempts || 0) + 1,
        percent: score,
        xp: previousXp + earnedXp,
      },
    };
    try {
      writeAppLocalValue(window.localStorage, PROGRESS_KEY, JSON.stringify(nextProgress));
      setProgressState({ data: nextProgress, error: '' });
      setSaveError('');
    } catch {
      setSaveError('O relatório foi concluído nesta sessão, mas não foi possível salvar a evolução neste dispositivo.');
    }
    setStage(4);
  };

  const restartOperation = () => {
    setStage(0);
    setAnswer('');
    setConversationResult(null);
    setChallengeResult(null);
    setSaveError('');
  };

  return (
    <section className="ops-room" aria-label="Sala de operações de aprendizagem">
      <aside className="ops-sidebar" aria-label="Navegação da academia">
        <button type="button" className="ops-academy-brand" onClick={() => onNavigate?.('concursos')} aria-label="Voltar à página inicial">
          <span className="ops-academy-emblem" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M24 3 28 18 43 12 31 23 44 29 28 28 24 45 20 28 4 29 17 23 5 12 20 18 24 3Z" stroke="currentColor" strokeWidth="1.4"/><circle cx="24" cy="24" r="5" stroke="currentColor" strokeWidth="1.4"/></svg></span>
          <strong>GLOBAL INTEL</strong>
          <span>SECURE LEARNING NETWORK</span>
        </button>

        <div className="ops-profile-card">
          <span className="ops-profile-avatar">{initials}</span>
          <span><strong>{username || 'AGENTE 07'}</strong><small>{currentRank.title} · Nível {currentRankIndex + 1}</small></span>
          <span className="ops-profile-chevron" aria-hidden="true">›</span>
        </div>

        <nav className="ops-side-nav" aria-label="Seções">
          <button type="button" onClick={() => onNavigate?.('concursos')}><span>⌂</span> Início</button>
          <button type="button" className="is-active" aria-current="page"><span>◎</span> Missões</button>
          <button type="button" onClick={() => onNavigate?.('concursos')}><span>▤</span> Matérias</button>
          <button type="button" onClick={() => onNavigate?.('idiomas')}><span>⌘</span> Idiomas</button>
          <button type="button" onClick={() => onNavigate?.('cerebro')}><span>◷</span> Progresso</button>
          <button type="button" onClick={() => onNavigate?.('ranking')}><span>◇</span> Ranking</button>
        </nav>

        <section className="ops-rank-card" aria-label="Patente e progressão">
          <div className="ops-rank-insignia" aria-hidden="true">{String(currentRankIndex + 1).padStart(2, '0')}</div>
          <div className="ops-rank-copy">
            <span>PATENTE ATUAL</span>
            <strong>{currentRank.title}</strong>
            <small>{xp} XP · {currentRank.unit}</small>
          </div>
          <div className="ops-rank-track"><span style={{ width: `${rankProgress}%` }} /></div>
          {nextRank
            ? <small className="ops-rank-next">{nextRank.threshold - xp} XP para {nextRank.title}</small>
            : <small className="ops-rank-next">PATENTE MÁXIMA · REDE GLOBAL</small>}
          <details className="ops-rank-ladder">
            <summary>Ver trilha de patentes</summary>
            <ol>
              {RANKS.map((rank, index) => <li key={rank.title} className={index <= currentRankIndex ? 'is-reached' : ''}><span>{String(index + 1).padStart(2, '0')}</span><strong>{rank.title}</strong><small>{rank.threshold} XP</small></li>)}
            </ol>
          </details>
        </section>

        <div className="ops-sidebar-quote">
          <span className="ops-quote-map" aria-hidden="true" />
          <strong>CONHECIMENTO<br />EM CONTEXTO</strong>
          <span>Aprender · investigar · aplicar</span>
        </div>
      </aside>

      <aside className="ops-contacts-panel" aria-label="Contatos e canais globais">
        <div className="ops-contacts-heading"><div><span>INTELLIGENCE NETWORK</span><strong>Conversas</strong></div><span>{unlockedCount}/{OPERATIONS.length}</span></div>
        <label className="ops-search">
          <span className="ops-search-icon" aria-hidden="true">⌕</span>
          <span className="ops-visually-hidden">Buscar contato ou canal</span>
          <input value={contactFilter} onChange={event => setContactFilter(event.target.value)} placeholder="Buscar conversas..." />
        </label>
        <div className="ops-contact-list">
          {filteredOperations.map(operation => {
            const isLocked = !isOperationUnlocked(operation);
            const isActive = operation.id === (lockedPreview ? lockedPreview.id : selectedOperation.id);
            const record = progress[operation.id];
            return (
              <button
                type="button"
                key={operation.id}
                className={`ops-contact${isActive ? ' is-active' : ''}${isLocked ? ' is-locked' : ''}`}
                onClick={() => selectOperation(operation.id)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${operation.agency}, ${isLocked ? getOperationLockRequirements(operation, currentRankIndex, progress).join(' ') : operation.subject}, nível ${operation.minimumRank + 1}`}
              >
                <span className="ops-contact-avatar">{operation.symbol}</span>
                <span className="ops-contact-copy">
                  <span className="ops-contact-name">{operation.agency}<span>{isLocked ? '▣' : record ? '●' : `NÍVEL ${operation.minimumRank + 1}`}</span></span>
                  <span className="ops-contact-last">{isLocked ? getOperationLockRequirements(operation, currentRankIndex, progress)[0] : record ? `${record.attempts} relatório(s) · ${record.percent}%` : operation.subject + ' · ' + operation.title}</span>
                </span>
                <span className={`ops-contact-rank${isLocked ? ' is-locked' : ''}`}>{isLocked ? RANKS[operation.minimumRank].threshold + ' XP' : '›'}</span>
              </button>
            );
          })}
          {filteredOperations.length === 0 && <p className="ops-empty-search">Nenhuma conversa encontrada.</p>}
        </div>
        <div className="ops-network-footer"><span /> CONEXÃO SEGURA <small>Comunicação ponta a ponta</small></div>
      </aside>

      <header className="ops-workspace-topbar">
        <div className="ops-global-status"><span /> CANAL CRIPTOGRAFADO <i /> REDE GLOBAL ATIVA</div>
        <div className="ops-topbar-tools">
          <span className={`hub-cloud-status hub-cloud-${cloudStatus}`}><i />{cloudStatus === 'synced' ? 'Sincronizado' : cloudStatus === 'saving' ? 'Salvando' : cloudStatus === 'offline' ? 'Offline' : cloudStatus === 'error' ? 'Falha ao sincronizar' : 'Conectando'}</span>
          <span className="ops-topbar-agent"><strong>{username || 'AGENTE 07'}</strong><small>Nível {currentRankIndex + 1} · {currentRank.title}</small></span>
          <button type="button" className="ops-topbar-signout" onClick={onSignOut}>Sair</button>
        </div>
      </header>

      <main className="ops-mission-main">
        <header className="ops-mission-hero">
          <span className="ops-mission-subject-mark"><SubjectMark code={displayOperation.code} /></span>
          <div className="ops-mission-hero-copy">
            <span className="ops-eyebrow">{lockedPreview ? 'CANAL GLOBAL RESTRITO' : 'COMUNICAÇÃO SEGURA · ' + displayOperation.channel}</span>
            <h1>{lockedPreview ? displayOperation.agency : displayOperation.title}</h1>
            <span className="ops-mission-hero-meta">{displayOperation.division} <i /> {displayOperation.subject} <i /> PATENTE {displayOperation.minimumRank + 1}</span>
          </div>
          <div className="ops-classified-stamp"><strong>{lockedPreview ? 'ACESSO RESTRITO' : 'NÍVEL ' + (displayOperation.minimumRank + 1)}</strong><span>REF. {displayOperation.id.toUpperCase()}</span><span>DURAÇÃO ESTIMADA: {displayOperation.duration}</span></div>
          <p>{lockedPreview ? `Este canal está protegido. ${lockRequirements.join(' ')} A conversa e o treinamento serão liberados após o cumprimento dos requisitos.` : displayOperation.briefing}</p>
        </header>

        <article className="ops-conversation">
          <header className="ops-conversation-header">
            <div className="ops-agent-identity">
              <span className="ops-agent-avatar" aria-hidden="true">{lockedPreview ? '▣' : agencyInitials}</span>
              <div><strong>{lockedPreview ? 'CANAL SOB SIGILO' : displayOperation.agency.toLocaleUpperCase('pt-BR')}</strong><span>{lockedPreview ? 'Acesso liberado por patente' : displayOperation.channel}</span></div>
            </div>
            <span className="ops-secure-label"><span aria-hidden="true">●</span> {lockedPreview ? 'NÍVEL ' + (displayOperation.minimumRank + 1) : displayOperation.agent}</span>
          </header>

          <div className={`ops-thread${lockedPreview ? ' is-locked-thread' : ''}`} aria-live="polite">
            {lockedPreview ? (
              <div className="ops-locked-screen">
                <span className="ops-locked-globe" aria-hidden="true"><svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="43" stroke="currentColor"/><ellipse cx="50" cy="50" rx="19" ry="43" stroke="currentColor"/><path d="M8 50h84M17 29h66M17 71h66M50 7v86" stroke="currentColor"/><path d="m43 46 7-5 7 5v11l-7 5-7-5V46Z" fill="#07111b" stroke="#8ec7ef" strokeWidth="2"/></svg></span>
                <span className="ops-locked-label">CLASSIFIED · NÍVEL {displayOperation.minimumRank + 1}</span>
                <h2>{displayOperation.agency}</h2>
                <p>Conversas de aprendizagem com agentes de operações globais.</p>
                <div className="ops-lock-requirements">
                  <strong>REQUISITOS DE ACESSO</strong>
                  <span>Patente atual: {currentRank.title} · {xp} XP</span>
                  {lockRequirements.map(requirement => <span key={requirement}>{requirement}</span>)}
                </div>
                <button type="button" disabled className="ops-locked-button">▣ &nbsp; ACESSO RESTRITO</button>
                <span className="ops-locked-progress">{displayOperation.minimumRank > currentRankIndex ? `${Math.min(xp, lockRequirement.threshold)} / ${lockRequirement.threshold} XP` : 'REQUISITO DE PATENTE ATENDIDO'}</span>
              </div>
            ) : (
              <>
            {displayOperation.messages.map((message, index) => (
              <div className="ops-message-row" key={message}>
              <span className="ops-message-avatar is-agent">{agencyInitials}</span>
                <div className="ops-message ops-agent-message">
                  <span className="ops-message-sender">{displayOperation.agent}<span> · {displayOperation.channel}</span></span>
                  <p>{message}</p>
                  <span className="ops-message-time">14:{String(23 + index).padStart(2, '0')}</span>
                </div>
              </div>
            ))}

            {stage === 0 && (
              <form className="ops-reply-form" onSubmit={submitConversation}>
                <span className="ops-card-index">SUA TAREFA</span>
                <label htmlFor="ops-answer">{selectedOperation.prompt}</label>
                <div className="ops-reply-entry">
                  <textarea
                    id="ops-answer"
                    value={answer}
                    onChange={event => setAnswer(event.target.value)}
                    placeholder={displayOperation.subject === 'Matemática' ? 'Informe o resultado...' : 'Digite sua resposta...'}
                    rows={2}
                    autoComplete="off"
                  />
                  <button type="submit" className="ops-send-button" disabled={!answer.trim()} aria-label="Enviar resposta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m4 4 17 8-17 8 3-8-3-8Z"/><path d="M7 12h14"/></svg></button>
                </div>
                <span className="ops-reply-hint">DICA: PRESTE ATENÇÃO AO CONTEXTO, AO VOCABULÁRIO E À MENSAGEM.</span>
              </form>
            )}

            {stage >= 1 && conversationResult && (
              <>
                <div className={`ops-message ops-user-message${conversationResult.correct ? ' is-correct' : ' is-incorrect'}`}>
                  <span className="ops-message-sender">VOCÊ <span>· RESPOSTA ENVIADA</span></span>
                  <p>{answer}</p>
                  <span className="ops-message-time">COMUNICAÇÃO · 14:24</span>
                </div>
                <div className={`ops-feedback ops-feedback-${conversationResult.correct ? 'success' : 'review'}`}>
                  <span>{conversationResult.correct ? 'ANÁLISE DA RESPOSTA · ADEQUADA' : 'ANÁLISE DA RESPOSTA · REVISAR'}</span>
                  <p>{conversationResult.text}</p>
                </div>
                {stage === 1 && <button type="button" className="ops-secondary-button" onClick={() => setStage(2)}>Ver material de apoio <span aria-hidden="true">→</span></button>}
              </>
            )}

            {stage >= 2 && (
              <section className="ops-evidence-panel" aria-labelledby="ops-evidence-title">
                <div className="ops-evidence-heading"><span className="ops-file-stamp">DOC</span><div><span className="ops-eyebrow">MATERIAL DE APOIO</span><h2 id="ops-evidence-title">Evidências da operação</h2></div></div>
                <div className="ops-evidence-list">
                  {displayOperation.evidence.map(item => <article key={item.label}><span>{item.label}</span><p>{item.text}</p></article>)}
                </div>
              </section>
            )}

            {stage === 2 && <button type="button" className="ops-secondary-button" onClick={() => setStage(3)}>Continuar para o desafio <span aria-hidden="true">→</span></button>}

            {stage === 3 && (
              <section className="ops-challenge" aria-labelledby="ops-challenge-title">
                <div className="ops-card-index">DESAFIO DE APLICAÇÃO · 01</div>
                <h2 id="ops-challenge-title">{displayOperation.challengePrompt}</h2>
                <div className="ops-choice-list">
                  {displayOperation.answers.map((choice, index) => (
                    <button type="button" key={choice.label} onClick={() => submitChallenge(choice)}>
                      <span>{String.fromCharCode(65 + index)}</span><span>{choice.label}</span><span aria-hidden="true">→</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {stage === 4 && challengeResult && (
              <section className="ops-debrief" aria-labelledby="ops-debrief-title">
                <div className="ops-debrief-topline"><span className="ops-eyebrow">RELATÓRIO DE APRENDIZAGEM</span><span className={`ops-result-badge${challengeResult.correct ? '' : ' needs-review'}`}>{challengeResult.correct ? 'CONCLUÍDA' : 'REVISÃO RECOMENDADA'}</span></div>
                <h2 id="ops-debrief-title">Operação encerrada</h2>
                <div className="ops-score-line"><strong>{currentScore}<small>%</small></strong><span>Precisão nesta operação<br />2 etapas avaliadas</span></div>
                <div className="ops-debrief-section"><span>DESAFIO</span><p>{challengeResult.correct ? 'Resposta correta.' : `Resposta selecionada: “${challengeResult.selected}”`}</p><p>{challengeResult.explanation}</p></div>
                <div className="ops-debrief-section"><span>PRÓXIMA AÇÃO</span><p>Retome o conceito estudado no material da matéria e volte a esta operação para consolidar a aprendizagem.</p></div>
                {storedOperation && <p className="ops-saved-note">Último resultado registrado: {storedOperation.percent}% · {storedOperation.attempts} tentativa{storedOperation.attempts > 1 ? 's' : ''}</p>}
                <button type="button" className="ops-secondary-button" onClick={restartOperation}>Refazer operação</button>
              </section>
            )}
              </>
            )}
          </div>
          {!lockedPreview && stage < 2 && <div className="ops-thread-footer"><button type="button" onClick={() => setStage(Math.max(stage, 2))}>◇ &nbsp; VER DOCUMENTOS DE APOIO</button><span className="ops-pagination">● ─ ● ─ ○ ─ ○ ─ ○ &nbsp; {stage + 1}/5</span></div>}
        </article>
      </main>

      <aside className="ops-details" aria-label="Detalhes da missão">
        <section className="ops-detail-card">
          <h2><span>◎</span> DETALHES DO CANAL</h2>
          <dl>
            <div><dt><span>⊕</span> Matéria</dt><dd>{displayOperation.subject}</dd></div>
            <div><dt><span>♧</span> Dificuldade</dt><dd className="ops-stars" aria-label={`Nível ${operationDifficulty} de 5`}>{Array.from({ length: 5 }, (_, index) => <span className={index < operationDifficulty ? 'is-filled' : ''} key={index}>★</span>)}</dd></div>
            <div><dt><span>◷</span> Tempo estimado</dt><dd>{displayOperation.duration.toLocaleLowerCase('pt-BR').replace('min', 'minutos')}</dd></div>
            <div><dt><span>▣</span> Patente de acesso</dt><dd>{RANKS[displayOperation.minimumRank].title}</dd></div>
          </dl>
        </section>

        <section className="ops-detail-card">
          <h2><span>⊙</span> TÓPICOS ABORDADOS</h2>
          <div className="ops-topic-list">{displayOperation.topics.map(topic => <span key={topic}>{topic}</span>)}</div>
        </section>

        <section className="ops-detail-card ops-rank-progress">
          <h2><span>◈</span> PROGRESSO DE PATENTE</h2>
          <div className="ops-rank-progress-heading"><strong>{currentRank.title}</strong><span>NÍVEL {currentRankIndex + 1}</span></div>
          <div className="ops-progress-track"><span style={{ width: `${rankProgress}%` }} /></div>
          <small>{xp} XP {nextRank ? `/ ${nextRank.threshold} XP` : '· NÍVEL MÁXIMO'}</small>
        </section>

        <section className="ops-detail-card ops-operation-progress">
          <h2><span>▤</span> PROGRESSO NA MATÉRIA</h2>
          <div className="ops-progress-caption"><span>{lockedPreview ? 'Acesso condicionado à patente' : stage === 4 ? 'Resultado mais recente' : conversationResult ? 'Etapa de conversa avaliada' : 'Aguardando resposta'}</span><strong>{lockedPreview ? '▣' : stage === 4 || conversationResult ? `${currentScore}%` : '—'}</strong></div>
          <div className="ops-progress-track"><span style={{ width: `${lockedPreview ? 0 : stage === 4 || conversationResult ? currentScore : 0}%` }} /></div>
          {displayStoredOperation && <small>{displayStoredOperation.attempts} conversa(s) · {getOperationXp(displayStoredOperation)} XP</small>}
        </section>

        <section className="ops-detail-card ops-feedback-note">
          <h2><span>✓</span> APÓS CONCLUIR</h2>
          <p>Você receberá feedback sobre suas respostas, com explicações e reforço do conteúdo.</p>
        </section>

        <button type="button" className="ops-complete-button" disabled={Boolean(lockedPreview) || stage !== 4} onClick={restartOperation}>
          <strong>{lockedPreview ? 'Acesso bloqueado' : stage === 4 ? 'Refazer conversa' : 'Concluir conversa'}</strong>
          <span>{lockedPreview ? `Requer patente ${lockRequirement.title}` : stage === 4 ? 'Inicie uma nova conversa para consolidar' : 'Responda para avançar no treinamento'}</span>
        </button>
      </aside>

      <footer className="ops-stagebar" aria-label="Etapas de aprendizagem">
        {FLOW_STEPS.map((label, index) => (
          <div key={label} className={`ops-stage-item${stage >= index ? ' is-reached' : ''}${stage === index ? ' is-current' : ''}`} aria-current={stage === index ? 'step' : undefined}>
            <span className="ops-stage-icon">{['▤', '◌', '◇', '◎', '↗'][index]}</span>
            <span><strong>{label.toLocaleUpperCase('pt-BR')}</strong><small>{['Receba o contexto', 'Interaja com o agente', 'Resolva o problema', 'Aprenda com seus erros', 'Avance na sua jornada'][index]}</small></span>
            {index < FLOW_STEPS.length - 1 && <span className="ops-stage-chevron" aria-hidden="true">›</span>}
          </div>
        ))}
        <div className="ops-stage-summary">{completedCount}/{OPERATIONS.length} OPERAÇÕES<br />{averageScore}% APROVEITAMENTO MÉDIO</div>
      </footer>
      {(progressState.error || saveError) && <p className="ops-save-error" role="alert">{progressState.error || saveError}</p>}
    </section>
  );
}

export default SalaOperacoes;
