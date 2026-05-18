import type { ReviewResult, Disagreement } from './types.js';

interface ClaudeFinding {
  severity: string;
  location: string;
  evidence: string;
}

export function detectDisagreements(
  claudeFindings: ClaudeFinding[],
  geminiFindings: ReviewResult,
): Disagreement[] {
  const disagreements: Disagreement[] = [];

  // Build location maps for efficient lookup
  const claudeByLocation = new Map<string, ClaudeFinding>();
  for (const f of claudeFindings) {
    claudeByLocation.set(normalizeLocation(f.location), f);
  }

  const geminiByLocation = new Map<string, ReviewResult['findings'][number]>();
  for (const f of geminiFindings.findings) {
    geminiByLocation.set(normalizeLocation(f.location), f);
  }

  // Gemini flags HIGH/CRITICAL but Claude has no finding at that location
  for (const gf of geminiFindings.findings) {
    if (gf.severity !== 'high' && gf.severity !== 'critical') continue;

    const loc = normalizeLocation(gf.location);
    const claudeMatch = claudeByLocation.get(loc);

    if (!claudeMatch) {
      disagreements.push({
        topic: `Issue at ${gf.location}`,
        claudeView: 'No issue found at this location',
        geminiView: `[${gf.severity.toUpperCase()}] ${gf.message}`,
        severity: gf.severity,
      });
    }
  }

  // Claude flags HIGH/CRITICAL but Gemini approved (no matching finding)
  for (const cf of claudeFindings) {
    if (cf.severity !== 'high' && cf.severity !== 'critical') continue;

    const loc = normalizeLocation(cf.location);
    const geminiMatch = geminiByLocation.get(loc);

    if (!geminiMatch && geminiFindings.approved) {
      disagreements.push({
        topic: `Issue at ${cf.location}`,
        claudeView: `[${cf.severity.toUpperCase()}] ${cf.evidence}`,
        geminiView: 'No issue found, PR approved',
        severity: cf.severity,
      });
    }
  }

  return disagreements;
}

function normalizeLocation(location: string): string {
  return location.trim().toLowerCase().replace(/\s+/g, ' ');
}
