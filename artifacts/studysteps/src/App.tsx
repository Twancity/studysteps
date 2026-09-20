import { type ChangeEvent, type DragEvent, type ReactNode, useEffect, useMemo, useRef, useState, useCallback, createContext, useContext } from 'react';
import { analyzePhoto, createPhotoHelp, createProjectPlan } from '@workspace/api-client-react';
import type { PhotoExtraction, PhotoHelpResult } from '@workspace/api-client-react';
import {
  ArrowLeft, ArrowRight, BookOpen, CalendarDays, Camera, Check, CheckCircle2,
  ChevronDown, ChevronUp, Circle, Clock3, GripVertical, HelpCircle, Home,
  Lightbulb, ListChecks, Mic, Pencil, Plus, Sparkles, Trash2, Upload, X,
  Play, Pause, Square, RotateCcw, Volume2
} from 'lucide-react';
import { Route, Switch, useLocation, useRoute, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import './index.css';

type SpeechContextType = {
  activeId: string | null;
  status: 'idle' | 'playing' | 'paused';
  play: (id: string, text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
};
const SpeechContext = createContext<SpeechContextType | null>(null);

function useSpeech() {
  const context = useContext(SpeechContext);
  if (!context) throw new Error('useSpeech must be used within a SpeechProvider');
  return context;
}

function SpeechProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'playing' | 'paused'>('idle');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const play = useCallback((id: string, text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    setActiveId(id);
    setStatus('playing');
    
    utterance.onstart = () => {
      if (utteranceRef.current === utterance) {
        setActiveId(id);
        setStatus('playing');
      }
    };
    utterance.onend = () => {
      if (utteranceRef.current === utterance) {
        utteranceRef.current = null;
        setActiveId(null);
        setStatus('idle');
      }
    };
    utterance.onpause = () => {
      if (utteranceRef.current === utterance) setStatus('paused');
    };
    utterance.onresume = () => {
      if (utteranceRef.current === utterance) setStatus('playing');
    };
    utterance.onerror = () => {
      if (utteranceRef.current === utterance) {
        utteranceRef.current = null;
        setActiveId(null);
        setStatus('idle');
      }
    };
    
    window.speechSynthesis.speak(utterance);
  }, []);

  const pause = useCallback(() => window.speechSynthesis?.pause(), []);
  const resume = useCallback(() => window.speechSynthesis?.resume(), []);
  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    utteranceRef.current = null;
    setActiveId(null);
    setStatus('idle');
  }, []);

  return (
    <SpeechContext.Provider value={{ activeId, status, play, pause, resume, stop }}>
      {children}
    </SpeechContext.Provider>
  );
}

function ReadAloud({ id, text, label = "Read to me" }: { id: string; text: string; label?: string }) {
  const { activeId, status, play, pause, resume, stop } = useSpeech();
  const isActive = activeId === id;
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  if (!isSupported) return <span className="read-unavailable" role="status">Read to Me isn’t available on this device.</span>;

  if (isActive) {
    return (
      <div className="read-aloud-controls" data-testid={`read-aloud-active-${id}`} aria-live="polite">
        {status === 'playing' ? (
          <button onClick={pause} aria-label="Pause reading" data-testid={`pause-${id}`}><Pause size={14} /> Pause</button>
        ) : (
          <button onClick={resume} aria-label="Resume reading" data-testid={`resume-${id}`}><Play size={14} /> Resume</button>
        )}
        <button onClick={() => play(id, text)} aria-label="Replay" data-testid={`replay-${id}`}><RotateCcw size={14} /> Replay</button>
        <button onClick={stop} aria-label="Stop reading" data-testid={`stop-${id}`}><Square size={14} /> Stop</button>
      </div>
    );
  }

  return (
    <button className="read-aloud-btn" onClick={() => play(id, text)} aria-label={`Read ${label}`} data-testid={`play-${id}`}>
      <Volume2 size={15} /> {label}
    </button>
  );
}

type Step = { id: string; text: string; complete: boolean };
type AssignmentStatus = 'Not Started' | 'Working On It' | 'Ready to Turn In' | 'Turned In';
type Deliverable = { id: string; text: string; complete: boolean };
type Assignment = {
  id: string; title: string; subject: string; dueDate: string; summary: string;
  steps: Step[]; createdAt: string;
  status: AssignmentStatus;
  deliverables: Deliverable[];
  turnInMethod: string;
  turnedInAt?: string;
  reminderEnabled?: boolean;
};
type Mode = 'assignment' | 'concept';
type InputMethod = 'text' | 'photo' | 'voice';
type Draft = { mode: Mode; text: string; title: string; subject: string; dueDate: string; suggestedSteps?: string[]; aiSummary?: string; deliverables?: string[]; turnInMethod?: string; };

const STORAGE_KEY = 'studysteps.assignments.v1';
const DRAFT_KEY = 'studysteps.draft.v1';
const PHOTO_HELP_KEY = 'studysteps.photo-help.v1';
const PROJECT_LAUNCHPAD_KEY = 'studysteps.project-launchpad.v1';
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const isoDate = (days: number) => {
  const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10);
};

const seedAssignments: Assignment[] = [
  {
    status: 'Working On It', deliverables: [{ id: 'd1', text: 'Completed poster', complete: true }], turnInMethod: 'Turn-in method not provided',
    id: 'sample-science', title: 'Ecosystem food web poster', subject: 'Science',
    dueDate: isoDate(1), summary: 'Create a clear poster showing how energy moves through an ecosystem.',
    createdAt: new Date().toISOString(),
    steps: [
      { id: 's1', text: 'Choose one ecosystem for the poster', complete: true },
      { id: 's2', text: 'List 8–10 organisms that live there', complete: true },
      { id: 's3', text: 'Label each producer, consumer, or decomposer', complete: false },
      { id: 's4', text: 'Draw arrows to show the direction of energy', complete: false },
      { id: 's5', text: 'Check the rubric and add final labels', complete: false },
    ],
  },
  {
    id: 'sample-english', status: 'Not Started', deliverables: [{ id: 'd2', text: 'Written paragraph', complete: false }], turnInMethod: 'Turn-in method not provided', title: 'Character analysis paragraph', subject: 'English',
    dueDate: isoDate(4), summary: 'Write one supported paragraph about how a character changes.',
    createdAt: new Date().toISOString(),
    steps: [
      { id: 'e1', text: 'Choose the character and one important change', complete: false },
      { id: 'e2', text: 'Find two quotes that show the change', complete: false },
      { id: 'e3', text: 'Write a topic sentence', complete: false },
      { id: 'e4', text: 'Explain how each quote supports your idea', complete: false },
      { id: 'e5', text: 'Revise for clarity and proofread', complete: false },
    ],
  },
  {
    id: 'sample-math', status: 'Turned In', turnedInAt: new Date().toISOString(), deliverables: [{ id: 'd3', text: 'Completed worksheet', complete: true }], turnInMethod: 'Turn-in method not provided', title: 'Fractions practice set', subject: 'Math',
    dueDate: isoDate(-1), summary: 'Complete and check the assigned fraction problems.',
    createdAt: new Date().toISOString(),
    steps: [
      { id: 'm1', text: 'Review the common denominator example', complete: true },
      { id: 'm2', text: 'Complete problems 1–10', complete: true },
      { id: 'm3', text: 'Check answers and correct mistakes', complete: true },
    ],
  },
];

function useAssignments() {
  const [items, setItems] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) {
          localStorage.setItem(`${STORAGE_KEY}.recovery`, saved);
          return seedAssignments;
        }
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const migrated = parsed.map((a: any) => {
          let status = a.status;
          if (!status) {
            status = a.steps?.length && a.steps.every((s: any) => s.complete) ? 'Ready to Turn In' : (a.steps?.some((s: any) => s.complete) ? 'Working On It' : 'Not Started');
          }
          return {
            ...a,
            status,
            deliverables: a.deliverables || [],
            turnInMethod: a.turnInMethod || 'Turn-in method not provided',
            turnedInAt: a.turnedInAt,
            reminderEnabled: a.reminderEnabled || false
          } as Assignment;
        }).filter((a: Assignment) => {
          if (a.status === 'Turned In' && a.turnedInAt) {
            const turnedInTime = new Date(a.turnedInAt).getTime();
            return Number.isNaN(turnedInTime) || (now - turnedInTime) < THIRTY_DAYS;
          }
          return true;
        });
        return migrated;
      } catch {
        localStorage.setItem(`${STORAGE_KEY}.recovery`, saved);
      }
    }
    return seedAssignments;
  });
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(items)), [items]);
  useEffect(() => {
    const removeExpired = () => {
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      setItems(current => current.filter(a => {
        if (a.status !== 'Turned In' || !a.turnedInAt) return true;
        const turnedInTime = new Date(a.turnedInAt).getTime();
        return Number.isNaN(turnedInTime) || turnedInTime > cutoff;
      }));
    };
    removeExpired();
    const timer = window.setInterval(removeExpired, 60 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);
  return { items, setItems };
}

function useReminders(assignments: Assignment[]) {
  const notified = useRef(new Set<string>());
  
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const checkDueWork = () => {
      assignments.forEach(a => {
        if (a.reminderEnabled && a.status !== 'Turned In') {
          const days = daysRemaining(a.dueDate);
          const reminderKey = `${a.id}:${a.dueDate}:${days}`;
          if (days <= 1 && !notified.current.has(reminderKey)) {
            notified.current.add(reminderKey);
            new Notification('StudySteps Reminder', {
              body: days < 0 ? `'${a.title}' is overdue.` : `'${a.title}' is due ${days === 0 ? 'today' : 'tomorrow'}.`
            });
          }
        }
      });
    };
    checkDueWork();
    const timer = window.setInterval(checkDueWork, 60 * 1000);
    return () => window.clearInterval(timer);
  }, [assignments]);
}

