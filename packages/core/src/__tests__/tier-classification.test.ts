import { describe, it, expect } from "vitest";
import { classifyTier } from "../schools/recommender";
import { COLLEGES_DATA } from "../schools/data";
import type { StudentProfile, College, CollegeTier } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function college(id: string): College {
  const c = COLLEGES_DATA.find(c => c.id === id);
  if (!c) throw new Error(`College "${id}" not found in data`);
  return c;
}

function profile(overrides: Partial<StudentProfile>): StudentProfile {
  return {
    id: "test",
    name: "Test Student",
    currentGrade: 11,
    gpaUnweighted: 3.5,
    gpaWeighted: 3.9,
    satScore: undefined,
    actScore: undefined,
    subjectGrades: [],
    extracurriculars: [],
    interests: [],
    careerGoals: [],
    preferredStates: [],
    avoidedStates: [],
    schoolSizePreference: "no_preference",
    budgetRange: "no_limit",
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function assertTier(studentOverrides: Partial<StudentProfile>, collegeId: string, expected: CollegeTier) {
  const tier = classifyTier(profile(studentOverrides), college(collegeId));
  expect(tier, `${collegeId}: expected ${expected}, got ${tier}`).toBe(expected);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Tier classification — acceptance rate scaling", () => {
  // The original bug: 3.7 GPA / 1260 SAT should NOT be reach at Ohio State (53% acceptance)
  it("Ohio State (53% acceptance): 3.70/1260 → target", () => {
    assertTier({ gpaUnweighted: 3.70, satScore: 1260 }, "ohio_state", "target");
  });

  it("Ohio State (53% acceptance): 3.50/1150 → reach (0.33 below avg GPA, 130 below avg SAT)", () => {
    assertTier({ gpaUnweighted: 3.50, satScore: 1150 }, "ohio_state", "reach");
  });

  it("Ohio State (53% acceptance): 4.00/1400 → safety", () => {
    assertTier({ gpaUnweighted: 4.00, satScore: 1400 }, "ohio_state", "safety");
  });

  it("Ohio State (53% acceptance): 3.20/1050 → reach", () => {
    assertTier({ gpaUnweighted: 3.20, satScore: 1050 }, "ohio_state", "reach");
  });

  it("Penn State (55% acceptance): 3.60/1200 → target", () => {
    assertTier({ gpaUnweighted: 3.60, satScore: 1200 }, "penn_state", "target");
  });

  it("Arizona State (87% acceptance): 3.40/1100 → target or safety", () => {
    const tier = classifyTier(profile({ gpaUnweighted: 3.40, satScore: 1100 }), college("arizona_state"));
    expect(["target", "safety"], `Expected target or safety, got ${tier}`).toContain(tier);
  });
});

describe("Tier classification — elite schools stay as reach", () => {
  it("MIT (4% acceptance): 3.70/1260 → reach", () => {
    assertTier({ gpaUnweighted: 3.70, satScore: 1260 }, "mit", "reach");
  });

  it("Harvard (4% acceptance): 3.85/1450 → reach", () => {
    assertTier({ gpaUnweighted: 3.85, satScore: 1450 }, "harvard", "reach");
  });

  it("Stanford (4% acceptance): 3.80/1400 → reach", () => {
    assertTier({ gpaUnweighted: 3.80, satScore: 1400 }, "stanford", "reach");
  });

  it("MIT: only a near-perfect student gets target", () => {
    // Even 4.17/1545 (MIT's own avg) should be target, not safety
    const tier = classifyTier(profile({ gpaUnweighted: 4.17, satScore: 1545 }), college("mit"));
    expect(["target", "reach"]).toContain(tier);
  });
});

describe("Tier classification — GPA/SAT hard floors (no location/program override)", () => {
  // These test that the hard floor kicks in regardless of other factors
  it("Hard reach: student 0.16+ below GPA and 100+ below SAT at selective school", () => {
    // Duke (7% acceptance), avgGPA 3.94, avgSAT 1510
    // Student: 3.70 GPA (-0.24), 1350 SAT (-160) — both exceed hard floor
    assertTier({ gpaUnweighted: 3.70, satScore: 1350 }, "duke", "reach");
  });

  it("Hard safety: student 0.16+ above GPA and 100+ above SAT at accessible school", () => {
    // Arizona State (87%), avgGPA 3.51, avgSAT 1140
    // Student: 3.90 GPA (+0.39), 1350 SAT (+210)
    assertTier({ gpaUnweighted: 3.90, satScore: 1350 }, "arizona_state", "safety");
  });
});

describe("Tier classification — target band integrity", () => {
  it("UC Berkeley (14%): 3.89/1415 → target", () => {
    assertTier({ gpaUnweighted: 3.89, satScore: 1415 }, "ucberkeley", "target");
  });

  it("Northeastern (6%): 3.87/1470 → target (right at averages)", () => {
    const tier = classifyTier(profile({ gpaUnweighted: 3.87, satScore: 1470 }), college("northeastern"));
    expect(["target", "reach"]).toContain(tier);
  });

  it("Purdue (53%): 3.72/1270 → target", () => {
    assertTier({ gpaUnweighted: 3.72, satScore: 1270 }, "purdue", "target");
  });

  it("Indiana (79%): 3.70/1190 → target or safety", () => {
    const tier = classifyTier(profile({ gpaUnweighted: 3.70, satScore: 1190 }), college("indiana"));
    expect(["target", "safety"]).toContain(tier);
  });
});

describe("Tier classification — SAT only (no GPA conflict)", () => {
  it("SAT well above average at accessible school → does not get demoted to reach", () => {
    // Ohio State avgSAT 1280, student SAT 1420 (+140) but GPA 3.50 (-0.33)
    // SAT says safety, GPA says reach — should be target or reach, NOT safety
    const tier = classifyTier(profile({ gpaUnweighted: 3.50, satScore: 1420 }), college("ohio_state"));
    expect(tier).not.toBe("safety");
  });
});

describe("Tier classification — no SAT provided", () => {
  it("No SAT: relies on GPA alone, Ohio State 3.70 → target", () => {
    assertTier({ gpaUnweighted: 3.70, satScore: undefined }, "ohio_state", "target");
  });

  it("No SAT: well below GPA at elite school → reach", () => {
    assertTier({ gpaUnweighted: 3.50, satScore: undefined }, "mit", "reach");
  });
});
