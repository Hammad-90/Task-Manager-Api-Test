const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const VALID_PRIORITIES = ["low", "medium", "high"];
const MAX_DESCRIPTION_LENGTH = 2000;

const SYSTEM_PROMPT = `You are a task planning assistant. Given a description of a task, respond with ONLY a valid JSON object (no markdown, no extra text) in exactly this shape:
{
  "summary": "A short one-sentence task summary",
  "priority": "low" | "medium" | "high",
  "estimatedHours": <positive number>,
  "steps": ["actionable step 1", "actionable step 2", "..."]
}
Provide between 3 and 8 clear, actionable steps.`;

// Validates and normalizes the plan returned by the AI model.
// Returns the clean plan, or null if the AI output is unusable.
const validatePlan = (raw) => {
  if (!raw || typeof raw !== "object") return null;

  const summary = typeof raw.summary === "string" ? raw.summary.trim() : "";
  const priority =
    typeof raw.priority === "string" ? raw.priority.trim().toLowerCase() : "";
  const estimatedHours = Number(raw.estimatedHours);
  const steps = Array.isArray(raw.steps)
    ? raw.steps
        .filter((s) => typeof s === "string" && s.trim())
        .map((s) => s.trim())
    : [];

  if (!summary) return null;
  if (!VALID_PRIORITIES.includes(priority)) return null;
  if (!Number.isFinite(estimatedHours) || estimatedHours <= 0) return null;
  if (steps.length === 0) return null;

  return { summary, priority, estimatedHours, steps };
};

// POST /api/ai/plan-task
exports.planTask = async (req, res, next) => {
  try {
    const { description } = req.body || {};

    // 1. Validate input
    if (typeof description !== "string" || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "A non-empty 'description' string is required",
      });
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`,
      });
    }

    // 2. Check configuration
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "AI service is not configured (missing GROQ_API_KEY)",
      });
    }
    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    // 3. Call the Groq API
    let response;
    try {
      response = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: description.trim() },
          ],
          temperature: 0.4,
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(20000),
      });
    } catch (err) {
      const timedOut = err.name === "TimeoutError" || err.name === "AbortError";
      return res.status(timedOut ? 504 : 502).json({
        success: false,
        message: timedOut
          ? "AI service timed out. Please try again."
          : "Could not reach the AI service. Please try again later.",
      });
    }

    // 4. Handle API errors (bad key, rate limit, server error...)
    if (!response.ok) {
      const status = response.status === 429 ? 429 : 502;
      const message =
        response.status === 429
          ? "AI service rate limit reached. Please try again later."
          : "AI service returned an error. Please try again later.";
      console.error(`Groq API error: HTTP ${response.status}`);
      return res.status(status).json({ success: false, message });
    }

    // 5. Parse and validate the AI output
    let plan = null;
    try {
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      plan = validatePlan(JSON.parse(content));
    } catch (err) {
      plan = null;
    }

    if (!plan) {
      return res.status(502).json({
        success: false,
        message: "AI returned an invalid response. Please try again.",
      });
    }

    res.status(200).json({ success: true, plan });
  } catch (err) {
    next(err);
  }
};
