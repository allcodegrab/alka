/** Forge Dark — Anvil Design System default theme */
export const forgeDark = {
  // Surfaces
  'surface-canvas': '#0A0B0D',
  'surface-base': '#0E1014',
  'surface-raised': '#14171C',
  'surface-overlay': '#1A1E25',
  'surface-sunken': '#07080A',

  // Borders
  'border-subtle': '#1A1E25',
  'border-default': '#262B33',
  'border-strong': '#3A4049',

  // Text
  'text-primary': '#E8EAED',
  'text-secondary': '#9CA3AF',
  'text-tertiary': '#6B7280',
  'text-disabled': '#4A5057',

  // Accent — Forge Amber
  accent: '#FF5C1F',
  'accent-hover': '#FF7A45',
  'accent-active': '#E54A0F',
  'accent-muted': 'rgba(255, 92, 31, 0.12)',
  'accent-on': '#0A0B0D',

  // Semantic
  success: '#2EBD6F',
  'success-muted': 'rgba(46, 189, 111, 0.12)',
  warning: '#E0A93B',
  'warning-muted': 'rgba(224, 169, 59, 0.12)',
  danger: '#E5484D',
  'danger-muted': 'rgba(229, 72, 77, 0.12)',
  info: '#4C8DFF',
  'info-muted': 'rgba(76, 141, 255, 0.12)',

  // Agent states
  'agent-idle': '#6B7280',
  'agent-planning': '#4C8DFF',
  'agent-running': '#FF5C1F',
  'agent-blocked': '#E0A93B',
  'agent-success': '#2EBD6F',
  'agent-failed': '#E5484D',

  // Risk classifier
  'risk-0': '#2EBD6F',
  'risk-1': '#B8C238',
  'risk-2': '#E0A93B',
  'risk-3': '#E07B3B',
  'risk-4': '#E5484D',
} as const;

export type ForgeThemeTokens = Record<keyof typeof forgeDark, string>;
