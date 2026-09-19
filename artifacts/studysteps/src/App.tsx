import { type ChangeEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, CalendarDays, Camera, Check, CheckCircle2,
  ChevronDown, ChevronUp, Circle, Clock3, GripVertical, HelpCircle, Home,
  Lightbulb, ListChecks, Mic, Pencil, Plus, Sparkles, Trash2, Upload, X,
} from 'lucide-react';
import { Route, Switch, useLocation, useRoute, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import './index.css';

type Step = { id: string; text: string; complete: boolean };
type Assignment = {
  id: string; title: string; subject: string; dueDate: string; summary: string;
  steps: Step[]; createdAt: string;
};
type Mode = 'assignment' | 'concept';
type InputMethod = 'text' | 'photo' | 'voice';
type Draft = { mode: Mode; text: string; title: string; subject: string; dueDate: string };

const STORAGE_KEY = 'studysteps.assignments.v1';
const DRAFT_KEY = 'studysteps.draft.v1';
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const isoDate = (days: number) => {
  const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10);
};

const seedAssignments: Assignment[] = [
  {
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
    id: 'sample-english', title: 'Character analysis paragraph', subject: 'English',
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
    id: 'sample-math', title: 'Fractions practice set', subject: 'Math',
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
    if (saved) { try { return JSON.parse(saved); } catch { /* seed below */ } }
    return seedAssignments;
  });
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(items)), [items]);
  return { items, setItems };
}

const progress = (a: Assignment) =>
  a.steps.length ? Math.round((a.steps.filter(s => s.complete).length / a.steps.length) * 100) : 0;
