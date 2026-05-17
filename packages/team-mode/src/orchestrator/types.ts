export interface SliceAssignment {
  sliceId: string;
  roleId: string;
  description: string;
  files: string[];
  dependencies: string[];
}

export interface SliceResult {
  sliceId: string;
  roleId: string;
  status: 'complete' | 'failed';
  costUsd: number;
  output?: string;
  error?: string;
}
