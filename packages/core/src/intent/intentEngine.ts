import { presplit } from "../preparation/presplit.js";
import type { IntentState } from "../types/IntentState.js";
import { sentenceMaker } from "../utils/sentence.js";
import { bracketAnnotations } from "./bracketAnnotations.js";
import { hesitation } from "./lexicons/hesitation.js";
import { loud } from "./lexicons/loud.js";
import { urgency } from "./lexicons/urgency.js";
import { whisper } from "./lexicons/whisper.js";
import { modifiers, multiWordModifiers } from "./modifiers.js";
import type {
  IntensityValue,
  PaceValue,
  SignalIntentState,
} from "./types/signals.js";

export const inferIntent = (text: string): IntentState => {
  const signals: SignalIntentState[] = [];
  const words = presplit(text);

  const emphasizedWords: string[] = [];
  const regex = /\[(.*?)\]/g;
  const cleanedText = text.replace(/\[+/g, "[").replace(/\]+/g, "]").trim();

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

  const bursts = cleanedText.split(/[.!]/).filter((b) => b.trim().length > 0);
  let length = 0;

  for (const burst of bursts) {
    length += presplit(burst.trim()).length;
  }
  const averageLength = length / bursts.length;

  if (bursts.length > 1 && averageLength < 3) {
    signals.push({ dimension: "pace", value: "fast", confidence: 0.7 });
  }

  for (let i = 0; i < words.length; i++) {
    const wordsCopy = words;
    const currentWord = words[i]?.word.toLowerCase();
    if (!currentWord) continue;
    const nextWord = words[i + 1]?.word.toLowerCase();

    if (hesitation[sentenceMaker(wordsCopy)]) {
      signals.push({
        dimension: "pace",
        value: "slow",
        confidence: hesitation[`${currentWord} ${nextWord}`] ?? 0,
      });
      i++;
      continue;
    } else {
      wordsCopy.shift();
    }
    if (loud[`${currentWord} ${nextWord}`]) {
      signals.push({
        dimension: "intensity",
        value: "loud",
        confidence: loud[`${currentWord} ${nextWord}`] ?? 0,
      });
      i++;
      continue;
    }
    if (loud[currentWord]) {
      signals.push({
        dimension: "intensity",
        value: "loud",
        confidence: loud[currentWord],
      });
    }

    if (urgency[currentWord]) {
      signals.push({
        dimension: "pace",
        value: "fast",
        confidence: urgency[currentWord],
      });
    }

    if (whisper[currentWord]) {
      signals.push({
        dimension: "intensity",
        value: "whisper",
        confidence: whisper[currentWord],
      });
    }
  }

  if (signals.length === 0) {
    return {
      intensity: "normal",
      pace: "normal",
      confidence: 0,
      source: "default",
    };
  }

  let intensitySum = 0;
  let paceSum = 0;
  let paceNum = 0;
  let intensityNum = 0;

  let frequencyIntensity: Record<string, { count: number; totalConf: number }> =
    {};
  let frequencyPace: Record<string, { count: number; totalConf: number }> = {};

  for (let i = 0; i < signals.length; i++) {
    const signal = signals[i];
    if (!signal) continue;

    if (signal.dimension === "intensity") {
      intensityNum++;
      intensitySum += signal.confidence;
      if (!frequencyIntensity[signal.value]) {
        frequencyIntensity[signal.value] = { count: 0, totalConf: 0 };
      }
      const intensityEntry = frequencyIntensity[signal.value]!;
      intensityEntry.count++;
      intensityEntry.totalConf += signal.confidence;
    }

    if (signal.dimension === "pace") {
      paceNum++;
      paceSum += signal.confidence;
      if (!frequencyPace[signal.value]) {
        frequencyPace[signal.value] = { count: 0, totalConf: 0 };
      }
      const paceEntry = frequencyPace[signal.value]!;
      paceEntry.count += 1;
      paceEntry.totalConf += signal.confidence;
    }
  }

  let intensity: IntensityValue = "normal";
  let intensityAgree = 0;

  if (intensityNum > 0) {
    let maxCount = -1;
    let maxConf = -1;

    for (const value in frequencyIntensity) {
      const current = frequencyIntensity[value]!;
      if (
        current.count > maxCount ||
        (current.count === maxCount && current.totalConf > maxConf)
      ) {
        maxCount = current.count;
        maxConf = current.totalConf;
        intensity = value as IntensityValue;
      }
    }
    intensityAgree = maxCount;
  }

  let pace: PaceValue = "normal";
  let paceAgree = 0;

  if (paceNum > 0) {
    let maxCount = -1;
    let maxConf = -1;

    for (const value in frequencyPace) {
      const current = frequencyPace[value]!;
      if (
        current.count > maxCount ||
        (current.count === maxCount && current.totalConf > maxConf)
      ) {
        maxCount = current.count;
        maxConf = current.totalConf;
        pace = value as PaceValue;
      }
    }
    paceAgree = maxCount;
  }

  const intensityDisagree = intensityNum - intensityAgree;
  const paceDisagree = paceNum - paceAgree;

  const lambda = 1;
  const cBaseIntensity = intensityNum > 0 ? intensitySum / intensityNum : 0;
  const cBasePace = paceNum > 0 ? paceSum / paceNum : 0;
  let cFinalIntensity = 0;
  let cFinalPace = 0;
  let cFinal = 0;

  if (intensityNum > 0) {
    const intensityRatio = (intensityAgree - intensityDisagree) / intensityNum;
    cFinalIntensity = cBaseIntensity * (1 + lambda * intensityRatio);
    cFinalIntensity = Math.max(0, Math.min(1, cFinalIntensity));
  }

  if (paceNum > 0) {
    const paceRatio = (paceAgree - paceDisagree) / paceNum;
    cFinalPace = cBasePace * (1 + lambda * paceRatio);
    cFinalPace = Math.max(0, Math.min(1, cFinalPace));
  }

  if (paceNum === 0) {
    cFinal = cFinalIntensity;
  } else if (intensityNum === 0) {
    cFinal = cFinalPace;
  } else {
    cFinal = (cFinalIntensity + cFinalPace) / 2;
  }

  return {
    intensity,
    pace,
    confidence: cFinal,
    ...(emphasizedWords.length > 0 && { emphasizedWords }),
    source: "text",
  };
};
