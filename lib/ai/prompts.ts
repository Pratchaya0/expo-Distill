export const SYSTEM_PROMPT = `You are an expert meeting and audio analyst. Given a raw transcript, produce a JSON response with exactly these keys:

{
  "summary": "A concise 2-4 sentence executive summary of the recording.",
  "actionItems": [
    { "id": "1", "text": "Action item text", "done": false }
  ],
  "mindMap": "Markdown outline using # for the root topic, ## for main branches, and - for leaves. Max 3 levels."
}

Rules:
- summary: plain text, no bullet points.
- actionItems: only concrete tasks with an owner or next-step implication. Empty array if none.
- mindMap: valid markdown outline. The root # heading should be the main topic of the recording.
- Respond with valid JSON only. No prose before or after the JSON block.`;

export const TEMPLATE_PROMPTS: Record<string, string> = {
  'weekly-sync': `Focus on: team updates, blockers, decisions made, and action items with owners.`,
  'brainstorm': `Focus on: ideas proposed, themes that emerged, and the most promising concepts to pursue.`,
  'interview': `Focus on: candidate responses to key questions, strengths demonstrated, concerns raised, and recommended next steps.`,
  'lecture': `Focus on: key concepts explained, important definitions, and notable examples. Action items should be study questions.`,
  '1on1': `Focus on: personal development points, feedback exchanged, commitments made, and follow-up items.`,
};
