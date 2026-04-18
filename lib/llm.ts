import { callGroq } from "./ai-router";

type CallTextModelOptions = {
  model?: string;
  maxTokens?: number;
  temperature?: number;
};

export async function callTextModel(
  systemPrompt: string,
  userPrompt: string,
  options: CallTextModelOptions = {}
) {
  return callGroq(systemPrompt, userPrompt, {
    maxTokens: options.maxTokens,
    temperature: options.temperature
  });
}
