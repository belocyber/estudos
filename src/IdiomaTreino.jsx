import { useEffect, useMemo, useState } from 'react';
import { APP_DATA_PREFIX, writeAppLocalValue } from './localData.js';

const STORAGE_KEY = `${APP_DATA_PREFIX}language-training:v1`;
const SESSION_SIZE = 10;
const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
const INITIAL_TRAINING_TIME = Date.now();
const LANGUAGES = {
  english: {
    name: 'Inglês',
    level: 'LÍNGUA DE COOPERAÇÃO INTERNACIONAL',
    vocabulary: [
      { id: 'briefing', term: 'briefing', translation: 'instrução; reunião informativa', example: 'The team received a briefing before deployment.' },
      { id: 'chain-of-command', term: 'chain of command', translation: 'cadeia de comando', example: 'Report the issue through the chain of command.' },
      { id: 'situational-awareness', term: 'situational awareness', translation: 'consciência situacional', example: 'Situational awareness is essential during field operations.' },
      { id: 'checkpoint', term: 'checkpoint', translation: 'posto de controle', example: 'The convoy will stop at the next checkpoint.' },
      { id: 'accountability', term: 'accountability', translation: 'responsabilização; prestação de contas', example: 'Clear records ensure accountability.' },
      { id: 'after-action-review', term: 'after-action review', translation: 'análise pós-ação', example: 'The unit conducted an after-action review.' },
      { id: 'deployment', term: 'deployment', translation: 'desdobramento; mobilização', example: 'The deployment schedule was updated.' },
      { id: 'supply-chain', term: 'supply chain', translation: 'cadeia de suprimentos', example: 'The supply chain must remain reliable.' },
      { id: 'intelligence-assessment', term: 'intelligence assessment', translation: 'avaliação de inteligência', example: 'The assessment summarizes verified information.' },
      { id: 'liaison-officer', term: 'liaison officer', translation: 'oficial de ligação', example: 'The liaison officer coordinated communication between units.' },
      { id: 'readiness', term: 'readiness', translation: 'prontidão', example: 'Readiness levels are reviewed every month.' },
      { id: 'field-report', term: 'field report', translation: 'relatório de campo', example: 'Submit the field report before the end of the shift.' },
    ],
  },
  spanish: {
    name: 'Espanhol',
    level: 'LÍNGUA DE COOPERAÇÃO REGIONAL',
    vocabulary: [
      { id: 'briefing', term: 'informe', translation: 'instrução; reunião informativa', example: 'El equipo recibió un informe antes del despliegue.' },
      { id: 'chain-of-command', term: 'cadena de mando', translation: 'cadeia de comando', example: 'Comunique la incidencia por la cadena de mando.' },
      { id: 'situational-awareness', term: 'conciencia situacional', translation: 'consciência situacional', example: 'La conciencia situacional es esencial en el terreno.' },
      { id: 'checkpoint', term: 'puesto de control', translation: 'posto de controle', example: 'El convoy hará una parada en el próximo puesto de control.' },
      { id: 'accountability', term: 'rendición de cuentas', translation: 'responsabilização; prestação de contas', example: 'Los registros claros garantizan la rendición de cuentas.' },
      { id: 'after-action-review', term: 'evaluación posterior a la acción', translation: 'análise pós-ação', example: 'La unidad realizó una evaluación posterior a la acción.' },
      { id: 'deployment', term: 'despliegue', translation: 'desdobramento; mobilização', example: 'Se actualizó el calendario de despliegue.' },
      { id: 'supply-chain', term: 'cadena de suministro', translation: 'cadeia de suprimentos', example: 'La cadena de suministro debe ser fiable.' },
      { id: 'intelligence-assessment', term: 'evaluación de inteligencia', translation: 'avaliação de inteligência', example: 'El informe resume información verificada.' },
      { id: 'liaison-officer', term: 'oficial de enlace', translation: 'oficial de ligação', example: 'El oficial de enlace coordinó la comunicación entre unidades.' },
      { id: 'readiness', term: 'disponibilidad operativa', translation: 'prontidão', example: 'El nivel de disponibilidad operativa se revisa cada mes.' },
      { id: 'field-report', term: 'informe de campo', translation: 'relatório de campo', example: 'Entregue el informe de campo antes del final del turno.' },
    ],
  },
};

function loadTrainingData() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      activeLanguage: Object.hasOwn(LANGUAGES, saved.activeLanguage) ? saved.activeLanguage : 'english',
      progress: saved.progress && typeof saved.progress === 'object' ? saved.progress : {},
      customVocabulary: Array.isArray(saved.customVocabulary) ? saved.customVocabulary : [],
      completedSessions: Number.isInteger(saved.completedSessions) ? saved.completedSessions : 0,
    };
  } catch {
    return { activeLanguage: 'english', progress: {}, customVocabulary: [], completedSessions: 0 };
  }
}

