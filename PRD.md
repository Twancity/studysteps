# StudySteps V1 Product Requirements Document

**Status:** Frozen V1 portfolio baseline  
**Product:** StudySteps  
**Tagline:** Turn confusing schoolwork into clear next steps.

## Product vision

Help students move from confusion to an informed next action while preserving learning, agency, and academic integrity.

## User problem

Students encounter three related but different problems:

1. They do not understand a concept or skill.
2. They do not know how to solve a specific worksheet problem.
3. They do not know how to turn a broad assignment into an actionable plan.

A generic checklist does not teach. A generic answer generator can bypass learning. StudySteps must identify the kind of help needed and provide the right sequence.

## Target users and personas

- **Independent middle/high school student:** needs a clear starting point and manageable steps.
- **Stuck learner:** understands part of a lesson but needs a simpler explanation, example, or hint.
- **Younger supported learner:** benefits from inferred or stated grade-level adaptation.
- **Multimodal learner:** prefers photos, speech, or audio output rather than text alone.

## Jobs to be done

- When schoolwork feels confusing, help me understand what it means and what to try next.
- When I am solving a problem, teach me the method without immediately giving me the answer.
- When I receive a project, help me understand requirements and choose an approach before planning.
- When I finish work, help me remember whether and how it must be turned in.

## Goals

- Reduce ambiguity at the start of schoolwork.
- Provide grade-appropriate explanations and actionable guidance.
- Preserve student choice in plans and project direction.
- Separate learning support from answer delivery.
- Support completion and submission as distinct states.
- Provide credible sources only when validation is available.

## Non-goals

- Completing or submitting graded work for students
- LMS integrations
- Parent or teacher portals
- Accounts, cloud sync, or cross-device history
- Open-web research coverage for every topic
- Automated grading, discipline, or high-stakes educational decisions

## MVP / V1 scope

- Typed Help Me Understand and Break Down My Assignment
- Browser voice input and Read to Me
- JPEG/JPG, PNG, and WebP photo input and multimodal understanding
- Concept, worksheet/problem, and project-specific help
- Progressive hints, guided solving, answer checking, and explicit answer reveal
- Project Launchpad
- Editable assignment plans
- Done & Due dashboard and assignment details
- Local persistence and completed-work cleanup
- Limited validated resources and citation formatting

## User stories

- As a student, I can type, speak, or photograph schoolwork so I can use the input mode available to me.
- As a student, I can receive a simpler explanation and a different worked example.
- As a student, I can request hints and try an answer before seeing the final answer.
- As a student, I can check my answer without the browser already holding an answer key.
- As a student, I can choose among project directions before generating a plan.
- As a student, I can edit AI-suggested steps before approving them.
- As a student, I can distinguish completed work from turned-in work.
- As a student, I can hear supported content read aloud.

## Functional requirements

### Inputs

- Text and pasted input must remain editable.
- Voice input must append recognized final speech and provide a typing fallback.
- Photo input must support camera, picker, and drag-and-drop.
- The client and API must accept only JPEG/JPG, PNG, and WebP.
- The student must review extracted photo content before help is generated.

### Learning help

- Concept help must infer topic, likely subject, and grade level when reasonable.
- Worksheet help must preserve visible problems and provide method-focused hints.
- Project help must summarize requirements and produce meaningfully different choices.
- Worked examples must differ from the student’s target problem and final result.
- Answer checking must use server-side reasoning rather than a browser answer key.
- Show Answer must make an explicit, separate request.

### Planning and tracking

- Plans must remain editable before approval.
- Project Launchpad must follow Understand → Explore → Choose → Plan → Build → Track.
- Approved assignments must appear in the dashboard and Done & Due.
- Assignment details must track steps, deliverables, due date, status, reminders, and turn-in method.

## AI behavior requirements

- Adapt explanations to the stated or inferred grade level.
- Tolerate common spelling, phonetic, and speech-recognition errors.
- Explain concretely before introducing formal language.
- Distinguish concepts, worksheet problems, and projects.
- Fail clearly when AI is unavailable; do not silently invent data.
- Never treat model output as automatically approved student work.

## Academic-integrity guardrails

- Teach before revealing a target answer.
- Keep final target answers out of initial browser payloads.
- Permit labeled answers only for clearly different worked examples.
- Reveal a target answer only after explicit student action.
- Never produce automatic submissions or a submission-ready graded creative project.
- Remind students to follow teacher rules and use their own words.
- Never fabricate citations, authors, dates, URLs, page numbers, DOIs, or metadata.

See [AI guardrails](docs/AI_GUARDRAILS.md).

## Accessibility requirements

- Provide text, photo, and voice input paths.
- Provide Read to Me where learning and planning content is presented.
- Preserve keyboard-operable controls and visible labels.
- Provide understandable loading, empty, unsupported, and error states.
- Maintain responsive behavior on narrow mobile viewports.
- Do not make essential information available only through audio or color.

## Done & Due requirements

- Group active assignments by urgency: overdue, today, tomorrow, soon, and later.
- Show progress and the next incomplete step.
- Distinguish work completion from Turned In status.
- Preserve explicit turn-in method when available.
- Support reminders without claiming background notification delivery.
- Remove completed work after thirty days to keep local state manageable.

## Proposed product metrics

These are future measurement definitions, not achieved results:

- Assignment-start rate
- Plan approval rate
- Hint-to-answer-reveal ratio
- Student-attempt-before-reveal rate
- Completion-to-turn-in rate
- On-time submission rate
- Concept-help satisfaction
- Return usage

See [success metrics](docs/SUCCESS_METRICS.md).

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| AI exposes a target answer too early | Separate reveal endpoint, answer-leak review, deterministic scanning, fail-closed retries, and continued regression testing |
| Weak or age-inappropriate teaching | Grade adaptation, method-first prompts, worked examples, and manual testing |
| Fabricated citations | Fixed validated collection, unsupported-topic messaging, and formatting only from validated metadata |
| Incorrect photo extraction | Student review before generating help and clear retry/edit paths |
| Browser speech incompatibility | Feature detection and text fallback |
| Local data loss or device lock-in | Clear local-first constraint; cloud sync deferred rather than implied |
| Product scope expands into an LMS | Explicit V1 non-goals and scope freeze |

## Acceptance criteria

- Supported image formats and messages align across client and API.
- HEIC/HEIF is not advertised or accepted.
- Initial target-problem payloads contain no final answer fields.
- Check My Answer sends no browser-held answer key.
- Show Answer is the explicit final-answer path.
- Concepts, worksheets, and projects receive distinct experiences.
- Source suggestions are validated or clearly unavailable.
- Plans remain editable and require student approval.
- Done & Due persists locally and separates completion from turn-in.
- Voice, Read to Me, and mobile fallbacks are present.
- API and web type checks and production builds pass.

These criteria describe the frozen V1 baseline. Photo-format and photo answer-boundary behavior passed manual/live acceptance checks; dedicated automated regression coverage remains future test work.

## V1 constraints and assumptions

- V1 is a portfolio build evaluated through manual and technical checks.
- Browser storage is the source of persistence.
- AI and photo analysis require network/service availability.
- Camera, microphone, speech recognition, and speech synthesis vary by browser/device.
- Source support is intentionally narrow.
- No adoption, learning-outcome, revenue, or public-usage claims are made.