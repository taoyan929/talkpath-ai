// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import App from "./App";
import { detectInputMode } from "./writingCoach";

type MockResponse = {
  ok: boolean;
  json: ReturnType<typeof vi.fn>;
};

const healthResponse = {
  status: "ok",
  service: "TalkPath AI backend",
};

const writingResponse = {
  overall_feedback: "Your meaning is clear. Focus on the verb tense.",
  corrected_text: "I went to the supermarket yesterday.",
  natural_version: "Yesterday, I went to the supermarket.",
  suggestions: [
    {
      category: "grammar",
      original: "go",
      replacement: "went",
      explanation: "Use the past tense for an action that happened yesterday.",
    },
  ],
  key_phrases: [
    {
      phrase: "went to",
      meaning: "visited a place",
      example: "We went to the library after lunch.",
    },
  ],
  word_details: null,
};

const dictionaryResponse = {
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
};

function jsonResponse(body: unknown, status = 200): MockResponse {
  return {
    ok: status >= 200 && status < 300,
    json: vi.fn().mockResolvedValue(body),
  };
}

function mockFetch(...writingRequests: Array<MockResponse | Error>) {
  const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(healthResponse));

  for (const request of writingRequests) {
    if (request instanceof Error) {
      fetchMock.mockRejectedValueOnce(request);
    } else {
      fetchMock.mockResolvedValueOnce(request);
    }
  }

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function enterText(value: string) {
  fireEvent.change(screen.getByLabelText("Your text"), {
    target: { value },
  });
}

