import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildPrompt,
  isSingleEnglishWord,
  parseGeminiWritingFeedback,
  WritingFeedbackProviderError,
} from "./gemini-writing";

test("Gemini feedback parser accepts the expected response structure", () => {
  const feedback = parseGeminiWritingFeedback(
    JSON.stringify({
      overall_feedback: "Clear overall feedback.",
      corrected_text: "Corrected writing.",
      natural_version: "More natural writing.",
      suggestions: [
        {
          category: "grammar",
          original: "go",
          replacement: "went",
          explanation: "Use the past tense.",
        },
      ],
      key_phrases: [
        {
          phrase: "went to",
          meaning: "visited a place",
          example: "I went to the park.",
        },
      ],
      word_details: null,
    }),
  );

  assert.equal(feedback.corrected_text, "Corrected writing.");
  assert.equal(feedback.natural_version, "More natural writing.");
  assert.equal(feedback.suggestions.length, 1);
  assert.equal(feedback.key_phrases.length, 1);
});

test("Gemini prompt separates correction from natural phrasing", () => {
  const prompt = buildPrompt({
    text: "Can you send it to me?",
    goal: "Sound casual",
  });

  assert.match(prompt, /only necessary grammar/i);
  assert.match(prompt, /natural, idiomatic version/i);
  assert.match(prompt, /do not duplicate or overlap/i);
  assert.match(prompt, /Learner goal: Sound casual/);
  assert.match(prompt, /Input mode: WRITING_FEEDBACK/);
});

test("Gemini prompt uses dictionary mode for one English word", () => {
  const prompt = buildPrompt({ text: "resilient" });

  assert.match(prompt, /Input mode: SINGLE_WORD_DICTIONARY/);
  assert.match(prompt, /IPA pronunciation/);
  assert.match(prompt, /1 to 3 common meanings/);
  assert.match(prompt, /empty key_phrases array/);
});

test("single-word detection excludes phrases and sentences", () => {
  assert.equal(isSingleEnglishWord("resilient"), true);
  assert.equal(isSingleEnglishWord("well-known"), true);
  assert.equal(isSingleEnglishWord("  learner's  "), true);
  assert.equal(isSingleEnglishWord("thank you"), false);
  assert.equal(isSingleEnglishWord("Hello!"), false);
});

test("Gemini feedback parser accepts dictionary details", () => {
  const feedback = parseGeminiWritingFeedback(
    JSON.stringify({
      overall_feedback: "Here is a useful meaning and example for this word.",
      corrected_text: "resilient",
      natural_version: "resilient",
      suggestions: [],
      key_phrases: [],
      word_details: {
        word: "resilient",
        pronunciation: "/rɪˈzɪliənt/",
        meanings: [
          {
            part_of_speech: "adjective",
            meaning: "able to recover after something difficult",
            example: "She stayed resilient during a difficult year.",
          },
        ],
      },
    }),
  );

  assert.equal(feedback.word_details?.word, "resilient");
  assert.equal(feedback.word_details?.meanings.length, 1);
});

test("Gemini feedback parser accepts empty suggestions and key phrases", () => {
  const feedback = parseGeminiWritingFeedback(
    JSON.stringify({
      overall_feedback: "This is clear and correct.",
      corrected_text: "Thank you.",
      natural_version: "Thanks!",
      suggestions: [],
      key_phrases: [],
      word_details: null,
    }),
  );

  assert.deepEqual(feedback.suggestions, []);
  assert.deepEqual(feedback.key_phrases, []);
});

test("Gemini feedback parser rejects more than three key phrases", () => {
  assert.throws(
    () =>
      parseGeminiWritingFeedback(
        JSON.stringify({
          overall_feedback: "Useful feedback.",
          corrected_text: "Corrected writing.",
          natural_version: "Natural writing.",
          suggestions: [],
          key_phrases: Array.from({ length: 4 }, (_, index) => ({
            phrase: `phrase ${index}`,
            meaning: "A meaning.",
            example: "An example sentence.",
          })),
          word_details: null,
        }),
      ),
    (error) =>
      error instanceof WritingFeedbackProviderError &&
      error.kind === "invalid_response",
  );
});

test("Gemini feedback parser rejects invalid JSON", () => {
  assert.throws(
    () => parseGeminiWritingFeedback("not JSON"),
    (error) =>
      error instanceof WritingFeedbackProviderError &&
      error.kind === "invalid_response",
  );
});

test("Gemini feedback parser rejects JSON with the wrong structure", () => {
  assert.throws(
    () =>
      parseGeminiWritingFeedback(JSON.stringify({ feedback: "Missing fields" })),
    (error) =>
      error instanceof WritingFeedbackProviderError &&
      error.kind === "invalid_response",
  );
});
