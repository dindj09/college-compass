import type {
  StudentProfile,
  College,
  CollegeRecommendation,
  CollegeTier,
  LocationFit,
  SchoolRecommendationResult,
} from "../types";
import { COLLEGES_DATA } from "./data";
import { llmJSON, resolveModel } from "../llm/client";

// ─── SAT Diminishing Returns ──────────────────────────────────────────────────
// A 100-pt SAT gap at 900 is meaningful. The same gap at 1500 is mostly noise.
// Weight falls linearly from 0.40 (SAT 800) to 0.20 (SAT 1600).

function satDiminishingWeight(studentSAT: number): number {
  const clamped = Math.max(800, Math.min(1600, studentSAT));
  return 0.40 - ((clamped - 800) / 800) * 0.20;
  // 800 → 0.40 | 1000 → 0.35 | 1200 → 0.30 | 1400 → 0.25 | 1600 → 0.20
}

// ─── Program Fit ──────────────────────────────────────────────────────────────
// Returns 0.0–1.0: how well the college's strong programs match student interests/goals

function programFitScore(student: StudentProfile, college: College): number {
  const studentTerms = [...student.interests, ...student.careerGoals].map(s => s.toLowerCase());
  if (studentTerms.length === 0) return 0.5;

  const collegeProgs = college.strongPrograms.map(p => p.toLowerCase());

  const matches = studentTerms.filter(term =>
    collegeProgs.some(prog => prog.includes(term) || term.includes(prog) || synonymMatch(term, prog))
  );

  const uniqueMatches = new Set(matches).size;
  if (uniqueMatches === 0) return 0;
  if (uniqueMatches === 1) return 0.45;
  if (uniqueMatches === 2) return 0.75;
  return 1.0;
}

function synonymMatch(a: string, b: string): boolean {
  const pairs: [string, string][] = [
    ["cs", "computer science"], ["cs", "software"], ["computer science", "software engineer"],
    ["pre-med", "medicine"], ["pre-med", "biology"], ["medicine", "nursing"],
    ["business", "entrepreneurship"], ["business", "finance"], ["business", "economics"],
    ["engineering", "mechanical"], ["engineering", "electrical"], ["engineering", "civil"],
    ["law", "political science"], ["law", "pre-law"], ["biology", "life sciences"],
    ["psychology", "neuroscience"], ["communications", "journalism"], ["film", "media"],
    ["art", "design"],
  ];
  return pairs.some(([x, y]) => (a.includes(x) && b.includes(y)) || (a.includes(y) && b.includes(x)));
}

// ─── GPA Resolution ───────────────────────────────────────────────────────────
// Use weighted GPA when provided (most college avgGPA data is weighted).
// Fall back to unweighted if weighted is 0 or equal (not filled in).

function resolveGPA(student: StudentProfile): { gpa: number; isWeighted: boolean } {
  if (student.gpaWeighted > 0 && student.gpaWeighted > student.gpaUnweighted) {
    return { gpa: student.gpaWeighted, isWeighted: true };
  }
  return { gpa: student.gpaUnweighted, isWeighted: false };
}

// ─── Course Rigor ─────────────────────────────────────────────────────────────
// Only used when the student has listed courses (subjectGrades.length > 0).
// AP/IB courses are the dominant signal — colleges care far more about these
// than honors. When school AP offerings are provided, we score by ratio
// (taking 6/8 available APs is more impressive than 6/30).

