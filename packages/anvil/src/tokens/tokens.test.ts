import { describe, it, expect } from 'vitest';
import {
  forgeDark,
  forgeLight,
  forgeHighContrast,
  getTheme,
  themeToCssVariables,
} from './index.js';

describe('Anvil tokens', () => {
  it('forgeDark has all required surface tokens', () => {
    expect(forgeDark['surface-canvas']).toBe('#0A0B0D');
    expect(forgeDark['surface-base']).toBe('#0E1014');
    expect(forgeDark['surface-raised']).toBe('#14171C');
    expect(forgeDark['surface-overlay']).toBe('#1A1E25');
    expect(forgeDark['surface-sunken']).toBe('#07080A');
  });

  it('forgeDark has Forge Amber accent', () => {
    expect(forgeDark.accent).toBe('#FF5C1F');
    expect(forgeDark['accent-hover']).toBe('#FF7A45');
    expect(forgeDark['accent-active']).toBe('#E54A0F');
  });

  it('forgeLight has inverted surfaces', () => {
    expect(forgeLight['surface-canvas']).toBe('#FAFAF9');
    expect(forgeLight['surface-base']).toBe('#FFFFFF');
    expect(forgeLight['text-primary']).toBe('#0A0B0D');
  });

  it('forgeHighContrast has WCAG AAA values', () => {
    expect(forgeHighContrast['surface-canvas']).toBe('#000000');
    expect(forgeHighContrast['text-primary']).toBe('#FFFFFF');
    expect(forgeHighContrast.accent).toBe('#FFB300');
  });

  it('all themes have the same keys', () => {
    const darkKeys = Object.keys(forgeDark).sort();
    const lightKeys = Object.keys(forgeLight).sort();
    const hcKeys = Object.keys(forgeHighContrast).sort();
    expect(darkKeys).toEqual(lightKeys);
    expect(darkKeys).toEqual(hcKeys);
  });

  it('getTheme returns correct theme', () => {
    expect(getTheme('dark')).toBe(forgeDark);
    expect(getTheme('light')['surface-canvas']).toBe('#FAFAF9');
    expect(getTheme('high-contrast')['surface-canvas']).toBe('#000000');
  });

  it('themeToCssVariables produces valid CSS', () => {
    const css = themeToCssVariables(forgeDark);
    expect(css).toContain('--surface-canvas: #0A0B0D');
    expect(css).toContain('--accent: #FF5C1F');
    expect(css).toContain('--text-primary: #E8EAED');
  });

  it('all agent state tokens exist', () => {
    expect(forgeDark['agent-idle']).toBeDefined();
    expect(forgeDark['agent-planning']).toBeDefined();
    expect(forgeDark['agent-running']).toBeDefined();
    expect(forgeDark['agent-blocked']).toBeDefined();
    expect(forgeDark['agent-success']).toBeDefined();
    expect(forgeDark['agent-failed']).toBeDefined();
  });

  it('all risk tokens exist', () => {
    expect(forgeDark['risk-0']).toBeDefined();
    expect(forgeDark['risk-1']).toBeDefined();
    expect(forgeDark['risk-2']).toBeDefined();
    expect(forgeDark['risk-3']).toBeDefined();
    expect(forgeDark['risk-4']).toBeDefined();
  });
});
