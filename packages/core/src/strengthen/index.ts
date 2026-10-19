import type { StudentProfile, StrengthReport } from "../types";
import { llmJSON, resolveModel } from "../llm/client";

export async function analyzeProfile(
  student: StudentProfile,
  options?: { modelOverride?: string }
): Promise<StrengthReport> {
  const model = resolveModel("strengthen", options?.modelOverride);

  const prompt = buildStrengthPrompt(student);

  const result = await llmJSON<Omit<StrengthReport, "modelUsed">>(
    prompt,
    { model, maxTokens: 3000 },
    STRENGTHEN_SYSTEM_PROMPT
  );

  return { ...result, modelUsed: model };
}

const STRENGTHEN_SYSTEM_PROMPT = `
You are an expert college admissions counselor with 20 years of experience helping high school students get into their dream colleges.
You provide actionable, specific, and encouraging advice tailored to each student's situation.
Always respond with valid JSON matching the exact schema requested.
`.trim();

function buildStrengthPrompt(student: StudentProfile): string {
  const ecList = student.extracurriculars
    .map(e => `- ${e.name} (${e.role}, ${e.yearsInvolved}yr, ${e.hoursPerWeek}hr/wk${e.isLeadership ? ", leadership" : ""})`)
    .join("\n") || "None listed";

  const subjectList = student.subjectGrades
    .map(s => `- ${s.subject}: ${s.grade}${s.isAP ? " (AP)" : s.isIB ? " (IB)" : s.isHonors ? " (Honors)" : ""}`)
    .join("\n") || "None listed";

  return `
Analyze this high school student's college application profile and provide a comprehensive strength assessment.

STUDENT PROFILE:
- Name: ${student.name}
- Current Grade: ${student.currentGrade}
- GPA (Unweighted): ${student.gpaUnweighted} / 4.0
- GPA (Weighted): ${student.gpaWeighted} / 5.0
- SAT Score: ${student.satScore ?? "Not taken"}
- ACT Score: ${student.actScore ?? "Not taken"}

SUBJECTS & GRADES:
${subjectList}

EXTRACURRICULARS:
${ecList}

INTERESTS: ${student.interests.join(", ") || "Not specified"}
CAREER GOALS: ${student.careerGoals.join(", ") || "Not specified"}
SCHOOL SIZE PREFERENCE: ${student.schoolSizePreference}
BUDGET RANGE: ${student.budgetRange}

Provide a response as JSON with exactly this structure:
{
  "overallAssessment": "2-3 sentence holistic assessment of the student's profile",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "gaps": ["gap 1", "gap 2"],
  "courseRecommendations": [
    {
      "course": "Course name",
      "reason": "Why this course strengthens the profile",
      "priority": "high" | "medium" | "low"
    }
  ],
  "ecRecommendations": [
    {
      "activity": "Activity name",
      "reason": "Why this activity strengthens the profile",
      "timeCommitment": "e.g., 5-8 hours/week",
      "priority": "high" | "medium" | "low"
    }
  ],
  "timelineAdvice": "Specific advice based on their current grade level about what to focus on this year vs. next"
}

Provide 3-5 strengths, 2-3 gaps, 3-5 course recommendations, and 3-5 EC recommendations. Be specific to their interests and grade level.
  `.trim();
}
