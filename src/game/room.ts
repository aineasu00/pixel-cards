import { createDeck } from './deck';
import { drawOne, isPlayable, nextPlayerIndex, playableCards, publicState, TURN_DURATION_MS, colorLabel, cardLabel, MAX_PLAYERS } from './rules';
import type { Card, GameState, Player, PlayerPrivateState, PublicGameState } from './types';

export function createRoomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

export function createInitialState(roomCode = createRoomCode()): GameState {
  return {
    roomCode,
    phase: 'lobby',
    players: [],
    deck: [],
    discard: [],
    hands: {},
    deckCount: 0,
    eventMessage: 'En attente des joueurs',
    lastEventId: crypto.randomUUID(),
  };
}

export function addOrUpdatePlayer(state: GameState, playerId: string, name: string): boolean {
  const existing = state.players.find((player) => player.id === playerId);
  if (existing) {
    existing.name = name;
    existing.connected = true;
    return true;
  }
  if (state.players.length >= MAX_PLAYERS || state.phase !== 'lobby') return false;
  state.players.push({ id: playerId, name: name.slice(0, 18), ready: false, connected: true, handCount: 0 });
  state.hands[playerId] = [];
  state.eventMessage = `${name.slice(0, 18)} rejoint la table`;
  state.lastEventId = crypto.randomUUID();
  return true;
}

export function setReady(state: GameState, playerId: string, ready: boolean): void {
  const player = state.players.find((item) => item.id === playerId);
  if (!player) return;
  player.ready = ready;
  state.eventMessage = `${player.name} est ${ready ? 'prêt' : 'en attente'}`;
  state.lastEventId = crypto.randomUUID();
}

export function startGame(state: GameState): boolean {
  if (state.players.length < 2) return false;
  state.phase = 'playing';
  state.deck = createDeck();
  state.discard = [];
  state.hands = {};
  for (const player of state.players) {
    state.hands[player.id] = [];
    player.drewThisTurn = false;
    for (let i = 0; i < 7; i += 1) {
      const card = drawOne(state);
      if (card) state.hands[player.id].push(card);
    }
    player.handCount = state.hands[player.id].length;
  }
  let firstCard = drawOne(state);
  while (firstCard?.kind === 'wild') {
    state.deck.unshift(firstCard);
    firstCard = drawOne(state);
  }
  if (firstCard) state.discard.push(firstCard);
  state.turn = {
    activePlayerId: state.players[0].id,
    direction: 1,
    startedAt: Date.now(),
    durationMs: TURN_DURATION_MS,
  };
  state.eventMessage = `Partie lancée. Tour de ${state.players[0].name}`;
  state.lastEventId = crypto.randomUUID();
  return true;
}

export function privateStates(state: GameState, playerIds?: string[]): PlayerPrivateState[] {
  const ids = playerIds ?? state.players.map((player) => player.id);
  return ids.map((playerId) => ({
    playerId,
    hand: state.hands[playerId] ?? [],
    drewThisTurn: Boolean(state.players.find((player) => player.id === playerId)?.drewThisTurn),
  }));
}

export function getPublicState(state: GameState): PublicGameState {
  return publicState(state);
}

export function playCard(state: GameState, playerId: string, cardId: string, chosenColor?: Card['color']): { ok: boolean; reason?: string } {
  if (state.phase !== 'playing' || state.turn?.activePlayerId !== playerId) return { ok: false, reason: "Ce n'est pas ton tour" };
  const hand = state.hands[playerId] ?? [];
  const index = hand.findIndex((card) => card.id === cardId);
  if (index < 0) return { ok: false, reason: 'Carte introuvable' };
  const card = hand[index];
  const top = state.discard[state.discard.length - 1];
  if (!isPlayable(card, top)) return { ok: false, reason: 'Carte non jouable' };

  hand.splice(index, 1);
  const played = card.kind === 'wild' ? { ...card, color: normalizeChosenColor(chosenColor) } : card;
  state.discard.push(played);
  const player = state.players.find((item) => item.id === playerId);
  if (player) {
    player.handCount = hand.length;
    player.drewThisTurn = false;
  }
  if (hand.length === 0) {
    state.phase = 'game-over';
    state.winnerId = playerId;
    state.eventMessage = `${player?.name ?? 'Un joueur'} gagne la partie`;
    state.lastEventId = crypto.randomUUID();
    return { ok: true };
  }

  applyActionAndAdvance(state, playerId, played);
  state.eventMessage = `${player?.name ?? 'Joueur'} joue ${cardLabel(played)} ${colorLabel(played.color)}`;
  state.lastEventId = crypto.randomUUID();
  return { ok: true };
}

