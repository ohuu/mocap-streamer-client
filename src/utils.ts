export function tuple<const T extends unknown[]>(...tuple: T): T {
  return tuple;
}

export type Entry<O, K extends keyof O> = readonly [K, O[K]];

export function typedToEntries<O extends object>(obj: O): Entry<O, keyof O>[] {
  return Object.entries(obj) as unknown as Entry<O, keyof O>[];
}

export function typedFromEntries<O extends object>(
  entries: Entry<O, keyof O>[]
): O {
  return Object.fromEntries(entries) as O;
}

export function mapObject<const O extends object, const N extends object>(
  obj: O,
  mapper: (entry: Entry<O, keyof O>) => Entry<N, keyof N>
): N {
  return typedFromEntries(typedToEntries(obj).map(mapper));
}

const bvhPartsRegex = /^(?<name>[\w\s]+)(?<data>[^a-z|]+) \|\|$/;
export function bvhToParts(bvh: string): { name: string; data: string } | null {
  const match = bvhPartsRegex.exec(bvh);
  return match?.groups?.name != null && match?.groups?.data != null
    ? { name: match.groups.name, data: match.groups.data }
    : null;
}
