// Reads an env var, trimmed. Empty/whitespace-only counts as unset.
export function env(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v ? v : undefined;
}
