export function parseBundleParam(
  value: string | null,
  known: string[],
): { plugins: string[]; unknown: string[] } {
  if (value === null) {
    return { plugins: [], unknown: [] };
  }
  const names = [
    ...new Set(
      value
        .split(",")
        .map((part) => part.trim())
        .filter((part) => part.length > 0),
    ),
  ];
  const knownSet = new Set(known);
  return {
    plugins: names.filter((name) => knownSet.has(name)),
    unknown: names.filter((name) => !knownSet.has(name)),
  };
}

export function serializeBundleParam(plugins: string[]): string {
  return [...plugins].sort().join(",");
}
