# StudySteps Success Metrics

## A. V1 acceptance and quality metrics

These are the quality conditions actually verified during V1 manual testing and technical checks. They are not adoption or learning-outcome claims.

| Quality measure | V1 evidence |
|---|---|
| Supported image formats align across client and API | Verified for JPEG/JPG, PNG, and WebP; HEIC/HEIF rejected |
| Initial target answers remain outside browser payloads | Verified in concept and worksheet flows |
| Show Answer is an explicit separate action | Verified through live API and UI flow checks |
| Answer checking does not require a browser answer key | Verified in request contract and live checks |
| Typed Help Me Understand uses live AI | Verified through successful live requests |
| Real photo understanding is connected | Verified through multimodal API/photo-help checks |
| Concept, worksheet, and project experiences are distinct | Verified through flow and code-path review |
| Source scope is limited and unsupported topics are clear | Verified in V1 resource behavior |
| Done & Due persists assignments locally | Verified manually within one browser profile |
| Mobile baseline remains usable | Verified with responsive mobile preview |
| Current API/web type checks and builds pass | Verified in final readiness audit |

Device-dependent camera, microphone, and speech behavior was reviewed manually and through implementation checks but cannot be guaranteed across every browser/device.

“Verified” here means the recorded manual/live V1 acceptance checks passed. It does not imply comprehensive automated regression coverage; photo-format rejection and photo-help answer boundaries retain explicit test gaps.

## B. Proposed future product metrics

These metrics are definitions for future instrumented evaluation. No achieved values are claimed.

### Activation and planning

- **Assignment-start rate:** share of captured assignments where a student begins the first planned step.
- **Plan approval rate:** share of generated plans that students edit or approve.
- **Project-choice rate:** share of Project Launchpad sessions where a student selects a direction.

### Learning behavior

- **Hint-to-answer-reveal ratio:** hints requested relative to final answer reveals.
- **Attempt-before-reveal rate:** share of practice problems with a student attempt before reveal.
- **Concept-help satisfaction:** student rating after a concept explanation or practice flow.
- **Understanding-check completion:** share of concept sessions with a completed reflection/check.

### Execution

- **Completion-to-turn-in rate:** completed assignments subsequently marked Turned In.
- **On-time submission rate:** assignments marked Turned In by the due date.
- **Step completion rate:** planned steps completed before the due date.

### Retention

- **Return usage:** students returning for another learning or planning session within a defined period.
- **Cross-experience usage:** students using more than one of concept help, problem help, and assignment planning.

## Measurement principles

- Separate behavioral telemetry from claimed learning outcomes.
- Do not interpret answer reveals alone as failure; use sequence and context.
- Segment by experience type and grade band without creating permanent ability labels.
- Obtain appropriate consent and minimize data collection, especially for minors.
- Publish metric definitions and known limitations before drawing conclusions.