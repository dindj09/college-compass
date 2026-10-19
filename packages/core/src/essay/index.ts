import type { EssayReviewRequest, EssayReview, EssayBrainstormRequest, EssayBrainstorm } from "../types";
import { llmJSON, resolveModel } from "../llm/client";

export async function reviewEssay(
  request: EssayReviewRequest,
  options?: { modelOverride?: string }
): Promise<EssayReview> {
  const model = resolveModel("essay", options?.modelOverride);
  const wordCount = request.essayText.trim().split(/\s+/).length;

  const prompt = buildEssayPrompt(request, wordCount);

  const result = await llmJSON<Omit<EssayReview, "wordCount" | "modelUsed">>(
    prompt,
    { model, maxTokens: 4000 },
    ESSAY_SYSTEM_PROMPT
  );

  return { ...result, wordCount, modelUsed: model };
}

export async function brainstormEssay(
  request: EssayBrainstormRequest,
  options?: { modelOverride?: string }
): Promise<EssayBrainstorm> {
  const model = resolveModel("essay", options?.modelOverride);
  const prompt = buildBrainstormPrompt(request);
  const result = await llmJSON<Omit<EssayBrainstorm, "modelUsed">>(
    prompt,
    { model, maxTokens: 3000 },
    ESSAY_SYSTEM_PROMPT
  );
  return { ...result, modelUsed: model };
}

const ESSAY_SYSTEM_PROMPT = `
You are an expert college essay coach who has helped thousands of students craft compelling essays for top universities.
You give honest, constructive, and specific feedback that helps students improve their essays significantly.
You understand what admissions officers are looking for: authenticity, specificity, growth, and a distinctive voice.
Always respond with valid JSON matching the exact schema requested.
`.trim();

function buildEssayPrompt(request: EssayReviewRequest, wordCount: number): string {
  const profileContext = request.studentProfile
    ? `\nSTUDENT CONTEXT:\n- Interests: ${request.studentProfile.interests.join(", ")}\n- Career goals: ${request.studentProfile.careerGoals.join(", ")}\n- Grade: ${request.studentProfile.currentGrade}`
    : "";

  const schoolContext = request.targetSchool
    ? `\nTarget school: ${request.targetSchool}`
    : "";

  const wordLimitContext = request.wordLimit
    ? `\nWord limit: ${request.wordLimit} (current: ${wordCount})`
    : `\nCurrent word count: ${wordCount}`;

  return `
Review this college application essay and provide detailed, actionable feedback.

ESSAY TYPE: ${request.promptType.replace(/_/g, " ")}
${wordLimitContext}${schoolContext}${profileContext}

ESSAY:
---
${request.essayText}
---

Provide a response as JSON with exactly this structure:
{
  "overallScore": <number 1-10>,
  "sections": {
    "hook": {
      "score": <number 1-10>,
      "feedback": "Specific feedback on the opening/hook",
      "suggestions": ["specific suggestion 1", "specific suggestion 2"]
    },
    "storytelling": {
      "score": <number 1-10>,
      "feedback": "Feedback on narrative and story quality",
      "suggestions": ["specific suggestion 1", "specific suggestion 2"]
    },
    "voice": {
      "score": <number 1-10>,
      "feedback": "Feedback on authentic voice and personality",
      "suggestions": ["specific suggestion 1", "specific suggestion 2"]
    },
    "structure": {
      "score": <number 1-10>,
      "feedback": "Feedback on essay structure and flow",
      "suggestions": ["specific suggestion 1", "specific suggestion 2"]
    },
    "insight": {
      "score": <number 1-10>,
      "feedback": "Feedback on self-reflection and insight shown",
      "suggestions": ["specific suggestion 1", "specific suggestion 2"]
    },
    "conclusion": {
      "score": <number 1-10>,
      "feedback": "Feedback on the ending/conclusion",
      "suggestions": ["specific suggestion 1", "specific suggestion 2"]
    }
  },
  "topStrengths": ["strength 1", "strength 2", "strength 3"],
  "topImprovements": ["most important improvement 1", "improvement 2", "improvement 3"],
  "revisedOpening": "A rewritten version of the first 1-2 sentences showing how to make the hook stronger"
}

Be specific, constructive, and reference actual lines from the essay in your feedback. Score 1-10 where 7 is a solid competitive essay.
  `.trim();
}

function buildBrainstormPrompt(request: EssayBrainstormRequest): string {
  const ecList = request.studentProfile?.extracurriculars?.length
    ? request.studentProfile.extracurriculars
        .map((e) => `- ${e.name} (${e.role}${e.isLeadership ? ", leadership" : ""})`)
        .join("\n")
    : "Not provided";

  const profileContext = request.studentProfile
    ? `
STUDENT PROFILE:
- Grade: ${request.studentProfile.currentGrade}
- Interests: ${request.studentProfile.interests.join(", ") || "Not specified"}
- Career goals: ${request.studentProfile.careerGoals.join(", ") || "Not specified"}
- Extracurriculars:
${ecList}`
    : "";

  const schoolLine = request.targetSchool ? `\nTarget school: ${request.targetSchool}` : "";

  return `
A high school student needs help brainstorming ideas for their college application essay.

ESSAY TYPE: ${request.promptType.replace(/_/g, " ")}${schoolLine}${profileContext}

Generate 6 distinct, compelling story angles this student could write about. Each angle should be specific, personal, and draw on their actual background. Avoid generic topics like "the big game" or vague leadership essays.

Respond as JSON with exactly this structure:
{
  "angles": [
    {
      "title": "Short, punchy title for the story angle (5-8 words)",
      "story": "2-3 sentences describing what the essay would be about and the core narrative arc",
      "whyItWorks": "1-2 sentences explaining why this angle is compelling for admissions and fits their profile",
      "suggestedOpening": "A single strong opening sentence that would hook a reader immediately"
    }
  ]
}

Make each angle genuinely different in theme and approach. Be specific to this student's experiences, not generic advice.
  `.trim();
}

