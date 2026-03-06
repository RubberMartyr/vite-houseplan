export function computeOpeningOffsetsFromChain(chain: number[]): number[] {
  const offsets: number[] = [];

  let cursor = 0;

  for (let i = 0; i < chain.length; i++) {
    const segment = chain[i];

    if (i % 2 === 1) {
      const center = cursor + segment / 2;
      offsets.push(center);
    }

    cursor += segment;
  }

  return offsets;
}
