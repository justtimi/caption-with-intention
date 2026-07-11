import { presplit } from "../preparation/presplit.js";
import type { IntentState } from "../types/IntentState.js";
import { bracketAnnotations } from "./bracketAnnotations.js";
import { modifiers, multiWordModifiers } from "./modifiers.js";
import type { SignalIntentState } from "./signals.js";

export const inferIntent = (text: string): IntentState => {
  const signals: SignalIntentState[] = [];
  const words = presplit(text);

  const emphasizedWords: string[] = [];
  const regex = /\[(.*?)\]/g;
  const cleanedText = text.replace(/\[+/g, "[").replace(/\]+/g, "]");

  for (const match of cleanedText.matchAll(regex)) {
    const word = match[1]?.toLowerCase().trim();
    let intentWord: SignalIntentState[] = [];
    let modifier = 0;
    let multiModifier = 0;
    let totalAdjustment = 0;

    if (word) {
      const matchWords = presplit(word);

      for (let i = 0; i < matchWords.length; i++) {
        const currentWord = matchWords[i];
        const nextWord = matchWords[i + 1];
        if (currentWord === undefined) continue;

        if (multiWordModifiers[`${currentWord.word} ${nextWord?.word}`]) {
          multiModifier =
            multiWordModifiers[`${currentWord.word} ${nextWord?.word}`] ?? 0;
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

  const lettersOnly = text.replace(/[^a-zA-Z]/g, "");
  if (lettersOnly === lettersOnly.toUpperCase() && lettersOnly.length >= 2) {
    signals.push({ dimension: "intensity", value: "loud", confidence: 0.8 });
  } else {
    for (let i = 0; i < words.length; i++) {
      const emphasizedWord = words[i];
      if (!emphasizedWord) continue;
      if (
        emphasizedWord.word.length >= 2 &&
        emphasizedWord.word === emphasizedWord.word.toUpperCase()
      )
        emphasizedWords.push(emphasizedWord.word);
    }
  }

  const questionMarkRegex = /\?/;
  const exclamationMarkRegex = /!/;
  const multipleExclamationMarkRegex = /!{3,}/;
  const ellipsisRegex = /\.{3}/;

  if (questionMarkRegex.test(cleanedText)) {
    signals.push({ dimension: "pace", value: "slow", confidence: 0.55 });
  }
  if (multipleExclamationMarkRegex.test(cleanedText)) {
    signals.push({ dimension: "intensity", value: "loud", confidence: 0.75 });
    signals.push({ dimension: "pace", value: "fast", confidence: 0.75 });
  } else if (exclamationMarkRegex.test(cleanedText)) {
    signals.push({ dimension: "intensity", value: "loud", confidence: 0.7 });
  }
  if (ellipsisRegex.test(cleanedText)) {
    signals.push({ dimension: "pace", value: "slow", confidence: 0.7 });
  }

  const bursts = cleanedText
    .trim()
    .split(/[.!]/)
    .filter((b) => b.trim().length > 0);
  let length = 0;

  for (const burst of bursts) {
    length += presplit(burst.trim()).length;
  }
  const averageLength = length / bursts.length;

  if (bursts.length > 1 && averageLength < 3) {
    signals.push({ dimension: "pace", value: "fast", confidence: 0.7 });
  }

  return {
    intensity: "normal",
    pace: "normal",
    confidence: 0,
    source: "default",
  };
};
