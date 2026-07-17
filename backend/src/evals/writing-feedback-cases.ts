export type WritingFeedbackEvaluationCase = {
  id: string;
  focus: string;
  text: string;
  goal?: string;
  expected_behavior: string[];
};

export const writingFeedbackEvaluationCases: WritingFeedbackEvaluationCase[] =
  [
    {
      id: "capitalization",
      focus: "capitalization",
      text: "i live in auckland.",
      expected_behavior: [
        "Capitalize 'I' and 'Auckland'.",
        "Keep the sentence structure unchanged.",
      ],
    },
    {
      id: "verb-tense",
      focus: "verb tense",
      text: "Yesterday I go to the library.",
      expected_behavior: ["Change 'go' to 'went'."],
    },
    {
      id: "articles",
      focus: "articles",
      text: "I bought book at the airport.",
      expected_behavior: ["Add an article before 'book'."],
    },
    {
      id: "prepositions",
      focus: "prepositions",
      text: "I'm interested on learning Spanish.",
      expected_behavior: ["Change 'interested on' to 'interested in'."],
    },
    {
      id: "word-choice",
      focus: "word choice",
      text: "I made a photo of the sunset.",
      expected_behavior: ["Use 'took a photo' in this context."],
    },
    {
      id: "professional-tone",
      focus: "professional tone",
      text: "Hey, send me the report now.",
      goal: "Sound professional but friendly",
      expected_behavior: [
        "Keep corrected_text focused on necessary corrections.",
        "Make natural_version polite and professional without sounding stiff.",
      ],
    },
    {
      id: "casual-tone",
      focus: "casual tone",
      text: "I would be delighted to attend your birthday celebration.",
      goal: "Sound casual",
      expected_behavior: [
        "Do not treat the formal wording as a grammar error.",
        "Offer a friendly, casual natural_version.",
      ],
    },
    {
      id: "already-correct",
      focus: "already correct English",
      text: "I need to leave early today.",
      expected_behavior: [
        "Keep corrected_text unchanged.",
        "Return no suggestions.",
      ],
    },
    {
      id: "short-input",
      focus: "short input",
      text: "thank you",
      expected_behavior: [
        "Only correct capitalization and punctuation if appropriate.",
        "Do not invent missing context.",
      ],
    },
    {
      id: "single-word-dictionary",
      focus: "single word dictionary",
      text: "resilient",
      expected_behavior: [
        "Return an IPA pronunciation and one to three common meanings.",
        "Include a part of speech, simple meaning, and example for each meaning.",
        "Do not duplicate the dictionary entry in key_phrases.",
      ],
    },
    {
      id: "multiple-errors",
      focus: "multiple errors",
      text: "yesterday i go to shop and buyed apple.",
      expected_behavior: [
        "Correct capitalization, tense, articles, and the irregular verb.",
        "Keep suggestions distinct and learner-friendly.",
      ],
    },
    {
      id: "avoid-overcorrection",
      focus: "avoiding overcorrection",
      text: "Could you send me the notes after class?",
      expected_behavior: [
        "Keep corrected_text unchanged.",
        "Do not present an optional rewrite as an error.",
      ],
    },
    {
      id: "avoid-duplicate-suggestions",
      focus: "avoiding duplicate suggestions",
      text: "She go to work every day.",
      expected_behavior: [
        "Change 'go' to 'goes'.",
        "Return one subject-verb agreement suggestion, not overlapping duplicates.",
      ],
    },
  ];
