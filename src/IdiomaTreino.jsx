import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { APP_DATA_PREFIX, writeAppLocalValue } from './localData.js';

const STORAGE_KEY = `${APP_DATA_PREFIX}language-training:v1`;
const SESSION_SIZE = 10;
const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
const INITIAL_TRAINING_TIME = Date.now();
const LANGUAGES = {
  english: {
    name: 'Inglês',
    nativeName: 'English',
    code: 'EN',
    locale: 'en-GB',
    country: 'REINO UNIDO',
    scene: 'london',
    direction: 'ltr',
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
    nativeName: 'Español',
    code: 'ES',
    locale: 'es-ES',
    country: 'ESPANHA',
    scene: 'madrid',
    direction: 'ltr',
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
  russian: {
    name: 'Russo',
    nativeName: 'Русский',
    code: 'RU',
    locale: 'ru-RU',
    country: 'RÚSSIA',
    scene: 'moscow',
    direction: 'ltr',
    level: 'LÍNGUA DE ALCANCE EURASIÁTICO',
    vocabulary: [
      { id: 'briefing', term: 'брифинг', translation: 'instrução; reunião informativa', example: 'Перед операцией состоялся краткий брифинг.' },
      { id: 'chain-of-command', term: 'цепь командования', translation: 'cadeia de comando', example: 'Передайте сообщение по цепи командования.' },
      { id: 'situational-awareness', term: 'осведомлённость об обстановке', translation: 'consciência situacional', example: 'Осведомлённость об обстановке важна для безопасности группы.' },
      { id: 'checkpoint', term: 'контрольный пункт', translation: 'posto de controle', example: 'Колонна остановится у следующего контрольного пункта.' },
      { id: 'accountability', term: 'подотчётность', translation: 'responsabilização; prestação de contas', example: 'Точный учёт обеспечивает подотчётность.' },
      { id: 'after-action-review', term: 'разбор действий после операции', translation: 'análise pós-ação', example: 'После задания подразделение провело разбор действий.' },
      { id: 'deployment', term: 'развёртывание', translation: 'desdobramento; mobilização', example: 'План развёртывания был обновлён.' },
      { id: 'supply-chain', term: 'цепочка поставок', translation: 'cadeia de suprimentos', example: 'Надёжная цепочка поставок поддерживает работу подразделения.' },
      { id: 'intelligence-assessment', term: 'аналитическая оценка разведданных', translation: 'avaliação de inteligência', example: 'Оценка включает только проверенную информацию.' },
      { id: 'liaison-officer', term: 'офицер связи', translation: 'oficial de ligação', example: 'Офицер связи координировал взаимодействие между подразделениями.' },
      { id: 'readiness', term: 'готовность', translation: 'prontidão', example: 'Готовность подразделения проверяется регулярно.' },
      { id: 'field-report', term: 'полевой доклад', translation: 'relatório de campo', example: 'Передайте полевой доклад до конца смены.' },
    ],
  },
  french: {
    name: 'Francês',
    nativeName: 'Français',
    code: 'FR',
    locale: 'fr-FR',
    country: 'FRANÇA',
    scene: 'paris',
    direction: 'ltr',
    level: 'LÍNGUA DE COOPERAÇÃO INTERNACIONAL',
    vocabulary: [
      { id: 'briefing', term: 'briefing', translation: 'instrução; reunião informativa', example: 'L’équipe a reçu un briefing avant le déploiement.' },
      { id: 'chain-of-command', term: 'chaîne de commandement', translation: 'cadeia de comando', example: 'Signalez le problème par la chaîne de commandement.' },
      { id: 'situational-awareness', term: 'connaissance de la situation', translation: 'consciência situacional', example: 'La connaissance de la situation est essentielle sur le terrain.' },
      { id: 'checkpoint', term: 'point de contrôle', translation: 'posto de controle', example: 'Le convoi s’arrêtera au prochain point de contrôle.' },
      { id: 'accountability', term: 'obligation de rendre compte', translation: 'responsabilização; prestação de contas', example: 'Des registres précis garantissent la traçabilité.' },
      { id: 'after-action-review', term: 'retour d’expérience', translation: 'análise pós-ação', example: 'L’unité a organisé un retour d’expérience après la mission.' },
      { id: 'deployment', term: 'déploiement', translation: 'desdobramento; mobilização', example: 'Le calendrier de déploiement a été mis à jour.' },
      { id: 'supply-chain', term: 'chaîne d’approvisionnement', translation: 'cadeia de suprimentos', example: 'La chaîne d’approvisionnement doit rester fiable.' },
      { id: 'intelligence-assessment', term: 'évaluation du renseignement', translation: 'avaliação de inteligência', example: 'L’évaluation résume les informations vérifiées.' },
      { id: 'liaison-officer', term: 'officier de liaison', translation: 'oficial de ligação', example: 'L’officier de liaison a coordonné la communication entre les unités.' },
      { id: 'readiness', term: 'état de préparation', translation: 'prontidão', example: 'L’état de préparation est vérifié chaque mois.' },
      { id: 'field-report', term: 'rapport de terrain', translation: 'relatório de campo', example: 'Transmettez le rapport de terrain avant la fin du service.' },
    ],
  },
  hebrew: {
    name: 'Hebraico',
    nativeName: 'עברית',
    code: 'HE',
    locale: 'he',
    country: 'ISRAEL',
    scene: 'jerusalem',
    direction: 'rtl',
    level: 'LÍNGUA DE COMUNICAÇÃO ESTRATÉGICA',
    vocabulary: [
      { id: 'briefing', term: 'תדריך', translation: 'instrução; reunião informativa', example: 'הצוות קיבל תדריך לפני תחילת המשימה.' },
      { id: 'chain-of-command', term: 'שרשרת הפיקוד', translation: 'cadeia de comando', example: 'יש לדווח על האירוע דרך שרשרת הפיקוד.' },
      { id: 'situational-awareness', term: 'מודעות למצב', translation: 'consciência situacional', example: 'מודעות למצב חיונית במהלך הפעילות בשטח.' },
      { id: 'checkpoint', term: 'מחסום בידוק', translation: 'posto de controle', example: 'השיירה תעצור במחסום הבידוק הבא.' },
      { id: 'accountability', term: 'אחריות ודיווח', translation: 'responsabilização; prestação de contas', example: 'תיעוד מדויק מבטיח אחריות ודיווח.' },
      { id: 'after-action-review', term: 'תחקיר לאחר פעולה', translation: 'análise pós-ação', example: 'היחידה ערכה תחקיר לאחר הפעולה.' },
      { id: 'deployment', term: 'פריסה מבצעית', translation: 'desdobramento; mobilização', example: 'לוח הזמנים של הפריסה המבצעית עודכן.' },
      { id: 'supply-chain', term: 'שרשרת אספקה', translation: 'cadeia de suprimentos', example: 'יש לשמור על שרשרת אספקה אמינה.' },
      { id: 'intelligence-assessment', term: 'הערכת מודיעין', translation: 'avaliação de inteligência', example: 'הערכת המודיעין כוללת מידע שאומת.' },
      { id: 'liaison-officer', term: 'קצין קישור', translation: 'oficial de ligação', example: 'קצין הקישור תיאם את התקשורת בין היחידות.' },
      { id: 'readiness', term: 'כשירות מבצעית', translation: 'prontidão', example: 'הכשירות המבצעית נבדקת באופן קבוע.' },
      { id: 'field-report', term: 'דוח שטח', translation: 'relatório de campo', example: 'יש להגיש את דוח השטח לפני תום המשמרת.' },
    ],
  },
};

function LanguageFlag({ languageId }) {
  const label = LANGUAGES[languageId];
  const clipId = `flag-clip-${languageId}-${useId().replaceAll(':', '')}`;
  return (
    <svg className={`academy-flag academy-flag-${languageId}`} viewBox="0 0 36 24" role="img" aria-label={`Bandeira: ${label.country}`}>
      <defs>
        <clipPath id={clipId}><rect width="36" height="24" rx="3" /></clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {languageId === 'english' && <>
          <rect width="36" height="24" fill="#17417f" />
          <path d="M0 0 36 24M36 0 0 24" stroke="#fff" strokeWidth="6" />
          <path d="M0 0 36 24M36 0 0 24" stroke="#c83245" strokeWidth="2.2" />
          <path d="M18 0v24M0 12h36" stroke="#fff" strokeWidth="9" />
          <path d="M18 0v24M0 12h36" stroke="#c83245" strokeWidth="4.2" />
        </>}
        {languageId === 'spanish' && <>
          <rect width="36" height="24" fill="#aa172a" />
          <path d="M0 6h36v12H0z" fill="#f5c842" />
          <circle cx="10" cy="12" r="2" fill="#ae242c" />
          <path d="M10 10.2v3.6M8.8 11h2.4" stroke="#f7dc96" strokeWidth=".7" />
        </>}
        {languageId === 'russian' && <>
          <rect width="36" height="8" fill="#f2f5f8" />
          <rect y="8" width="36" height="8" fill="#2854a4" />
          <rect y="16" width="36" height="8" fill="#d63c48" />
        </>}
        {languageId === 'french' && <>
          <rect width="12" height="24" fill="#244996" />
          <rect x="12" width="12" height="24" fill="#f5f5f2" />
          <rect x="24" width="12" height="24" fill="#d83f4a" />
        </>}
        {languageId === 'hebrew' && <>
          <rect width="36" height="24" fill="#fff" />
          <path d="M0 4h36v3H0zM0 17h36v3H0z" fill="#2762a8" />
          <path d="m18 8 4 7h-8zM18 16l-4-7h8z" fill="none" stroke="#2762a8" strokeWidth="1.1" />
        </>}
      </g>
      <rect x=".5" y=".5" width="35" height="23" rx="2.5" fill="none" stroke="rgba(207,231,255,.4)" />
    </svg>
  );
}

function LanguageLandmark({ languageId }) {
  const gradientId = `landmark-wash-${languageId}-${useId().replaceAll(':', '')}`;
  return (
    <svg className={`academy-landmark academy-landmark-${LANGUAGES[languageId].scene}`} viewBox="0 0 360 190" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#72d5ff" stopOpacity=".82" />
          <stop offset="1" stopColor="#1784ed" stopOpacity=".38" />
        </linearGradient>
      </defs>
      <g fill="none" stroke={`url(#${gradientId})`} strokeLinecap="round" strokeLinejoin="round">
        {languageId === 'english' && <>
          <path d="M12 178h337M24 178V94h42v84M19 94l26-15 26 15M29 79l16-29 16 29M37 66h18M36 106v17m16-17v17M37 139v24m16-24v24M31 178v-9h28v9" strokeWidth="2.2" />
          <circle cx="273" cy="134" r="39" strokeWidth="2.4" /><circle cx="273" cy="134" r="31" strokeWidth="1" />
          <path d="M273 95v78m-39-39h78m-67-27 55 55m0-55-55 55M250 96l-7-15m52 15 7-15M248 173l-6 12m63-12 7 12" strokeWidth="1.5" />
          <path d="M99 178V139h29v39m9 0v-55h23v55m-20-55 9-20 9 20m-2 0h16v55m24 0v-32h28v32" strokeWidth="1.4" />
        </>}
        {languageId === 'spanish' && <>
          <path d="M13 178h334M25 178v-51h38v51m-43-51h48l-8-10H28zM70 178V91h36v87M65 91h47l-9-12H74z" strokeWidth="2" />
          <path d="M82 78V51l6-8 6 8v27m-22 29h36m-30 15h24m-28 16h32m-29 16h26m-32 13h39" strokeWidth="1.5" />
          <path d="M137 178V111h29v67m-34-67h39l-8-11h-23zM143 110l8-18 8 18m31 68v-55h35v55m-40-55h45l-9-12h-27z" strokeWidth="1.7" />
          <path d="M251 178v-39h22v39m30 0v-60h29v60m-34-60h39l-7-10h-25z" strokeWidth="1.5" />
        </>}
        {languageId === 'russian' && <>
          <path d="M12 178h336M23 178V109h50v69m-56-69h62l-31-18zM30 109v-15h36v15m-26 0v-27m17 27V82" strokeWidth="2" />
          <path d="M87 178v-81h38v81m-43-81h48l-24-21zM95 97V86h22v11m-17 0V71m12 26V71" strokeWidth="2" />
          <path d="M143 178V91h42v87m-48-87h54l-27-27zm7 0V70h34v21m-27 0V56m20 35V56" strokeWidth="2.4" />
          <path d="M196 178v-75h39v75m-45-75h51l-25-19zm9 0V90h34v13m-26 0V76m19 27V76m22 75h46v-47h-46z" strokeWidth="2" />
          <path d="M258 126h9m9 0h9m9 0h9m-36 17h9m9 0h9m9 0h9m-38 35v-25h30v25" strokeWidth="1.3" />
        </>}
        {languageId === 'french' && <>
          <path d="M12 178h337M26 178h45m218 0h44M180 178l-22-110m22 110 22-110M158 68h44m-39 20h34m-29 21h24m-20 20h16m-13 20h10m-19 29h38" strokeWidth="2.1" />
          <path d="m158 68 22-42 22 42m-35 0-13 110m39-110 13 110M147 109h66m-60 20h54m-50 20h46m-43 20h40" strokeWidth="1.5" />
          <path d="M25 178v-32h31v32m-37-32h43m-37-9 15-15 15 15m-25 0v-18h20v18m219 56v-45h38v45m-44-45h50l-8-10h-34z" strokeWidth="1.7" />
          <path d="M286 133h7v10h-7zm17 0h7v10h-7zm-17 17h7v10h-7zm17 0h7v10h-7z" strokeWidth="1.1" />
        </>}
        {languageId === 'hebrew' && <>
          <path d="M12 178h338M23 178v-48h47v48m-53-48h59l-30-18zM31 130h31m-28 12h25m-31 12h37m-32 12h27" strokeWidth="1.9" />
          <path d="M98 178v-68h54v68m-60-68h66l-33-24zM108 110h34m-37 14h40m-40 14h40m-40 14h40m-40 14h40m-37 12v-24h34v24" strokeWidth="1.8" />
          <path d="M173 178v-47h38v47m-44-47h50l-25-20zm9 0v-12h20v12" strokeWidth="1.8" />
          <path d="M229 178v-59h61v59m-67-59h73l-36-25zM242 119v-11h35v11m-39 15h43m-43 14h43m-43 14h43m-34 16v-25h25v25" strokeWidth="2" />
          <path d="M301 178v-38h33v38m-38-38h43l-22-17z" strokeWidth="1.7" />
        </>}
      </g>
      <path d="M12 179.5h336" stroke={`url(#${gradientId})`} strokeOpacity=".35" strokeWidth="1" />
    </svg>
  );
}

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

export default function IdiomaTreino({ username = '' }) {
  const [data, setData] = useState(loadTrainingData);
  const [currentTime, setCurrentTime] = useState(INITIAL_TRAINING_TIME);
  const [session, setSession] = useState(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('language-overview');
  const [newTerm, setNewTerm] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [newExample, setNewExample] = useState('');
  const [saveError, setSaveError] = useState('');
  const languageMenuRef = useRef(null);
  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => {
    const handlePointerDown = event => {
      if (!languageMenuRef.current?.contains(event.target)) setLanguageMenuOpen(false);
    };
    const handleKeyDown = event => {
      if (event.key === 'Escape') setLanguageMenuOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  const language = LANGUAGES[data.activeLanguage];
  const vocabulary = useMemo(
    () => [...language.vocabulary, ...data.customVocabulary.filter(item => item.language === data.activeLanguage)],
    [data.customVocabulary, data.activeLanguage, language],
  );
  const languageProgress = data.progress[data.activeLanguage] || {};
  const dueCount = vocabulary.filter(item => (languageProgress[item.id]?.nextReviewAt || 0) <= currentTime).length;
  const masteredCount = vocabulary.filter(item => (languageProgress[item.id]?.repetitions || 0) > 0).length;
  const masteryPercent = vocabulary.length ? Math.round((masteredCount / vocabulary.length) * 100) : 0;
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
    setLanguageMenuOpen(false);
    save({ ...data, activeLanguage: id });
  };

  const navigateTo = id => {
    setActiveNav(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    <main className="language-dashboard academy-dashboard">
      <header className="academy-welcome" id="language-overview">
        <div>
          <span className="language-eyebrow">PROGRAMA DE CAPACITAÇÃO LINGUÍSTICA</span>
          <h1>Olá{username ? `, ${username}` : ''}.</h1>
          <p>Treine com método. Avance com consistência.</p>
        </div>
        <div className="academy-course-selector" ref={languageMenuRef}>
          <button
            className="academy-course-trigger"
            type="button"
            aria-haspopup="menu"
            aria-expanded={languageMenuOpen}
            onClick={() => setLanguageMenuOpen(open => !open)}
          >
            <LanguageFlag languageId={data.activeLanguage} />
            <span className="academy-course-label"><small>IDIOMA ATIVO</small><strong>{language.name}</strong></span>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
          </button>
          {languageMenuOpen && (
            <div className="academy-course-menu" role="menu" aria-label="Selecionar curso de idioma">
              {Object.entries(LANGUAGES).map(([id, item]) => (
                <button
                  key={id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={data.activeLanguage === id}
                  className={data.activeLanguage === id ? 'active' : ''}
                  onClick={() => chooseLanguage(id)}
                >
                  <LanguageFlag languageId={id} />
                  <span className="academy-course-code">{item.code}</span>
                  <span className="academy-course-label"><strong>{item.name}</strong><small>{item.level}</small></span>
                  {data.activeLanguage === id && <span className="academy-course-check" aria-hidden="true">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="academy-workspace">
        <nav className="academy-sidebar" aria-label="Navegação do programa de idiomas">
          <span className="academy-sidebar-heading">ÁREA DE TREINAMENTO</span>
          <button className={activeNav === 'language-overview' ? 'active' : ''} onClick={() => navigateTo('language-overview')}><span className="academy-nav-mark">01</span>Visão geral</button>
          <button className={activeNav === 'language-course' ? 'active' : ''} onClick={() => navigateTo('language-course')}><span className="academy-nav-mark">02</span>Meu curso</button>
          <button className={activeNav === 'language-practice' ? 'active' : ''} onClick={() => navigateTo('language-practice')}><span className="academy-nav-mark">03</span>Prática</button>
          <button className={activeNav === 'language-bank' ? 'active' : ''} onClick={() => navigateTo('language-bank')}><span className="academy-nav-mark">04</span>Vocabulário</button>
          <button className={activeNav === 'language-notebook' ? 'active' : ''} onClick={() => navigateTo('language-notebook')}><span className="academy-nav-mark">05</span>Caderno pessoal</button>
          <div className="academy-sidebar-note">
            <span>PRINCÍPIO DE INSTRUÇÃO</span>
            <strong>Disciplina diária. Competência duradoura.</strong>
            <i aria-hidden="true" />
          </div>
        </nav>

        <div className="academy-main-column">
          <section className={`academy-hero academy-hero-${language.scene}`}>
            <div className="academy-hero-art"><LanguageLandmark languageId={data.activeLanguage} /></div>
            <div className="academy-hero-copy">
              <span className="academy-hero-kicker">ESTUDE · PRATIQUE · AVANCE</span>
              <h2>{language.nativeName}.<br />Uma nova perspectiva.</h2>
              <p>Aprenda {language.name.toLowerCase()} com vocabulário aplicado, prática ativa e progresso acompanhado.</p>
              <button className="language-primary-button" onClick={() => navigateTo('language-practice')}>
                Iniciar treinamento <span aria-hidden="true">→</span>
              </button>
            </div>
            <div className="academy-hero-country"><LanguageFlag languageId={data.activeLanguage} /><span>{language.country}<small>{language.level}</small></span></div>
            <span className="academy-hero-index">CENTRO DE IDIOMAS / {language.code}</span>
          </section>

          <section className="language-panel academy-progress-panel" id="language-course">
            <div className="academy-panel-heading">
              <div><span className="language-section-code">CURSO EM ANDAMENTO</span><h2>{language.name} <span className="academy-level-badge">TRILHA PROFISSIONAL</span></h2></div>
              <span className="academy-progress-percent">{masteryPercent}%</span>
            </div>
            <div className="academy-progress-track" role="progressbar" aria-label={`Vocabulário de ${language.name} consolidado`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={masteryPercent}>
              <span style={{ width: `${masteryPercent}%` }} />
            </div>
            <div className="academy-progress-foot"><span>{masteredCount} de {vocabulary.length} termos consolidados</span><span>{language.level}</span></div>
            <div className="academy-course-stats">
              <div><span className="academy-stat-symbol">V</span><strong>{vocabulary.length}</strong><small>Termos no módulo</small></div>
              <div><span className="academy-stat-symbol">R</span><strong>{dueCount}</strong><small>Revisões pendentes</small></div>
              <div><span className="academy-stat-symbol">S</span><strong>{data.completedSessions}</strong><small>Ciclos concluídos</small></div>
              <div><span className="academy-stat-symbol">M</span><strong>{masteredCount}</strong><small>Termos consolidados</small></div>
            </div>
          </section>

          <section className="academy-courses-section">
            <div className="academy-section-heading"><div><span className="language-section-code">FORMAÇÃO CONTÍNUA</span><h2>Seus cursos</h2></div><span>{Object.keys(LANGUAGES).length} IDIOMAS DISPONÍVEIS</span></div>
            <div className="academy-course-grid">
              {Object.entries(LANGUAGES).map(([id, item], index) => {
                const isActive = data.activeLanguage === id;
                return (
                  <button
                    key={id}
                    className={`academy-course-card academy-course-card-${item.scene}${isActive ? ' active' : ''}`}
                    aria-pressed={isActive}
                    onClick={() => chooseLanguage(id)}
                  >
                    <span className="academy-course-card-art"><LanguageLandmark languageId={id} /></span>
                    <span className="academy-course-card-top"><LanguageFlag languageId={id} /><span>{isActive ? 'EM ANDAMENTO' : `TRILHA 0${index + 1}`}</span></span>
                    <strong>{item.name}<span className="academy-native-name" lang={item.locale} dir={item.direction}>{item.nativeName}</span></strong>
                    <small>{item.country} · {item.level}</small>
                    <span className="academy-course-card-action">{isActive ? 'Curso selecionado' : 'Acessar curso'} <span aria-hidden="true">↗</span></span>
                  </button>
                );
              })}
            </div>
          </section>

          <article className="language-panel language-practice-panel academy-practice-panel" id="language-practice">
            <div className="language-panel-heading">
              <div><span className="language-section-code">INSTRUÇÃO / 01</span><h2>Prática de recuperação</h2></div>
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
                <p>Recupere o significado antes de revelar a resposta. O ciclo prioriza termos pendentes e fortalece a retenção com intervalos progressivos.</p>
                <button className="language-primary-button" onClick={beginSession} disabled={vocabulary.length === 0}>Iniciar ciclo de treino <span aria-hidden="true">→</span></button>
                {vocabulary.length === 0 && <span className="language-empty-note">Adicione termos ao seu caderno para iniciar.</span>}
              </div>
            ) : currentCard ? (
              <div className="language-flashcard" lang={language.locale} dir={language.direction}>
                <span className="language-card-prompt">QUAL É O SIGNIFICADO DESTE TERMO?</span>
                <h3>{currentCard.term}</h3>
                {revealed ? (
                  <div className="language-card-answer">
                    <strong>{currentCard.translation}</strong>
                    {currentCard.example && <p><span>EM CONTEXTO</span><bdi lang={language.locale} dir={language.direction}>{currentCard.example}</bdi></p>}
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

          <article className="language-panel language-vocabulary-panel academy-vocabulary-panel" id="language-bank">
            <div className="language-panel-heading">
              <div><span className="language-section-code">BANCO DE TERMOS / 02</span><h2>Vocabulário operacional</h2></div>
              <span className="language-bank-count">{vocabulary.length} TERMOS</span>
            </div>
            <div className="language-vocabulary-list">
              {vocabulary.map(item => {
                const itemProgress = languageProgress[item.id];
                const isDue = !itemProgress || itemProgress.nextReviewAt <= currentTime;
                return (
                  <div className="language-vocabulary-row" key={item.id}>
                    <div><strong lang={language.locale} dir={language.direction}>{item.term}</strong><span>{item.translation}</span></div>
                    <span className={`language-review-status${isDue ? ' due' : ''}`}>{isDue ? 'REVISAR' : `INTERVALO ${itemProgress.interval}D`}</span>
                  </div>
                );
              })}
            </div>
          </article>
        </div>

        <aside className="academy-right-column" aria-label="Recursos do curso">
          <article className="academy-side-card academy-priority-card">
            <div className="academy-side-card-heading"><span className="academy-side-symbol">R</span><span>PRIORIDADE DO CICLO</span></div>
            <strong>{dueCount > 0 ? `${dueCount} termos para revisar` : 'Revisões em dia'}</strong>
            <p>{dueCount > 0 ? 'A prática regular reforça a retenção do vocabulário.' : 'Novos termos serão programados conforme seu avanço.'}</p>
            <button onClick={() => navigateTo('language-practice')}>Acessar treinamento <span aria-hidden="true">→</span></button>
          </article>

          <article className="academy-side-card academy-shortcuts">
            <div className="academy-section-heading"><div><span className="language-section-code">ACESSO RÁPIDO</span><h2>Recursos</h2></div></div>
            <button onClick={() => navigateTo('language-practice')}><span className="academy-shortcut-code">01</span><span><strong>Prática guiada</strong><small>Recuperação ativa</small></span><span aria-hidden="true">↗</span></button>
            <button onClick={() => navigateTo('language-bank')}><span className="academy-shortcut-code">02</span><span><strong>Vocabulário</strong><small>Banco de termos</small></span><span aria-hidden="true">↗</span></button>
            <button onClick={() => navigateTo('language-notebook')}><span className="academy-shortcut-code">03</span><span><strong>Caderno pessoal</strong><small>Registre novos termos</small></span><span aria-hidden="true">↗</span></button>
          </article>

          <article className="language-panel language-notebook-panel academy-notebook-panel" id="language-notebook">
            <div className="language-panel-heading"><div><span className="language-section-code">REGISTRO PESSOAL / 03</span><h2>Adicionar vocabulário</h2></div></div>
            <form className="language-add-form" onSubmit={addVocabulary}>
              <label>Termo ou expressão<input value={newTerm} onChange={event => setNewTerm(event.target.value)} maxLength={100} required placeholder="Ex.: operational readiness" /></label>
              <label>Significado<input value={newTranslation} onChange={event => setNewTranslation(event.target.value)} maxLength={160} required placeholder="Tradução em português" /></label>
              <label>Exemplo profissional<input value={newExample} onChange={event => setNewExample(event.target.value)} maxLength={220} placeholder="Opcional" /></label>
              <button className="language-secondary-button" type="submit">Incluir no caderno <span aria-hidden="true">+</span></button>
            </form>
          </article>
          {saveError && <p className="language-save-error academy-save-error" role="alert">{saveError}</p>}

          <div className="academy-doctrine-card">
            <span>PROTOCOLO DE ESTUDO</span>
            <strong>Compreender.<br />Aplicar.<br />Consolidar.</strong>
            <i aria-hidden="true" />
          </div>
        </aside>
      </div>
    </main>
  );
}
