export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type CardKind = 'number' | 'draw2' | 'skip' | 'reverse' | 'wild' | 'wildDraw4';
export type Direction = 1 | -1;
export type NetworkStatus = 'connected' | 'reconnecting' | 'disconnected' | 'local';

export interface Card {
  id: string;
  color: CardColor;
  kind: CardKind;
  value?: number;
  imagePath?: string;
}

export interface Player {
  id: string;
  name: string;
  ready: boolean;
  connected: boolean;
  handCount: number;
  drewThisTurn?: boolean;
}

export interface PlayerPrivateState {
  playerId: string;
  hand: Card[];
  drewThisTurn: boolean;
}

export interface TurnState {
  activePlayerId: string;
  direction: Direction;
  startedAt: number;
  durationMs: number;
}

export interface PublicGameState {
  roomCode: string;
  phase: 'lobby' | 'playing' | 'game-over';
  players: Player[];
  discardTop?: Card;
  deckCount: number;
  turn?: TurnState;
  winnerId?: string;
  eventMessage: string;
  lastEventId: string;
}

export interface GameState extends PublicGameState {
  deck: Card[];
  discard: Card[];
  hands: Record<string, Card[]>;
}

export interface JoinRoomEvent {
  type: 'JOIN_ROOM';
  roomCode: string;
  playerId: string;
  name: string;
}

export interface PlayerReadyEvent {
  type: 'PLAYER_READY';
  roomCode: string;
  playerId: string;
  ready: boolean;
}

export interface StartGameEvent {
  type: 'START_GAME';
  roomCode: string;
}

export interface PlayCardEvent {
  type: 'PLAY_CARD';
  roomCode: string;
  playerId: string;
  cardId: string;
  chosenColor?: Exclude<CardColor, 'wild'>;
  clientActionId: string;
}

export interface DrawCardEvent {
  type: 'DRAW_CARD';
  roomCode: string;
  playerId: string;
  clientActionId: string;
}

export interface PassTurnEvent {
  type: 'PASS_TURN';
  roomCode: string;
  playerId: string;
  clientActionId: string;
}

export interface TimerSyncEvent {
  type: 'TIMER_SYNC';
  roomCode: string;
  remainingMs: number;
  activePlayerId?: string;
}

export interface GameStatePatchEvent {
  type: 'GAME_STATE_PATCH';
  roomCode: string;
  publicState: PublicGameState;
  privateStates?: PlayerPrivateState[];
  acceptedActionId?: string;
  rejectedActionId?: string;
  reason?: string;
}

export interface GameOverEvent {
  type: 'GAME_OVER';
  roomCode: string;
  publicState: PublicGameState;
}

export type GameEvent =
  | JoinRoomEvent
  | PlayerReadyEvent
  | StartGameEvent
  | PlayCardEvent
  | DrawCardEvent
  | PassTurnEvent
  | TimerSyncEvent
  | GameStatePatchEvent
  | GameOverEvent;
