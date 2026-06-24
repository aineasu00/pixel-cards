import './styles/global.css';
import './styles/table.css';
import { connectRoom } from './game/realtime';
import { createInitialState, createRoomCode, addOrUpdatePlayer, setReady, startGame, getPublicState, privateStates, playCard, drawCardForPlayer, passTurn, handleTimeout } from './game/room';
import type { GameEvent, GameState, NetworkStatus } from './game/types';
import { renderTable, updateTimer } from './ui/renderTable';
import { pulse } from './ui/animations';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App root missing');
const appRoot: HTMLElement = app;

let state: GameState = createInitialState(localStorage.getItem('pixel-cards-room') ?? createRoomCode());
localStorage.setItem('pixel-cards-room', state.roomCode);
let room = connectRoom(state.roomCode);
let network: NetworkStatus = room.status;
let timerInterval = 0;
let renderVersion = 0;

room.onStatus((status) => {
  network = status;
  scheduleRender();
});

room.onEvent((event) => {
  if (event.roomCode !== state.roomCode) return;
  handleEvent(event);
});

function handleEvent(event: GameEvent): void {
  if (event.type === 'JOIN_ROOM') {
    addOrUpdatePlayer(state, event.playerId, event.name);
    broadcastState();
  }
  if (event.type === 'PLAYER_READY') {
    setReady(state, event.playerId, event.ready);
    broadcastState();
  }
  if (event.type === 'PLAY_CARD') {
    const result = playCard(state, event.playerId, event.cardId, event.chosenColor);
    broadcastState(event.clientActionId, result.ok ? undefined : result.reason);
  }
  if (event.type === 'DRAW_CARD') {
    const result = drawCardForPlayer(state, event.playerId);
    broadcastState(event.clientActionId, result.ok ? undefined : result.reason);
  }
  if (event.type === 'PASS_TURN') {
    const result = passTurn(state, event.playerId);
    broadcastState(event.clientActionId, result.ok ? undefined : result.reason);
  }
}

function broadcastState(actionId?: string, rejectionReason?: string): void {
  const publicState = getPublicState(state);
  room.send({
    type: 'GAME_STATE_PATCH',
    roomCode: state.roomCode,
    publicState,
    privateStates: privateStates(state),
    acceptedActionId: rejectionReason ? undefined : actionId,
    rejectedActionId: rejectionReason ? actionId : undefined,
    reason: rejectionReason,
  });
  scheduleRender();
}

function scheduleRender(): void {
  const version = ++renderVersion;
  window.requestAnimationFrame(() => {
    if (version !== renderVersion) return;
    render();
  });
}

async function render(): Promise<void> {
  const publicState = getPublicState(state);
  await renderTable({
    app: appRoot,
    state: publicState,
    joinUrl: new URL(`./player.html?room=${state.roomCode}`, window.location.href).toString(),
    network,
    onStart: () => {
      if (startGame(state)) {
        broadcastState();
        ensureTimer();
        pulse('.play-card');
      }
    },
    onNewGame: () => {
      state = createInitialState(createRoomCode());
      localStorage.setItem('pixel-cards-room', state.roomCode);
      room.close();
      room = connectRoom(state.roomCode);
      room.onStatus((status) => {
        network = status;
        scheduleRender();
      });
      room.onEvent((event) => {
        if (event.roomCode === state.roomCode) handleEvent(event);
      });
      scheduleRender();
    },
  });
  updateTimer(publicState);
  ensureTimer();
}

function ensureTimer(): void {
  window.clearInterval(timerInterval);
  timerInterval = window.setInterval(() => {
    const publicState = getPublicState(state);
    updateTimer(publicState);
    if (state.phase === 'playing' && state.turn && Date.now() - state.turn.startedAt >= state.turn.durationMs) {
      handleTimeout(state);
      broadcastState();
    }
  }, 250);
}

scheduleRender();
