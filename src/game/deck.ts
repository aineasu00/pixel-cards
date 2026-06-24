import type { Card, CardColor } from './types';

const colors: Exclude<CardColor, 'wild'>[] = ['red', 'blue', 'green', 'yellow'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const color of colors) {
    for (let value = 0; value <= 9; value += 1) {
      deck.push({ id: `${color}-${value}-a`, color, kind: 'number', value });
      if (value !== 0) deck.push({ id: `${color}-${value}-b`, color, kind: 'number', value });
    }
    for (const suffix of ['a', 'b']) {
      deck.push({ id: `${color}-draw2-${suffix}`, color, kind: 'draw2' });
      deck.push({ id: `${color}-skip-${suffix}`, color, kind: 'skip' });
      deck.push({ id: `${color}-reverse-${suffix}`, color, kind: 'reverse' });
    }
  }
  for (let i = 0; i < 4; i += 1) {
    deck.push({ id: `wild-${i}`, color: 'wild', kind: 'wild' });
  }
  return shuffle(deck);
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
