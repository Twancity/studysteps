# StudySteps

**Turn confusing schoolwork into clear next steps.**

StudySteps is a local-first study support product that helps students understand schoolwork, break assignments into manageable plans, and keep track of what is done versus what still needs to be submitted. It accepts text, voice, and supported photos, then adapts the experience to a concept, worksheet problem, or project.

**Status:** V1 portfolio build / frozen baseline.

## Problem

Students often know they have work to do but do not know how to begin, what a prompt requires, or how to recover when they are stuck. Generic task lists organize work without teaching the underlying concept. General-purpose AI can produce an answer quickly, but that can reduce learning, weaken student agency, and create citation risks.

## Target users

- Primarily students in grades 6–12
- Younger learners when a grade level is provided or can be reasonably inferred
- Students who benefit from multiple input and reading modes

StudySteps is a student tool, not an LMS, teacher dashboard, or automatic submission system.

## Core experiences

- **Help Me Understand:** creates a grade-appropriate explanation, worked example, guided practice, hints, answer checking, and an explicitly gated answer reveal.
- **Break Down My Assignment:** turns assignment language into editable steps, deliverables, dates, and turn-in details.
- **Worksheet/problem help:** teaches the method before revealing a final answer.
- **Project Launchpad:** moves from Understand → Explore → Choose → Plan → Build → Track.
- **Text, photo, and voice input:** supports typed or pasted work, browser-native voice transcription, camera capture, file selection, and drag-and-drop.
- **Read to Me:** reads explanations and plans aloud with browser speech synthesis.
- **Done & Due:** separates finishing work from turning it in and organizes assignments by urgency.

## Product principles

1. **Teach Before Answer.** Explain, model, hint, invite an attempt, check, and reveal only on request.
2. **AI suggests; the student decides.** Plans and project directions remain editable and require student choice.
3. **Explain reasoning instead of dumping answers.**
4. **Never submit automatically.**
5. **Never fabricate citations or source metadata.**

## Input modes and accessibility

- Keyboard-friendly text entry
- Camera capture, file picker, and drag-and-drop for JPEG/JPG, PNG, and WebP
- Browser-native speech recognition with typing fallback
- Browser-native Read to Me controls
- Responsive layouts for mobile and desktop
- Plain-language error and recovery states

Browser speech, microphone permission, camera behavior, and voice availability vary by browser and device.

## Current V1 capabilities

- Live AI concept tutoring and assignment breakdown
- Real multimodal photo understanding for supported image formats
- Separate concept, worksheet/problem, and project behavior
- Progressive hints and student answer checking
- Explicit Show Answer gating
- Project idea exploration and editable planning
- Limited, validated source suggestions where available
- MLA, APA, and Chicago formatting for validated metadata
- Local assignment persistence, Done & Due grouping, reminders, and turn-in tracking
- Thirty-day cleanup of completed work

## Known V1 limitations

- Data is local to the browser; there are no accounts or cloud sync.
- Verified source suggestions cover a deliberately limited collection and are not available for every topic.
- StudySteps does not search the open web for citations.
- Speech recognition and speech synthesis depend on browser support.
- Photo understanding depends on image clarity and AI service availability.
- HEIC/HEIF files are not supported.
- There are no LMS integrations, parent/teacher portals, or automatic submission.
- AI output can still require student review and correction.
- Photo-format and photo answer-boundary behavior passed manual/live checks, but dedicated automated regression coverage remains a known test gap.

## Testing statement

V1 was evaluated through manual acceptance testing, live API checks, responsive preview review, TypeScript checks, and production builds. Manual passes are not presented as comprehensive automated regression coverage. This repository does not claim automated user research, public adoption, revenue, or real-world usage outcomes.

## Technology and build

StudySteps uses a React and TypeScript web client, a TypeScript API service, an OpenAPI contract with generated client types, and managed AI integration. Local browser storage supports the V1 persistence model. Secrets are supplied through the hosting environment and are not stored in documentation or source control.

Common verification commands:

```bash
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/studysteps run typecheck
PORT=4173 BASE_PATH=/studysteps pnpm --filter @workspace/studysteps run build
```

See [PRD.md](PRD.md), [the product case study](docs/PRODUCT_CASE_STUDY.md), and [testing notes](docs/TESTING.md) for the product rationale and V1 evidence.