const nextStep = (a: Assignment) => a.steps.find(s => !s.complete)?.text ?? 'All steps complete';
const daysRemaining = (date: string) => Math.ceil((new Date(`${date}T23:59:59`).getTime() - Date.now()) / 86400000);
const dueLabel = (date: string) => {
  const days = daysRemaining(date);
  if (days < 0) return `Due ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due ${new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
};

function Shell({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
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
        <button className={location === '/' ? 'active' : ''} onClick={() => navigate('/')}><Home /><span>Dashboard</span></button>
        <button className={location.startsWith('/help') || location === '/review' ? 'active help-nav' : 'help-nav'} onClick={() => navigate('/help')}><Plus /><span>Get Help</span></button>
        <button className={location.startsWith('/assignments') ? 'active' : ''} onClick={() => navigate('/')}><ListChecks /><span>My Work</span></button>
      </nav>
    </div>
  );
}

function Dashboard({ assignments }: { assignments: Assignment[] }) {
  const [, navigate] = useLocation();
  const complete = assignments.filter(a => progress(a) === 100);
  const active = assignments.filter(a => progress(a) < 100);
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
  const [voiceStatus, setVoiceStatus] = useState('');
  const recognition = useRef<any>(null);

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader(); reader.onload = () => setPhoto(String(reader.result)); reader.readAsDataURL(file);
  };
  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setVoiceStatus('Voice typing isn’t supported in this browser. You can type or paste your schoolwork instead.'); return; }
    const r = new SpeechRecognition(); recognition.current = r; r.continuous = false; r.interimResults = false;
    r.onstart = () => setVoiceStatus('Listening… Say what you need help with.');
    r.onresult = (e: any) => { setText((v) => `${v}${v ? ' ' : ''}${e.results[0][0].transcript}`); setVoiceStatus('Got it! You can edit what we heard below.'); };
    r.onerror = () => setVoiceStatus('We couldn’t hear that clearly. Try again, or type your schoolwork below.');
    r.onend = () => recognition.current = null; r.start();
  };
  const continueToReview = () => {
    const draft: Draft = { mode, text: text.trim(), title: title.trim() || text.trim().split(/[.!?\n]/)[0].slice(0, 55), subject, dueDate };
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
          <button className={method === 'text' ? 'active' : ''} onClick={() => setMethod('text')}><Pencil /> Type or paste</button>
          <button className={method === 'photo' ? 'active' : ''} onClick={() => setMethod('photo')}><Camera /> Photo</button>
          <button className={method === 'voice' ? 'active' : ''} onClick={() => setMethod('voice')}><Mic /> Voice</button>
        </div>
        {method === 'photo' && <div className="input-panel">
          {photo ? <div className="photo-preview"><img src={photo} alt="Selected schoolwork preview" /><button onClick={() => setPhoto(null)} aria-label="Remove photo"><X /></button></div> :
            <label className="upload-zone"><Upload /><strong>Choose or take a photo</strong><span>Use a clear, well-lit picture of the whole page.</span><input type="file" accept="image/*" capture="environment" onChange={handlePhoto} /></label>}
          <div className="coming-note"><Sparkles /><span><strong>Photo understanding is coming next.</strong> For now, your photo stays as a preview. Type the important details below so we can build a test plan.</span></div>
        </div>}
        {method === 'voice' && <div className="input-panel voice-panel"><button className="voice-button" onClick={startVoice}><Mic /> Start speaking</button>{voiceStatus && <p role="status">{voiceStatus}</p>}<p className="muted-copy">Voice uses your browser’s built-in speech recognition when available. You can always edit the words below.</p></div>}
        <label className="field"><span>{mode === 'assignment' ? 'Assignment directions' : 'Concept or question'}</span><textarea value={text} onChange={e => setText(e.target.value)} rows={7} placeholder={mode === 'assignment' ? 'Paste the directions here, or explain what your teacher asked you to do…' : 'Example: I don’t understand why seasons happen…'} /><small>{text.length} characters · Include enough detail for useful steps.</small></label>
        {mode === 'assignment' && <div className="details-grid">
          <label className="field"><span>Assignment name</span><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Example: History presentation" /></label>
          <label className="field"><span>Subject</span><select value={subject} onChange={e => setSubject(e.target.value)}><option>English</option><option>Math</option><option>Science</option><option>History</option><option>World Language</option><option>Arts</option><option>Other</option></select></label>
          <label className="field"><span>Due date</span><input type="date" value={dueDate} min={isoDate(0)} onChange={e => setDueDate(e.target.value)} /></label>
        </div>}
        <button className="primary full" disabled={!canContinue} onClick={continueToReview}>Create a draft to review <ArrowRight /></button>
        {!canContinue && <p className="form-hint">Add at least a sentence so StudySteps has something to work with.</p>}
      </section>
      <div className="integrity-note compact"><HelpCircle /><span>We’ll suggest a starting point—not produce answers to turn in. You’ll review everything before deciding what to keep.</span></div>
    </div>
  );
}

const buildSteps = (draft: Draft): Step[] => {
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
    const a: Assignment = { id: uid(), title: title.trim(), subject, dueDate, summary: `A step-by-step plan for: ${draft.text.slice(0, 180)}${draft.text.length > 180 ? '…' : ''}`, steps: clean, createdAt: new Date().toISOString() };
    saveAssignment(a); sessionStorage.removeItem(DRAFT_KEY); navigate(`/assignments/${a.id}`);
  };
  return (
    <div className="page narrow review-page">
      <button className="back" onClick={() => navigate('/help')}><ArrowLeft /> Edit what I shared</button>
      <div className="review-banner"><span><Sparkles /></span><div><p className="eyebrow">DRAFT FOR YOUR REVIEW</p><h1>Here’s a possible plan</h1><p>Change anything that doesn’t fit. Nothing is saved until you approve it.</p></div></div>
      <section className="review-card">
        <h2>Plain-language summary</h2>
        <p>You’re being asked to complete <strong>{title || 'this assignment'}</strong>. The easiest way forward is to identify exactly what the final result needs, gather what you need, and work through one small part at a time.</p>
      </section>
      <section className="review-card">
        <div className="review-title"><div><p className="eyebrow">SUGGESTED STEPS</p><h2>Make this plan yours</h2></div><span>{steps.length} steps</span></div>
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
      <section className="concept-card"><span className="concept-label">SIMPLE EXPLANATION</span><h2>{guide.heading}</h2><p><strong>Your question:</strong> {topic}</p>{guide.explanation.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</section>
      <section className="concept-card"><span className="concept-label">KEY IDEAS</span><ul className="key-list">{guide.keyIdeas.map(idea => <li key={idea}><Check /> {idea}</li>)}</ul></section>
      <section className="concept-card analogy"><span className="concept-label">CONCRETE ANALOGY</span><p>{guide.analogy}</p></section>
      <section className="check-question"><HelpCircle /><div><span>QUICK UNDERSTANDING CHECK</span><h2>{guide.check}</h2><textarea rows={3} aria-label="Your understanding-check answer" placeholder={guide.checkHint} /></div></section>
      <div className="concept-actions"><button className="secondary" onClick={() => navigate('/help')}>Ask another question</button><button className="primary" onClick={() => navigate('/')}>Done for now</button></div>
      <div className="integrity-note compact"><Lightbulb /><span>Use this explanation to build your understanding. Write your final schoolwork in your own words and follow your teacher’s rules.</span></div>
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
  const toggle = (id: string) => setAssignments(v => v.map(a => a.id === assignment.id ? { ...a, steps: a.steps.map(s => s.id === id ? { ...s, complete: !s.complete } : s) } : a));
  const saveEdit = () => { setAssignments(v => v.map(a => a.id === assignment.id ? { ...a, ...form } : a)); setEditing(false); };
  const remove = () => { setAssignments(v => v.filter(a => a.id !== assignment.id)); navigate('/'); };
  return (
    <div className="page narrow details-page">
      <button className="back" onClick={() => navigate('/')}><ArrowLeft /> Dashboard</button>
      <section className="detail-hero">
        <div className="card-top"><span className={`subject subject-${assignment.subject.toLowerCase()}`}>{assignment.subject}</span><span className="due"><CalendarDays />{dueLabel(assignment.dueDate)}</span></div>
        <div className="detail-title"><div><h1>{assignment.title}</h1><p>{assignment.summary}</p></div><button className="icon-text" onClick={() => setEditing(true)}><Pencil /> Edit</button></div>
        <div className="metric-row"><div><strong>{pct}%</strong><span>complete</span></div><div><strong>{assignment.steps.filter(s => s.complete).length}/{assignment.steps.length}</strong><span>steps done</span></div><div><strong>{days < 0 ? 'Past' : days}</strong><span>{days < 0 ? 'due' : days === 1 ? 'day left' : 'days left'}</span></div></div>
        <div className="progress-track large"><span style={{ width: `${pct}%` }} /></div>
      </section>
      {pct < 100 ? <section className="focus-card"><span><ArrowRight /></span><div><p className="eyebrow">YOUR NEXT STEP</p><h2>{nextStep(assignment)}</h2><p>Just focus on this one. You don’t have to do everything at once.</p></div></section> :
        <section className="celebration"><CheckCircle2 /><div><h2>You finished every step!</h2><p>Take a moment to check your work against the directions before turning it in.</p></div></section>}
      <section className="checklist-card"><div className="review-title"><div><p className="eyebrow">YOUR PLAN</p><h2>Assignment checklist</h2></div><span>{assignment.steps.filter(s => s.complete).length} of {assignment.steps.length}</span></div>
        <div className="checklist">{assignment.steps.map((s, i) => <button key={s.id} className={s.complete ? 'done' : ''} onClick={() => toggle(s.id)}><span className="check-control">{s.complete ? <Check /> : <Circle />}</span><span><small>STEP {i + 1}</small>{s.text}</span></button>)}</div>
      </section>
      <button className="delete-button" onClick={() => setConfirmDelete(true)}><Trash2 /> Delete assignment</button>
      {editing && <div className="modal-backdrop" role="presentation"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-title"><div className="modal-head"><h2 id="edit-title">Edit assignment</h2><button onClick={() => setEditing(false)} aria-label="Close"><X /></button></div><label className="field"><span>Name</span><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label><div className="details-grid"><label className="field"><span>Subject</span><input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></label><label className="field"><span>Due date</span><input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></label></div><div className="modal-actions"><button className="secondary" onClick={() => setEditing(false)}>Cancel</button><button className="primary" onClick={saveEdit}>Save changes</button></div></div></div>}
      {confirmDelete && <div className="modal-backdrop" role="presentation"><div className="modal small" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><span className="danger-icon"><Trash2 /></span><h2 id="delete-title">Delete this assignment?</h2><p>This removes the plan and its progress from this device. This can’t be undone.</p><div className="modal-actions"><button className="secondary" onClick={() => setConfirmDelete(false)}>Keep it</button><button className="danger" onClick={remove}>Delete</button></div></div></div>}
    </div>
  );
}

function AppRouter() {
  const { items, setItems } = useAssignments();
  const saveAssignment = (a: Assignment) => setItems(v => [a, ...v]);
  return <Shell><RoutedErrorBoundary><Switch>
    <Route path="/"><Dashboard assignments={items} /></Route>
    <Route path="/help"><GetHelp /></Route>
    <Route path="/review"><Review saveAssignment={saveAssignment} /></Route>
    <Route path="/assignments/:id"><AssignmentDetails assignments={items} setAssignments={setItems} /></Route>
    <Route component={NotFound} />
  </Switch></RoutedErrorBoundary></Shell>;
}
function RoutedErrorBoundary({ children }: { children: ReactNode }) { const [location] = useLocation(); return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>; }
export default function App() {
  return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><AppRouter /></WouterRouter>;
}