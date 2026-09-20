import { Router, type IRouter, type Request, type Response } from "express";
import {
  AnalyzePhotoBody,
  AnalyzePhotoResponse,
  CreatePhotoHelpBody,
  CreatePhotoHelpResponse,
  CreateProjectPlanBody,
  CreateProjectPlanResponse,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { logger } from "../lib/logger";
import { assertNoStudentAnswerLeak, generateWithSafetyRetries } from "../lib/answer-leak-guard";

const router: IRouter = Router();
const supportedImage = /^data:image\/(?:jpeg|png|webp);base64,/i;

function parseModelJson(content: string | null) {
  if (!content) throw new Error("The model returned an empty response");
  return JSON.parse(content.replace(/^```json\s*/i, "").replace(/\s*```$/, ""));
}

const waterCycleResources = [
  {
    title: "The Water Cycle for Kids",
    organization: "U.S. Geological Survey (USGS)",
    credibility: "USGS is a United States government science agency and this resource comes from its Water Science School.",
    supports: "Accurate labels, process descriptions, and visual inspiration for a water-cycle model.",
    date: "October 1, 2022",
    url: "https://www.usgs.gov/media/images/water-cycle-kids",
    resourceType: "image" as const,
  },
  {
    title: "Exploring the Water Cycle",
    organization: "NASA",
    credibility: "NASA is a United States government science agency; this K–8 activity is published in NASA STEM resources.",
    supports: "How water moves through each stage and how heat energy drives the cycle.",
    date: "February 15, 2023",
    url: "https://www.nasa.gov/stem-content/exploring-the-water-cycle",
    resourceType: "activity" as const,
  },
  {
    title: "The Water Cycle",
    organization: "National Oceanic and Atmospheric Administration (NOAA)",
    credibility: "NOAA is a United States government science agency with educational material reviewed for weather and water science.",
    supports: "Student-friendly explanations plus selected water-cycle videos and multimedia.",
    date: "Last-updated date unavailable",
    url: "https://www.noaa.gov/education/resource-collections/freshwater/water-cycle",
    resourceType: "video" as const,
  },
];

function verifiedResourcesFor(extraction: { title: string; directions: string; visibleContent: string; skill: string }) {
  const text = `${extraction.title} ${extraction.directions} ${extraction.visibleContent} ${extraction.skill}`.toLowerCase();
  return text.includes("water cycle") || text.includes("evaporation") || text.includes("precipitation")
    ? waterCycleResources
    : [];
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
    const result = await generateWithSafetyRetries(async () => {
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
                    hints: { type: "array", items: { type: "string" } },
                  },
                  required: ["problem", "hints"],
                },
              },
              guidedTry: { type: "string" },
              understandingCheck: { type: "string" },
              summary: { type: "string" },
              planSteps: { type: "array", items: { type: "string" } },
              projectIdeas: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    approach: { type: "string" },
                    whyItFits: { type: "string" },
                  },
                  required: ["title", "description", "approach", "whyItFits"],
                },
              },
              resources: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    title: { type: "string" },
                    organization: { type: "string" },
                    credibility: { type: "string" },
                    supports: { type: "string" },
                    date: { type: "string" },
                    url: { type: "string" },
                    resourceType: { type: "string", enum: ["article", "activity", "image", "video"] },
                  },
                  required: ["title", "organization", "credibility", "supports", "date", "url", "resourceType"],
                },
              },
              detectedCitationStyle: { type: "string", enum: ["MLA", "APA", "Chicago", "Not specified"] },
              deliverables: { type: "array", items: { type: "string" } },
              turnInMethod: { type: "string" },
            },
            required: ["kind", "heading", "explanation", "keyIdeas", "exampleProblem", "exampleSteps", "exampleAnswer", "actualProblems", "guidedTry", "understandingCheck", "summary", "planSteps", "projectIdeas", "resources", "detectedCitationStyle", "deliverables", "turnInMethod"],
          },
        },
      },
      messages: [
        {
          role: "system",
          content: `You are StudySteps, a patient tutor and planner. Use only the student-approved extraction. Match the inferred grade level without making the student choose a grade.

For worksheet_problem:
- identify and explain the practiced skill in plain language
- give one different concrete worked example with numbered reasoning; it must not be equivalent to any actual visible problem and must have a different final answer
- include each actual visible problem with progressive hints that teach the next move without giving away its final answer
- do not calculate, state, imply, encode, or include final answers for the student's actual visible problems anywhere in this response; those are requested separately only after Show Answer
- include a simple guided try and understanding check
- keep planSteps empty
- keep projectIdeas and resources empty and detectedCitationStyle "Not specified"
- list a worksheet in deliverables only when the approved directions or visible content indicate that the worksheet itself must be submitted, handed in, uploaded, or brought to class
- for missing-addend equations, explain that the blank represents the number added to make the total and teach the additive-identity strategy, but stop before filling the student's blank or stating its value
- when a target has the form n + ____ = n, do not mention the target's answer in words or numerals anywhere in this response; refer only to "the identity amount that leaves a number unchanged"
- for that target, the worked example must instead be a nonzero missing-addend problem whose total differs from the known addend; do not use another identity example because it would have the same final answer

For assignment_project:
- produce a concise summary and exactly 3 meaningfully different projectIdeas. Each must include a description, concrete materials/approach, and why it fits detected requirements.
- this is the Explore and Choose stage: keep planSteps empty until the student selects one direction
- detect MLA, APA, or Chicago only when explicitly required; otherwise use "Not specified"
- keep resources empty; the server adds only independently verified resources when available
- leave worksheet-only example fields and actualProblems empty

For concept_topic:
- provide a plain-language explanation, key ideas, a grounded example or analogy, and an understanding check
- leave planSteps, projectIdeas, resources, and actualProblems empty; detectedCitationStyle is "Not specified"

For every kind:
- extract deliverables only from explicit assignment language: items the student must submit, present, bring, upload, or hand in. Include required research sources or citations only when the instructions make them part of the submitted work. Never invent a file, photo, physical item, or extra deliverable.
- set turnInMethod to the explicit method stated in the approved extraction, such as "Upload through Google Classroom", "Hand to teacher", "Bring to class", or "Present in class"
- when no submission method is stated, return exactly "Turn-in method not provided"

Support learning and reasoning. A different, clearly labeled worked example may include its solution. Do not solve the student's actual worksheet problems in this response; those answers are generated only after the student explicitly chooses Show Answer. Never write a submission-ready essay or complete a graded creative project for the student.`,
        },
        {
          role: "user",
          content: `Student request: ${parsed.data.studentRequest || "Help me with this."}\n\nStudent-approved extraction:\n${JSON.stringify(parsed.data.extraction, null, 2)}`,
        },
      ],
      });
      const modelResult = parseModelJson(completion.choices[0]?.message?.content ?? null);
      if (parsed.data.extraction.kind === "worksheet_problem" && Array.isArray(modelResult.actualProblems)) {
        modelResult.actualProblems = modelResult.actualProblems.map((problem: { problem: string }) => ({
          problem: problem.problem,
          hints: [
            "Identify what the problem is asking you to find.",
            `Use the ${parsed.data.extraction.skill || "same"} method from the worked example with the information in this problem.`,
            "Write the setup and reasoning, then pause before calculating or stating the final answer.",
          ],
        }));
        const extractionText = `${parsed.data.extraction.directions}\n${parsed.data.extraction.visibleContent}`;
        const hasIdentityMissingAddend = /(\d+)\s*\+\s*(?:_{2,}|blank|\?|□)\s*=\s*\1\b/i.test(extractionText);
        if (hasIdentityMissingAddend) {
          modelResult.explanation = [
            "This is a missing-addend equation: the blank represents an unknown amount.",
            "Compare the starting number with the total, then decide what amount would leave the total unchanged.",
          ];
          modelResult.keyIdeas = [
            "Identify the starting number and the total shown in the equation.",
            "Choose the amount that keeps both sides of the equation balanced.",
          ];
          modelResult.guidedTry = "Cover the blank, compare the starting number with the total, and describe what the missing amount must do without calculating it yet.";
          modelResult.understandingCheck = "How can you check that a missing addend keeps an equation balanced?";
        }
      }
      modelResult.resources = parsed.data.extraction.kind === "assignment_project"
        ? verifiedResourcesFor(parsed.data.extraction)
        : [];
      const candidate = CreatePhotoHelpResponse.parse(modelResult);
      if (candidate.kind === "worksheet_problem") {
        await assertNoStudentAnswerLeak({
          studentProblems: candidate.actualProblems.map(problem => problem.problem),
          studentVisibleResponse: candidate,
          literalScanContent: {
            heading: candidate.heading,
            explanation: candidate.explanation,
            keyIdeas: candidate.keyIdeas,
            actualProblemHints: candidate.actualProblems.map(problem => problem.hints),
            guidedTry: candidate.guidedTry,
            understandingCheck: candidate.understandingCheck,
            summary: candidate.summary,
            planSteps: candidate.planSteps,
            projectIdeas: candidate.projectIdeas,
            deliverables: candidate.deliverables,
            turnInMethod: candidate.turnInMethod,
          },
          allowedWorkedExample: {
            problem: candidate.exampleProblem,
            steps: candidate.exampleSteps,
            answer: candidate.exampleAnswer,
          },
        });
      }
      return candidate;
    });
    res.json(result);
  } catch (error) {
    logger.error({ err: error }, "Photo help generation failed");
    res.status(502).json({ message: "We couldn’t build the learning help right now. Try again or use typed help." });
  }
});

