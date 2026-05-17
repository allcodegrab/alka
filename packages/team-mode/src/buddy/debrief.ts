export function generateDebriefPrompt(
  originalBrief: { problemStatement: string; successCriteria: string[] },
  sliceResults: Array<{ sliceId: string; status: string }>,
  findingsCount: number,
): string {
  const completedSlices = sliceResults.filter((s) => s.status === 'complete');
  const failedSlices = sliceResults.filter((s) => s.status === 'failed');
  const totalSlices = sliceResults.length;

  const lines: string[] = [
    '# Mission Debrief',
    '',
    '## Original Intent',
    originalBrief.problemStatement,
    '',
    '## Success Criteria',
    ...originalBrief.successCriteria.map((c, i) => `${i + 1}. ${c}`),
    '',
    '## Delivery Summary',
    `- Slices completed: ${completedSlices.length}/${totalSlices}`,
    `- Slices failed: ${failedSlices.length}/${totalSlices}`,
    `- Findings recorded: ${findingsCount}`,
    '',
  ];

  if (failedSlices.length > 0) {
    lines.push('## Failed Slices');
    for (const slice of failedSlices) {
      lines.push(`- ${slice.sliceId}: ${slice.status}`);
    }
    lines.push('');
  }

  lines.push(
    '## Questions for Debrief',
    '1. Were all success criteria met? If not, which remain open?',
    '2. Were there any unexpected findings or side effects?',
    '3. Are there follow-up tasks that should be tracked?',
    '4. What went well that should be repeated?',
    '5. What should be improved for next time?',
    '',
  );

  return lines.join('\n');
}
