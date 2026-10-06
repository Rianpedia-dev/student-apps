/**
 * Deterministic pseudo-random number generator and shuffle using a seed.
 * Menjamin urutan konsisten bagi siswa saat me-refresh browser,
 * namun berbeda antar-siswa.
 */
function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function seededShuffle<T>(array: T[], seed: number | string): T[] {
  if (array.length <= 1) return [...array];

  const numericSeed =
    typeof seed === "number"
      ? seed
      : seed.split("").reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0);

  const rng = createSeededRandom(Math.abs(numericSeed) || 12345);
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
