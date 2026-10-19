import type { RiasecQuestion } from "../types";

export const RIASEC_QUESTIONS: RiasecQuestion[] = [
  // R - Realistic
  { id: "R1", type: "R", text: "Building or repairing physical objects" },
  { id: "R2", type: "R", text: "Operating tools, machinery, or equipment" },
  { id: "R3", type: "R", text: "Working outdoors or with nature" },
  { id: "R4", type: "R", text: "Fixing mechanical or electronic devices" },
  { id: "R5", type: "R", text: "Doing hands-on, physical work" },
  { id: "R6", type: "R", text: "Working with plants, animals, or natural materials" },

  // I - Investigative
  { id: "I1", type: "I", text: "Conducting scientific research or experiments" },
  { id: "I2", type: "I", text: "Analyzing complex data or statistics" },
  { id: "I3", type: "I", text: "Studying how natural or technical systems work" },
  { id: "I4", type: "I", text: "Solving abstract math or logic problems" },
  { id: "I5", type: "I", text: "Reading scientific papers or articles" },
  { id: "I6", type: "I", text: "Exploring new theories or ideas" },

  // A - Artistic
  { id: "A1", type: "A", text: "Creating original art, music, or writing" },
  { id: "A2", type: "A", text: "Performing in front of an audience" },
  { id: "A3", type: "A", text: "Designing visual layouts, graphics, or spaces" },
  { id: "A4", type: "A", text: "Expressing yourself through creative work" },
  { id: "A5", type: "A", text: "Working in a flexible, creative environment" },
  { id: "A6", type: "A", text: "Developing original ideas for projects" },

  // S - Social
  { id: "S1", type: "S", text: "Teaching or tutoring other people" },
  { id: "S2", type: "S", text: "Counseling or helping others through problems" },
  { id: "S3", type: "S", text: "Volunteering or doing community work" },
  { id: "S4", type: "S", text: "Working closely with and supporting a team" },
  { id: "S5", type: "S", text: "Caring for children, elderly, or patients" },
  { id: "S6", type: "S", text: "Facilitating group discussions or workshops" },

  // E - Enterprising
  { id: "E1", type: "E", text: "Leading a team or group toward a goal" },
  { id: "E2", type: "E", text: "Starting or running your own project or business" },
  { id: "E3", type: "E", text: "Persuading or selling ideas to others" },
  { id: "E4", type: "E", text: "Making high-stakes decisions quickly" },
  { id: "E5", type: "E", text: "Competing to achieve results" },
  { id: "E6", type: "E", text: "Managing and coordinating large projects" },

  // C - Conventional
  { id: "C1", type: "C", text: "Organizing files, data, or records" },
  { id: "C2", type: "C", text: "Following detailed procedures and guidelines" },
  { id: "C3", type: "C", text: "Working with spreadsheets or financial data" },
  { id: "C4", type: "C", text: "Tracking budgets, schedules, or inventories" },
  { id: "C5", type: "C", text: "Writing detailed reports or documentation" },
  { id: "C6", type: "C", text: "Building systems to keep things organized" },
];

// Interleaved so consecutive questions aren't the same type
export const DISPLAY_ORDER: string[] = [
  "R1","I1","A1","S1","E1","C1",
  "R2","I2","A2","S2","E2","C2",
  "R3","I3","A3","S3","E3","C3",
  "R4","I4","A4","S4","E4","C4",
  "R5","I5","A5","S5","E5","C5",
  "R6","I6","A6","S6","E6","C6",
];
