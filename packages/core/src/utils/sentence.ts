import type { WordToken } from "../types/EnrichedCue.js";

export const sentenceMaker = (words: WordToken[]): string => {
    let sentence = ""
    for (const word of words) {
        sentence = sentence + " ";
        sentence = sentence + word.word;
    }

    return sentence;
}