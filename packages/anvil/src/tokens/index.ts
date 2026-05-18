import { forgeDark, type ForgeThemeTokens } from './dark.js';
import { forgeLight } from './light.js';
import { forgeHighContrast } from './high-contrast.js';

export { forgeDark, forgeLight, forgeHighContrast, type ForgeThemeTokens };

export type ThemeName = 'dark' | 'light' | 'high-contrast';

export function getTheme(name: ThemeName): ForgeThemeTokens {
  switch (name) {
    case 'dark':
      return forgeDark;
    case 'light':
      return forgeLight as ForgeThemeTokens;
    case 'high-contrast':
      return forgeHighContrast as ForgeThemeTokens;
  }
}

export function themeToCssVariables(theme: ForgeThemeTokens): string {
  return Object.entries(theme)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join('\n');
}
