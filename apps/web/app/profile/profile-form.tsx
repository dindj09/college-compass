"use client";

import { useState } from "react";
import type { StudentProfile, SubjectGrade, Extracurricular, Grade } from "@college-compass/core";
import { cn } from "@/lib/utils";
import { saveProfileAction } from "./actions";

const STEPS = ["Basic Info", "Academics", "Activities", "Goals & Preferences"];

const SUBJECT_OPTIONS = [
  "English", "Mathematics", "Algebra II", "Pre-Calculus", "Calculus AB", "Calculus BC",
  "Statistics", "Biology", "Chemistry", "Physics", "Environmental Science",
  "US History", "World History", "AP US History", "AP World History",
  "Economics", "Psychology", "Sociology", "Computer Science", "Spanish",
  "French", "Mandarin", "Art", "Music Theory",
];

const INTEREST_OPTIONS = [
  "Computer Science", "Engineering", "Biology", "Chemistry", "Physics",
  "Mathematics", "Business", "Economics", "Political Science", "Law",
  "Pre-Med / Medicine", "Psychology", "Sociology", "History", "English / Literature",
  "Philosophy", "Art", "Music", "Film / Media", "Communications",
  "Environmental Science", "Architecture", "Education", "Nursing", "Social Work",
  "International Relations", "Entrepreneurship",
];

const CAREER_OPTIONS = [
  "Software Engineer", "Doctor / Physician", "Lawyer", "Engineer (Civil/Mech/Chemical)",
  "Data Scientist / AI Engineer", "Business / Finance", "Entrepreneur",
  "Scientist / Researcher", "Nurse / Healthcare", "Teacher / Professor",
  "Journalist / Writer", "Artist / Designer", "Musician / Performer",
  "Architect", "Psychologist / Therapist", "Policy / Government",
  "Environmental Scientist", "Pharmacist", "Veterinarian", "Not sure yet",
];