const deriveDeliverablesAndMethod = (text: string) => {
  const input = text.toLowerCase();
  const deliverables: string[] = [];
  const explicitlyRequires = (item: string) => new RegExp(
    `\\b(?:write|create|make|build|complete|prepare|submit|turn in|hand in|upload|bring|present|include|provide)\\b[^.!?\\n]{0,80}\\b(?:${item})\\b|\\b(?:${item})\\b[^.!?\\n]{0,50}\\b(?:is required|must be submitted|must be turned in|due)\\b`,
    'i'
  ).test(input);
  if (explicitlyRequires('essay|paper|report')) deliverables.push('Written paper or report');
  else if (explicitlyRequires('paragraph')) deliverables.push('Written paragraph');
  if (explicitlyRequires('slides?|slideshow|powerpoint|google slides')) deliverables.push('Presentation slides');
  else if (explicitlyRequires('presentation')) deliverables.push('Class presentation');
  if (explicitlyRequires('poster|display board')) deliverables.push('Completed poster');
  if (explicitlyRequires('worksheet|packet')) deliverables.push('Completed worksheet');
  if (explicitlyRequires('video|recording')) deliverables.push('Video recording');
  if (explicitlyRequires('works cited|bibliography|reference list|citations?')) deliverables.push('Required sources and citations');
  if (explicitlyRequires('photo|image')) deliverables.push('Required photo or image');

  let turnInMethod = 'Turn-in method not provided';
  const namedSystem = input.match(/\b(?:submit|upload|turn in|hand in)\b[^.!?\n]{0,50}\b(google classroom|canvas|blackboard|schoology)\b|\b(google classroom|canvas|blackboard|schoology)\b[^.!?\n]{0,50}\b(?:submit|upload|turn in|hand in)\b/i);
  const systemName = namedSystem?.[1] || namedSystem?.[2];
  if (systemName) {
    turnInMethod = `Submit through ${systemName.replace(/\b\w/g, letter => letter.toUpperCase())}`;
  } else if (/\b(?:upload|submit online)\b[^.!?\n]{0,60}\b(?:assignment|work|file|photo|image|essay|report|slides?|presentation)\b|\b(?:assignment|work|file|photo|image|essay|report|slides?|presentation)\b[^.!?\n]{0,60}\b(?:upload|submit online)\b/.test(input)) {
    turnInMethod = 'Upload online';
  } else if (/\bbring\b[^.!?\n]{0,60}\bclass\b|\bclass\b[^.!?\n]{0,60}\bbring\b/.test(input)) {
    turnInMethod = 'Bring to class';
  } else if (/\b(?:hand|turn)\s+in\b[^.!?\n]{0,60}\b(?:teacher|class|assignment|work|paper|worksheet|project)\b/.test(input)) {
    turnInMethod = 'Hand to teacher';
  } else if (/\bpresent(?:ation)?\s+in\s+class\b/.test(input)) {
    turnInMethod = 'Present in class';
  } else if (/\b(?:email|send)\b[^.!?\n]{0,60}\b(?:assignment|work|file|photo|image|essay|report|slides?|presentation|teacher)\b|\b(?:assignment|work|file|photo|image|essay|report|slides?|presentation)\b[^.!?\n]{0,60}\b(?:email|send)\b/.test(input)) {
    turnInMethod = 'Email to teacher';
  }

  return { deliverables, turnInMethod };
};

const progress = (a: Assignment) => {
  const items = [...a.steps, ...a.deliverables];
  return items.length ? Math.round((items.filter(item => item.complete).length / items.length) * 100) : 0;
};
const nextStep = (a: Assignment) =>
  a.steps.find(s => !s.complete)?.text ??
  a.deliverables.find(d => !d.complete)?.text ??
  'All work complete';