function courseRigorScore(student: StudentProfile): number {
  const courses = student.subjectGrades;
  if (courses.length === 0) return 0;

  const apIbCount   = courses.filter(c => c.isAP || c.isIB).length;
  const honorsCount = courses.filter(c => c.isHonors && !c.isAP && !c.isIB).length;
  const apAvailable = student.schoolAPCoursesOffered ?? null;

  let score = 0;

  // ── AP / IB — dominant signal ──
  if (apAvailable !== null && apAvailable > 0) {
    const apRatio = apIbCount / apAvailable;
    if      (apRatio >= 0.60) score += 0.55;
    else if (apRatio >= 0.40) score += 0.42;
    else if (apRatio >= 0.25) score += 0.28;
    else if (apRatio >= 0.10) score += 0.15;
    else if (apIbCount > 0)   score += 0.08;
  } else {
    // No school context — use raw count (typical school offers ~20 APs)
    if      (apIbCount >= 6) score += 0.50;
    else if (apIbCount >= 4) score += 0.38;
    else if (apIbCount >= 2) score += 0.24;
    else if (apIbCount >= 1) score += 0.12;
  }

  // ── Honors — secondary signal ──
  if      (honorsCount >= 5) score += 0.18;
  else if (honorsCount >= 3) score += 0.12;
  else if (honorsCount >= 1) score += 0.06;

  return Math.min(score, 1.0);
}

// ─── Extracurricular Strength ─────────────────────────────────────────────────
// Returns 0.0–1.0 holistic EC strength

function ecStrengthScore(student: StudentProfile): number {
  const ecs = student.extracurriculars;
  if (ecs.length === 0) return 0;

  let score = 0;
  const leadershipCount = ecs.filter(e => e.isLeadership).length;
  score += Math.min(leadershipCount, 3) * 0.12;

  const totalHours = ecs.reduce((sum, e) => sum + e.hoursPerWeek, 0);
  if (totalHours >= 20)      score += 0.20;
  else if (totalHours >= 10) score += 0.12;
  else if (totalHours >= 5)  score += 0.06;

  score += Math.min(ecs.length, 5) * 0.05;

  const avgYears = ecs.reduce((sum, e) => sum + e.yearsInvolved, 0) / ecs.length;
  if (avgYears >= 3)      score += 0.12;
  else if (avgYears >= 2) score += 0.07;
  else if (avgYears >= 1) score += 0.03;

  return Math.min(score, 1.0);
}

// ─── Tier Classification ──────────────────────────────────────────────────────
//
// GPA thresholds (adjusted by program fit & ECs):
//   Safety  : adjusted gap ≥ +0.20
//   Target  : within ±0.10
//   Reach   : school more than 0.10 above student
//
// SAT thresholds (raw):
//   Safety  : student SAT ≥ college avg + 100
//   Target  : |student SAT − college avg| ≤ 10
//   Reach   : college avg > student SAT + 10
//
// Both metrics are combined with a weighted vote.
// SAT weight diminishes as the student's absolute SAT score rises.
// GPA always carries the majority weight.
// Thresholds expand for less selective schools — a 3.70/1260 student is not
// a "reach" at a school that accepts 53% of applicants.

type TierNum = 0 | 1 | 2; // reach=0, target=1, safety=2

// Separate thresholds for each direction:
//   targetLow  — how far *below* avg a student can be and still be target
//   safetyHigh — how far *above* avg a student needs to be for safety
//
// For accessible schools the target window is wider (more students qualify)
// AND the safety bar is lower (less stat advantage needed to be clearly in).
// For selective schools both stay tight.
interface Bands {
  gpaTargetLow:  number; // student can be this far below avg GPA and still be target
  gpaSafetyHigh: number; // student needs to be this far above avg GPA for safety
  satTargetLow:  number; // same logic for SAT
  satSafetyHigh: number;
}

function acceptanceBands(rate: number): Bands {
  if (rate > 0.55) return { gpaTargetLow: 0.22, gpaSafetyHigh: 0.10, satTargetLow: 70, satSafetyHigh: 50 };
  if (rate > 0.35) return { gpaTargetLow: 0.16, gpaSafetyHigh: 0.13, satTargetLow: 50, satSafetyHigh: 65 };
  if (rate > 0.20) return { gpaTargetLow: 0.13, gpaSafetyHigh: 0.17, satTargetLow: 25, satSafetyHigh: 80 };
  return                  { gpaTargetLow: 0.10, gpaSafetyHigh: 0.20, satTargetLow: 10, satSafetyHigh: 100 };
}