export function drawCardForPlayer(state: GameState, playerId: string, forced = false): { ok: boolean; reason?: string } {
  if (state.phase !== 'playing' || state.turn?.activePlayerId !== playerId) return { ok: false, reason: "Ce n'est pas ton tour" };
  const player = state.players.find((item) => item.id === playerId);
  if (!player) return { ok: false, reason: 'Joueur inconnu' };
  const hand = state.hands[playerId] ?? [];
  if (!forced && playableCards(hand, state.discard[state.discard.length - 1]).length > 0) {
    return { ok: false, reason: 'Tu as une carte jouable' };
  }
  const card = drawOne(state);
  if (card) hand.push(card);
  player.handCount = hand.length;
  player.drewThisTurn = true;
  state.eventMessage = `${player.name} pioche`;
  state.lastEventId = crypto.randomUUID();
  return { ok: true };
}

export function passTurn(state: GameState, playerId: string, forced = false): { ok: boolean; reason?: string } {
  if (state.phase !== 'playing' || state.turn?.activePlayerId !== playerId) return { ok: false, reason: "Ce n'est pas ton tour" };
  const player = state.players.find((item) => item.id === playerId);
  const hand = state.hands[playerId] ?? [];
  if (!forced && !player?.drewThisTurn && playableCards(hand, state.discard[state.discard.length - 1]).length > 0) {
    return { ok: false, reason: 'Joue une carte ou pioche avant de passer' };
  }
  advanceTurn(state, 1);
  state.eventMessage = forced ? `${player?.name ?? 'Joueur'} pioche automatiquement, tour passé` : 'Tour passé';
  state.lastEventId = crypto.randomUUID();
  return { ok: true };
}

export function handleTimeout(state: GameState): void {
  if (state.phase !== 'playing' || !state.turn) return;
  const active = state.turn.activePlayerId;
  drawCardForPlayer(state, active, true);
  passTurn(state, active, true);
}

function applyActionAndAdvance(state: GameState, playerId: string, card: Card): void {
  const players = state.players;
  const currentIndex = players.findIndex((player) => player.id === playerId);
  if (currentIndex < 0 || !state.turn) return;
  if (card.kind === 'reverse') {
    state.turn.direction = (state.turn.direction * -1) as 1 | -1;
    advanceTurn(state, players.length === 2 ? 2 : 1);
    return;
  }
  if (card.kind === 'skip') {
    advanceTurn(state, 2);
    return;
  }
  if (card.kind === 'draw2') {
    const targetIndex = nextPlayerIndex(players, currentIndex, state.turn.direction, 1);
    const target = players[targetIndex];
    for (let i = 0; i < 2; i += 1) {
      const drawn = drawOne(state);
      if (drawn) state.hands[target.id].push(drawn);
    }
    target.handCount = state.hands[target.id].length;
    advanceTurn(state, 2);
    return;
  }
  advanceTurn(state, 1);
}

function advanceTurn(state: GameState, steps: number): void {
  if (!state.turn) return;
  const currentIndex = state.players.findIndex((player) => player.id === state.turn?.activePlayerId);
  const nextIndex = nextPlayerIndex(state.players, currentIndex, state.turn.direction, steps);
  for (const player of state.players) player.drewThisTurn = false;
  state.turn = {
    ...state.turn,
    activePlayerId: state.players[nextIndex].id,
    startedAt: Date.now(),
  };
}

function normalizeChosenColor(color?: Card['color']): Exclude<Card['color'], 'wild'> {
  return color === 'red' || color === 'blue' || color === 'green' || color === 'yellow' ? color : 'blue';
}