const daysRemaining = (date: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(`${date}T00:00:00`);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
};
const dueLabel = (date: string) => {
  const days = daysRemaining(date);
  if (days < 0) return `Due ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due ${new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
};

function Shell({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const { stop } = useSpeech();
  
  useEffect(() => {
    stop();
  }, [location, stop]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate('/')} aria-label="StudySteps home">
          <span className="brand-mark"><ListChecks size={22} /></span>
          <span>StudySteps</span>
        </button>
        <div className="principle"><Sparkles size={15} /> You review. You decide.</div>
      </header>
      <main>{children}</main>
      <nav className="bottom-nav" aria-label="Main navigation">
        <button className={location === '/' && !location.startsWith('/assignments') ? 'active' : ''} onClick={() => navigate('/')}><Home /><span>Dashboard</span></button>
        <button className={location === '/done-due' ? 'active' : ''} onClick={() => navigate('/done-due')} data-testid="nav-done-due"><Clock3 /><span>Done & Due</span></button>
        <button className={location.startsWith('/help') || location === '/review' ? 'active help-nav' : 'help-nav'} onClick={() => navigate('/help')}><Plus /><span>Get Help</span></button>
      </nav>
    </div>
  );
}

function Dashboard({ assignments }: { assignments: Assignment[] }) {
  const [, navigate] = useLocation();
  const complete = assignments.filter(a => a.status === 'Turned In');
  const active = assignments.filter(a => a.status !== 'Turned In');
  const today = active.filter(a => daysRemaining(a.dueDate) <= 1);
  const upcoming = active.filter(a => daysRemaining(a.dueDate) > 1);
  return (
    <div className="page dashboard-page">
      <section className="welcome">
        <div>
          <p className="eyebrow">YOUR STUDY SPACE</p>
          <h1>What’s your next step?</h1>
          <p>Turn confusing schoolwork into clear next steps.</p>
        </div>
        <button className="primary big-action" onClick={() => navigate('/help')}><Sparkles /> Get Help <ArrowRight /></button>
      </section>
      <div className="integrity-note"><Lightbulb /><span><strong>You’re in charge.</strong> StudySteps helps you understand and plan your own work—it won’t complete graded work for you.</span></div>
      {assignments.length === 0 ? (
        <section className="empty-state"><div className="empty-icon"><BookOpen /></div><h2>Nothing on your list yet</h2><p>Bring in an assignment or a concept that feels confusing. We’ll find a clear place to start.</p><button className="primary" onClick={() => navigate('/help')}>Get your first steps</button></section>
      ) : <>
        <AssignmentSection title="Today" count={today.length} items={today} empty="Nothing urgent today. Nice!" onOpen={id => navigate(`/assignments/${id}`)} />
        <AssignmentSection title="Upcoming" count={upcoming.length} items={upcoming} empty="No upcoming assignments." onOpen={id => navigate(`/assignments/${id}`)} />
        <AssignmentSection title="Completed" count={complete.length} items={complete} empty="Completed work will show here." onOpen={id => navigate(`/assignments/${id}`)} completed />
      </>}
    </div>
  );
}

function AssignmentSection({ title, count, items, empty, onOpen, completed = false }: { title: string; count: number; items: Assignment[]; empty: string; onOpen: (id: string) => void; completed?: boolean }) {
  return (
    <section className="assignment-section">
      <div className="section-title"><h2>{title}</h2><span>{count}</span></div>
      {items.length === 0 ? <p className="small-empty">{empty}</p> :
        <div className="card-grid">{items.map(a => <AssignmentCard key={a.id} assignment={a} onClick={() => onOpen(a.id)} completed={completed} />)}</div>}
    </section>
  );
}

function AssignmentCard({ assignment: a, onClick, completed }: { assignment: Assignment; onClick: () => void; completed: boolean }) {
  const pct = progress(a);
  return (
    <button className={`assignment-card ${completed ? 'completed' : ''}`} onClick={onClick}>
      <div className="card-top"><span className={`subject subject-${a.subject.toLowerCase()}`}>{a.subject}</span><span className="due"><CalendarDays />{dueLabel(a.dueDate)}</span></div>
      <h3>{a.title}</h3>
      <div className="progress-row"><div className="progress-track"><span style={{ width: `${pct}%` }} /></div><strong>{pct}%</strong></div>
      <div className="next-row">{completed ? <><CheckCircle2 /> Finished</> : <><ArrowRight /><span><small>NEXT STEP</small>{nextStep(a)}</span></>}</div>
    </button>
  );
}

function GetHelp() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<Mode>('assignment');
  const [method, setMethod] = useState<InputMethod>('text');
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('English');
  const [dueDate, setDueDate] = useState(isoDate(3));
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [extraction, setExtraction] = useState<PhotoExtraction | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingHelp, setGeneratingHelp] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'error' | 'unsupported'>('idle');
  const [voiceErrorText, setVoiceErrorText] = useState('');
  const recognition = useRef<any>(null);
  const recognitionSession = useRef(0);
  const previousMode = useRef(mode);
  const photoGeneration = useRef(0);
  const analysisGeneration = useRef(0);

  const [isDragging, setIsDragging] = useState(false);
  const onDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handlePhotoFile(file);
  };

  const handlePhotoFile = (file: File) => {
    const generation = ++photoGeneration.current;
    analysisGeneration.current += 1;
    setAnalyzing(false);
    setPhotoError('');
    setExtraction(null);
    const extension = file.name.split('.').pop()?.toLowerCase();
    const supportedType = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.type);
    const supportedExtension = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(extension ?? '');
    if (!supportedType && !supportedExtension) {
      setPhotoError('That file type is not supported. Choose a JPEG, PNG, WebP, HEIC, or HEIF image.');
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => {
      if (photoGeneration.current === generation) setPhotoError('We couldn’t open that image. Try another photo or type the directions below.');
    };
    reader.onload = () => {
      if (photoGeneration.current === generation) setPhoto(String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePhotoFile(file);
    e.target.value = '';
  };
  const analyzeSelectedPhoto = async () => {
    if (!photo) return;
    const requestGeneration = ++analysisGeneration.current;
    const photoAtRequest = photo;
    setAnalyzing(true);
    setPhotoError('');
    try {
      const result = await analyzePhoto({ imageDataUrl: photoAtRequest, studentRequest: text.trim(), selectedMode: mode });
      if (analysisGeneration.current !== requestGeneration || photoGeneration.current < 1) return;
      setExtraction(result);
      if (!result.readable) setPhotoError(result.note || 'Some of this photo may be hard to read. Correct the text below or try a clearer photo.');
    } catch {
      if (analysisGeneration.current === requestGeneration) setPhotoError('We couldn’t understand that photo right now. Try a JPEG, PNG, or WebP image, retake it more clearly, or type the schoolwork below.');
    } finally {
      if (analysisGeneration.current === requestGeneration) setAnalyzing(false);
    }
  };
  const approveExtraction = async () => {
    if (!extraction) return;
    setGeneratingHelp(true);
    setPhotoError('');
    try {
      const help = await createPhotoHelp({ extraction, studentRequest: text.trim() });
      if (help.kind === 'assignment_project') {
        sessionStorage.setItem(PROJECT_LAUNCHPAD_KEY, JSON.stringify({ extraction, help, dueDate }));
        navigate('/project-launchpad');
      } else {
        sessionStorage.setItem(PHOTO_HELP_KEY, JSON.stringify({ extraction, help, dueDate }));
        navigate('/photo-help');
      }
    } catch {
      setPhotoError('We read the photo, but couldn’t create the learning help. Try again or use the corrected text with typed help.');
    } finally {
      setGeneratingHelp(false);
    }
  };
  const stopVoice = () => {
    recognitionSession.current += 1;
    const activeRecognition = recognition.current;
    recognition.current = null;
    activeRecognition?.abort();
    setVoiceState('idle');
  };

  useEffect(() => {
    if (method !== 'voice' && recognition.current) stopVoice();
  }, [method]);
  useEffect(() => {
    if (previousMode.current !== mode && recognition.current) stopVoice();
    previousMode.current = mode;
  }, [mode]);
  useEffect(() => () => {
    recognitionSession.current += 1;
    recognition.current?.abort();
    recognition.current = null;
  }, []);

  const startVoice = () => {
    if (recognition.current) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { 
      setVoiceState('unsupported'); 
      setVoiceErrorText('Voice typing isn’t supported in this browser. You can type or paste your schoolwork instead.'); 
      return; 
    }
    try {
      const session = ++recognitionSession.current;
      const r = new SpeechRecognition();
      recognition.current = r; 
      r.continuous = true; 
      r.interimResults = true;
      setVoiceState('listening');
      setVoiceErrorText('');
      r.onstart = () => {
        if (recognitionSession.current === session && recognition.current === r) setVoiceState('listening');
      };
      r.onresult = (e: any) => { 
        if (recognitionSession.current !== session || recognition.current !== r) return;
        let finalTranscript = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            finalTranscript += e.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setText(prev => {
            const current = prev.trim();
            return current ? `${current} ${finalTranscript.trim()}` : finalTranscript.trim();
          });
        }
      };
      r.onerror = (e: any) => { 
        if (recognitionSession.current !== session || recognition.current !== r) return;
        setVoiceState('error');
        setVoiceErrorText(e.error === 'not-allowed' ? 'Microphone access denied. Please allow microphone access or type your schoolwork below.' : 'We couldn’t hear that clearly. Try again, or type your schoolwork below.');
      };
      r.onend = () => { 
        if (recognitionSession.current !== session || recognition.current !== r) return;
        setVoiceState(prev => prev === 'listening' ? 'idle' : prev);
        recognition.current = null;
      }; 
      r.start();
    } catch (err) {
      recognitionSession.current += 1;
      recognition.current = null;
      setVoiceState('error');
      setVoiceErrorText('We couldn’t start the microphone. Try typing your schoolwork instead.');
    }
  };
  const continueToReview = () => {
    const derived = deriveDeliverablesAndMethod(text);
    const draft: Draft = { mode, text: text.trim(), title: title.trim() || text.trim().split(/[.!?\n]/)[0].slice(0, 55), subject, dueDate, deliverables: derived.deliverables, turnInMethod: derived.turnInMethod };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); navigate('/review');
  };
  const canContinue = text.trim().length >= 10;
  return (
    <div className="page narrow">
      <button className="back" onClick={() => navigate('/')}><ArrowLeft /> Dashboard</button>
      <div className="page-heading"><p className="eyebrow">GET UNSTUCK</p><h1>What do you need help with?</h1><p>Choose the kind of help that fits right now.</p></div>
      <div className="mode-grid">
        <button className={`mode-card ${mode === 'assignment' ? 'selected' : ''}`} onClick={() => setMode('assignment')}><span className="mode-icon coral"><ListChecks /></span><span><strong>Break Down My Assignment</strong><small>Turn a project or homework task into manageable steps.</small></span><span className="radio">{mode === 'assignment' && <Check />}</span></button>
        <button className={`mode-card ${mode === 'concept' ? 'selected' : ''}`} onClick={() => setMode('concept')}><span className="mode-icon yellow"><Lightbulb /></span><span><strong>Help Me Understand</strong><small>Get a simpler explanation, example, and quick check.</small></span><span className="radio">{mode === 'concept' && <Check />}</span></button>
      </div>
      <section className="form-card">
        <h2>{mode === 'assignment' ? 'Share your assignment' : 'What feels confusing?'}</h2>
        <div className="method-tabs" role="tablist" aria-label="Input method">
          <button role="tab" aria-selected={method === 'text'} className={method === 'text' ? 'active' : ''} onClick={() => setMethod('text')}><Pencil /> Type or paste</button>
          <button role="tab" aria-selected={method === 'photo'} className={method === 'photo' ? 'active' : ''} onClick={() => setMethod('photo')}><Camera /> Photo</button>
          <button role="tab" aria-selected={method === 'voice'} className={method === 'voice' ? 'active' : ''} onClick={() => setMethod('voice')}><Mic /> Tell StudySteps</button>
        </div>
        {method === 'photo' && <div className="input-panel">
          {photo ? <div className="photo-preview" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
            <img src={photo} alt="Selected schoolwork preview" onError={() => { setPhoto(null); setPhotoError('This device can’t preview that image format. Try a JPEG or PNG instead.'); }} />
            <div className="photo-preview-actions">
              <label className="replace-photo"><Upload /><span>Replace photo</span><input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" onChange={handlePhoto} data-testid="input-replace-photo" /></label>
              <button onClick={() => { photoGeneration.current += 1; analysisGeneration.current += 1; setAnalyzing(false); setPhoto(null); setExtraction(null); setPhotoError(''); }} aria-label="Remove photo" data-testid="button-remove-photo"><X /><span>Remove</span></button>
            </div>
          </div> :
            <div 
              className={`photo-source-panel ${isDragging ? 'dragging' : ''}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              data-testid="photo-dropzone"
            >
              <div className="photo-source-heading"><Camera /><div><strong>Add a photo of your schoolwork</strong><span>Use a clear, well-lit picture of the whole page. <span className="drop-copy">Or drag and drop it here.</span></span></div></div>
              <div className="photo-source-actions">
                <label className="photo-source-button camera-choice"><Camera /><span><strong>Take photo</strong><small>Open your camera</small></span><input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" capture="environment" onChange={handlePhoto} data-testid="input-take-photo" /></label>
                <label className="photo-source-button"><Upload /><span><strong>Choose photo</strong><small>Browse your device</small></span><input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" onChange={handlePhoto} data-testid="input-choose-photo" /></label>
              </div>
            </div>}
          {photoError && <div className="photo-input-error" role="alert"><HelpCircle /><span>{photoError}</span></div>}
          {!extraction && <div className="photo-ready-note"><Sparkles /><span><strong>Your photo will guide the help.</strong> We’ll read the visible directions and problems, then ask you to review what we found.</span></div>}
          {photo && !extraction && <button className="primary full photo-analyze-button" disabled={analyzing} onClick={analyzeSelectedPhoto}>{analyzing ? 'Reading your schoolwork…' : <><Sparkles /> Understand this photo</>}</button>}
          {extraction && <section className="extraction-review">
            <div className="extraction-heading"><span><Sparkles /></span><div><p className="eyebrow">PHOTO REVIEW</p><h3>Here’s what I found in your photo</h3><p>Correct anything that was misread before StudySteps creates help.</p></div></div>
            <div className="extraction-meta">
              <label className="field"><span>Type of schoolwork</span><select value={extraction.kind} onChange={e => setExtraction({ ...extraction, kind: e.target.value as PhotoExtraction['kind'] })}><option value="worksheet_problem">Worksheet or problems</option><option value="assignment_project">Assignment or project</option><option value="concept_topic">Concept or topic</option></select></label>
              <label className="field"><span>Grade clues</span><input value={extraction.gradeLevel} onChange={e => setExtraction({ ...extraction, gradeLevel: e.target.value })} /></label>
              <label className="field"><span>Subject</span><input value={extraction.subject} onChange={e => setExtraction({ ...extraction, subject: e.target.value })} /></label>
            </div>
            <label className="field"><span>Worksheet title</span><input value={extraction.title} onChange={e => setExtraction({ ...extraction, title: e.target.value })} /></label>
            <label className="field"><span>Directions</span><textarea rows={3} value={extraction.directions} onChange={e => setExtraction({ ...extraction, directions: e.target.value })} /></label>
            <label className="field"><span>Questions, equations, or visible content</span><textarea rows={7} value={extraction.visibleContent} onChange={e => setExtraction({ ...extraction, visibleContent: e.target.value })} /></label>
            <label className="field"><span>Skill or topic</span><input value={extraction.skill} onChange={e => setExtraction({ ...extraction, skill: e.target.value })} /></label>
            <label className="field"><span>Important requirements</span><textarea rows={3} value={extraction.requirements.join('\n')} onChange={e => setExtraction({ ...extraction, requirements: e.target.value.split('\n').filter(Boolean) })} placeholder="One requirement per line" /></label>
            <button className="primary full" disabled={generatingHelp || !extraction.visibleContent.trim()} onClick={approveExtraction}>{generatingHelp ? 'Building the right kind of help…' : <><Check /> Approve and create help</>}</button>
            <p className="never-auto"><CheckCircle2 /> You control the corrected text. Nothing is saved automatically.</p>
          </section>}
        </div>}
        {method === 'voice' && (
          <div className="input-panel voice-panel">
            {voiceState === 'listening' ? (
              <div className="voice-active">
                <div className="listening-indicator">
                  <span className="pulse"></span>
                  <strong>Listening...</strong>
                </div>
                <button className="primary danger" onClick={stopVoice} data-testid="button-stop-voice"><Square size={16} /> Stop Listening</button>
              </div>
            ) : (
              <button className="voice-button" onClick={startVoice} data-testid="button-start-voice">
                <Mic /> Tell StudySteps
              </button>
            )}
            {(voiceState === 'error' || voiceState === 'unsupported') && <p role="status" className="voice-error"><HelpCircle size={16} /> {voiceErrorText}</p>}
            <p className="muted-copy">Tell StudySteps what you need help with. Voice uses your browser’s built-in speech recognition. You can always edit the words below.</p>
          </div>
        )}
        <label className="field"><span>{mode === 'assignment' ? 'Assignment directions' : 'Concept or question'}</span><textarea value={text} onChange={e => setText(e.target.value)} rows={7} placeholder={mode === 'assignment' ? 'Paste the directions here, or explain what your teacher asked you to do…' : 'Example: I don’t understand why seasons happen…'} /><small>{text.length} characters · Include enough detail for useful steps.</small></label>
        {mode === 'assignment' && <div className="details-grid">
          <label className="field"><span>Assignment name</span><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Example: History presentation" /></label>
          <label className="field"><span>Subject</span><select value={subject} onChange={e => setSubject(e.target.value)}><option>English</option><option>Math</option><option>Science</option><option>History</option><option>World Language</option><option>Arts</option><option>Other</option></select></label>
          <label className="field"><span>Due date</span><input type="date" value={dueDate} min={isoDate(0)} onChange={e => setDueDate(e.target.value)} /></label>
        </div>}
        {method !== 'photo' && <button className="primary full" disabled={!canContinue} onClick={continueToReview}>Create a draft to review <ArrowRight /></button>}
        {method !== 'photo' && !canContinue && <p className="form-hint">Add at least a sentence so StudySteps has something to work with.</p>}
      </section>
      <div className="integrity-note compact"><HelpCircle /><span>We’ll suggest a starting point—not produce answers to turn in. You’ll review everything before deciding what to keep.</span></div>
    </div>
  );
}

