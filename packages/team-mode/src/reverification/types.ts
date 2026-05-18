export interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  duration?: number;
}

export interface Regression {
  testName: string;
  previousStatus: 'pass';
  currentStatus: 'fail';
}

export interface ReverificationReport {
  total: number;
  passed: number;
  failed: number;
  regressions: Regression[];
  timestamp: string;
}
