import { ok, err, type Result } from '@forge/protocol';
import type { ReviewResult } from './types.js';
import { GeminiError } from './errors.js';

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

const SYSTEM_INSTRUCTION = `You are a senior code reviewer. Analyze the provided PR diff and related context.
Return your review as a JSON object with this exact structure:
{
  "findings": [
    {
      "severity": "info" | "low" | "medium" | "high" | "critical",
      "location": "file:line or description",
      "message": "description of the issue"
    }
  ],
  "summary": "brief overall assessment"
}
Only output valid JSON, no markdown fences or extra text.`;

export async function reviewPR(params: {
  diff: string;
  brief: string;
  verifierFindings: string;
  decisions: string;
}): Promise<Result<ReviewResult, GeminiError>> {
  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey) {
    return err(new GeminiError('NO_API_KEY', 'GEMINI_API_KEY environment variable is not set'));
  }

  const userPrompt = [
    '## PR Diff',
    params.diff,
    '',
    '## Mission Brief',
    params.brief,
    '',
    '## Verifier Findings',
    params.verifierFindings,
    '',
    '## Decisions Made',
    params.decisions,
  ].join('\n');

  const body = {
    system_instruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4096,
    },
  };

  let response: Response;
  try {
    response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return err(
      new GeminiError(
        'API_ERROR',
        `Gemini API request failed: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }

  if (response.status === 401 || response.status === 403) {
    return err(new GeminiError('AUTH_ERROR', 'Invalid Gemini API key'));
  }
  if (!response.ok) {
    const text = await response.text();
    return err(new GeminiError('API_ERROR', `Gemini API error: ${response.status} ${text}`));
  }

  const data = (await response.json()) as Record<string, unknown>;

  let reviewJson: { findings: ReviewResult['findings']; summary: string };
  try {
    const candidates = data['candidates'] as Array<Record<string, unknown>> | undefined;
    const content = candidates?.[0]?.['content'] as Record<string, unknown> | undefined;
    const parts = content?.['parts'] as Array<Record<string, unknown>> | undefined;
    const text = parts?.[0]?.['text'] as string | undefined;
    if (!text) {
      return err(new GeminiError('PARSE_ERROR', 'No text content in Gemini response'));
    }
    reviewJson = JSON.parse(text);
  } catch (e) {
    return err(
      new GeminiError(
        'PARSE_ERROR',
        `Failed to parse Gemini response: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }

  if (!Array.isArray(reviewJson.findings)) {
    return err(new GeminiError('PARSE_ERROR', 'Gemini response missing findings array'));
  }

  const approved = !reviewJson.findings.some(
    (f) => f.severity === 'high' || f.severity === 'critical',
  );

  return ok({
    findings: reviewJson.findings,
    summary: reviewJson.summary || '',
    approved,
  });
}
