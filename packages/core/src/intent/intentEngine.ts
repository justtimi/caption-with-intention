import { presplit } from "../preparation/presplit.js";
import type { IntentState } from "../types/IntentState.js";
import { bracketAnnotations } from "./bracketAnnotations.js";
import { modifiers, multiWordModifiers } from "./modifiers.js";
import type { SignalIntentState } from "./signals.js";

export const inferIntent = (text: string): IntentState => {
  const signals: SignalIntentState[] = [];

  const regex = /\[(.*?)\]/g;

  for (const match of text.matchAll(regex)) {
    const word = match[1]?.toLowerCase().trim();
    let intentWord: SignalIntentState[] = [];
    let modifier: number = 0;
    let multiModifier: number | undefined = 0;
    let totalAdjustment: number = 0;

    if (word) {
      const words = presplit(word);

      for (let i = 0; i < words.length; i++) {
        const currentWord = words[i];
        const nextWord = words[i + 1];
        if (currentWord === undefined) continue;

        if (multiWordModifiers[`${currentWord.word} ${nextWord?.word}`]) {
          multiModifier =
            multiWordModifiers[`${currentWord.word} ${nextWord?.word}`];
          i++;
          continue;
        }
        if (modifiers[currentWord.word]) {
          modifier += modifiers[currentWord.word] ?? 0;
        }
        if (bracketAnnotations[currentWord.word]) {
          intentWord = bracketAnnotations[currentWord.word] ?? intentWord;
        }
      }
      totalAdjustment = (modifier || 0) + (multiModifier || 0);
      signals.push(
        ...intentWord.map((signal) => ({
          ...signal,
          confidence: Math.max(
            0,
            Math.min(1, signal.confidence + totalAdjustment),
          ),
        })),
      );
    }
  }

  return {
    intensity: "normal",
    pace: "normal",
    confidence: 0,
    source: "default",
  };
};
