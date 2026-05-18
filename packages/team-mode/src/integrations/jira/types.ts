export interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

export interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  issueType: string;
  assignee?: string;
  parent?: string;
}

export interface CreateIssueParams {
  projectKey: string;
  issueType: 'Story' | 'Sub-task' | 'Bug' | 'Task';
  summary: string;
  description: string;
  parent?: string;
  labels?: string[];
}