function gpaTierNum(diff: number, b: Bands): TierNum {
  if (diff >=  b.gpaSafetyHigh) return 2;
  if (diff >= -b.gpaTargetLow)  return 1;
  return 0;
}

function satTierNum(diff: number, b: Bands): TierNum {
  if (diff >=  b.satSafetyHigh) return 2;
  if (diff >= -b.satTargetLow)  return 1;
  return 0;
}

function tierFromNum(n: number): CollegeTier {
  if (n >= 1.65) return "safety";
  if (n >= 0.45) return "target";
  return "reach";
}

export function classifyTier(student: StudentProfile, college: College): CollegeTier {
  const { gpa: studentGpa } = resolveGPA(student);
  const gpaDiff    = studentGpa - college.avgGPA;
  const studentSAT = student.satScore ?? (student.actScore ? student.actScore * 40 : null);
  const satDiff    = studentSAT ? studentSAT - college.avgSAT : null;
  const bands      = acceptanceBands(college.acceptanceRate);

  // ── Hard academic floors ───────────────────────────────────────────────────
  // If both GPA and SAT are unambiguously beyond the target window, lock the
  // tier immediately — no program/EC/location soft adjustment can override it.
  const hardReachGpa = bands.gpaTargetLow  + 0.10;
  const hardReachSat = bands.satTargetLow  + 40;
  const hardSafeGpa  = bands.gpaSafetyHigh + 0.10;
  const hardSafeSat  = bands.satSafetyHigh + 40;

  if (satDiff !== null) {
    if (gpaDiff <= -hardReachGpa && satDiff <= -hardReachSat) return "reach";
    if (gpaDiff >=  hardSafeGpa  && satDiff >=  hardSafeSat)  return "safety";
  } else {
    if (gpaDiff <= -(hardReachGpa + 0.04)) return "reach";
    if (gpaDiff >=  (hardSafeGpa  + 0.04)) return "safety";
  }

  // ── Soft adjustments for borderline cases ────────────────────────────────
  const progFit    = programFitScore(student, college);
  const progAdjust = (progFit - 0.5) * 0.16;
  const ecBonus    = ecStrengthScore(student) * 0.05;
  const rigorBonus = courseRigorScore(student) * 0.03; // small — rigor nudges borderline cases

  const adjustedGpaDiff = gpaDiff + progAdjust + ecBonus + rigorBonus;
  const gpaNum          = gpaTierNum(adjustedGpaDiff, bands);

  if (!studentSAT) return tierFromNum(gpaNum);

  const satWeight = satDiminishingWeight(studentSAT);
  const combined  = gpaNum * (1 - satWeight) + satTierNum(satDiff!, bands) * satWeight;
  return tierFromNum(combined);
}

// ─── Match Scoring ────────────────────────────────────────────────────────────

