import assert from "node:assert/strict";
import { test } from "node:test";

import { writingFeedbackEvaluationCases } from "./writing-feedback-cases";

test("Writing Coach evaluation dataset covers the required quality cases", () => {
  const requiredFocusAreas = [
    "capitalization",
    "verb tense",
    "articles",
    "prepositions",
    "word choice",
    "professional tone",
    "casual tone",
    "already correct English",
    "short input",
    "single word dictionary",
    "multiple errors",
    "avoiding overcorrection",
    "avoiding duplicate suggestions",
  ];
  const focusAreas = new Set(
    writingFeedbackEvaluationCases.map((evaluationCase) =>
      evaluationCase.focus,
    ),
  );
  const ids = writingFeedbackEvaluationCases.map(
    (evaluationCase) => evaluationCase.id,
  );

  assert.ok(writingFeedbackEvaluationCases.length >= 12);
  assert.equal(new Set(ids).size, ids.length);

  for (const focusArea of requiredFocusAreas) {
    assert.ok(focusAreas.has(focusArea), `Missing focus area: ${focusArea}`);
  }
});
