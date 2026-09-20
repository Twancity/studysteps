# StudySteps V1 Decision Log

## Local-first V1

**Decision:** Store assignments in the browser without accounts or cloud sync.  
**Rationale:** Validate the core learning and planning experience before adding identity, backend persistence, and privacy complexity.  
**Tradeoff:** Data is browser/device specific.

## Multimodal inputs

**Decision:** Support text, supported photos, and browser voice input.  
**Rationale:** Schoolwork arrives in different forms, and students have different access needs.  
**Tradeoff:** Camera and speech behavior vary by device.

## Separate problem, concept, and project modes

**Decision:** Route each kind of schoolwork to a distinct experience.  
**Rationale:** A concept needs teaching, a problem needs guided solving, and a project needs choice and planning. A generic checklist was insufficient.

## Teach Before Answer

**Decision:** Sequence explanation, example, hint, student attempt, check, and reveal.  
**Rationale:** The product should support learning rather than act as an answer dispenser.

## Answer-reveal gating

**Decision:** Do not deliver target final answers in initial browser payloads; retrieve them only after Show Answer.  
**Rationale:** UI hiding alone is not a meaningful boundary if the answer already exists in browser state.

## Project Launchpad

**Decision:** Use Understand → Explore → Choose → Plan → Build → Track.  
**Rationale:** Students should interpret requirements and select a direction before a plan is generated.

## Credible-source limitations

**Decision:** Offer only a limited validated source collection and clearly mark unsupported topics.  
**Rationale:** Narrow, accurate support is preferable to fabricated or unverified citations.

## Done & Due

**Decision:** Separate completion progress from Turned In status.  
**Rationale:** A finished assignment can still miss its real outcome if it is not submitted correctly.

## Thirty-day completed-work cleanup

**Decision:** Remove completed local records after thirty days.  
**Rationale:** Keep local state useful and bounded without claiming long-term archival.

## Browser-native speech

**Decision:** Use browser speech recognition and speech synthesis where practical.  
**Rationale:** Provide accessible input/output without adding a separate audio service in V1.  
**Tradeoff:** Availability and voice quality are browser dependent.

## V1 scope freeze

**Decision:** Freeze the portfolio baseline after readiness checks.  
**Rationale:** Protect product coherence and document the validated baseline before pursuing scheduling, personalization, broad research, or agentic behavior.