const buildSteps = (draft: Draft): Step[] => {
  if (draft.suggestedSteps?.length) {
    return draft.suggestedSteps.map(text => ({ id: uid(), text, complete: false }));
  }
  const input = draft.text.toLowerCase();
  const numberWords: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  };
  const readNumber = (value?: string) => value
    ? (Number.isNaN(Number(value)) ? numberWords[value] : Number(value))
    : undefined;
  const sourceMatch = input.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:credible\s+|reliable\s+)?sources?\b/);
  const minuteMatch = input.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)[-\s]minute\b/);
  const slideMatch = input.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+slides?\b/);
  const pageMatch = input.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)[-\s]pages?\b/);
  const wordMatch = input.match(/\b(\d{2,4})[-\s]words?\b/);
  const sourceCount = readNumber(sourceMatch?.[1]);
  const minutes = readNumber(minuteMatch?.[1]);
  const slides = readNumber(slideMatch?.[1]);
  const pages = readNumber(pageMatch?.[1]);
  const words = readNumber(wordMatch?.[1]);
  const hasPresentation = /\b(present|presentation|speech|talk)\b/.test(input);
  const hasResearch = Boolean(sourceCount) || /\b(research|sources?|bibliography|works cited|citations?)\b/.test(input);
  const hasEssay = /\b(essay|paper|paragraph|report)\b/.test(input);
  const hasSlides = Boolean(slides) || /\b(slides?|slideshow|powerpoint|google slides)\b/.test(input);
  const hasPoster = /\bposter|display board\b/.test(input);

  const steps: string[] = ['Review the directions and make a checklist of every requirement'];

  if (sourceCount) {
    steps.push(`Find ${sourceCount} credible source${sourceCount === 1 ? '' : 's'} and record the citation details`);
  } else if (hasResearch) {
    steps.push('Find credible sources and record the citation details');
  } else {
    steps.push('Gather the notes, examples, and materials you will need');
  }

  if (hasResearch) {
    steps.push('Organize the research into the main ideas you want to explain');
  } else {
    steps.push('Organize your main ideas before creating the final work');
  }

  if (hasEssay) {
    const length = pages ? ` for the ${pages}-page requirement` : words ? ` for the ${words}-word requirement` : '';
    steps.push(`Create a short outline${length}`);
    steps.push('Write the first draft using your notes and evidence');
  } else if (hasSlides) {
    steps.push(`Create the ${slides ? `${slides} ` : ''}slides with clear points and helpful visuals`);
  } else if (hasPoster) {
    steps.push('Create the poster with clear sections, labels, and helpful visuals');
  } else if (hasPresentation) {
    steps.push('Create the presentation content from your organized research');
  } else {
    steps.push('Create a first version of the project one section at a time');
  }

  if (hasPresentation) {
    steps.push(`Prepare what you will say for the ${minutes ? `${minutes}-minute ` : ''}presentation`);
    steps.push(`Practice the presentation${minutes ? ` with a timer until it is close to ${minutes} minutes` : ' out loud and revise unclear parts'}`);
  }

  steps.push('Review the finished work against every assignment requirement');
  return steps.map(text => ({ id: uid(), text, complete: false }));
};

