import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { LLMConfig, SupportedModel } from "../types";

// Default models per feature — can be overridden via env or explicit config
export const DEFAULT_MODELS: Record<string, SupportedModel> = {
  schools:   "claude-haiku-4-5-20251001",
  strengthen: "claude-sonnet-4-6",
  essay:     "claude-sonnet-4-6",
  riasec:    "claude-sonnet-4-6",
};

// ── Anthropic ──────────────────────────────────────────────────────────────────

let _anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    _anthropic = new Anthropic({ apiKey });
  }
  return _anthropic;
}

// ── OpenAI ────────────────────────────────────────────────────────────────────

let _openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

function isOpenAIModel(model: string): boolean {
  return model.startsWith("gpt-") || model.startsWith("o1") || model.startsWith("o3") || model.startsWith("o4");
}

// ── Shared interface ──────────────────────────────────────────────────────────

export async function llmComplete(
  prompt: string,
  config: LLMConfig,
  systemPrompt?: string
): Promise<string> {
  if (isOpenAIModel(config.model)) {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: config.model,
      max_tokens: config.maxTokens ?? 2048,
      messages: [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        { role: "user" as const, content: prompt },
      ],
    });
    return response.choices[0].message.content ?? "";
  }

  // Anthropic
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: config.model,
    max_tokens: config.maxTokens ?? 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });
  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type from Anthropic");
  return block.text;
}

export async function llmJSON<T>(
  prompt: string,
  config: LLMConfig,
  systemPrompt?: string
): Promise<T> {
  const jsonSystemPrompt = `${systemPrompt ?? ""}\n\nRespond with valid JSON only. No markdown, no code fences, no explanation.`.trim();
  const raw = await llmComplete(prompt, config, jsonSystemPrompt);
  // Strip accidental markdown fences if model adds them
  const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
  return JSON.parse(cleaned) as T;
}

export function resolveModel(feature: string, override?: string): SupportedModel {
  if (override) return override as SupportedModel;
  const envKey = `LLM_MODEL_${feature.toUpperCase()}`;
  const envVal = process.env[envKey];
  if (envVal) return envVal as SupportedModel;
  return DEFAULT_MODELS[feature] ?? "claude-sonnet-4-6";
}