function submitText(value: string) {
  enterText(value);
  fireEvent.click(screen.getByRole("button", { name: "Get feedback" }));
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("input mode detection", () => {
  test("detects dictionary words and writing input deterministically", () => {
    expect(detectInputMode("hello")).toBe("dictionary");
    expect(detectInputMode("don't")).toBe("dictionary");
    expect(detectInputMode("well-being")).toBe("dictionary");
    expect(detectInputMode("take off")).toBe("writing");
    expect(detectInputMode("I am happy.")).toBe("writing");
  });
});

describe("Writing Coach interactions", () => {
  test("quick goal options fill the editable goal input", () => {
    mockFetch();
    render(<App />);

    const option = screen.getByRole("button", { name: "Professional" });
    const goalInput = screen.getByLabelText(/^Your goal/) as HTMLInputElement;

    fireEvent.click(option);
    expect(goalInput.value).toBe("Professional");
    expect(option.getAttribute("aria-pressed")).toBe("true");

    fireEvent.change(goalInput, { target: { value: "Friendly email" } });
    expect(option.getAttribute("aria-pressed")).toBe("false");
  });

  test("shows dictionary details without redundant writing sections", async () => {
    mockFetch(jsonResponse(dictionaryResponse));
    render(<App />);

    submitText("resilient");

    expect(await screen.findByText("/rɪˈzɪliənt/")).toBeTruthy();
    expect(screen.getByText("able to recover after something difficult")).toBeTruthy();
    expect(screen.queryByText("Corrected text")).toBeNull();
    expect(screen.queryByText("More natural version")).toBeNull();
    expect(screen.queryByText("Suggestions")).toBeNull();

    enterText("I am editing this now.");
    expect(document.querySelector(".result-mode")?.textContent).toBe(
      "Dictionary mode",
    );
  });

  test("shows the complete writing result and collapsible learning sections", async () => {
    mockFetch(jsonResponse(writingResponse));
    render(<App />);

    submitText("I go supermarket yesterday.");

    expect(await screen.findByText("Corrected text")).toBeTruthy();
    expect(screen.getByText("More natural version")).toBeTruthy();
    expect(screen.getByText("Suggestions")).toBeTruthy();
    expect(screen.getByText("Key phrases")).toBeTruthy();
    expect(screen.queryByText("Dictionary")).toBeNull();

    const hideButtons = screen.getAllByRole("button", { name: "Hide" });
    expect(hideButtons[0].getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(hideButtons[0]);
    expect(screen.queryByText("Use the past tense for an action that happened yesterday.")).toBeNull();
    expect(screen.getByRole("button", { name: "Show" }).getAttribute("aria-expanded")).toBe("false");
  });

  test("shows a simple no-corrections state without an empty suggestions section", async () => {
    mockFetch(
      jsonResponse({
        ...writingResponse,
        corrected_text: "I need to leave early today.",
        natural_version: "I need to leave early today.",
        suggestions: [],
        key_phrases: [],
      }),
    );
    render(<App />);

    submitText("I need to leave early today.");

    expect(await screen.findByText("No corrections needed.")).toBeTruthy();
    expect(screen.queryByText("Suggestions")).toBeNull();
  });

  test("Start over clears the form and result and focuses the textarea", async () => {
    mockFetch(jsonResponse(writingResponse));
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Professional" }));
    submitText("I go supermarket yesterday.");
    await screen.findByText("Corrected text");

    fireEvent.click(screen.getByRole("button", { name: "Start over" }));

    const textArea = screen.getByLabelText("Your text") as HTMLTextAreaElement;
    const goalInput = screen.getByLabelText(/^Your goal/) as HTMLInputElement;
    expect(textArea.value).toBe("");
    expect(goalInput.value).toBe("");
    expect(screen.queryByText("Corrected text")).toBeNull();
    expect(document.activeElement).toBe(textArea);
  });

  test("uses the natural version as new input while preserving the goal", async () => {
    mockFetch(jsonResponse(writingResponse));
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Professional" }));
    submitText("I go supermarket yesterday.");
    await screen.findByText("More natural version");

    fireEvent.click(screen.getByRole("button", { name: "Use as new input" }));

    const textArea = screen.getByLabelText("Your text") as HTMLTextAreaElement;
    const goalInput = screen.getByLabelText(/^Your goal/) as HTMLInputElement;
    expect(textArea.value).toBe(writingResponse.natural_version);
    expect(goalInput.value).toBe("Professional");
    expect(screen.queryByText("More natural version")).toBeNull();
    expect(document.activeElement).toBe(textArea);
  });

  test("Retry reuses the failed request snapshot", async () => {
    const fetchMock = mockFetch(
      new Error("network unavailable"),
      jsonResponse(writingResponse),
    );
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Fix grammar" }));
    submitText("I go supermarket yesterday.");

    expect(await screen.findByRole("button", { name: "Retry" })).toBeTruthy();
    enterText("This is different text.");
    fireEvent.change(screen.getByLabelText(/^Your goal/), {
      target: { value: "Casual" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await screen.findByText("Corrected text");
    const retryOptions = fetchMock.mock.calls[2][1] as RequestInit;
    expect(JSON.parse(retryOptions.body as string)).toEqual({
      text: "I go supermarket yesterday.",
      goal: "Fix grammar",
    });
  });

  test("clears stale feedback when a new request fails", async () => {
    mockFetch(jsonResponse(writingResponse), new Error("network unavailable"));
    render(<App />);

    submitText("I go supermarket yesterday.");
    await screen.findByText("I went to the supermarket yesterday.");

    submitText("This request will fail.");

    expect(
      await screen.findByText(
        "Unable to connect to the Writing Coach service. Please make sure the backend is running and try again.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("I went to the supermarket yesterday.")).toBeNull();
  });

  test("copies corrected text and shows temporary success feedback", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    mockFetch(jsonResponse(writingResponse));
    render(<App />);

    submitText("I go supermarket yesterday.");
    const correctedLabel = await screen.findByText("Corrected text");
    const correctedCard = correctedLabel.closest(".corrected-card");

    expect(correctedCard).toBeTruthy();
    fireEvent.click(
      within(correctedCard as HTMLElement).getByRole("button", { name: "Copy" }),
    );

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(writingResponse.corrected_text);
    });
    expect(
      within(correctedCard as HTMLElement).getByRole("button", {
        name: "Copied",
      }),
    ).toBeTruthy();
  });
});
