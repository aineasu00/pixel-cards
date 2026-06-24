import type { Card, CardColor, GameState, Player } from './types';
import { shuffle } from './deck';

export const TURN_DURATION_MS = 50_000;
export const MAX_PLAYERS = 9;

export function cardLabel(card?: Card): string {
  if (!card) return '';
  if (card.kind === 'number') return `${card.value}`;
  if (card.kind === 'draw2') return '+2';
  if (card.kind === 'skip') return 'skip';
  if (card.kind === 'reverse') return 'reverse';
  return 'wild';
}

export function colorLabel(color: CardColor): string {
  return ({ red: 'rouge', blue: 'bleu', green: 'vert', yellow: 'jaune', wild: 'joker' })[color];
}

export function isPlayable(card: Card, top?: Card): boolean {
  if (!top) return true;
  if (card.kind === 'wild') return true;
  if (card.color === top.color) return true;
  if (card.kind === top.kind && card.kind !== 'number') return true;
  return card.kind === 'number' && top.kind === 'number' && card.value === top.value;
}

export function playableCards(hand: Card[], top?: Card): Card[] {
  return hand.filter((card) => isPlayable(card, top));
}

export function nextPlayerIndex(players: Player[], currentIndex: number, direction: 1 | -1, steps = 1): number {
  const count = players.length;
  return (currentIndex + direction * steps + count * 4) % count;
}

export function drawOne(state: GameState): Card | undefined {
  if (state.deck.length === 0 && state.discard.length > 1) {
    const top = state.discard[state.discard.length - 1];
    state.deck = shuffle(state.discard.slice(0, -1));
    state.discard = [top];
  }
  return state.deck.pop();
}

export function publicState(state: GameState) {
  return {
    roomCode: state.roomCode,
    phase: state.phase,
    players: state.players.map((player) => ({
      ...player,
      handCount: state.hands[player.id]?.length ?? player.handCount,
    })),
    discardTop: state.discard[state.discard.length - 1],
    deckCount: state.deck.length,
    turn: state.turn,
    winnerId: state.winnerId,
    eventMessage: state.eventMessage,
    lastEventId: state.lastEventId,
  };
}
