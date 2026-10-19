// ─── Student Profile ─────────────────────────────────────────────────────────

export type Grade = 9 | 10 | 11 | 12;

export interface SubjectGrade {
  subject: string;
  grade: string; // "A", "A-", "B+", etc.
  isAP: boolean;
  isIB: boolean;
  isHonors: boolean;
}

export interface Extracurricular {
  name: string;
  role: string;
  yearsInvolved: number;
  hoursPerWeek: number;
  description: string;
  isLeadership: boolean;
}

export interface StudentProfile {
  id: string;
  name: string;
  currentGrade: Grade;
  gpaUnweighted: number;   // 0.0–4.0
  gpaWeighted: number;     // 0.0–5.0
  satScore?: number;        // 400–1600
  actScore?: number;        // 1–36
  subjectGrades: SubjectGrade[];
  extracurriculars: Extracurricular[];
  interests: string[];      // e.g. ["Computer Science", "Biology", "Music"]
  careerGoals: string[];    // e.g. ["Software Engineer", "Doctor"]
  preferredStates: string[];       // up to 5 US state abbreviations the student wants to be in
  avoidedStates: string[];         // up to 5 US state abbreviations the student does NOT want
  schoolAPCoursesOffered?: number; // how many AP courses their high school offers (optional context)
  schoolSizePreference: "small" | "medium" | "large" | "no_preference";
  budgetRange: "under_30k" | "30k_50k" | "50k_70k" | "over_70k" | "no_limit";
  updatedAt: string;
}

// ─── College Data ─────────────────────────────────────────────────────────────

export type CollegeType = "public" | "private";
export type CollegeSize = "small" | "medium" | "large";
export type CollegeSetting = "urban" | "suburban" | "rural";

export interface College {
  id: string;
  name: string;
  city: string;
  state: string;
  type: CollegeType;
  size: CollegeSize;
  setting: CollegeSetting;
  acceptanceRate: number;   // 0–1
  avgGPA: number;           // 4.0 scale
  avgSAT: number;
  avgACT: number;
  ranking: number;          // US News national ranking (999 = unranked nationally)
  annualTuition: number;    // USD (tuition only)
  annualRoomBoard: number;  // USD (room & board)
  strongPrograms: string[]; // e.g. ["CS", "Engineering", "Business", "Pre-Med"]
  website: string;
}

// ─── Campus Tours ─────────────────────────────────────────────────────────────

export type TourStatus = "wishlist" | "scheduled" | "completed" | "cancelled";

export interface TourEntry {
  collegeId: string;
  collegeName: string;
  collegeState: string;
  collegeWebsite: string;
  status: TourStatus;
  scheduledDate?: string; // ISO date string, e.g. "2025-10-15"
  notes?: string;
  addedAt: string;
}

// ─── Recommendations ─────────────────────────────────────────────────────────

export type CollegeTier = "reach" | "target" | "safety";

export type LocationFit = "preferred" | "neutral" | "avoided";

export interface CollegeRecommendation {
  college: College;
  tier: CollegeTier;
  matchScore: number;       // 0–100
  locationFit: LocationFit; // preferred / neutral / avoided state
  fitReasons: string[];
  concerns: string[];
  llmNarrative?: string;
}

export interface SchoolRecommendationResult {
  reach: CollegeRecommendation[];
  target: CollegeRecommendation[];
  safety: CollegeRecommendation[];
  modelUsed: string;
  gpaTypeUsed: "weighted" | "unweighted";
  gpaUsed: number;
}

// ─── Profile Strengthening ───────────────────────────────────────────────────

export interface CourseRecommendation {
  course: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

export interface ECRecommendation {
  activity: string;
  reason: string;
  timeCommitment: string;
  priority: "high" | "medium" | "low";
}

export interface StrengthReport {
  overallAssessment: string;
  strengths: string[];
  gaps: string[];
  courseRecommendations: CourseRecommendation[];
  ecRecommendations: ECRecommendation[];
  timelineAdvice: string;
  modelUsed: string;
}

// ─── Essay Review ────────────────────────────────────────────────────────────

export type EssayPromptType =
  | "common_app_main"
  | "common_app_activity"
  | "why_school"
  | "supplemental"
  | "scholarship"
  | "other";

export interface EssayReviewRequest {
  essayText: string;
  promptType: EssayPromptType;
  targetSchool?: string;
  wordLimit?: number;
  studentProfile?: Pick<StudentProfile, "interests" | "careerGoals" | "currentGrade">;
}

export interface EssayFeedbackSection {
  score: number;           // 1–10
  feedback: string;
  suggestions: string[];
}

export interface EssayReview {
  overallScore: number;    // 1–10
  wordCount: number;
  sections: {
    hook: EssayFeedbackSection;
    storytelling: EssayFeedbackSection;
    voice: EssayFeedbackSection;
    structure: EssayFeedbackSection;
    insight: EssayFeedbackSection;
    conclusion: EssayFeedbackSection;
  };
  topStrengths: string[];
  topImprovements: string[];
  revisedOpening?: string;
  modelUsed: string;
}

// ─── Essay Brainstorm ────────────────────────────────────────────────────────

export interface EssayBrainstormRequest {
  promptType: EssayPromptType;
  targetSchool?: string;
  studentProfile?: Pick<StudentProfile, "interests" | "careerGoals" | "currentGrade" | "extracurriculars">;
}

export interface EssayStoryAngle {
  title: string;
  story: string;
  whyItWorks: string;
  suggestedOpening: string;
}

export interface EssayBrainstorm {
  angles: EssayStoryAngle[];
  modelUsed: string;
}

// ─── RIASEC Career Assessment ────────────────────────────────────────────────

export type RiasecType = "R" | "I" | "A" | "S" | "E" | "C";

export interface RiasecQuestion {
  id: string;
  text: string;
  type: RiasecType;
}

export interface RiasecScores {
  R: number;
  I: number;
  A: number;
  S: number;
  E: number;
  C: number;
}

export interface CareerMatch {
  title: string;
  description: string;
  majors: string[];
  fitReason: string;
}

export interface RiasecResult {
  scores: RiasecScores;
  hollandCode: string;
  typeDescriptions: Record<RiasecType, string>;
  topCareers: CareerMatch[];
  topMajors: string[];
  summary: string;
  modelUsed: string;
}

// ─── LLM Config ──────────────────────────────────────────────────────────────

export type SupportedModel =
  | "claude-haiku-4-5-20251001"
  | "claude-sonnet-4-6"
  | "claude-opus-4-6"
  | "gpt-4o-mini"
  | "gpt-4o";

export interface LLMConfig {
  model: SupportedModel;
  maxTokens?: number;
}
