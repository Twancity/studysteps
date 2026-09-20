const fs = require('fs');
let content = fs.readFileSync('artifacts/studysteps/src/App.tsx', 'utf8');

const routerSearch = `function AppRouter() {
  const { items, setItems } = useAssignments();
  const saveAssignment = (a: Assignment) => setItems(v => [a, ...v]);
  return <Shell><RoutedErrorBoundary><Switch>
    <Route path="/"><Dashboard assignments={items} /></Route>
    <Route path="/help"><GetHelp /></Route>
    <Route path="/review"><Review saveAssignment={saveAssignment} /></Route>
    <Route path="/photo-help"><PhotoHelpReview /></Route>
    <Route path="/project-launchpad"><ProjectLaunchpad /></Route>
    <Route path="/assignments/:id"><AssignmentDetails assignments={items} setAssignments={setItems} /></Route>
    <Route component={NotFound} />
  </Switch></RoutedErrorBoundary></Shell>;
}`;

const doneDueCode = `function DoneDue({ assignments, setAssignments }: { assignments: Assignment[]; setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>> }) {
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
          {items.map(a => <AssignmentCard key={a.id} assignment={a} onClick={() => navigate(\`/assignments/\${a.id}\`)} completed={false} />)}
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
    <Route path="/done-due"><DoneDue assignments={items} setAssignments={setItems} /></Route>
    <Route path="/help"><GetHelp /></Route>
    <Route path="/review"><Review saveAssignment={saveAssignment} /></Route>
    <Route path="/photo-help"><PhotoHelpReview /></Route>
    <Route path="/project-launchpad"><ProjectLaunchpad /></Route>
    <Route path="/assignments/:id"><AssignmentDetails assignments={items} setAssignments={setItems} /></Route>
    <Route component={NotFound} />
  </Switch></RoutedErrorBoundary></Shell>;
}`;

content = content.replace(routerSearch, doneDueCode);
fs.writeFileSync('artifacts/studysteps/src/App.tsx', content);
