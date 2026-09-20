import { Router, type IRouter, type Request, type Response } from "express";
import {
  AnalyzePhotoBody,
  AnalyzePhotoResponse,
  CreatePhotoHelpBody,
  CreatePhotoHelpResponse,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const supportedImage = /^data:image\/(?:jpeg|png|webp);base64,/i;

function parseModelJson(content: string | null) {
  if (!content) throw new Error("The model returned an empty response");
  return JSON.parse(content.replace(/^```json\s*/i, "").replace(/\s*```$/, ""));
}

router.post("/photo-analysis", async (req: Request, res: Response) => {
  const parsed = AnalyzePhotoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Choose a valid JPEG, PNG, or WebP image and try again." });
    return;
  }
  const { imageDataUrl, studentRequest, selectedMode } = parsed.data;
  if (!supportedImage.test(imageDataUrl)) {
    res.status(400).json({ message: "This image format cannot be analyzed. Try JPEG, PNG, or WebP." });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      max_completion_tokens: 8192,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "schoolwork_extraction",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              kind: { type: "string", enum: ["worksheet_problem", "assignment_project", "concept_topic"] },
              title: { type: "string" },
              directions: { type: "string" },
              visibleContent: { type: "string" },
              gradeLevel: { type: "string" },
              subject: { type: "string" },
              skill: { type: "string" },
              requirements: { type: "array", items: { type: "string" } },
              readable: { type: "boolean" },
              note: { type: "string" },
            },
            required: ["kind", "title", "directions", "visibleContent", "gradeLevel", "subject", "skill", "requirements", "readable", "note"],
          },
        },
      },
      messages: [
        {
          role: "system",
          content: `You extract and classify photographed schoolwork for StudySteps. Understand the actual page before choosing help.
Classify it as exactly one of:
- worksheet_problem: individual questions, equations, exercises, reading questions, or a worksheet
- assignment_project: directions for a longer deliverable, essay, presentation, report, poster, or project
- concept_topic: notes, a diagram, vocabulary, or a topic needing explanation

Transcribe all visible directions, equations, blanks, questions, labels, titles, and requirements faithfully. Preserve mathematical symbols and write blanks as ____. Infer grade level only when the material reasonably supports it; otherwise say "Not clear". Infer subject and the practiced skill. Do not solve the work yet. If blurry or cropped, set readable false and explain exactly what needs a clearer photo. Never invent unreadable content.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Student request: ${studentRequest || "Please help me understand this."}\nSelected help mode: ${selectedMode}` },
            { type: "image_url", image_url: { url: imageDataUrl, detail: "high" } },
          ],
        },
      ],
    });
    const result = AnalyzePhotoResponse.parse(parseModelJson(completion.choices[0]?.message?.content ?? null));
    res.json(result);
  } catch (error) {
    logger.error({ err: error }, "Photo analysis failed");
    res.status(502).json({ message: "We couldn’t read that photo right now. Try again or type the schoolwork instead." });
  }
});

router.post("/photo-help", async (req: Request, res: Response) => {
  const parsed = CreatePhotoHelpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Review the extracted schoolwork before continuing." });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      max_completion_tokens: 8192,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "study_help",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              kind: { type: "string", enum: ["worksheet_problem", "assignment_project", "concept_topic"] },
              heading: { type: "string" },
              explanation: { type: "array", items: { type: "string" } },
              keyIdeas: { type: "array", items: { type: "string" } },
              exampleProblem: { type: "string" },
              exampleSteps: { type: "array", items: { type: "string" } },
              exampleAnswer: { type: "string" },
              actualProblems: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    problem: { type: "string" },
                    steps: { type: "array", items: { type: "string" } },
                    answer: { type: "string" },
                  },
                  required: ["problem", "steps", "answer"],
                },
              },
              guidedTry: { type: "string" },
              understandingCheck: { type: "string" },
              summary: { type: "string" },
              planSteps: { type: "array", items: { type: "string" } },
            },
            required: ["kind", "heading", "explanation", "keyIdeas", "exampleProblem", "exampleSteps", "exampleAnswer", "actualProblems", "guidedTry", "understandingCheck", "summary", "planSteps"],
          },
        },
      },
      messages: [
        {
          role: "system",
          content: `You are StudySteps, a patient tutor and planner. Use only the student-approved extraction. Match the inferred grade level without making the student choose a grade.

For worksheet_problem:
- identify and explain the practiced skill in plain language
- give one different concrete worked example with numbered reasoning
- work through each actual visible problem with reasoning and an answer; do not dump answers
- include a simple guided try and understanding check
- keep planSteps empty
- for missing-addend equations, explicitly explain that the blank is the number added to make the total. For "54 + ____ = 54", explain that adding 0 does not change 54, so the blank is 0.

For assignment_project:
- produce a concise summary and planSteps tied to every detected requirement
- avoid generic steps such as "gather materials" unless the assignment actually requires materials
- leave worksheet-only example fields and actualProblems empty

For concept_topic:
- provide a plain-language explanation, key ideas, a grounded example or analogy, and an understanding check
- leave planSteps and actualProblems empty

Support learning and reasoning. It is acceptable to provide a solution with reasoning. Never write a submission-ready essay or complete a graded creative project for the student.`,
        },
        {
          role: "user",
          content: `Student request: ${parsed.data.studentRequest || "Help me with this."}\n\nStudent-approved extraction:\n${JSON.stringify(parsed.data.extraction, null, 2)}`,
        },
      ],
    });
    const result = CreatePhotoHelpResponse.parse(parseModelJson(completion.choices[0]?.message?.content ?? null));
    res.json(result);
  } catch (error) {
    logger.error({ err: error }, "Photo help generation failed");
    res.status(502).json({ message: "We couldn’t build the learning help right now. Try again or use typed help." });
  }
});

export default router;