router.post("/project-plan", async (req: Request, res: Response) => {
  const parsed = CreateProjectPlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Choose a project direction before building the plan." });
    return;
  }
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      max_completion_tokens: 8192,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "project_plan",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              summary: { type: "string" },
              planSteps: { type: "array", items: { type: "string" } },
            },
            required: ["summary", "planSteps"],
          },
        },
      },
      messages: [
        {
          role: "system",
          content: `Build a personalized student project plan only after the student has chosen a direction. Follow Understand → Explore → Choose → Plan → Build → Track. The response is the Plan/Build/Track stage.
Every step must be concrete, doable, and tied to the selected idea or a detected assignment requirement. Include research/citation steps when the assignment needs research. Never include vague filler like "gather materials" unless you name the actual materials from the selected idea. Do not create the finished graded product.`,
        },
        {
          role: "user",
          content: `Approved assignment extraction:\n${JSON.stringify(parsed.data.extraction, null, 2)}\n\nStudent-selected direction:\n${JSON.stringify(parsed.data.selectedIdea, null, 2)}\n\nCitation style: ${parsed.data.citationStyle}`,
        },
      ],
    });
    const result = CreateProjectPlanResponse.parse(parseModelJson(completion.choices[0]?.message?.content ?? null));
    res.json(result);
  } catch (error) {
    logger.error({ err: error }, "Project plan generation failed");
    res.status(502).json({ message: "We couldn’t build the selected plan right now. Try again." });
  }
});

export default router;