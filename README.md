# StudySteps

> **Turn confusing schoolwork into clear next steps.**

StudySteps is a multimodal AI learning and planning product designed to help students **understand schoolwork, choose a path forward, learn the method, and remember what still needs to be turned in**.

**Status:** V1 frozen portfolio baseline  
**Role demonstrated:** Product discovery, AI product design, prioritization, guardrails, UX iteration, acceptance testing, and roadmap definition

---

## Portfolio quick tour

If you are reviewing this as a Product Manager portfolio project, start here:

| Artifact | What it shows |
|---|---|
| [Product Case Study](docs/PRODUCT_CASE_STUDY.md) | How the product evolved through testing and iteration |
| [PRD](PRD.md) | Product vision, requirements, scope, user stories, risks, and acceptance criteria |
| [Testing](docs/TESTING.md) | Manual acceptance-test history and final V1 readiness evidence |
| [Decision Log](docs/DECISION_LOG.md) | Major product tradeoffs and why they were made |
| [AI Guardrails](docs/AI_GUARDRAILS.md) | Teach-before-answer, student agency, citation integrity, and answer gating |
| [Success Metrics](docs/SUCCESS_METRICS.md) | Verified V1 quality measures vs. proposed future product metrics |
| [Roadmap](docs/ROADMAP.md) | Sequenced post-V1 opportunities and explicit non-goals |
| [Demo Guide](docs/DEMO_GUIDE.md) | Short scenarios that demonstrate the product end to end |

See the full [documentation index](docs/README.md).

---

## The problem

Students can struggle at several different points:

1. **“I don’t understand this.”**
2. **“I don’t know how to solve this problem.”**
3. **“I don’t know how to start this project.”**
4. **“I finished it, but I forgot to turn it in.”**

A generic checklist does not teach. A generic answer generator can bypass learning. StudySteps separates these needs and gives each one a different product experience.

---

## Core product flows

### Learn a concept
**Explain → Example → Guided practice → Hint → Student attempts → Check → Show Answer**

StudySteps adapts explanations to the student’s grade level and does not reveal the target answer by default.

### Solve a worksheet/problem
The app identifies the skill, teaches the method, shows a **different** worked example, then helps the student work through the actual problem.

### Start a project
**Understand → Explore → Choose → Plan → Build → Track**

Project Launchpad gives the student multiple directions, credible-resource support where validated, and an editable plan rather than making every creative decision for them.

### Remember to submit
**Done & Due** tracks what is due, what must be turned in, whether the work is complete, and whether it has actually been submitted.

---

## V1 capabilities

- Live AI **Help Me Understand**
- **Break Down My Assignment**
- Concept, worksheet/problem, and project-specific behavior
- Text, voice, camera, file picker, and drag-and-drop input
- Real multimodal photo understanding for JPEG/JPG, PNG, and WebP
- Editable photo extraction review
- Progressive hints and guided solving
- Explicit **Show Answer** gating
- **Tell StudySteps** voice input with editable transcript
- **Read to Me** with play, pause, resume, and stop
- **Project Launchpad**
- Editable assignment plans
- **Done & Due** status and turn-in tracking
- Local persistence and 30-day cleanup of turned-in work
- Limited validated research resources
- MLA, APA, and Chicago formatting from trustworthy source metadata

---

## Product principles

1. **Teach Before Answer** — method and reasoning come first.
2. **AI suggests; the student decides** — plans and project directions remain editable.
3. **Student agency over automation** — no automatic submission.
4. **Different jobs require different experiences** — concepts, worksheet problems, and projects are not treated the same.
5. **Never fabricate research metadata** — no invented authors, dates, URLs, page numbers, DOIs, or citations.
6. **Accessible by design** — students can type, speak, photograph work, drag/drop images, or listen to content.

---

## Key PM iteration

One of the most important findings during manual testing was that **technically valid AI output was not the same as useful learning support**.

Early versions returned generic steps and generic explanations. Photo uploads were also initially only previews and were not actually connected to AI. Those failures changed the product definition of success.

The V1 product was redesigned around:

- separate concept / problem / project paths,
- multimodal understanding,
- grade-appropriate teaching,
- teach-before-answer,
- student-controlled answer reveal,
- Project Launchpad,
- and Done & Due.

The full evolution is documented in the [Product Case Study](docs/PRODUCT_CASE_STUDY.md).

---

## Target users

- Primarily students in grades 6–12
- Younger learners when a grade level is stated or reasonably inferred
- Students who benefit from multiple input and reading modes

StudySteps is **not** an LMS, teacher dashboard, parent portal, automatic grading system, or automatic submission tool.

---

## V1 constraints

- Browser-local persistence; no accounts or cloud sync
- Verified research-source support is intentionally limited
- No open-web citation search
- Browser/device support affects speech recognition, speech synthesis, camera behavior, and notifications
- Photo understanding depends on image quality and AI service availability
- HEIC/HEIF is not supported
- No LMS integrations or cross-device history
- No public adoption, revenue, or learning-outcome claims are made

---

## Testing

V1 was evaluated through:

- manual acceptance testing,
- live API checks,
- responsive mobile review,
- TypeScript checks,
- production builds,
- and final feature-readiness auditing.

The project intentionally distinguishes **verified V1 quality checks** from **future product metrics**.

See [Testing](docs/TESTING.md) and [Success Metrics](docs/SUCCESS_METRICS.md).

---

## Repository map

```text
studysteps/
├── README.md
├── PRD.md
├── docs/
│   ├── README.md
│   ├── PRODUCT_CASE_STUDY.md
│   ├── TESTING.md
│   ├── ROADMAP.md
│   ├── DECISION_LOG.md
│   ├── AI_GUARDRAILS.md
│   ├── SUCCESS_METRICS.md
│   └── DEMO_GUIDE.md
├── artifacts/
│   ├── studysteps/       # Web application
│   └── api-server/       # API service
└── lib/                  # Shared/generated integration support
```

---

## Technology

StudySteps uses a React + TypeScript client, a TypeScript API service, an OpenAPI contract with generated client types, managed AI integration, and browser-local persistence for V1.

Secrets are supplied through the hosting environment and are not committed to this repository.

---

## What V1 intentionally does not claim

This is a portfolio product build. It does **not** claim:

- public adoption,
- revenue,
- production school deployment,
- measured improvements in grades,
- measured learning outcomes,
- or formal user-research sample sizes that were not conducted.

The documented evidence is limited to the product decisions, manual acceptance testing, and technical checks actually completed during V1.