function computeMatchScore(student: StudentProfile, college: College): {
  score: number;
  fitReasons: string[];
  concerns: string[];
} {
  let score = 40;
  const fitReasons: string[] = [];
  const concerns: string[] = [];

  // ── GPA fit ──
  const { gpa: studentGpa, isWeighted } = resolveGPA(student);
  const gpaDiff = studentGpa - college.avgGPA;
  const gpaLabel = isWeighted ? "Weighted GPA" : "GPA";
  if (gpaDiff >= 0.15)                      { score += 10; fitReasons.push(`${gpaLabel} is above this school's average`); }
  else if (Math.abs(gpaDiff) <= 0.10)       { score += 8;  fitReasons.push(`${gpaLabel} is right in range for this school`); }
  else if (gpaDiff < -0.10 && gpaDiff >= -0.25) { score += 3; }
  else if (gpaDiff < -0.25)                 { score -= 5;  concerns.push(`${gpaLabel} is below this school's average`); }

  // ── SAT fit (with diminishing contribution at higher scores) ──
  const studentSAT = student.satScore ?? (student.actScore ? student.actScore * 40 : null);
  if (studentSAT) {
    const satDiff = studentSAT - college.avgSAT;
    // Diminishing returns: each SAT point matters less the higher the score
    const satImpact = satDiminishingWeight(studentSAT) / 0.30; // normalize to 1.0 at median weight
    const satBonus  = Math.round(8 * satImpact);  // max bonus scales down at high scores
    const satPenalty = Math.round(8 * satImpact);

    if (satDiff >= 80)        { score += satBonus;  fitReasons.push("Test scores are above average here"); }
    else if (satDiff >= -40)  { score += Math.round(satBonus * 0.6); fitReasons.push("Test scores are competitive"); }
    else if (satDiff < -120)  { score -= satPenalty; concerns.push("Test scores are below this school's average"); }
  }

  // ── Program fit (most important non-academic factor) ──
  const progFit = programFitScore(student, college);
  const matchedTerms = [...student.interests, ...student.careerGoals].filter(term =>
    college.strongPrograms.some(prog =>
      prog.toLowerCase().includes(term.toLowerCase()) ||
      term.toLowerCase().includes(prog.toLowerCase()) ||
      synonymMatch(term.toLowerCase(), prog.toLowerCase())
    )
  );

  if (progFit >= 0.75) {
    score += 20;
    fitReasons.push(`Highly ranked in ${[...new Set(matchedTerms)].slice(0, 2).join(" & ")}`);
  } else if (progFit >= 0.45) {
    score += 12;
    fitReasons.push(`Solid program in ${matchedTerms[0] ?? "your interest area"}`);
  } else if (progFit === 0) {
    score -= 12;
    concerns.push("No strong programs matching your stated interests");
  }

  // ── EC strength ──
  const ecScore = ecStrengthScore(student);
  const leaderCount = student.extracurriculars.filter(e => e.isLeadership).length;
  if (ecScore >= 0.6)       { score += 10; fitReasons.push("Strong extracurricular profile"); }
  else if (ecScore >= 0.35) { score += 6;  if (leaderCount >= 1) fitReasons.push("Demonstrated leadership"); }
  else if (ecScore > 0)     { score += 2; }

  // ── Course rigor (only when courses are listed) ──
  const rigorScore = courseRigorScore(student);
  if (rigorScore >= 0.65)      { score += 9; fitReasons.push("Exceptional course rigor — heavy AP/IB load"); }
  else if (rigorScore >= 0.40) { score += 6; fitReasons.push("Strong course rigor with solid AP/IB coursework"); }
  else if (rigorScore >= 0.15) { score += 3; fitReasons.push("Good course rigor with AP/Honors coursework"); }

  // ── Location (preferred / avoided states) ──
  // Preferred states: bonus. Avoided states: penalty. Neutral: no change.
  // Location fit does NOT affect tier — it only affects match score and sort order.
  if (student.preferredStates?.includes(college.state)) {
    score += 10; fitReasons.push(`Located in a preferred state (${college.state})`);
  } else if (student.avoidedStates?.includes(college.state)) {
    score -= 15; concerns.push(`Located in a state you'd prefer to avoid (${college.state})`);
  }

  // ── Size ──
  if (student.schoolSizePreference !== "no_preference") {
    if (student.schoolSizePreference === college.size) {
      score += 6; fitReasons.push(`Matches your size preference (${college.size})`);
    } else {
      score -= 4; concerns.push(`School size (${college.size}) differs from your preference`);
    }
  }

  // ── Budget (total cost of attendance: tuition + room & board) ──
  const totalCost = college.annualTuition + college.annualRoomBoard;
  const budgetOk =
    (student.budgetRange === "under_30k" && totalCost < 30000) ||
    (student.budgetRange === "30k_50k"   && totalCost < 50000) ||
    (student.budgetRange === "50k_70k"   && totalCost < 70000) ||
    student.budgetRange === "over_70k" ||
    student.budgetRange === "no_limit";

  if (budgetOk) { score += 4; }
  else          { score -= 12; concerns.push("Total cost of attendance may exceed your budget"); }

  return {
    score: Math.max(0, Math.min(100, score)),
    fitReasons: fitReasons.slice(0, 4),
    concerns:   concerns.slice(0, 3),
  };
}

