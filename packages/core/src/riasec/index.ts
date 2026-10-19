import type { RiasecScores, RiasecType, RiasecResult } from "../types";
import { RIASEC_QUESTIONS } from "./questions";
import { llmJSON, resolveModel } from "../llm/client";

export { RIASEC_QUESTIONS, DISPLAY_ORDER } from "./questions";

const TYPE_NAMES: Record<RiasecType, string> = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};

export const TYPE_DESCRIPTIONS: Record<RiasecType, string> = {
  R: "You enjoy working with tools, machines, and physical materials. Hands-on problem solving energizes you.",
  I: "You love analyzing, researching, and exploring ideas. Intellectual challenges are your driving force.",
  A: "You thrive on creativity and self-expression. You prefer open-ended work with room for innovation.",
  S: "You are people-oriented and enjoy helping, teaching, and collaborating with others.",
  E: "You are a natural leader who enjoys persuading, managing, and driving results.",
  C: "You excel at organizing, following procedures, and bringing order to complex systems.",
};

export function scoreRiasec(answers: Record<string, number>): RiasecScores {
  const scores: RiasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  for (const q of RIASEC_QUESTIONS) {
    scores[q.type] += answers[q.id] ?? 3;
  }
  return scores;
}

export function deriveHollandCode(scores: RiasecScores): string {
  return (Object.entries(scores) as [RiasecType, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type)
    .join("");
}

export async function assessCareer(
  answers: Record<string, number>,
  options?: {
    modelOverride?: string;
    interests?: string[];
    careerGoals?: string[];
  }
): Promise<RiasecResult> {
  const model = resolveModel("riasec", options?.modelOverride);
  const scores = scoreRiasec(answers);
  const hollandCode = deriveHollandCode(scores);

  const topTypes = hollandCode.split("") as RiasecType[];
  const typeDescriptions = Object.fromEntries(
    topTypes.map((t) => [t, TYPE_DESCRIPTIONS[t]])
  ) as Record<RiasecType, string>;

  const prompt = buildCareerPrompt(scores, hollandCode, options?.interests, options?.careerGoals);
  const llmResult = await llmJSON<Omit<RiasecResult, "scores" | "hollandCode" | "typeDescriptions" | "modelUsed">>(
    prompt,
    { model, maxTokens: 2000 },
    RIASEC_SYSTEM_PROMPT
  );

  return { scores, hollandCode, typeDescriptions, ...llmResult, modelUsed: model };
}

const RIASEC_SYSTEM_PROMPT = `
You are an expert career counselor specializing in the Holland RIASEC model, helping high school students explore college majors and careers.
Always respond with valid JSON matching the exact schema requested.
`.trim();

function buildCareerPrompt(
  scores: RiasecScores,
  hollandCode: string,
  interests?: string[],
  careerGoals?: string[]
): string {
  const scoreList = (Object.entries(scores) as [RiasecType, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([type, score]) => `- ${TYPE_NAMES[type]} (${type}): ${score}/30`)
    .join("\n");

  const interestLine = interests?.length ? `\nStudent interests: ${interests.join(", ")}` : "";
  const goalLine = careerGoals?.length ? `\nStudent career goals: ${careerGoals.join(", ")}` : "";

  return `
A high school student just completed the Holland RIASEC career assessment.

RIASEC SCORES:
${scoreList}

HOLLAND CODE: ${hollandCode}${interestLine}${goalLine}

Based on their Holland Code and scores, recommend careers and college majors tailored for a high school student planning for college.

Respond as JSON with exactly this structure:
{
  "summary": "2-3 sentences describing their personality type, ideal work environment, and key strengths",
  "topCareers": [
    {
      "title": "Career title",
      "description": "1-2 sentences about the career and why it fits their RIASEC code",
      "majors": ["Relevant major 1", "Relevant major 2"],
      "fitReason": "Specifically which of their top RIASEC types this matches and why"
    }
  ],
  "topMajors": ["Major 1", "Major 2", "Major 3", "Major 4", "Major 5"]
}

Provide 5-7 career matches and 5-8 college major suggestions. Be specific and actionable for a high school student.
  `.trim();
}
