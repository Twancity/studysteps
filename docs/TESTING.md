# StudySteps V1 Testing

## Testing approach

V1 was assessed through **manual acceptance tests** and **technical build checks**. No automated user-research sample, public usage study, or automated test count is claimed.

## Manual acceptance-test history

### Break Down My Assignment — manual

**Purpose:** verify that pasted assignment language becomes an editable plan rather than an automatically saved result.

**Checks:** requirement interpretation, generated steps, editable title/subject/date, approval, and dashboard visibility.

**Final status:** Pass.

### Dashboard and details persistence — manual

**Purpose:** verify that approved assignments survive navigation and reload.

**Checks:** local persistence, step completion, deliverables, progress, due date, turn-in method, status, and completed-work cleanup behavior.

**Final status:** Pass within the same browser profile.

### Help Me Understand — manual, initial partial fail then pass

**Initial result:** The AI returned technically structured output, but the lesson was educationally weak. Grade adaptation, worked-example separation, practice guidance, and answer boundaries needed refinement.

**Iteration:** Concept-specific prompts, safe progressive hints, separate practice, answer checking, and explicit answer reveal were added.

**Final status:** Pass in live concept-help checks, including ordinary spelling errors.

### Voice-input assignment — manual

**Initial focus:** determine whether speech could populate an assignment without trapping the student in a voice-only flow.

**Iteration:** Final transcripts append to editable text; stop, permission, error, and unsupported-browser states were clarified.

**Final status:** Implementation pass. Physical microphone behavior remains browser/device dependent.

### Photo understanding — manual, initial fail then pass

**Initial issue:** The app previewed an uploaded photo but did not send it to AI for understanding.

**Root cause:** The upload interaction and the analysis workflow were not connected.

**Iteration:** Supported images are validated, encoded, sent to multimodal analysis, reviewed by the student, and then routed to concept, worksheet, or project help.

**Final status:** Pass in manual/live API checks for supported images and photo-help generation. OCR quality still depends on image clarity. Dedicated automated regression coverage for renamed/unsupported phone-image formats remains an open test gap.

### Worksheet teaching — manual

**Purpose:** verify Teach Before Answer rather than answer dumping.

**Checks:** distinct worked example, method-first explanation, progressive hints, student attempt, answer check without a browser key, and explicit Show Answer.

**Iteration:** Initial answer fields were removed from browser payloads. Semantic review, deterministic answer scanning, and fail-closed retries were added. A missing-addend identity case was used to test subtle leakage.

**Final status:** Pass in manual/live checks. The initial `54 + ____ = 54` lesson withheld the target answer; Show Answer later returned the reasoning and answer. Dedicated automated regression coverage for photo-help answer leakage remains an open test gap.

### Final V1 readiness audit — manual and technical

The final audit reviewed:

- Image-format alignment and HEIC/HEIF rejection
- Target-answer gating
- Credible-source boundaries
- Live typed concept help
- Voice and Read to Me implementation
- Camera, picker, drag/drop, preview, replace, and remove
- Real photo analysis
- Project Launchpad
- Done & Due
- Local persistence
- Mobile rendering
- Current builds and TypeScript checks

**Final status:** Pass, with browser/device caveats below.

## Current major-feature status

| Area | Test type | Status |
|---|---|---|
| Help Me Understand | Manual/live API | Pass |
| Break Down My Assignment | Manual | Pass |
| Worksheet teach-before-answer | Manual/live API | Pass |
| Project Launchpad | Manual/code-path review | Pass |
| Photo understanding | Manual/live API | Pass |
| Voice input | Manual/implementation review | Pass with device caveat |
| Read to Me | Manual/implementation review | Pass with device caveat |
| Done & Due | Manual | Pass |
| Local persistence | Manual | Pass |
| Mobile layout | Responsive preview | Pass |

## Technical build checks

The final readiness audit recorded:

- API TypeScript check: Pass
- API production build: Pass
- Web TypeScript check: Pass
- Web production build: Pass
- Diff whitespace check: Pass
- Running workflows and browser console review: Pass

These are build checks, not user-outcome evidence.

The V1 evidence is intentionally separated from test completeness: manual/live checks passed, while automated regression suites for photo-format rejection and photo answer boundaries were not recorded as complete.

## Browser and device caveats

- Microphone permission and speech recognition vary by browser and operating system.
- Speech-synthesis voices and audio quality vary by device.
- Camera picker behavior differs across mobile browsers.
- Local data does not follow the student to another browser or device.
- Photo understanding depends on framing, image clarity, supported encoding, network availability, and AI service availability.