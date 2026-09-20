const fs = require('fs');
let content = fs.readFileSync('artifacts/studysteps/src/App.tsx', 'utf8');

const oldDetails = `function AssignmentDetails({ assignments, setAssignments }: { assignments: Assignment[]; setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>> }) {
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
        <div className="card-top"><span className={\`subject subject-\${assignment.subject.toLowerCase()}\`}>{assignment.subject}</span><span className="due"><CalendarDays />{dueLabel(assignment.dueDate)}</span></div>
        <div className="detail-title"><div><h1>{assignment.title}</h1><p>{assignment.summary}</p></div><button className="icon-text" onClick={() => setEditing(true)}><Pencil /> Edit</button></div>
        <div className="metric-row"><div><strong>{pct}%</strong><span>complete</span></div><div><strong>{assignment.steps.filter(s => s.complete).length}/{assignment.steps.length}</strong><span>steps done</span></div><div><strong>{days < 0 ? 'Past' : days}</strong><span>{days < 0 ? 'due' : days === 1 ? 'day left' : 'days left'}</span></div></div>
        <div className="progress-track large"><span style={{ width: \`\${pct}%\` }} /></div>
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
}`;

const newDetails = `function AssignmentDetails({ assignments, setAssignments }: { assignments: Assignment[]; setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>> }) {
  const [, params] = useRoute('/assignments/:id');
  const [, navigate] = useLocation();
  const assignment = assignments.find(a => a.id === params?.id);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState(() => assignment ? { title: assignment.title, subject: assignment.subject, dueDate: assignment.dueDate } : { title: '', subject: '', dueDate: '' });
  
  if (!assignment) return <div className="page narrow empty-state"><h1>Assignment not found</h1><button className="primary" onClick={() => navigate('/')}>Back to Dashboard</button></div>;
  
  const pct = progress(assignment); const days = daysRemaining(assignment.dueDate);
  const allStepsComplete = assignment.steps.length > 0 && assignment.steps.every(s => s.complete);
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
        <div className="card-top"><span className={\`subject subject-\${assignment.subject.toLowerCase()}\`}>{assignment.subject}</span><span className="due"><CalendarDays />{dueLabel(assignment.dueDate)}</span></div>
        <div className="detail-title"><div><h1>{assignment.title}</h1><p>{assignment.summary}</p></div><button className="icon-text" onClick={() => setEditing(true)}><Pencil /> Edit</button></div>
        <div className="metric-row"><div><strong>{pct}%</strong><span>complete</span></div><div><strong>{assignment.steps.filter(s => s.complete).length}/{assignment.steps.length}</strong><span>steps done</span></div><div><strong>{days < 0 ? 'Past' : days}</strong><span>{days < 0 ? 'due' : days === 1 ? 'day left' : 'days left'}</span></div></div>
        <div className="progress-track large"><span style={{ width: \`\${pct}%\` }} /></div>
      </section>

      {allStepsComplete && notTurnedIn && (
        <section className="celebration turned-in-reminder" data-testid="status-reminder">
          <CheckCircle2 />
          <div>
            <h2>You finished this, but did you turn it in?</h2>
            <p>Make sure you submit your work using the method below, then mark it Turned In.</p>
          </div>
        </section>
      )}

      {pct < 100 && !allStepsComplete && (
        <section className="focus-card"><span><ArrowRight /></span><div><p className="eyebrow">YOUR NEXT STEP</p><h2>{nextStep(assignment)}</h2><p>Just focus on this one. You don’t have to do everything at once.</p></div></section>
      )}
      
      {pct === 100 && !notTurnedIn && (
        <section className="celebration"><CheckCircle2 /><div><h2>You finished every step!</h2><p>Take a moment to check your work against the directions before turning it in.</p></div></section>
      )}

      <section className="checklist-card"><div className="review-title"><div><p className="eyebrow">YOUR PLAN</p><h2>Assignment checklist</h2></div><span>{assignment.steps.filter(s => s.complete).length} of {assignment.steps.length}</span></div>
        <div className="checklist">{assignment.steps.map((s, i) => <button key={s.id} className={s.complete ? 'done' : ''} onClick={() => toggleStep(s.id)}><span className="check-control">{s.complete ? <Check /> : <Circle />}</span><span><small>STEP {i + 1}</small>{s.text}</span></button>)}</div>
      </section>

      <section className="checklist-card">
        <div className="review-title">
          <div><p className="eyebrow">READY TO SUBMIT?</p><h2>Turn in checklist</h2></div>
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
             <button key={s} className={\`status-btn \${assignment.status === s ? 'active' : ''}\`} onClick={() => setStatus(s)}>
               {s === 'Turned In' ? <CheckCircle2 /> : <Circle />} {s}
             </button>
           ))}
        </div>
      </section>

      <section className="reminder-controls">
        <p className="eyebrow">REMINDERS</p>
        <button className={\`secondary \${assignment.reminderEnabled ? 'active' : ''}\`} onClick={requestNotificationPermission}>
          {assignment.reminderEnabled ? <Check /> : <Clock3 />} Browser reminders {assignment.reminderEnabled ? 'enabled' : 'off'}
        </button>
      </section>

      <button className="delete-button" onClick={() => setConfirmDelete(true)}><Trash2 /> Delete assignment</button>
      {editing && <div className="modal-backdrop" role="presentation"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-title"><div className="modal-head"><h2 id="edit-title">Edit assignment</h2><button onClick={() => setEditing(false)} aria-label="Close"><X /></button></div><label className="field"><span>Name</span><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label><div className="details-grid"><label className="field"><span>Subject</span><input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></label><label className="field"><span>Due date</span><input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></label></div><div className="modal-actions"><button className="secondary" onClick={() => setEditing(false)}>Cancel</button><button className="primary" onClick={saveEdit}>Save changes</button></div></div></div>}
      {confirmDelete && <div className="modal-backdrop" role="presentation"><div className="modal small" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><span className="danger-icon"><Trash2 /></span><h2 id="delete-title">Delete this assignment?</h2><p>This removes the plan and its progress from this device. This can’t be undone.</p><div className="modal-actions"><button className="secondary" onClick={() => setConfirmDelete(false)}>Keep it</button><button className="danger" onClick={remove}>Delete</button></div></div></div>}
    </div>
  );
}`;

content = content.replace(oldDetails, newDetails);
fs.writeFileSync('artifacts/studysteps/src/App.tsx', content);