// ─── Location Fit ─────────────────────────────────────────────────────────────

function getLocationFit(student: StudentProfile, college: College): LocationFit {
  if (student.preferredStates?.includes(college.state)) return "preferred";
  if (student.avoidedStates?.includes(college.state))   return "avoided";
  return "neutral";
}

// Sort priority: preferred → neutral → avoided, then by match score within each group
const LOCATION_ORDER: Record<LocationFit, number> = { preferred: 0, neutral: 1, avoided: 2 };

// ─── Main Recommender ─────────────────────────────────────────────────────────

export async function recommendSchools(
  student: StudentProfile,
  options?: {
    modelOverride?: string;
    maxPerTier?: number;
    useLLMNarratives?: boolean;
  }
): Promise<SchoolRecommendationResult> {
  const maxPerTier = options?.maxPerTier ?? 6;
  const model = resolveModel("schools", options?.modelOverride);
  const hasInterests = student.interests.length > 0 || student.careerGoals.length > 0;
  const { gpa: gpaUsed, isWeighted } = resolveGPA(student);

  const scored = COLLEGES_DATA.map(college => {
    const { score, fitReasons, concerns } = computeMatchScore(student, college);
    return {
      college,
      tier: classifyTier(student, college),
      matchScore: score,
      locationFit: getLocationFit(student, college),
      fitReasons,
      concerns,
      llmNarrative: undefined as string | undefined,
    } satisfies CollegeRecommendation;
  });

  function filterAndSort(tier: CollegeTier): CollegeRecommendation[] {
    return scored
      .filter(r => r.tier === tier)
      .filter(r => !hasInterests || programFitScore(student, r.college) > 0)
      // Hard exclude: avoided states are never shown, regardless of academic fit
      .filter(r => r.locationFit !== "avoided")
      // Sort: preferred states first, then neutral — by match score within each group
      .sort((a, b) =>
        LOCATION_ORDER[a.locationFit] - LOCATION_ORDER[b.locationFit] ||
        b.matchScore - a.matchScore
      )
      .slice(0, maxPerTier);
  }

  const reach  = filterAndSort("reach");
  const target = filterAndSort("target");
  const safety = filterAndSort("safety");

  if (options?.useLLMNarratives) {
    const all = [...reach, ...target, ...safety];
    try {
      const narratives = await llmJSON<Record<string, string>>(
        buildNarrativePrompt(student, all),
        { model, maxTokens: 2000 }
      );
      for (const rec of all) rec.llmNarrative = narratives[rec.college.id] ?? "";
    } catch { /* narratives are optional */ }
  }

  return { reach, target, safety, modelUsed: model, gpaTypeUsed: isWeighted ? "weighted" : "unweighted", gpaUsed };
}

function buildNarrativePrompt(student: StudentProfile, recs: CollegeRecommendation[]): string {
  const schoolList = recs.map(r => `- ${r.college.id}: ${r.college.name} (${r.tier})`).join("\n");
  return `
Student profile:
- Grade: ${student.currentGrade}, GPA: ${student.gpaUnweighted}
- Interests: ${student.interests.join(", ")}
- Career goals: ${student.careerGoals.join(", ")}
- Extracurriculars: ${student.extracurriculars.map(e => `${e.name}${e.isLeadership ? " (leader)" : ""}`).join(", ")}

For each college write a 2-sentence narrative (max 60 words) explaining specifically why it fits this student's interests and goals.

Schools:
${schoolList}

Return JSON: { "college_id": "narrative", ... }
  `.trim();
}
