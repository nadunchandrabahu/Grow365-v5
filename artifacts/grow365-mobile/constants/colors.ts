/**
 * Semantic design tokens for the mobile app.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#171E25',
    tint: '#C4A45A',

    // Core surfaces
    background: '#F4F7F6', // Cool off-white with faint green cast
    foreground: '#171E25', // Deep blue-slate near-black

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#171E25',

    // Primary action color (buttons, links, active states)
    primary: '#171E25',
    primaryForeground: '#F4F7F6',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#E8EBE9',
    secondaryForeground: '#171E25',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#E8EBE9',
    mutedForeground: '#7A8B80', // Soft sage-grey

    // Accent highlights (badges, selected items, focus rings)
    accent: '#C4A45A', // Aged brass for Today
    accentForeground: '#FFFFFF',

    // Destructive actions (delete, error states)
    destructive: '#B25050', // Muted brick red
    destructiveForeground: '#FFFFFF',

    // Success / Completed states
    success: '#4B5E32', // Deep olive
    successForeground: '#FFFFFF',

    // Borders and input outlines
    border: '#E2E8E4',
    input: '#E2E8E4',
  },
  dark: {
    text: '#E8EBE9',
    tint: '#D4B872',
    background: '#11161A',
    foreground: '#E8EBE9',
    card: '#1C242A',
    cardForeground: '#E8EBE9',
    primary: '#E8EBE9',
    primaryForeground: '#11161A',
    secondary: '#1C242A',
    secondaryForeground: '#E8EBE9',
    muted: '#1C242A',
    mutedForeground: '#8DA196',
    accent: '#D4B872',
    accentForeground: '#11161A',
    destructive: '#C56363',
    destructiveForeground: '#FFFFFF',
    success: '#668043',
    successForeground: '#FFFFFF',
    border: '#2A363E',
    input: '#2A363E',
  },
  radius: 12,
};

export default colors;