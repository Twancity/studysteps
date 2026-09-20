# StudySteps AI Guardrails

## Purpose

StudySteps uses AI to support learning and planning, not to replace student judgment or complete schoolwork automatically.

## Teach before answer

- Explain the concept or practiced skill first.
- Use a clearly different worked example.
- Provide progressive hints and guided setup.
- Invite a student attempt and offer answer checking.
- Reveal the target answer only after explicit Show Answer selection.
- Keep target final answers out of initial browser payloads.

## Student agency

- AI suggests; the student decides.
- Photo extraction is reviewed before use.
- Project direction is selected by the student.
- Plans remain editable before approval.
- Suggestions are not automatically saved or submitted.

## Explanation quality

- Explain reasoning rather than dumping answers.
- Adapt language, numbers, and pacing to the stated or inferred grade level.
- Begin concretely before using formal terminology.
- Tolerate ordinary spelling, phonetic, and speech-recognition errors.
- Ask for clarification or fail clearly when the input cannot be understood.

## Academic integrity

- Do not produce submission-ready graded essays or creative projects.
- Do not perform automatic submission.
- Keep worked examples distinct from target problems and final results.
- Encourage students to follow teacher rules and use their own words.
- Treat answer checking as feedback, not high-stakes grading.

## Source and citation integrity

StudySteps must never fabricate:

- Citations
- Authors
- Publication dates
- URLs
- Page numbers
- DOIs
- Titles, organizations, or other source metadata

Verified-source support must be clearly distinguished from unsupported topics. When validated metadata is unavailable, say so. Citation style formatting must operate only on validated metadata.

## Availability and fallback

- Show understandable loading and error states.
- Preserve student input when a request fails where practical.
- Offer retry, edit, or typed fallback paths.
- Do not silently replace unavailable AI output with invented content.

## Image-processing privacy

Supported photos are sent to the configured AI service for analysis when the student chooses to analyze them. Students should avoid uploading unrelated sensitive information. V1 does not provide an account-based image library or promise long-term cloud storage. Future retention or storage features require explicit privacy controls and documentation.

## Enforcement model

Guardrails combine:

- Structured API contracts
- Prompt requirements
- Server-authored safe hints
- Semantic answer-leak review
- Deterministic target-answer scanning
- Fail-closed regeneration
- Separate answer-check and answer-reveal endpoints

These measures reduce risk but do not make AI infallible. Students must retain the ability to review, correct, and stop.

The controls above are implemented and passed targeted manual/live V1 checks. Dedicated automated regression coverage for the photo-help answer boundary remains an open test gap.