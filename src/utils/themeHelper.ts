// Theme color management & dynamic color calculation for LifeBuddy

export interface ThemeColorPreset {
  id: string;
  name: string;
  hex: string;
  accent: string;
}

export const THEME_COLOR_PRESETS: ThemeColorPreset[] = [
  { id: 'purple', name: 'Royal Purple', hex: '#7c3aed', accent: 'Classic LifeBuddy Aesthetic' },
  { id: 'blue', name: 'Sapphire Blue', hex: '#2563eb', accent: 'Calm Clarity & High Focus' },
  { id: 'emerald', name: 'Emerald Green', hex: '#059669', accent: 'Fresh Botanical Productivity' },
  { id: 'indigo', name: 'Electric Indigo', hex: '#4f46e5', accent: 'Deep Focus & Discipline' },
  { id: 'rose', name: 'Ruby Rose', hex: '#e11d48', accent: 'Vibrant Energy & Drive' },
  { id: 'amber', name: 'Sunset Amber', hex: '#d97706', accent: 'Warm Study Comfort' },
  { id: 'teal', name: 'Ocean Teal', hex: '#0d9488', accent: 'Balanced Steady Workflow' },
  { id: 'slate', name: 'Graphite Slate', hex: '#475569', accent: 'Minimalist Modern Precision' },
  { id: 'fuchsia', name: 'Neon Fuchsia', hex: '#c026d3', accent: 'Creative Spark & Inspiration' }
];

export const DEFAULT_THEME_COLOR = '#7c3aed';

// Hex to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

// Calculate relative luminance to determine optimal text contrast (WCAG)
export function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Get suitable text color (light or dark) for a given background color
export function getContrastTextColor(hex: string): '#ffffff' | '#0f172a' {
  try {
    const { r, g, b } = hexToRgb(hex);
    const lum = getLuminance(r, g, b);
    return lum > 0.45 ? '#0f172a' : '#ffffff';
  } catch {
    return '#ffffff';
  }
}

// Darken or lighten a hex color
export function adjustHexBrightness(hex: string, percent: number): string {
  try {
    const { r, g, b } = hexToRgb(hex);
    const adjust = (val: number) => {
      const calculated = Math.round(val * (1 + percent / 100));
      return Math.min(255, Math.max(0, calculated));
    };
    const rr = adjust(r).toString(16).padStart(2, '0');
    const gg = adjust(g).toString(16).padStart(2, '0');
    const bb = adjust(b).toString(16).padStart(2, '0');
    return `#${rr}${gg}${bb}`;
  } catch {
    return hex;
  }
}

// Apply theme dynamically to CSS variables
export function applyThemeColorToDocument(hex: string) {
  if (typeof document === 'undefined') return;

  try {
    const { r, g, b } = hexToRgb(hex);
    const contrast = getContrastTextColor(hex);
    const hoverColor = adjustHexBrightness(hex, -15);
    const activeColor = adjustHexBrightness(hex, -25);
    const deepHeading = adjustHexBrightness(hex, -55);
    const subtleBg = `rgba(${r}, ${g}, ${b}, 0.04)`;
    const lightContainerBg = `rgba(${r}, ${g}, ${b}, 0.09)`;
    const borderTint = `rgba(${r}, ${g}, ${b}, 0.24)`;
    const ringTint = `rgba(${r}, ${g}, ${b}, 0.45)`;

    const root = document.documentElement;
    root.style.setProperty('--theme-primary', hex);
    root.style.setProperty('--theme-primary-hover', hoverColor);
    root.style.setProperty('--theme-primary-active', activeColor);
    root.style.setProperty('--theme-primary-text', contrast);
    root.style.setProperty('--theme-heading', deepHeading);
    root.style.setProperty('--theme-bg-subtle', subtleBg);
    root.style.setProperty('--theme-light', lightContainerBg);
    root.style.setProperty('--theme-border', borderTint);
    root.style.setProperty('--theme-ring', ringTint);

    // Update meta theme-color for mobile browsers
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', hex);
    }
  } catch (e) {
    console.error('Failed to apply theme color:', e);
  }
}
