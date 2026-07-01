import './styles/global.css';
import './styles/cards.css';
import './styles/player.css';
import { connectRoom } from './game/realtime';
import type { Card, CardColor, GameEvent, NetworkStatus, PlayerPrivateState, PublicGameState } from './game/types';
import { renderPlayer, updatePhoneTimer } from './ui/renderPlayer';
import { vibrate } from './ui/animations';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App root missing');
const appRoot: HTMLElement = app;

const params = new URLSearchParams(window.location.search);
const roomCode = (params.get('room') ?? localStorage.getItem('pixel-cards-room') ?? 'DEMO').toUpperCase();
const playerId = localStorage.getItem('pixel-cards-player-id') ?? crypto.randomUUID();
localStorage.setItem('pixel-cards-player-id', playerId);
localStorage.setItem('pixel-cards-room', roomCode);

let playerName = localStorage.getItem(`pixel-cards-name-${roomCode}`) ?? '';
let publicState: PublicGameState | undefined;
let privateState: PlayerPrivateState | undefined;
let pendingCardId: string | undefined;
let pendingActionId: string | undefined;
let error = '';
let network: NetworkStatus = 'reconnecting';
let actionLocked = false;

const room = connectRoom(roomCode);
room.onStatus((status) => {
  network = status;
  render();
  if (playerName && status !== 'disconnected') join();
});
room.onEvent((event) => {
  if (event.roomCode !== roomCode) return;
  handleEvent(event);
});

function handleEvent(event: GameEvent): void {
  if (event.type === 'GAME_OVER') {
    publicState = event.publicState;
    pendingActionId = undefined;
    pendingCardId = undefined;
    actionLocked = false;
    render();
    return;
  }
  if (event.type !== 'GAME_STATE_PATCH') return;
  publicState = event.publicState;
  privateState = event.privateStates?.find((item) => item.playerId === playerId) ?? privateState;
  if (pendingActionId && event.acceptedActionId === pendingActionId) {
    pendingActionId = undefined;
    pendingCardId = undefined;
    error = '';
  }
  if (pendingActionId && event.rejectedActionId === pendingActionId) {
    pendingActionId = undefined;
    pendingCardId = undefined;
    error = event.reason ?? 'Action refusée';
  }
  actionLocked = false;
  render();
}

function join(): void {
  room.send({ type: 'JOIN_ROOM', roomCode, playerId, name: playerName });
}

function sendAction(event: GameEvent): void {
  if (actionLocked) return;
  actionLocked = true;
  room.send(event);
  window.setTimeout(() => {
    actionLocked = false;
  }, 450);
}

function render(): void {
  renderPlayer({
    app: appRoot,
    roomCode,
    playerId,
    name: playerName,
    state: publicState,
    privateState,
    network,
    pendingCardId,
    error,
    onJoin: (name) => {
      playerName = name;
      localStorage.setItem(`pixel-cards-name-${roomCode}`, playerName);
      join();
      render();
    },
    onReady: () => {
      const ready = !(publicState?.players.find((player) => player.id === playerId)?.ready);
      sendAction({ type: 'PLAYER_READY', roomCode, playerId, ready });
    },
    onPlay: (card: Card, color?: Exclude<CardColor, 'wild'>) => {
      if (publicState?.turn?.activePlayerId !== playerId || pendingActionId) return;
      pendingActionId = crypto.randomUUID();
      pendingCardId = card.id;
      if (privateState) privateState = { ...privateState, hand: privateState.hand.filter((item) => item.id !== card.id) };
      vibrate();
      sendAction({ type: 'PLAY_CARD', roomCode, playerId, cardId: card.id, chosenColor: color, clientActionId: pendingActionId });
      render();
    },
    onDraw: () => {
      if (publicState?.turn?.activePlayerId !== playerId || pendingActionId) return;
      pendingActionId = crypto.randomUUID();
      sendAction({ type: 'DRAW_CARD', roomCode, playerId, clientActionId: pendingActionId });
    },
    onPass: () => {
      if (publicState?.turn?.activePlayerId !== playerId || pendingActionId) return;
      pendingActionId = crypto.randomUUID();
      sendAction({ type: 'PASS_TURN', roomCode, playerId, clientActionId: pendingActionId });
    },
  });
  updatePhoneTimer(publicState);
}

window.setInterval(() => updatePhoneTimer(publicState), 250);
render();
