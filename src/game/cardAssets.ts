import type { Card, CardColor } from './types';

const CARD_BASE = `${import.meta.env.BASE_URL}assets/cards`;

const visualColorFolder: Record<Exclude<CardColor, 'wild'>, string> = {
  blue: 'blue',
  red: 'red',
  yellow: 'gold',
  green: 'purple',
};

const visualColorLabel: Record<CardColor, string> = {
  blue: 'bleue',
  red: 'magenta',
  yellow: 'or',
  green: 'violette',
  wild: 'au choix',
};

export function getCardImagePath(card: Card): string {
  if (card.imagePath) return withBase(card.imagePath);
  if (card.kind === 'wild') return `${CARD_BASE}/special/wild.png`;
  if (card.kind === 'wildDraw4') return `${CARD_BASE}/special/wild-draw4.png`;
  if (card.color === 'wild') return getCardBackImagePath();

  const folder = visualColorFolder[card.color];
  if (card.kind === 'number') return `${CARD_BASE}/${folder}/${folder}-${card.value}.png`;
  if (card.kind === 'draw2') return `${CARD_BASE}/${folder}/${folder}-draw2.png`;
  if (card.kind === 'reverse') return `${CARD_BASE}/${folder}/${folder}-reverse.png`;
  if (card.kind === 'skip') return `${CARD_BASE}/${folder}/${folder}-skip.png`;

  return getCardBackImagePath();
}

export function getCardBackImagePath(): string {
  return `${CARD_BASE}/special/card-back.png`;
}

export function getCardAlt(card?: Card): string {
  if (!card) return 'Defausse vide';
  if (card.kind === 'wild') return 'Carte au choix';
  if (card.kind === 'wildDraw4') return 'Carte +4';
  if (card.kind === 'number') return `Carte ${visualColorLabel[card.color]} ${card.value}`;
  if (card.kind === 'draw2') return `Carte ${visualColorLabel[card.color]} pioche 2`;
  if (card.kind === 'reverse') return `Carte ${visualColorLabel[card.color]} inverse`;
  if (card.kind === 'skip') return `Carte ${visualColorLabel[card.color]} passe`;
  return 'Carte Pixel Card';
}

export function getCardBackAlt(): string {
  return 'Dos de carte Pixel Card';
}

export function withCardImagePath(card: Card): Card {
  return { ...card, imagePath: getCardImagePath(card) };
}

function withBase(path: string): string {
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path;
  if (path.startsWith(import.meta.env.BASE_URL)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\.?\//, '')}`;
}
