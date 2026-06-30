const TEAM_AVATAR_TONES = [
  'bg-brand-indigo-muted text-brand-indigo',
  'bg-muted text-foreground',
  'bg-accent text-accent-foreground',
] as const;

export function getTeamAvatarTone(seed: string): string {
  const hash = seed
    .trim()
    .toLowerCase()
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return TEAM_AVATAR_TONES[hash % TEAM_AVATAR_TONES.length];
}
