export interface Rng {
  next(): number;
  int(max: number): number;
  pick<T>(items: readonly T[]): T;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  const next = (): number => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int(max: number) {
      if (max <= 0) {
        return 0;
      }
      return Math.floor(next() * max);
    },
    pick<T>(items: readonly T[]) {
      return items[Math.floor(next() * items.length)] as T;
    },
  };
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = rng.int(i + 1);
    const current = copy[i] as T;
    copy[i] = copy[j] as T;
    copy[j] = current;
  }
  return copy;
}

export function bagFromCounts<T>(counts: ReadonlyArray<readonly [T, number]>): T[] {
  const out: T[] = [];
  for (const [value, count] of counts) {
    for (let i = 0; i < count; i += 1) {
      out.push(value);
    }
  }
  return out;
}
