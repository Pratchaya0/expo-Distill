import type { TranscriptSegment, ActionItem } from '@/types';
import { SYSTEM_PROMPT, TEMPLATE_PROMPTS } from './prompts';

const GROQ_BASE = 'https://api.groq.com/openai/v1';
const ALLOWED_LANGUAGES = new Set(['th', 'en']);
const MAX_TRANSCRIPT_CHARS = 50_000;

export interface ProcessedResult {
  summary: string;
  actionItems: ActionItem[];
  mindMap: string;
}

/** Transcribe an audio file given its local URI. */
export async function groqTranscribe(
  fileUri: string,
  apiKey: string,
  language: 'th' | 'en' = 'th',
): Promise<TranscriptSegment[]> {
  const safeLanguage = ALLOWED_LANGUAGES.has(language) ? language : 'th';

  // React Native FormData supports { uri, name, type } for file uploads
  const form = new FormData();
  form.append('file', { uri: fileUri, name: 'recording.m4a', type: 'audio/mp4' } as unknown as Blob);
  form.append('model', 'whisper-large-v3');
  form.append('response_format', 'verbose_json');
  form.append('language', safeLanguage);

  const res = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Transcription failed (${res.status})`);
  }

  const data = await res.json();
  if (data.segments?.length) {
    return data.segments.map((s: { start: number; end: number; text: string }) => ({
      start: s.start,
      end: s.end,
      text: s.text.trim(),
    }));
  }
  return [{ start: 0, end: 0, text: (data.text ?? '').trim() }];
}

/** Process a transcript into summary, action items, and mind map. */
export async function groqProcess(
  segments: TranscriptSegment[],
  apiKey: string,
  templateId?: string,
  language: 'th' | 'en' = 'th',
): Promise<ProcessedResult> {
  const transcriptText = segments.map((s) => s.text).join(' ');
  if (transcriptText.length > MAX_TRANSCRIPT_CHARS) {
    throw new Error(`Transcript too long (max ${MAX_TRANSCRIPT_CHARS} chars).`);
  }

  const safeTemplateHint =
    templateId && Object.prototype.hasOwnProperty.call(TEMPLATE_PROMPTS, templateId)
      ? `\n\nContext hint: ${TEMPLATE_PROMPTS[templateId]}`
      : '';

  const langInstruction =
    language === 'th'
      ? '\n\nIMPORTANT: Write all text values in Thai (ภาษาไทย). Keep JSON keys in English.'
      : '\n\nIMPORTANT: Write all text values in English.';

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + langInstruction + safeTemplateHint },
        { role: 'user', content: `Transcript:\n\n${transcriptText}` },
      ],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `AI processing failed (${res.status})`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? '{}';
  let parsed: Partial<ProcessedResult>;
  try { parsed = JSON.parse(raw); } catch { throw new Error('Could not parse AI response.'); }

  return {
    summary: parsed.summary ?? '',
    actionItems: (parsed.actionItems ?? []).map((item: ActionItem, i: number) => ({
      id: item.id ?? String(i + 1),
      text: item.text ?? '',
      done: item.done ?? false,
    })),
    mindMap: parsed.mindMap ?? '',
  };
}
