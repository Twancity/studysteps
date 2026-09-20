# StudySteps V1 Product Case Study

## Summary

StudySteps evolved from an assignment organizer into a multimodal learning and planning product. The central PM decision was to stop treating every school task as a checklist problem. Concepts, worksheet problems, and projects require different interactions, different guardrails, and different definitions of success.

## Initial problem hypothesis

Students often delay schoolwork because the first step is unclear. The initial hypothesis was that converting an assignment into a checklist would reduce that ambiguity.

## Why a generic checklist was insufficient

Manual testing showed that a checklist could organize a project but could not explain multiplication, teach a worksheet method, or help a student choose among project directions. “Break this down” and “help me understand” were separate jobs.

## Discovery through manual testing

Testing focused on realistic flows rather than polished happy paths: entering assignments, refreshing the browser, using voice transcription, uploading photos, asking misspelled concept questions, solving worksheet problems, and checking whether work was merely complete or actually submitted.

Two findings changed the product:

1. **Educational quality mattered beyond technical validity.** An early Help Me Understand response could be structurally valid yet educationally weak: it did not reliably adapt to the learner, separate examples from practice, or guide an attempt.
2. **The photo experience was initially incomplete.** Uploading a photo produced a preview, but the image was not connected to real AI understanding. The UI implied capability the product did not yet deliver.

## Key product decisions

### Separate problems, concepts, and projects

- **Concept:** explain, model, practice, and check understanding.
- **Worksheet/problem:** teach the method, invite an attempt, check, then reveal on request.
- **Project:** understand requirements, explore options, choose, and only then plan.

This routing replaced a one-size-fits-all checklist.

### Teach Before Answer

The problem-learning sequence became:

**Explain → Example → Hint → Student Attempts → Check → Show Answer**

The target answer is not placed in the initial browser payload. A different worked example may include its answer because its purpose is to model reasoning. Final target reasoning and answers require an explicit Show Answer request.

### Project Launchpad

Broad assignments use:

**Understand → Explore → Choose → Plan → Build → Track**

The sequence prevents premature planning. Students first review extracted requirements, compare three directions, and make a human choice before AI proposes steps.

## Student agency and human-in-the-loop choices

- Photo extraction is reviewed before help is created.
- Project directions require a student selection.
- Plans remain editable before approval.
- AI suggestions are not saved automatically.
- Show Answer is a deliberate student action.
- StudySteps never submits work.

## Accessibility and input decisions

The product supports:

- Typed and pasted input
- Camera capture and file selection
- Drag-and-drop photos
- Browser-native voice transcription
- Read to Me using browser speech synthesis
- Responsive mobile layouts

These modes provide alternatives rather than replacing editable text. Unsupported speech environments fall back to typing.

## Done & Due insight

Completing an assignment is not the same as submitting it. Done & Due therefore tracks both work progress and Turned In state, along with the required turn-in method. This distinction made the organizer reflect the student’s real job rather than only task completion.

## Credible-source and citation guardrails

Source discovery was deliberately constrained. V1 offers a limited validated collection where available and clearly states when a topic is unsupported. MLA, APA, and Chicago formatting operate on validated metadata; the product does not invent authors, dates, URLs, page numbers, or DOIs.

## Scope control

The V1 freeze excluded:

- Accounts and cloud sync
- LMS integrations
- Parent and teacher portals
- Automatic submission
- Broad open-web research
- Long-term learner profiles
- Autonomous study agents

These exclusions kept the portfolio build focused on the core learning and planning loops.

## What shipped in V1

- Live AI concept help
- Assignment breakdown and editable planning
- Real multimodal photo understanding
- Voice input and Read to Me
- Distinct concept, worksheet, and project flows
- Progressive hints, answer checking, and gated reveal
- Project Launchpad
- Done & Due with local persistence and turn-in tracking
- Limited validated resources and citation formatting
- Mobile-responsive UI and graceful error states

Photo-format rejection and answer-boundary behavior were verified manually and through live checks for the frozen baseline. Dedicated automated regression coverage for those paths remains deferred test work rather than a claimed V1 capability.

## What is deferred

Smart scheduling, adaptive understanding checks, broader grounded research, class-material retrieval, learning memory, cloud sync, and agentic coaching remain future roadmap options.

## PM competencies demonstrated

- Problem framing and job segmentation
- Manual discovery and acceptance testing
- Translating weak outputs into product requirements
- Human-in-the-loop interaction design
- AI behavior and academic-integrity policy
- Accessibility and multimodal product design
- Scope control and phased roadmapping
- Risk identification and mitigation
- Clear distinction between verified evidence and proposed future metrics

This case study documents product decisions and observed test behavior. It does not claim public adoption, revenue, or measured learning outcomes.