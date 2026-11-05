export function priceForName(name: string): number {
  const len = name.trim().length;
  if (len === 1) return 2000;
  if (len === 2) return 400;
  if (len === 3) return 400;
  if (len === 4) return 150;
  return 30;
}
