/**
 * Semantic design tokens for the mobile app.
 */

const ink = '#12171C';
const paper = '#F7F8F6';
const stone = '#6B7A78';
const olive = '#4A5D4E';
const brass = '#B08847';
const rule = '#E2E5E0';
const alarm = '#9B4A3F';

const theme = {
  text: ink,
  tint: olive,
  background: paper,
  foreground: ink,
  card: paper,
  cardForeground: ink,
  primary: olive,
  primaryForeground: paper,
  secondary: rule,
  secondaryForeground: ink,
  muted: rule,
  mutedForeground: stone,
  accent: brass,
  accentForeground: ink,
  destructive: alarm,
  destructiveForeground: paper,
  success: olive,
  successForeground: paper,
  border: rule,
  input: rule,
};

const colors = {
  light: theme,
  dark: theme,
  radius: 12,
};

export default colors;