export function ProfileForm({ initialProfile }: { initialProfile: StudentProfile }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<StudentProfile>(initialProfile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof StudentProfile>(key: K, value: StudentProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveProfileAction(profile);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="card">
      {/* Step tabs */}
      <div className="flex border-b border-slate-200">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
              step === i
                ? "border-brand-500 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <span className="hidden sm:inline">{s}</span>
            <span className="sm:hidden">{i + 1}</span>
          </button>
        ))}
      </div>

      <div className="p-6 space-y-6">
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <BasicInfoStep profile={profile} update={update} />
        )}

        {/* Step 1: Academics */}
        {step === 1 && (
          <AcademicsStep profile={profile} update={update} />
        )}

        {/* Step 2: Activities */}
        {step === 2 && (
          <ActivitiesStep profile={profile} update={update} />
        )}

        {/* Step 3: Goals & Preferences */}
        {step === 3 && (
          <GoalsStep profile={profile} update={update} />
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="btn-secondary disabled:opacity-30"
          >
            Back
          </button>

          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-sm text-green-600 font-medium">Saved!</span>
            )}
            <button onClick={handleSave} disabled={saving} className="btn-ghost">
              {saving ? "Saving..." : "Save"}
            </button>
            {!isLastStep ? (
              <button onClick={() => setStep((s) => s + 1)} className="btn-primary">
                Next
              </button>
            ) : (
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? "Saving..." : "Save Profile"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step Components ──────────────────────────────────────────────────────────

function BasicInfoStep({
  profile,
  update,
}: {
  profile: StudentProfile;
  update: <K extends keyof StudentProfile>(k: K, v: StudentProfile[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="section-heading">Basic Information</h2>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="label">Full Name</label>
          <input
            className="input"
            placeholder="e.g. Alex Johnson"
            value={profile.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </div>

        <div>
          <label className="label">Current Grade</label>
          <select
            className="input"
            value={profile.currentGrade}
            onChange={(e) => update("currentGrade", Number(e.target.value) as Grade)}
          >
            <option value={9}>9th Grade (Freshman)</option>
            <option value={10}>10th Grade (Sophomore)</option>
            <option value={11}>11th Grade (Junior)</option>
            <option value={12}>12th Grade (Senior)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function AcademicsStep({
  profile,
  update,
}: {
  profile: StudentProfile;
  update: <K extends keyof StudentProfile>(k: K, v: StudentProfile[K]) => void;
}) {
  function addSubject() {
    const newSubject: SubjectGrade = {
      subject: "",
      grade: "A",
      isAP: false,
      isIB: false,
      isHonors: false,
    };
    update("subjectGrades", [...profile.subjectGrades, newSubject]);
  }

  function updateSubject(index: number, field: keyof SubjectGrade, value: string | boolean) {
    const updated = profile.subjectGrades.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    update("subjectGrades", updated);
  }

  function removeSubject(index: number) {
    update("subjectGrades", profile.subjectGrades.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6">
      <h2 className="section-heading">Academic Information</h2>

      {/* GPA & Test Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="label">GPA (Unweighted)</label>
          <input
            type="number"
            min="0"
            max="4.0"
            step="0.01"
            className="input"
            placeholder="3.85"
            value={profile.gpaUnweighted || ""}
            onChange={(e) => update("gpaUnweighted", parseFloat(e.target.value) || 0)}
          />
          <p className="text-xs text-slate-400 mt-1">0.0 – 4.0 scale</p>
        </div>
        <div>
          <label className="label">GPA (Weighted)</label>
          <input
            type="number"
            min="0"
            max="5.0"
            step="0.01"
            className="input"
            placeholder="4.2"
            value={profile.gpaWeighted || ""}
            onChange={(e) => update("gpaWeighted", parseFloat(e.target.value) || 0)}
          />
          <p className="text-xs text-slate-400 mt-1">0.0 – 5.0 scale</p>
        </div>
        <div>
          <label className="label">SAT Score</label>
          <input
            type="number"
            min="400"
            max="1600"
            step="10"
            className="input"
            placeholder="1350"
            value={profile.satScore ?? ""}
            onChange={(e) => update("satScore", e.target.value ? parseInt(e.target.value) : undefined)}
          />
          <p className="text-xs text-slate-400 mt-1">400 – 1600 (optional)</p>
        </div>
        <div>
          <label className="label">ACT Score</label>
          <input
            type="number"
            min="1"
            max="36"
            className="input"
            placeholder="30"
            value={profile.actScore ?? ""}
            onChange={(e) => update("actScore", e.target.value ? parseInt(e.target.value) : undefined)}
          />
          <p className="text-xs text-slate-400 mt-1">1 – 36 (optional)</p>
        </div>
      </div>

      {/* AP Courses Offered */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="label">AP Courses at Your School</label>
          <input
            type="number"
            min="0"
            max="40"
            className="input"
            placeholder="e.g. 15"
            value={profile.schoolAPCoursesOffered ?? ""}
            onChange={(e) => update("schoolAPCoursesOffered", e.target.value ? parseInt(e.target.value) : undefined)}
          />
          <p className="text-xs text-slate-400 mt-1">How many AP courses does your school offer? (optional — contextualizes your rigor)</p>
        </div>
      </div>

      {/* Courses */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="label mb-0">Courses & Grades</label>
          <button onClick={addSubject} className="btn-ghost text-sm">
            + Add Course
          </button>
        </div>

        {profile.subjectGrades.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
            No courses added yet. Click &quot;+ Add Course&quot; to start.
          </div>
        )}

        <div className="space-y-2">
          {profile.subjectGrades.map((subject, i) => (
            <div key={i} className="flex flex-wrap gap-2 items-center p-3 bg-slate-50 rounded-xl">
              <select
                className="input flex-1 min-w-[140px]"
                value={subject.subject}
                onChange={(e) => updateSubject(i, "subject", e.target.value)}
              >
                <option value="">Select subject...</option>
                {SUBJECT_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                className="input w-20"
                value={subject.grade}
                onChange={(e) => updateSubject(i, "grade", e.target.value)}
              >
                {["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>

              <div className="flex items-center gap-3 text-sm text-slate-600">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subject.isAP}
                    onChange={(e) => updateSubject(i, "isAP", e.target.checked)}
                    className="rounded"
                  />
                  AP
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subject.isIB}
                    onChange={(e) => updateSubject(i, "isIB", e.target.checked)}
                    className="rounded"
                  />
                  IB
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subject.isHonors}
                    onChange={(e) => updateSubject(i, "isHonors", e.target.checked)}
                    className="rounded"
                  />
                  Honors
                </label>
              </div>

              <button
                onClick={() => removeSubject(i)}
                className="text-slate-400 hover:text-red-500 transition-colors ml-auto"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivitiesStep({
  profile,
  update,
}: {
  profile: StudentProfile;
  update: <K extends keyof StudentProfile>(k: K, v: StudentProfile[K]) => void;
}) {
  function addEC() {
    const newEC: Extracurricular = {
      name: "",
      role: "",
      yearsInvolved: 1,
      hoursPerWeek: 2,
      description: "",
      isLeadership: false,
    };
    update("extracurriculars", [...profile.extracurriculars, newEC]);
  }

  function updateEC(index: number, field: keyof Extracurricular, value: string | number | boolean) {
    const updated = profile.extracurriculars.map((e, i) =>
      i === index ? { ...e, [field]: value } : e
    );
    update("extracurriculars", updated);
  }

  function removeEC(index: number) {
    update("extracurriculars", profile.extracurriculars.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-heading">Extracurricular Activities</h2>
          <p className="text-sm text-slate-500 mt-1">Include clubs, sports, jobs, volunteer work, personal projects, etc.</p>
        </div>
        <button onClick={addEC} className="btn-secondary text-sm">
          + Add Activity
        </button>
      </div>

      {profile.extracurriculars.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
          No activities added yet. Click &quot;+ Add Activity&quot; to start.
        </div>
      )}

      <div className="space-y-4">
        {profile.extracurriculars.map((ec, i) => (
          <div key={i} className="card p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="grid md:grid-cols-2 gap-3 flex-1">
                <div>
                  <label className="label">Activity Name</label>
                  <input
                    className="input"
                    placeholder="e.g. Robotics Club"
                    value={ec.name}
                    onChange={(e) => updateEC(i, "name", e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Your Role</label>
                  <input
                    className="input"
                    placeholder="e.g. Team Captain, Member"
                    value={ec.role}
                    onChange={(e) => updateEC(i, "role", e.target.value)}
                  />
                </div>
              </div>
              <button
                onClick={() => removeEC(i)}
                className="text-slate-300 hover:text-red-500 transition-colors mt-6"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Years Involved</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  className="input"
                  value={ec.yearsInvolved}
                  onChange={(e) => updateEC(i, "yearsInvolved", parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <label className="label">Hrs/Week</label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  className="input"
                  value={ec.hoursPerWeek}
                  onChange={(e) => updateEC(i, "hoursPerWeek", parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={ec.isLeadership}
                    onChange={(e) => updateEC(i, "isLeadership", e.target.checked)}
                    className="rounded w-4 h-4"
                  />
                  Leadership role
                </label>
              </div>
            </div>

            <div>
              <label className="label">Brief Description</label>
              <textarea
                className="input resize-none"
                rows={2}
                placeholder="What did you do? Any achievements or impact?"
                value={ec.description}
                onChange={(e) => updateEC(i, "description", e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalsStep({
  profile,
  update,
}: {
  profile: StudentProfile;
  update: <K extends keyof StudentProfile>(k: K, v: StudentProfile[K]) => void;
}) {
  function toggleInterest(interest: string) {
    const current = profile.interests;
    const updated = current.includes(interest)
      ? current.filter((i) => i !== interest)
      : [...current, interest];
    update("interests", updated);
  }

  function toggleCareer(career: string) {
    const current = profile.careerGoals;
    const updated = current.includes(career)
      ? current.filter((c) => c !== career)
      : [...current, career];
    update("careerGoals", updated);
  }

  return (
    <div className="space-y-6">
      <h2 className="section-heading">Goals & Preferences</h2>

      {/* Academic Interests */}
      <div>
        <label className="label">Academic Interests (select all that apply)</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {INTEREST_OPTIONS.map((interest) => (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                profile.interests.includes(interest)
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-brand-300"
              )}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      {/* Career Goals */}
      <div>
        <label className="label">Career Interests (select all that apply)</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {CAREER_OPTIONS.map((career) => (
            <button
              key={career}
              onClick={() => toggleCareer(career)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                profile.careerGoals.includes(career)
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-brand-300"
              )}
            >
              {career}
            </button>
          ))}
        </div>
      </div>

      {/* State preferences */}
      <StatePickerSection profile={profile} update={update} />

      <div className="grid md:grid-cols-2 gap-4">
        {/* School size */}
        <div>
          <label className="label">Preferred School Size</label>
          <select
            className="input"
            value={profile.schoolSizePreference}
            onChange={(e) =>
              update(
                "schoolSizePreference",
                e.target.value as StudentProfile["schoolSizePreference"]
              )
            }
          >
            <option value="no_preference">No Preference</option>
            <option value="small">Small (&lt;3,000 undergrad)</option>
            <option value="medium">Medium (3,000–15,000)</option>
            <option value="large">Large (&gt;15,000)</option>
          </select>
        </div>

        {/* Budget */}
        <div>
          <label className="label">Annual Budget (tuition + room &amp; board)</label>
          <select
            className="input"
            value={profile.budgetRange}
            onChange={(e) =>
              update("budgetRange", e.target.value as StudentProfile["budgetRange"])
            }
          >
            <option value="no_limit">No Limit / Open to Any</option>
            <option value="under_30k">Under $30,000 total/year</option>
            <option value="30k_50k">$30,000 – $50,000 total/year</option>
            <option value="50k_70k">$50,000 – $70,000 total/year</option>
            <option value="over_70k">Over $70,000 total/year</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── State Picker ─────────────────────────────────────────────────────────────

const US_STATES: { abbr: string; name: string }[] = [
  { abbr: "AL", name: "Alabama" },    { abbr: "AK", name: "Alaska" },
  { abbr: "AZ", name: "Arizona" },    { abbr: "AR", name: "Arkansas" },
  { abbr: "CA", name: "California" }, { abbr: "CO", name: "Colorado" },
  { abbr: "CT", name: "Connecticut" },{ abbr: "DE", name: "Delaware" },
  { abbr: "FL", name: "Florida" },    { abbr: "GA", name: "Georgia" },
  { abbr: "HI", name: "Hawaii" },     { abbr: "ID", name: "Idaho" },
  { abbr: "IL", name: "Illinois" },   { abbr: "IN", name: "Indiana" },
  { abbr: "IA", name: "Iowa" },       { abbr: "KS", name: "Kansas" },
  { abbr: "KY", name: "Kentucky" },   { abbr: "LA", name: "Louisiana" },
  { abbr: "ME", name: "Maine" },      { abbr: "MD", name: "Maryland" },
  { abbr: "MA", name: "Massachusetts" },{ abbr: "MI", name: "Michigan" },
  { abbr: "MN", name: "Minnesota" },  { abbr: "MS", name: "Mississippi" },
  { abbr: "MO", name: "Missouri" },   { abbr: "MT", name: "Montana" },
  { abbr: "NE", name: "Nebraska" },   { abbr: "NV", name: "Nevada" },
  { abbr: "NH", name: "New Hampshire" },{ abbr: "NJ", name: "New Jersey" },
  { abbr: "NM", name: "New Mexico" }, { abbr: "NY", name: "New York" },
  { abbr: "NC", name: "North Carolina" },{ abbr: "ND", name: "North Dakota" },
  { abbr: "OH", name: "Ohio" },       { abbr: "OK", name: "Oklahoma" },
  { abbr: "OR", name: "Oregon" },     { abbr: "PA", name: "Pennsylvania" },
  { abbr: "RI", name: "Rhode Island" },{ abbr: "SC", name: "South Carolina" },
  { abbr: "SD", name: "South Dakota" },{ abbr: "TN", name: "Tennessee" },
  { abbr: "TX", name: "Texas" },      { abbr: "UT", name: "Utah" },
  { abbr: "VT", name: "Vermont" },    { abbr: "VA", name: "Virginia" },
  { abbr: "WA", name: "Washington" }, { abbr: "WV", name: "West Virginia" },
  { abbr: "WI", name: "Wisconsin" },  { abbr: "WY", name: "Wyoming" },
  { abbr: "DC", name: "Washington D.C." },
];

const MAX_STATE_PICKS = 5;

function StatePickerSection({
  profile,
  update,
}: {
  profile: StudentProfile;
  update: <K extends keyof StudentProfile>(k: K, v: StudentProfile[K]) => void;
}) {
  function toggle(abbr: string, list: "preferredStates" | "avoidedStates") {
    const opposite = list === "preferredStates" ? "avoidedStates" : "preferredStates";
    const current: string[] = (profile[list] as string[]) ?? [];
    const currentOpposite: string[] = (profile[opposite] as string[]) ?? [];

    if (current.includes(abbr)) {
      // Deselect
      update(list, current.filter((s) => s !== abbr));
    } else if (currentOpposite.includes(abbr)) {
      // Can't be in both lists — remove from opposite first, add here
      update(opposite, currentOpposite.filter((s) => s !== abbr));
      if (current.length < MAX_STATE_PICKS) update(list, [...current, abbr]);
    } else if (current.length < MAX_STATE_PICKS) {
      update(list, [...current, abbr]);
    }
  }

  const preferred = profile.preferredStates ?? [];
  const avoided   = profile.avoidedStates   ?? [];

  return (
    <div className="space-y-4">
      <div>
        <label className="label">
          Preferred States
          <span className="ml-2 text-xs font-normal text-slate-400">
            ({preferred.length}/{MAX_STATE_PICKS} selected) — schools here sort to the top
          </span>
        </label>
        <StateGrid
          selected={preferred}
          otherSelected={avoided}
          activeClass="bg-green-600 text-white border-green-600"
          hoverClass="hover:border-green-400"
          onToggle={(abbr) => toggle(abbr, "preferredStates")}
          maxReached={preferred.length >= MAX_STATE_PICKS}
        />
      </div>

      <div>
        <label className="label">
          States to Avoid
          <span className="ml-2 text-xs font-normal text-slate-400">
            ({avoided.length}/{MAX_STATE_PICKS} selected) — schools here sort to the bottom
          </span>
        </label>
        <StateGrid
          selected={avoided}
          otherSelected={preferred}
          activeClass="bg-red-500 text-white border-red-500"
          hoverClass="hover:border-red-300"
          onToggle={(abbr) => toggle(abbr, "avoidedStates")}
          maxReached={avoided.length >= MAX_STATE_PICKS}
        />
      </div>
    </div>
  );
}

function StateGrid({
  selected,
  otherSelected,
  activeClass,
  hoverClass,
  onToggle,
  maxReached,
}: {
  selected: string[];
  otherSelected: string[];
  activeClass: string;
  hoverClass: string;
  onToggle: (abbr: string) => void;
  maxReached: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {US_STATES.map(({ abbr, name }) => {
        const isSelected = selected.includes(abbr);
        const isOther    = otherSelected.includes(abbr);
        const isDisabled = !isSelected && maxReached;

        return (
          <button
            key={abbr}
            title={name}
            disabled={isDisabled}
            onClick={() => onToggle(abbr)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors",
              isSelected
                ? activeClass
                : isOther
                ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed"
                : isDisabled
                ? "bg-white text-slate-300 border-slate-100 cursor-not-allowed"
                : `bg-white text-slate-600 border-slate-200 ${hoverClass}`
            )}
          >
            {abbr}
          </button>
        );
      })}
    </div>
  );
}