function Review({ saveAssignment }: { saveAssignment: (a: Assignment) => void }) {
  const [, navigate] = useLocation();
  const draft = useMemo<Draft | null>(() => { try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null'); } catch { return null; } }, []);
  const [steps, setSteps] = useState<Step[]>(() => draft ? buildSteps(draft) : []);
  const [title, setTitle] = useState(draft?.title || '');
  const [subject, setSubject] = useState(draft?.subject || 'Other');
  const [dueDate, setDueDate] = useState(draft?.dueDate || isoDate(3));
  if (!draft) return <div className="page narrow empty-state"><h1>No draft to review</h1><p>Start by telling us what you need help with.</p><button className="primary" onClick={() => navigate('/help')}>Go to Get Help</button></div>;
  if (draft.mode === 'concept') return <ConceptReview draft={draft} />;
  const update = (id: string, text: string) => setSteps(v => v.map(s => s.id === id ? { ...s, text } : s));
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction; if (target < 0 || target >= steps.length) return;
    setSteps(v => { const n = [...v]; [n[index], n[target]] = [n[target], n[index]]; return n; });
  };
  const approve = () => {
    const clean = steps.filter(s => s.text.trim()).map(s => ({ ...s, text: s.text.trim() }));
    if (!clean.length || !title.trim()) return;
    const a: Assignment = { 
      id: uid(), title: title.trim(), subject, dueDate, summary: `A step-by-step plan for: ${draft.text.slice(0, 180)}${draft.text.length > 180 ? '…' : ''}`, steps: clean, createdAt: new Date().toISOString(),
      status: 'Not Started',
      deliverables: draft.deliverables ? draft.deliverables.map(d => ({ id: uid(), text: d, complete: false })) : [],
      turnInMethod: draft.turnInMethod || 'Turn-in method not provided'
    };
    saveAssignment(a); sessionStorage.removeItem(DRAFT_KEY); navigate(`/assignments/${a.id}`);
  };
  return (
    <div className="page narrow review-page">
      <button className="back" onClick={() => navigate('/help')}><ArrowLeft /> Edit what I shared</button>
      <div className="review-banner"><span><Sparkles /></span><div><p className="eyebrow">DRAFT FOR YOUR REVIEW</p><h1>Here’s a possible plan</h1><p>Change anything that doesn’t fit. Nothing is saved until you approve it.</p></div></div>
      <section className="review-card">
        <div className="review-title" style={{ marginBottom: '10px' }}>
          <h2>Plain-language summary</h2>
          <ReadAloud id="review-summary" text={draft.aiSummary || `You’re being asked to complete ${title || 'this assignment'}. The easiest way forward is to identify exactly what the final result needs, gather what you need, and work through one small part at a time.`} />
        </div>
        <p>{draft.aiSummary || <>You’re being asked to complete <strong>{title || 'this assignment'}</strong>. The easiest way forward is to identify exactly what the final result needs, gather what you need, and work through one small part at a time.</>}</p>
      </section>
      <section className="review-card">
        <div className="review-title"><div><p className="eyebrow">SUGGESTED STEPS</p><h2>Make this plan yours</h2></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ReadAloud id="review-steps" text={`Suggested steps. ${steps.map(s => s.text).join('. ')}`} label="Read steps" />
            <span>{steps.length} steps</span>
          </div>
        </div>
        <div className="start-here"><ArrowRight /><span><small>START HERE</small>{steps[0]?.text}</span></div>
        <ol className="editable-steps">
          {steps.map((step, i) => <li key={step.id}>
            <GripVertical className="grip" aria-hidden />
            <span className="step-number">{i + 1}</span>
            <input aria-label={`Step ${i + 1}`} value={step.text} onChange={e => update(step.id, e.target.value)} />
            <div className="step-actions">
              <button disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move step ${i + 1} up`}><ChevronUp /></button>
              <button disabled={i === steps.length - 1} onClick={() => move(i, 1)} aria-label={`Move step ${i + 1} down`}><ChevronDown /></button>
              <button onClick={() => setSteps(v => v.filter(s => s.id !== step.id))} aria-label={`Delete step ${i + 1}`}><Trash2 /></button>
            </div>
          </li>)}
        </ol>
        <button className="secondary add-step" onClick={() => setSteps(v => [...v, { id: uid(), text: '', complete: false }])}><Plus /> Add a step</button>
      </section>
      <section className="review-card">
        <h2>Assignment details</h2>
        <div className="details-grid">
          <label className="field"><span>Name</span><input value={title} onChange={e => setTitle(e.target.value)} /></label>
          <label className="field"><span>Subject</span><select value={subject} onChange={e => setSubject(e.target.value)}><option>English</option><option>Math</option><option>Science</option><option>History</option><option>World Language</option><option>Arts</option><option>Other</option></select></label>
          <label className="field"><span>Due date</span><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></label>
        </div>
      </section>
      <div className="approval-box"><div><strong>Ready to use this plan?</strong><span>Approving saves it to your Dashboard. You can still edit it later.</span></div><button className="primary" onClick={approve} disabled={!title.trim() || !steps.some(s => s.text.trim())}><Check /> Approve Plan</button></div>
      <p className="never-auto"><CheckCircle2 /> AI suggestions are never saved automatically.</p>
    </div>
  );
}

type ConceptGuide = {
  heading: string;
  explanation: string[];
  keyIdeas: string[];
  analogy: string;
  check: string;
  checkHint: string;
};

function buildConceptGuide(input: string): ConceptGuide {
  const question = input.toLowerCase();

  if (question.includes('photosynth')) {
    return {
      heading: 'Plants use light energy to make stored food',
      explanation: [
        'Photosynthesis is the process plants use to make sugar, which stores energy they can use to grow and stay alive.',
        'It happens mainly in leaf cells inside structures called chloroplasts. Chlorophyll in those chloroplasts captures energy from sunlight.',
        'The plant takes in carbon dioxide from the air and water through its roots. Using light energy, it rearranges those materials into glucose (a sugar) and releases oxygen.',
        'The important idea is that sunlight supplies the energy, but it does not become matter. The atoms in the sugar come from carbon dioxide and water.',
      ],
      keyIdeas: [
        'Inputs: light energy, carbon dioxide, and water.',
        'Main product: glucose, which stores chemical energy for the plant.',
        'Oxygen is released as another product.',
        'Most photosynthesis happens in chloroplasts, especially in leaves.',
      ],
      analogy: 'Think of a leaf as a tiny solar-powered kitchen. Sunlight powers the kitchen, carbon dioxide and water are the ingredients, glucose is the food it prepares, and oxygen is released along the way.',
      check: 'A plant is placed in bright light but receives no carbon dioxide. Why can it not keep making glucose, even though it still has energy from the light?',
      checkHint: 'Explain what carbon dioxide contributes to the process—not just that the plant “needs it.”',
    };
  }

  if (question.includes('mitosis') || question.includes('cell division')) {
    return {
      heading: 'One cell carefully makes two matching cells',
      explanation: [
        'Mitosis is the process a body cell uses to divide into two genetically matching cells.',
        'Before division begins, the cell copies its DNA so there are two complete sets of instructions.',
        'During mitosis, the copied chromosomes line up and separate to opposite sides. The cell then splits, giving each new cell one copy of every chromosome.',
        'Your body uses this process for growth, repair, and replacing worn-out cells.',
      ],
      keyIdeas: [
        'DNA is copied before the cell divides.',
        'Copied chromosomes separate evenly.',
        'The result is two cells with matching genetic information.',
        'Mitosis supports growth and tissue repair.',
      ],
      analogy: 'Imagine copying a complete instruction manual, checking that every chapter is present, and then placing one full copy into each of two new binders.',
      check: 'If the DNA were not copied before mitosis, what important problem would the two new cells have?',
      checkHint: 'Think about the instructions each cell needs in order to function.',
    };
  }

  if (question.includes('fraction') || question.includes('denominator')) {
    return {
      heading: 'Fractions describe equal parts of a whole',
      explanation: [
        'A fraction compares a number of selected parts with the total number of equal parts in one whole.',
        'The denominator tells how many equal-sized parts the whole is divided into. The numerator tells how many of those parts you have.',
        'Two fractions can look different but represent the same amount because the whole has simply been divided into more or fewer equal pieces.',
        'When adding fractions, the pieces must be the same size, which is why different denominators need a common denominator first.',
      ],
      keyIdeas: [
        'The denominator describes the size of each equal part.',
        'The numerator counts how many parts are being considered.',
        'Equivalent fractions name the same amount with different-sized pieces.',
        'Only like-sized fractional parts can be added directly.',
      ],
      analogy: 'One half of a pizza is the same amount as two fourths. Cutting each half into two smaller pieces changes the number of pieces, but it does not change how much pizza you have.',
      check: 'Why would adding 1/2 + 1/3 as 2/5 give the wrong amount?',
      checkHint: 'Compare the size of a half-piece with the size of a third-piece.',
    };
  }

  if (question.includes('gravity') || question.includes('orbit')) {
    return {
      heading: 'Gravity is an attraction between objects with mass',
      explanation: [
        'Gravity is a force that pulls any two objects with mass toward each other.',
        'The pull becomes stronger when an object has more mass and weaker when the objects are farther apart.',
        'Earth’s large mass creates a noticeable pull that gives objects weight and causes unsupported objects to accelerate toward the ground.',
        'Gravity also keeps the Moon and satellites in orbit: they move forward while continually falling toward Earth, so their path curves around it.',
      ],
      keyIdeas: [
        'All objects with mass exert gravity.',
        'More mass creates a stronger gravitational pull.',
        'Greater distance makes the pull weaker.',
        'An orbit combines forward motion with continuous falling.',
      ],
      analogy: 'Imagine rolling a ball forward while the floor curves downward beneath it at the same rate. The ball keeps falling, but it never reaches the floor—similar to an object in orbit.',
      check: 'Why does the Moon stay near Earth instead of either flying away in a straight line or falling straight down?',
      checkHint: 'Use both the Moon’s forward motion and Earth’s gravitational pull in your explanation.',
    };
  }

  if (question.includes('ecosystem') || question.includes('food chain') || question.includes('food web')) {
    return {
      heading: 'An ecosystem connects living things with their environment',
      explanation: [
        'An ecosystem includes all the living organisms in an area and the nonliving parts of their environment, such as water, air, soil, and sunlight.',
        'Organisms depend on one another for energy, shelter, pollination, decomposition, and other needs.',
        'Energy usually enters through producers like plants, moves to consumers, and eventually reaches decomposers. Unlike matter, which is recycled, usable energy decreases as it moves through the system.',
        'Because these relationships are connected, a change to one population or resource can affect many other parts of the ecosystem.',
      ],
      keyIdeas: [
        'Biotic factors are living; abiotic factors are nonliving.',
        'Producers capture energy, consumers eat, and decomposers recycle matter.',
        'Food webs show several connected feeding relationships.',
        'Changes can spread through the whole system.',
      ],
      analogy: 'An ecosystem is like a neighborhood where homes, stores, roads, electricity, and people all depend on one another. Removing one important service can create effects throughout the neighborhood.',
      check: 'If a disease greatly reduces the plants in an ecosystem, how could that affect both herbivores and predators?',
      checkHint: 'Trace how energy moves from producers to different levels of consumers.',
    };
  }

  const cleaned = input.trim().replace(/[?.!]$/, '');
  return {
    heading: `Build a clear model of “${cleaned.slice(0, 70)}${cleaned.length > 70 ? '…' : ''}”`,
    explanation: [
      'Start by identifying what kind of thing the concept is: an object, a process, a relationship, or a rule.',
      'Next, look for the parts involved and what each part does. Then connect them using cause-and-effect language such as “because,” “therefore,” or “when this changes, that changes.”',
      'A strong explanation should say not only what happens, but also how or why it happens. Compare that explanation with your class notes and vocabulary so you can replace this general model with the exact details your course expects.',
    ],
    keyIdeas: [
      'Name the concept and its purpose or role.',
      'Identify the important parts, inputs, or conditions.',
      'Describe the sequence or cause-and-effect connection.',
      'Check the explanation against your class materials.',
    ],
    analogy: 'Think of understanding a concept like assembling a map: vocabulary gives you the landmarks, cause and effect gives you the roads, and an example shows one complete route through the map.',
    check: `What is one change to the conditions in “${cleaned.slice(0, 60)}” that would change the result, and why?`,
    checkHint: 'Use a because statement to show the connection between the change and its effect.',
  };
}

function ConceptReview({ draft }: { draft: Draft }) {
  const [, navigate] = useLocation();
  const topic = draft.text.trim().replace(/[?.!]$/, '');
  const guide = buildConceptGuide(topic);
  return (
    <div className="page narrow review-page">
      <button className="back" onClick={() => navigate('/help')}><ArrowLeft /> Try a different question</button>
      <div className="review-banner concept"><span><Lightbulb /></span><div><p className="eyebrow">A SIMPLER WAY IN</p><h1>Let’s make this click</h1><p>This is a practice explanation—not an answer to submit.</p></div></div>
      <section className="concept-card">
        <div className="review-title" style={{ marginBottom: '10px' }}>
          <div><span className="concept-label">SIMPLE EXPLANATION</span><h2>{guide.heading}</h2></div>
          <ReadAloud id="concept-explanation" text={`Simple explanation: ${guide.heading}. Your question: ${topic}. ${guide.explanation.join(' ')}`} />
        </div>
        <p><strong>Your question:</strong> {topic}</p>
        {guide.explanation.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      </section>
      <section className="concept-card">
        <div className="review-title" style={{ marginBottom: '10px' }}>
          <span className="concept-label">KEY IDEAS</span>
          <ReadAloud id="concept-key-ideas" text={`Key ideas: ${guide.keyIdeas.join('. ')}`} />
        </div>
        <ul className="key-list">{guide.keyIdeas.map(idea => <li key={idea}><Check /> {idea}</li>)}</ul>
      </section>
      <section className="concept-card analogy">
        <div className="review-title" style={{ marginBottom: '10px' }}>
          <span className="concept-label">CONCRETE ANALOGY</span>
          <ReadAloud id="concept-analogy" text={`Concrete analogy: ${guide.analogy}`} />
        </div>
        <p>{guide.analogy}</p>
      </section>
      <section className="check-question"><HelpCircle /><div style={{ width: '100%' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}><span>QUICK UNDERSTANDING CHECK</span><ReadAloud id="concept-check" text={`Quick understanding check. ${guide.check}. Hint: ${guide.checkHint}`} /></div><h2>{guide.check}</h2><textarea rows={3} aria-label="Your understanding-check answer" placeholder={guide.checkHint} /></div></section>
      <div className="concept-actions"><button className="secondary" onClick={() => navigate('/help')}>Ask another question</button><button className="primary" onClick={() => navigate('/')}>Done for now</button></div>
      <div className="integrity-note compact"><Lightbulb /><span>Use this explanation to build your understanding. Write your final schoolwork in your own words and follow your teacher’s rules.</span></div>
    </div>
  );
}

function PhotoHelpReview() {
  const [, navigate] = useLocation();
  const { activeId, stop: stopReading } = useSpeech();
  const payload = useMemo<{ extraction: PhotoExtraction; help: PhotoHelpResult; dueDate?: string } | null>(() => {
    try { return JSON.parse(sessionStorage.getItem(PHOTO_HELP_KEY) || 'null'); } catch { return null; }
  }, []);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [hintLevels, setHintLevels] = useState<Record<number, number>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  if (!payload) return <div className="page narrow empty-state"><h1>No photo help to review</h1><p>Start with a photo of the schoolwork you want to understand.</p><button className="primary" onClick={() => navigate('/help')}>Add a photo</button></div>;
  const { extraction, help } = payload;
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return (
    <div className="page narrow review-page photo-help-page">
      <button className="back" onClick={() => navigate('/help')}><ArrowLeft /> Review a different photo</button>
      <div className="review-banner concept"><span><Lightbulb /></span><div><p className="eyebrow">{extraction.gradeLevel || 'STUDY HELP'} · {extraction.subject}</p><h1>{help.heading}</h1><p>Built from the schoolwork you reviewed—not a generic project checklist.</p></div></div>
      <div className="help-actions" aria-label="Ways to get help">
        <button onClick={() => jump('explain')}><Lightbulb /> Explain this</button>
        <button onClick={() => jump('example')}><BookOpen /> Show me an example</button>
        <button onClick={() => jump('solve')}><Sparkles /> Solve one with me</button>
        <button onClick={() => jump('solve')}><HelpCircle /> Give me a hint</button>
        <button onClick={() => jump('check')}><CheckCircle2 /> Check my answer</button>
      </div>
      <section className="concept-card" id="explain">
        <div className="review-title" style={{ marginBottom: '10px' }}>
          <span className="concept-label">SKILL: {extraction.skill || 'WHAT THIS PRACTICES'}</span>
          <ReadAloud id="photo-explanation" text={`Skill: ${extraction.skill || 'What this practices'}. ${help.explanation.join(' ')}. Key ideas: ${help.keyIdeas.join('. ')}`} />
        </div>
        {help.explanation.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        {help.keyIdeas.length > 0 && <ul className="key-list">{help.keyIdeas.map(idea => <li key={idea}><Check /> {idea}</li>)}</ul>}
      </section>
      <section className="concept-card worked-example" id="example">
        <div className="review-title" style={{ marginBottom: '10px' }}>
          <span className="concept-label">WORKED EXAMPLE</span>
          <ReadAloud id="photo-example" text={`Worked example. ${help.exampleProblem}. Steps: ${help.exampleSteps.join('. ')}. ${help.exampleAnswer ? `Answer: ${help.exampleAnswer}` : ''}`} />
        </div>
        <h2>{help.exampleProblem}</h2>
        <ol>{help.exampleSteps.map((step, index) => <li key={index}><span>{index + 1}</span>{step}</li>)}</ol>
        {help.exampleAnswer && <p className="example-answer"><strong>Answer:</strong> {help.exampleAnswer}</p>}
      </section>
      <section className="concept-card" id="solve">
        <span className="concept-label">YOUR PHOTOGRAPHED WORK</span>
        {help.actualProblems.map((problem, index) => {
          const revealedHintLevels = hintLevels[index] ?? 0;
          const isRevealed = revealedAnswers[index];
          const textToRead = [
            `Problem: ${problem.problem}.`,
            revealedHintLevels > 0 ? `Hints: ${problem.steps.slice(0, revealedHintLevels).join('. ')}` : '',
            isRevealed ? `Answer with reasoning: ${problem.steps.join('. ')}. Final answer: ${problem.answer}` : ''
          ].filter(Boolean).join(' ');
          
          return (
            <div className="actual-problem" key={`${problem.problem}-${index}`}>
              <div className="review-title" style={{ marginBottom: '10px' }}>
                <h2>{problem.problem}</h2>
                <ReadAloud id={`photo-problem-${index}`} text={textToRead} />
              </div>
              <p>Try this problem using the method above. Ask for a hint when you need one.</p>
              {(hintLevels[index] ?? 0) > 0 && <div className="progressive-hints"><strong>Hint {hintLevels[index]}</strong><ol>{problem.steps.slice(0, hintLevels[index]).map((step, stepIndex) => <li key={stepIndex}>{step}</li>)}</ol></div>}
              {revealedAnswers[index] && <div className="answer-reveal"><strong>Answer with reasoning</strong><ol>{problem.steps.map((step, stepIndex) => <li key={stepIndex}>{step}</li>)}</ol><p className="problem-answer"><strong>Final answer:</strong> {problem.answer}</p></div>}
              <div className="problem-actions">
                <button className="secondary" disabled={revealedAnswers[index] || (hintLevels[index] ?? 0) >= problem.steps.length} onClick={() => {
                  if (activeId === `photo-problem-${index}`) stopReading();
                  setHintLevels(v => ({ ...v, [index]: Math.min((v[index] ?? 0) + 1, problem.steps.length) }));
                }}><HelpCircle /> Give me a hint</button>
                <button className="primary" onClick={() => {
                  if (activeId === `photo-problem-${index}`) stopReading();
                  setRevealedAnswers(v => ({ ...v, [index]: !v[index] }));
                }}>{revealedAnswers[index] ? 'Hide answer' : 'Show Answer'}</button>
              </div>
            </div>
          );
        })}
        {help.actualProblems.length === 0 && <p>{help.summary}</p>}
        {help.guidedTry && <div className="guided-try"><strong>Now try this:</strong><span>{help.guidedTry}</span></div>}
      </section>
      <section className="check-question" id="check"><HelpCircle /><div style={{ width: '100%' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}><span>CHECK MY ANSWER</span><ReadAloud id="photo-check" text={`Check my answer. ${help.understandingCheck}`} /></div><h2>{help.understandingCheck}</h2><textarea rows={3} value={studentAnswer} onChange={e => setStudentAnswer(e.target.value)} placeholder="Write how you worked it out…" /><p>{studentAnswer.trim() ? 'Good start. Compare each step with the method above, not only the final number.' : 'Explain your thinking so you can check the method as well as the answer.'}</p></div></section>
      <div className="concept-actions">
        <button className="secondary" onClick={() => navigate('/help')}>Try another photo</button>
        <button className="primary" onClick={() => navigate('/')}>Done for now</button>
        <button className="primary" data-testid="track-assignment-btn" onClick={() => {
          const draft: Draft = {
            mode: 'assignment',
            text: [extraction.directions, extraction.visibleContent].join('\n\n'),
            title: extraction.title || 'Worksheet practice',
            subject: extraction.subject || 'Other',
            dueDate: payload.dueDate || isoDate(1),
            suggestedSteps: help.planSteps.length ? help.planSteps : ['Review the examples and explanations', 'Complete the remaining problems'],
            aiSummary: help.summary,
            deliverables: help.deliverables,
            turnInMethod: help.turnInMethod
          };
          sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
          navigate('/review');
        }}>Track as Assignment</button>
      </div>
      <div className="integrity-note compact"><Lightbulb /><span>StudySteps may show solutions when they teach the reasoning. Follow your teacher’s rules and write submitted work in your own words.</span></div>
    </div>
  );
}

type CitationStyle = 'MLA' | 'APA' | 'Chicago';

function citationFor(resource: PhotoHelpResult['resources'][number], style: CitationStyle) {
  const unavailable = /unavailable/i.test(resource.date);
  if (style === 'APA') return `${resource.organization}. (${unavailable ? 'n.d.' : resource.date}). ${resource.title}. ${resource.url}`;
  if (style === 'Chicago') return `${resource.organization}. “${resource.title}.” ${unavailable ? 'Accessed September 20, 2026' : resource.date}. ${resource.url}.`;
  return `“${resource.title}.” ${resource.organization}, ${unavailable ? 'n.d.' : resource.date}, ${resource.url}. Accessed 20 Sept. 2026.`;
}

function inTextFor(resource: PhotoHelpResult['resources'][number], style: CitationStyle) {
  if (style === 'APA') return `(${resource.organization}, ${/unavailable/i.test(resource.date) ? 'n.d.' : resource.date.match(/\d{4}/)?.[0] || resource.date})`;
  if (style === 'Chicago') return `Use a numbered footnote after the borrowed fact.`;
  return `(${resource.organization})`;
}

function ProjectLaunchpad() {
  const [, navigate] = useLocation();
  const payload = useMemo<{ extraction: PhotoExtraction; help: PhotoHelpResult; dueDate: string } | null>(() => {
    try { return JSON.parse(sessionStorage.getItem(PROJECT_LAUNCHPAD_KEY) || 'null'); } catch { return null; }
  }, []);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const detected = payload?.help.detectedCitationStyle;
  const [citationStyle, setCitationStyle] = useState<CitationStyle>(detected === 'MLA' || detected === 'APA' || detected === 'Chicago' ? detected : 'MLA');
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState('');
  if (!payload) return <div className="page narrow empty-state"><h1>No project to explore</h1><p>Start with assignment instructions or a photo.</p><button className="primary" onClick={() => navigate('/help')}>Start a project</button></div>;
  const { extraction, help } = payload;
  const buildSelectedPlan = async () => {
    if (selectedIndex === null) return;
    setBuilding(true); setError('');
    try {
      const selectedIdea = help.projectIdeas[selectedIndex];
      const plan = await createProjectPlan({ extraction, selectedIdea, citationStyle });
      const sourceSteps = help.resources.length ? [`Review the ${help.resources.length} credible source${help.resources.length === 1 ? '' : 's'} and record notes with ${citationStyle} citations`] : [];
      const draft: Draft = {
        mode: 'assignment',
        text: [extraction.directions, extraction.visibleContent, extraction.requirements.join('\n')].filter(Boolean).join('\n\n'),
        title: extraction.title || 'Photo assignment',
        subject: extraction.subject || 'Other',
        dueDate: payload.dueDate,
        suggestedSteps: [...sourceSteps, ...plan.planSteps],
        aiSummary: plan.summary,
        deliverables: help.deliverables,
        turnInMethod: help.turnInMethod
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      navigate('/review');
    } catch {
      setError('We couldn’t build that direction into a plan right now. Try again.');
    } finally {
      setBuilding(false);
    }
  };
  return (
    <div className="page narrow review-page launchpad-page">
      <button className="back" onClick={() => navigate('/help')}><ArrowLeft /> Edit the assignment</button>
      <div className="launch-stages" aria-label="Project stages">{['Understand', 'Explore', 'Choose', 'Plan', 'Build', 'Track'].map((stage, index) => <span className={index < 3 ? 'active' : ''} key={stage}>{index + 1}<small>{stage}</small></span>)}</div>
      <div className="review-banner"><span><Sparkles /></span><div style={{ width: '100%' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><p className="eyebrow">PROJECT LAUNCHPAD</p><ReadAloud id="launchpad-summary" text={help.summary} /></div><h1>Choose a direction that feels like yours</h1><p>{help.summary}</p></div></div>
      <section className="review-card"><div className="review-title"><div><p className="eyebrow">EXPLORE</p><h2>Possible project directions</h2></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ReadAloud id="launchpad-ideas" text={`Possible project directions. ${help.projectIdeas.length} ideas. ${help.projectIdeas.map((idea, i) => `Idea ${i + 1}: ${idea.title}. ${idea.description}. Approach: ${idea.approach}. Why it fits: ${idea.whyItFits}.`).join(' ')}`} label="Read ideas" />
          <span>{help.projectIdeas.length} ideas</span>
        </div>
      </div>
        <div className="idea-grid">{help.projectIdeas.map((idea, index) => <button className={`idea-card ${selectedIndex === index ? 'selected' : ''}`} onClick={() => setSelectedIndex(index)} key={idea.title}><span className="idea-number">{index + 1}</span><h3>{idea.title}</h3><p>{idea.description}</p><dl><dt>Materials or approach</dt><dd>{idea.approach}</dd><dt>Why it fits</dt><dd>{idea.whyItFits}</dd></dl><span className="idea-choice">{selectedIndex === index ? <><Check /> Selected</> : 'Choose this direction'}</span></button>)}</div>
      </section>
      <section className="review-card">
        <div className="review-title">
          <div><p className="eyebrow">CREDIBLE RESOURCES</p><h2>Research and inspiration</h2></div>
          {help.resources.length > 0 && <ReadAloud id="launchpad-resources" text={`Research and inspiration. ${help.resources.map(r => `${r.title} by ${r.organization}. Why it's credible: ${r.credibility}. Use it for: ${r.supports}.`).join(' ')}`} label="Read resources" />}
        </div>
        {help.resources.length === 0 ? <p className="resource-empty">No verified direct resources are available for this topic yet. StudySteps will not invent links or source details.</p> :
          <div className="resource-list">{help.resources.map(resource => <article className="resource-card" key={resource.url}><div><span className="resource-type">{resource.resourceType}</span><h3>{resource.title}</h3><strong>{resource.organization}</strong></div><p><b>Why it’s credible:</b> {resource.credibility}</p><p><b>Use it for:</b> {resource.supports}</p><p><b>Published or updated:</b> {resource.date}</p><a href={resource.url} target="_blank" rel="noreferrer">Open resource <ArrowRight /></a></article>)}</div>}
      </section>
      {help.resources.length > 0 && <section className="review-card citation-card">
        <div className="review-title">
          <p className="eyebrow">CITATION SUPPORT</p>
          {help.resources.length > 0 && <ReadAloud id="launchpad-citations" text={`Citation examples in ${citationStyle} format. ${help.resources.map(r => `${r.title}. Citation: ${citationFor(r, citationStyle)}. In-text example: ${inTextFor(r, citationStyle)}`).join(' ')}`} label="Read citations" />}
        </div>
        <div className="citation-heading"><h2>{detected && detected !== 'Not specified' ? `${detected} was detected in the directions` : 'Choose a citation style'}</h2><select value={citationStyle} onChange={e => setCitationStyle(e.target.value as CitationStyle)}><option>MLA</option><option>APA</option><option>Chicago</option></select></div>
        {help.resources.map(resource => <div className="citation-example" key={resource.url}><strong>{resource.title}</strong><p>{citationFor(resource, citationStyle)}</p><small><b>In-text example:</b> {inTextFor(resource, citationStyle)}</small><small>Parts: organization/author · publication date when available · title · direct URL. Verify these details on the source page before submitting.</small></div>)}
      </section>}
      {error && <div className="photo-input-error" role="alert"><HelpCircle />{error}</div>}
      <div className="approval-box"><div><strong>Ready to turn your choice into a plan?</strong><span>You choose the direction. StudySteps will create editable Plan, Build, and Track steps.</span></div><button className="primary" disabled={selectedIndex === null || building} onClick={buildSelectedPlan}>{building ? 'Building your plan…' : <><ArrowRight /> Build my plan</>}</button></div>
      <p className="never-auto"><CheckCircle2 /> The plan remains editable and is never saved until you approve it.</p>
    </div>
  );
}

function AssignmentDetails({ assignments, setAssignments }: { assignments: Assignment[]; setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>> }) {
  const [, params] = useRoute('/assignments/:id');
  const [, navigate] = useLocation();
  const assignment = assignments.find(a => a.id === params?.id);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState(() => assignment ? { title: assignment.title, subject: assignment.subject, dueDate: assignment.dueDate } : { title: '', subject: '', dueDate: '' });
  
  if (!assignment) return <div className="page narrow empty-state"><h1>Assignment not found</h1><button className="primary" onClick={() => navigate('/')}>Back to Dashboard</button></div>;
  
  const pct = progress(assignment); const days = daysRemaining(assignment.dueDate);
  const allStepsComplete = assignment.steps.length > 0 && assignment.steps.every(s => s.complete);
  const allDeliverablesComplete = assignment.deliverables.length === 0 || assignment.deliverables.every(d => d.complete);
  const allWorkComplete = allStepsComplete && allDeliverablesComplete;
  const notTurnedIn = assignment.status !== 'Turned In';

  const toggleStep = (id: string) => setAssignments(v => v.map(a => {
    if (a.id !== assignment.id) return a;
    const steps = a.steps.map(s => s.id === id ? { ...s, complete: !s.complete } : s);
    let newStatus = a.status;
    if (a.status !== 'Turned In') {
      const someComplete = steps.some(s => s.complete) || (a.deliverables || []).some(d => d.complete);
      const allComplete = steps.every(s => s.complete) && (!a.deliverables?.length || a.deliverables.every(d => d.complete));
      if (allComplete) newStatus = 'Ready to Turn In';
      else if (someComplete) newStatus = 'Working On It';
      else newStatus = 'Not Started';
    }
    return { ...a, steps, status: newStatus };
  }));

  const toggleDeliverable = (id: string) => setAssignments(v => v.map(a => {
    if (a.id !== assignment.id) return a;
    const deliverables = a.deliverables.map(d => d.id === id ? { ...d, complete: !d.complete } : d);
    let newStatus = a.status;
    if (a.status !== 'Turned In') {
      const someComplete = a.steps.some(s => s.complete) || deliverables.some(d => d.complete);
      const allComplete = a.steps.every(s => s.complete) && deliverables.every(d => d.complete);
      if (allComplete) newStatus = 'Ready to Turn In';
      else if (someComplete) newStatus = 'Working On It';
      else newStatus = 'Not Started';
    }
    return { ...a, deliverables, status: newStatus };
  }));

  const setStatus = (status: AssignmentStatus) => setAssignments(v => v.map(a => {
    if (a.id !== assignment.id) return a;
    return { ...a, status, turnedInAt: status === 'Turned In' ? new Date().toISOString() : undefined };
  }));

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert("Browser notifications aren't supported on this device.");
      return;
    }
    if (Notification.permission === 'granted') {
      setAssignments(v => v.map(a => a.id === assignment.id ? { ...a, reminderEnabled: !a.reminderEnabled } : a));
    } else {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
         setAssignments(v => v.map(a => a.id === assignment.id ? { ...a, reminderEnabled: !a.reminderEnabled } : a));
      } else {
         alert("Notification permission was denied. You can change this in your browser settings.");
      }
    }
  };

  const saveEdit = () => { setAssignments(v => v.map(a => a.id === assignment.id ? { ...a, ...form } : a)); setEditing(false); };
  const remove = () => { setAssignments(v => v.filter(a => a.id !== assignment.id)); navigate('/'); };

  return (
    <div className="page narrow details-page">
      <button className="back" onClick={() => navigate('/')}><ArrowLeft /> Dashboard</button>
      <section className="detail-hero">
        <div className="card-top"><span className={`subject subject-${assignment.subject.toLowerCase()}`}>{assignment.subject}</span><span className="due"><CalendarDays />{dueLabel(assignment.dueDate)}</span></div>
        <div className="detail-title">
          <div style={{ paddingRight: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1>{assignment.title}</h1>
              <ReadAloud id="assignment-summary" text={`${assignment.title}. ${assignment.summary}`} label="" />
            </div>
            <p>{assignment.summary}</p>
          </div>
          <button className="icon-text" onClick={() => setEditing(true)}><Pencil /> Edit</button>
        </div>
        <div className="metric-row"><div><strong>{pct}%</strong><span>complete</span></div><div><strong>{assignment.steps.filter(s => s.complete).length}/{assignment.steps.length}</strong><span>steps done</span></div><div><strong>{days < 0 ? 'Past' : days}</strong><span>{days < 0 ? 'due' : days === 1 ? 'day left' : 'days left'}</span></div></div>
        <div className="progress-track large"><span style={{ width: `${pct}%` }} /></div>
      </section>

      {allWorkComplete && notTurnedIn && (
        <section className="celebration turned-in-reminder" data-testid="status-reminder">
          <CheckCircle2 />
          <div>
            <h2>You finished this, but did you turn it in?</h2>
            <p>Make sure you submit your work using the method below, then mark it Turned In.</p>
          </div>
        </section>
      )}

      {!allWorkComplete && (
        <section className="focus-card">
          <span><ArrowRight /></span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p className="eyebrow">YOUR NEXT STEP</p>
              <ReadAloud id="assignment-next-step" text={`Your next step. ${nextStep(assignment)}`} />
            </div>
            <h2>{nextStep(assignment)}</h2>
            <p>Just focus on this one. You don’t have to do everything at once.</p>
          </div>
        </section>
      )}
      
      {pct === 100 && !notTurnedIn && (
        <section className="celebration"><CheckCircle2 /><div><h2>Turned in</h2><p>This stays in Completed for 30 days, then StudySteps removes it from this device.</p></div></section>
      )}

      <section className="checklist-card"><div className="review-title"><div><p className="eyebrow">YOUR PLAN</p><h2>Assignment checklist</h2></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ReadAloud id="assignment-plan" text={`Assignment checklist. ${assignment.steps.map((s, i) => `Step ${i + 1}: ${s.text}. ${s.complete ? 'Complete.' : 'Not complete.'}`).join(' ')}`} label="Read plan" />
          <span>{assignment.steps.filter(s => s.complete).length} of {assignment.steps.length}</span>
        </div>
      </div>
        <div className="checklist">{assignment.steps.map((s, i) => <button key={s.id} className={s.complete ? 'done' : ''} onClick={() => toggleStep(s.id)}><span className="check-control">{s.complete ? <Check /> : <Circle />}</span><span><small>STEP {i + 1}</small>{s.text}</span></button>)}</div>
      </section>

      <section className="checklist-card" data-testid="turn-in-checklist">
        <div className="review-title">
          <div><p className="eyebrow">READY TO SUBMIT?</p><h2>Turn in checklist</h2></div>
          <ReadAloud id="assignment-turnin" text={`Turn in checklist. Method: ${assignment.turnInMethod}. Deliverables: ${assignment.deliverables?.length ? assignment.deliverables.map(d => `${d.text}, ${d.complete ? 'Complete' : 'Not complete'}`).join('. ') : 'No deliverables.'}`} label="Read turn-in" />
        </div>
        <div className="turn-in-method"><strong>Method:</strong> {assignment.turnInMethod}</div>
        {assignment.deliverables?.length > 0 ? (
          <div className="checklist">
            {assignment.deliverables.map((d) => (
              <button key={d.id} className={d.complete ? 'done' : ''} onClick={() => toggleDeliverable(d.id)}>
                <span className="check-control">{d.complete ? <Check /> : <Circle />}</span>
                <span>{d.text}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="small-empty">No deliverables were identified.</p>
        )}
      </section>

      <section className="status-controls">
        <p className="eyebrow">CURRENT STATUS</p>
        <div className="status-grid" data-testid="status-controls">
           {(['Not Started', 'Working On It', 'Ready to Turn In', 'Turned In'] as const).map(s => (
             <button key={s} className={`status-btn ${assignment.status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>
               {s === 'Turned In' ? <CheckCircle2 /> : <Circle />} {s}
             </button>
           ))}
        </div>
      </section>

      <section className="reminder-controls">
        <p className="eyebrow">REMINDERS</p>
        <button className={`secondary ${assignment.reminderEnabled ? 'active' : ''}`} onClick={requestNotificationPermission} data-testid="reminder-toggle">
          {assignment.reminderEnabled ? <Check /> : <Clock3 />} Browser reminders {assignment.reminderEnabled ? 'enabled' : 'off'}
        </button>
        <small>Optional browser reminders appear while StudySteps is open. In-app due labels always remain available.</small>
      </section>

      <button className="delete-button" onClick={() => setConfirmDelete(true)}><Trash2 /> Delete assignment</button>
      {editing && <div className="modal-backdrop" role="presentation"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-title"><div className="modal-head"><h2 id="edit-title">Edit assignment</h2><button onClick={() => setEditing(false)} aria-label="Close"><X /></button></div><label className="field"><span>Name</span><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label><div className="details-grid"><label className="field"><span>Subject</span><input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></label><label className="field"><span>Due date</span><input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></label></div><div className="modal-actions"><button className="secondary" onClick={() => setEditing(false)}>Cancel</button><button className="primary" onClick={saveEdit}>Save changes</button></div></div></div>}
      {confirmDelete && <div className="modal-backdrop" role="presentation"><div className="modal small" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><span className="danger-icon"><Trash2 /></span><h2 id="delete-title">Delete this assignment?</h2><p>This removes the plan and its progress from this device. This can’t be undone.</p><div className="modal-actions"><button className="secondary" onClick={() => setConfirmDelete(false)}>Keep it</button><button className="danger" onClick={remove}>Delete</button></div></div></div>}
    </div>
  );
}

function DoneDue({ assignments }: { assignments: Assignment[] }) {
  const [, navigate] = useLocation();
  const active = assignments.filter(a => a.status !== 'Turned In');
  const overdue = active.filter(a => daysRemaining(a.dueDate) < 0);
  const dueToday = active.filter(a => daysRemaining(a.dueDate) === 0);
  const dueTomorrow = active.filter(a => daysRemaining(a.dueDate) === 1);
  const dueSoon = active.filter(a => daysRemaining(a.dueDate) > 1 && daysRemaining(a.dueDate) <= 3);
  const later = active.filter(a => daysRemaining(a.dueDate) > 3);

  const Group = ({ title, items, empty }: { title: string; items: Assignment[]; empty?: string }) => (
    <section className="assignment-section done-due-group">
      <div className="section-title"><h2>{title}</h2><span>{items.length}</span></div>
      {items.length === 0 ? (empty ? <p className="small-empty">{empty}</p> : null) :
        <div className="card-grid">
          {items.map(a => <AssignmentCard key={a.id} assignment={a} onClick={() => navigate(`/assignments/${a.id}`)} completed={false} />)}
        </div>
      }
    </section>
  );

  return (
    <div className="page narrow done-due-page">
      <div className="page-heading">
        <p className="eyebrow">YOUR ACTIVE WORK</p>
        <h1>Done & Due</h1>
        <p>Keep track of what’s coming up.</p>
      </div>
      <Group title="Overdue" items={overdue} />
      <Group title="Due Today" items={dueToday} empty="Nothing due today." />
      <Group title="Due Tomorrow" items={dueTomorrow} empty="Nothing due tomorrow." />
      <Group title="Due Soon" items={dueSoon} empty="Nothing due in the next 3 days." />
      <Group title="Later" items={later} />
      <div className="integrity-note compact">
         <Lightbulb /><span>Turned-in work is removed after 30 days. Active work stays until you turn it in.</span>
      </div>
    </div>
  );
}

function AppRouter() {
  const { items, setItems } = useAssignments();
  useReminders(items);
  const saveAssignment = (a: Assignment) => setItems(v => [a, ...v]);
  return <Shell><RoutedErrorBoundary><Switch>
    <Route path="/"><Dashboard assignments={items} /></Route>
    <Route path="/done-due"><DoneDue assignments={items} /></Route>
    <Route path="/help"><GetHelp /></Route>
    <Route path="/review"><Review saveAssignment={saveAssignment} /></Route>
    <Route path="/photo-help"><PhotoHelpReview /></Route>
    <Route path="/project-launchpad"><ProjectLaunchpad /></Route>
    <Route path="/assignments/:id"><AssignmentDetails assignments={items} setAssignments={setItems} /></Route>
    <Route component={NotFound} />
  </Switch></RoutedErrorBoundary></Shell>;
}
function RoutedErrorBoundary({ children }: { children: ReactNode }) { const [location] = useLocation(); return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>; }
export default function App() {
  return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><SpeechProvider><AppRouter /></SpeechProvider></WouterRouter>;
}