export default function IdiomaTreino() {
  const [data, setData] = useState(loadTrainingData);
  const [currentTime, setCurrentTime] = useState(INITIAL_TRAINING_TIME);
  const [session, setSession] = useState(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [newExample, setNewExample] = useState('');
  const [saveError, setSaveError] = useState('');
  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);
  const language = LANGUAGES[data.activeLanguage];
  const vocabulary = useMemo(
    () => [...language.vocabulary, ...data.customVocabulary.filter(item => item.language === data.activeLanguage)],
    [data.customVocabulary, data.activeLanguage, language],
  );
  const languageProgress = data.progress[data.activeLanguage] || {};
  const dueCount = vocabulary.filter(item => (languageProgress[item.id]?.nextReviewAt || 0) <= currentTime).length;
  const currentCard = session ? vocabulary.find(item => item.id === session.queue[session.index]) : null;

  const save = nextData => {
    try {
      writeAppLocalValue(window.localStorage, STORAGE_KEY, JSON.stringify(nextData));
      setData(nextData);
      setSaveError('');
      return true;
    } catch {
      setSaveError('Não foi possível salvar. Verifique o espaço disponível no dispositivo e tente novamente.');
      return false;
    }
  };

  const chooseLanguage = id => {
    if (id === data.activeLanguage) return;
    setSession(null);
    setSessionCompleted(false);
    setRevealed(false);
    save({ ...data, activeLanguage: id });
  };

  const beginSession = () => {
    const due = vocabulary.filter(item => (languageProgress[item.id]?.nextReviewAt || 0) <= Date.now());
    const upcoming = vocabulary.filter(item => (languageProgress[item.id]?.nextReviewAt || 0) > Date.now());
    const queue = [...due, ...upcoming].slice(0, SESSION_SIZE).map(item => item.id);
    setSession({ queue, index: 0 });
    setSessionCompleted(false);
    setRevealed(false);
  };

  const gradeCard = consolidated => {
    if (!currentCard || !session) return;
    const previous = languageProgress[currentCard.id] || { repetitions: 0, interval: 0 };
    const repetitions = consolidated ? previous.repetitions + 1 : 0;
    const interval = consolidated
      ? REVIEW_INTERVALS[Math.min(repetitions - 1, REVIEW_INTERVALS.length - 1)]
      : 0;
    const nextProgress = {
      ...data.progress,
      [data.activeLanguage]: {
        ...languageProgress,
        [currentCard.id]: {
          repetitions,
          interval,
          nextReviewAt: Date.now() + (consolidated ? interval * 24 * 60 * 60 * 1000 : 10 * 60 * 1000),
        },
      },
    };
    const isLastCard = session.index === session.queue.length - 1;
    const nextData = {
      ...data,
      progress: nextProgress,
      completedSessions: data.completedSessions + (isLastCard ? 1 : 0),
    };
    if (!save(nextData)) return;
    if (isLastCard) {
      setSession(null);
      setSessionCompleted(true);
      setRevealed(false);
    } else {
      setSession({ ...session, index: session.index + 1 });
      setRevealed(false);
    }
  };

  const addVocabulary = event => {
    event.preventDefault();
    const term = newTerm.trim();
    const translation = newTranslation.trim();
    if (!term || !translation) return;
    const item = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      language: data.activeLanguage,
      term,
      translation,
      example: newExample.trim(),
    };
    if (save({ ...data, customVocabulary: [...data.customVocabulary, item] })) {
      setNewTerm('');
      setNewTranslation('');
      setNewExample('');
    }
  };

  return (
    <main className="language-dashboard">
      <header className="language-header">
        <div>
          <span className="language-eyebrow">PROGRAMA DE CAPACITAÇÃO LINGUÍSTICA</span>
          <h1>Idiomas</h1>
          <p>Treino deliberado de vocabulário, recuperação ativa e comunicação profissional.</p>
        </div>
        <div className="language-standard">
          <span>PADRÃO DE INSTRUÇÃO</span>
          <strong>Compreender · Aplicar · Revisar</strong>
        </div>
      </header>

      <section className="language-selection" aria-label="Seleção de idioma">
        {Object.entries(LANGUAGES).map(([id, item]) => (
          <button
            key={id}
            className={`language-option${data.activeLanguage === id ? ' active' : ''}`}
            aria-pressed={data.activeLanguage === id}
            onClick={() => chooseLanguage(id)}
          >
            <span className="language-option-code">{id === 'english' ? 'EN' : 'ES'}</span>
            <span className="language-option-copy"><strong>{item.name}</strong><small>{item.level}</small></span>
            <span className="language-option-state">{data.activeLanguage === id ? 'EM TREINO' : 'SELECIONAR'}</span>
          </button>
        ))}
      </section>

      <section className="language-metrics" aria-label="Indicadores de treinamento">
        <article className="language-metric"><span>VOCABULÁRIO DO MÓDULO</span><strong>{vocabulary.length}</strong><small>termos disponíveis</small></article>
        <article className="language-metric"><span>REVISÕES PENDENTES</span><strong>{dueCount}</strong><small>prioridade de hoje</small></article>
        <article className="language-metric"><span>SESSÕES CONCLUÍDAS</span><strong>{data.completedSessions}</strong><small>ciclos de treino completos</small></article>
        <article className="language-metric"><span>OBJETIVO DO CICLO</span><strong>{Math.min(SESSION_SIZE, vocabulary.length)} termos</strong><small>por sessão de recuperação ativa</small></article>
      </section>
      {saveError && <p className="language-save-error language-save-notice" role="alert">{saveError}</p>}

      <section className="language-training-grid">
        <article className="language-panel language-practice-panel">
          <div className="language-panel-heading">
            <div><span className="language-section-code">01 / INSTRUÇÃO</span><h2>Prática de recuperação</h2></div>
            {session && <span className="language-session-count">ITEM {session.index + 1} DE {session.queue.length}</span>}
          </div>
          {!session && sessionCompleted ? (
            <div className="language-session-start language-session-complete" role="status">
              <strong>Ciclo concluído. Registros de revisão atualizados.</strong>
              <p>Retorne ao treino após o intervalo indicado para reforçar a retenção.</p>
              <button className="language-primary-button" onClick={beginSession}>Iniciar novo ciclo <span aria-hidden="true">→</span></button>
            </div>
          ) : !session ? (
            <div className="language-session-start">
              <p>Recupere o significado antes de revelar a resposta. Cada ciclo prioriza os termos em revisão e consolida o aprendizado com intervalos progressivos.</p>
              <button className="language-primary-button" onClick={beginSession} disabled={vocabulary.length === 0}>Iniciar ciclo de treino <span aria-hidden="true">→</span></button>
              {vocabulary.length === 0 && <span className="language-empty-note">Adicione termos ao seu caderno para iniciar.</span>}
            </div>
          ) : currentCard ? (
            <div className="language-flashcard">
              <span className="language-card-prompt">QUAL É O SIGNIFICADO DESTE TERMO?</span>
              <h3>{currentCard.term}</h3>
              {revealed ? (
                <div className="language-card-answer">
                  <strong>{currentCard.translation}</strong>
                  {currentCard.example && <p><span>EM CONTEXTO</span>{currentCard.example}</p>}
                </div>
              ) : (
                <button className="language-reveal-button" onClick={() => setRevealed(true)}>Revelar tradução</button>
              )}
              {revealed && <div className="language-grade-actions">
                <button className="language-review-button" onClick={() => gradeCard(false)}>Revisar novamente</button>
                <button className="language-consolidate-button" onClick={() => gradeCard(true)}>Consolidado</button>
              </div>}
            </div>
          ) : null}
        </article>

        <article className="language-panel language-method-panel">
          <div className="language-panel-heading"><div><span className="language-section-code">02 / MÉTODO</span><h2>Protocolo de estudo</h2></div></div>
          <ol className="language-method-list">
            <li><span>01</span><div><strong>Recuperação antes da consulta</strong><p>Tente traduzir e formular uma frase antes de revelar a resposta.</p></div></li>
            <li><span>02</span><div><strong>Aplicação em contexto</strong><p>Leia o exemplo em voz alta e identifique o uso profissional do termo.</p></div></li>
            <li><span>03</span><div><strong>Revisão espaçada</strong><p>Consolide para ampliar o intervalo; marque revisão se ainda houver dúvida.</p></div></li>
          </ol>
        </article>
      </section>

      <section className="language-lower-grid">
        <article className="language-panel language-notebook-panel">
          <div className="language-panel-heading"><div><span className="language-section-code">03 / CADERNO PESSOAL</span><h2>Adicionar vocabulário</h2></div></div>
          <form className="language-add-form" onSubmit={addVocabulary}>
            <label>Termo ou expressão<input value={newTerm} onChange={event => setNewTerm(event.target.value)} maxLength={100} required placeholder="Ex.: operational readiness" /></label>
            <label>Significado em português<input value={newTranslation} onChange={event => setNewTranslation(event.target.value)} maxLength={160} required placeholder="Ex.: prontidão operacional" /></label>
            <label>Exemplo profissional <span>OPCIONAL</span><input value={newExample} onChange={event => setNewExample(event.target.value)} maxLength={220} placeholder="Use o termo em uma frase" /></label>
            <button className="language-secondary-button" type="submit">Incluir no caderno</button>
          </form>
        </article>

        <article className="language-panel language-vocabulary-panel">
          <div className="language-panel-heading">
            <div><span className="language-section-code">04 / BANCO DE TERMOS</span><h2>Vocabulário operacional</h2></div>
            <span className="language-bank-count">{vocabulary.length} TERMOS</span>
          </div>
          <div className="language-vocabulary-list">
            {vocabulary.map(item => {
              const itemProgress = languageProgress[item.id];
              const isDue = !itemProgress || itemProgress.nextReviewAt <= currentTime;
              return (
                <div className="language-vocabulary-row" key={item.id}>
                  <div><strong>{item.term}</strong><span>{item.translation}</span></div>
                  <span className={`language-review-status${isDue ? ' due' : ''}`}>{isDue ? 'REVISAR' : `INTERVALO ${itemProgress.interval}D`}</span>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </main>
  );
}
