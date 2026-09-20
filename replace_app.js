const fs = require('fs');

let content = fs.readFileSync('artifacts/studysteps/src/App.tsx', 'utf8');

content = content.replace(
  "type Assignment = {\n  id: string; title: string; subject: string; dueDate: string; summary: string;\n  steps: Step[]; createdAt: string;\n};",
  `type AssignmentStatus = 'Not Started' | 'Working On It' | 'Ready to Turn In' | 'Turned In';
type Deliverable = { id: string; text: string; complete: boolean };
type Assignment = {
  id: string; title: string; subject: string; dueDate: string; summary: string;
  steps: Step[]; createdAt: string;
  status: AssignmentStatus;
  deliverables: Deliverable[];
  turnInMethod: string;
  turnedInAt?: string;
  reminderEnabled?: boolean;
};`
);

content = content.replace(
  "type Draft = { mode: Mode; text: string; title: string; subject: string; dueDate: string; suggestedSteps?: string[]; aiSummary?: string };",
  "type Draft = { mode: Mode; text: string; title: string; subject: string; dueDate: string; suggestedSteps?: string[]; aiSummary?: string; deliverables?: string[]; turnInMethod?: string; };"
);

content = content.replace(
  "const seedAssignments: Assignment[] = [\n  {",
  `const seedAssignments: Assignment[] = [
  {
    status: 'Ready to Turn In', deliverables: [{ id: 'd1', text: 'Completed poster', complete: true }], turnInMethod: 'In person (physical)',`
);

content = content.replace(
  "    id: 'sample-english', title: 'Character analysis paragraph', subject: 'English',",
  "    id: 'sample-english', status: 'Working On It', deliverables: [{ id: 'd2', text: 'Written paragraph', complete: false }], turnInMethod: 'Online submission (LMS/Portal)', title: 'Character analysis paragraph', subject: 'English',"
);

content = content.replace(
  "    id: 'sample-math', title: 'Fractions practice set', subject: 'Math',",
  "    id: 'sample-math', status: 'Turned In', turnedInAt: new Date().toISOString(), deliverables: [{ id: 'd3', text: 'Completed worksheet', complete: true }], turnInMethod: 'In person (physical)', title: 'Fractions practice set', subject: 'Math',"
);

content = content.replace(
  `function useAssignments() {
  const [items, setItems] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { try { return JSON.parse(saved); } catch { /* seed below */ } }
    return seedAssignments;
  });
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(items)), [items]);
  return { items, setItems };
}`,
  `function useAssignments() {
  const [items, setItems] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
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
            turnInMethod: a.turnInMethod || 'Turn-in method not provided.',
            turnedInAt: a.turnedInAt,
            reminderEnabled: a.reminderEnabled || false
          } as Assignment;
        }).filter((a: Assignment) => {
          if (a.status === 'Turned In' && a.turnedInAt) {
            return (now - new Date(a.turnedInAt).getTime()) < THIRTY_DAYS;
          }
          return true;
        });
        return migrated.length ? migrated : seedAssignments;
      } catch { /* seed below */ }
    }
    return seedAssignments;
  });
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(items)), [items]);
  return { items, setItems };
}

function useReminders(assignments: Assignment[]) {
  const notified = useRef(new Set<string>());
  
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    
    assignments.forEach(a => {
      if (a.reminderEnabled && a.status !== 'Turned In') {
        const days = daysRemaining(a.dueDate);
        if (days <= 1 && !notified.current.has(a.id)) {
          notified.current.add(a.id);
          new Notification('StudySteps Reminder', {
            body: \`'\${a.title}' is due \${days < 0 ? 'now (overdue)' : days === 0 ? 'today' : 'tomorrow'}!\`,
            icon: '/favicon.ico'
          });
        }
      }
    });
  }, [assignments]);
}

const deriveDeliverablesAndMethod = (text: string, title?: string) => {
  const input = text.toLowerCase();
  const deliverables: string[] = [];
  if (/\\b(essay|paper|report)\\b/.test(input)) deliverables.push('Written paper/essay');
  else if (/\\bparagraph\\b/.test(input)) deliverables.push('Written paragraph');
  if (/\\b(slides?|slideshow|powerpoint|google slides)\\b/.test(input)) deliverables.push('Presentation slides');
  if (/\\b(poster|display board)\\b/.test(input)) deliverables.push('Completed poster');
  if (/\\b(worksheet|packet)\\b/.test(input)) deliverables.push('Completed worksheet');
  if (/\\b(video|recording)\\b/.test(input)) deliverables.push('Video recording');

  if (deliverables.length === 0 && title) {
    const t = title.toLowerCase();
    if (/\\b(essay|paper|report|paragraph|slides|poster|worksheet|packet|video|recording)\\b/.test(t)) {
      deliverables.push(title); 
    }
  }

  let turnInMethod = 'Turn-in method not provided.';
  if (/\\b(canvas|google classroom|blackboard|schoology|upload|submit online)\\b/.test(input)) {
    turnInMethod = 'Online submission (LMS/Portal)';
  } else if (/\\b(print|hand in|on paper|physical)\\b/.test(input) || (input.includes('bring') && input.includes('class'))) {
    turnInMethod = 'In person (physical)';
  } else if (/\\bemail\\b/.test(input)) {
    turnInMethod = 'Email to teacher';
  }

  return { deliverables, turnInMethod };
};`
);

content = content.replace(
  `        <button className={location === '/' ? 'active' : ''} onClick={() => navigate('/')}><Home /><span>Dashboard</span></button>`,
  `        <button className={location === '/' && !location.startsWith('/assignments') ? 'active' : ''} onClick={() => navigate('/')}><Home /><span>Dashboard</span></button>
        <button className={location === '/done-due' ? 'active' : ''} onClick={() => navigate('/done-due')}><Clock3 /><span>Done & Due</span></button>`
);

content = content.replace(
  `        <button className={location.startsWith('/assignments') ? 'active' : ''} onClick={() => navigate('/')}><ListChecks /><span>My Work</span></button>`,
  ``
);

fs.writeFileSync('artifacts/studysteps/src/App.tsx', content);
