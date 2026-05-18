import { execFile } from 'node:child_process';
import { ok, err, type Result } from '@forge/protocol';
import { ReverificationError } from './errors.js';
import { loadBaseline } from './baseline.js';
import { detectRegressions } from './regression.js';
import type { TestResult, ReverificationReport } from './types.js';

function parseTestOutput(stdout: string): TestResult[] {
  const results: TestResult[] = [];
  const lines = stdout.split('\n');

  for (const line of lines) {
    const passMatch = line.match(/\s*[+v]\s+(.+)\s+\((\d+)\s*ms\)/);
    const failMatch = line.match(/\s*[x-]\s+(.+)\s+\((\d+)\s*ms\)/);

    if (passMatch) {
      results.push({
        name: passMatch[1]!.trim(),
        status: 'pass',
        duration: parseInt(passMatch[2]!, 10),
      });
    } else if (failMatch) {
      results.push({
        name: failMatch[1]!.trim(),
        status: 'fail',
        duration: parseInt(failMatch[2]!, 10),
      });
    }
  }

  return results;
}

export async function runReverification(
  projectRoot: string,
): Promise<Result<ReverificationReport, ReverificationError>> {
  const baseline = await loadBaseline(projectRoot);

  let stdout: string;
  try {
    stdout = await new Promise<string>((resolve, reject) => {
      execFile(
        'pnpm',
        ['test', '--reporter', 'verbose'],
        { cwd: projectRoot, maxBuffer: 10 * 1024 * 1024 },
        (error, stdoutBuf, stderrBuf) => {
          // pnpm test may exit non-zero if tests fail, but we still want the output
          resolve((stdoutBuf ?? '') + (stderrBuf ?? ''));
        },
      );
    });
  } catch (e) {
    return err(
      new ReverificationError(
        'EXECUTION_ERROR',
        `Failed to run tests: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }

  const current = parseTestOutput(stdout);
  const regressions = detectRegressions(current, baseline);

  const passed = current.filter((t) => t.status === 'pass').length;
  const failed = current.filter((t) => t.status === 'fail').length;

  const report: ReverificationReport = {
    total: current.length,
    passed,
    failed,
    regressions,
    timestamp: new Date().toISOString(),
  };

  return ok(report);
}
