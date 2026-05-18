export interface NotificationEvent {
  type: 'inbox_item' | 'mission_complete' | 'mission_failed' | 'payroll_alert' | 'healing_event';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  body: string;
  missionId?: string;
}

export interface NotificationConfig {
  notion?: { apiKey: string; pageId: string };
  slack?: { webhookUrl: string; channel?: string };
}
