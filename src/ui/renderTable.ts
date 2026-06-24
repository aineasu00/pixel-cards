import QRCode from 'qrcode';
import { cardLabel, colorLabel } from '../game/rules';
import type { Card, NetworkStatus, PublicGameState } from '../game/types';

export interface TableRenderOptions {
  app: HTMLElement;
  state: PublicGameState;
  joinUrl: string;
  network: NetworkStatus;
  onStart: () => void;
  onNewGame: () => void;
}

export async function renderTable(options: TableRenderOptions): Promise<void> {
  const { app, state, joinUrl, network } = options;
  app.innerHTML = state.phase === 'lobby' ? lobbyMarkup(state, network) : tableMarkup(state, network);

  app.querySelector<HTMLButtonElement>('[data-action="start"]')?.addEventListener('click', options.onStart);
  app.querySelector<HTMLButtonElement>('[data-action="new-game"]')?.addEventListener('click', options.onNewGame);

  const canvas = app.querySelector<HTMLCanvasElement>('#qr');
  if (canvas) await QRCode.toCanvas(canvas, joinUrl, { width: 236, margin: 1, color: { dark: '#0b0d11', light: '#f5f1e6' } });
}

function lobbyMarkup(state: PublicGameState, network: NetworkStatus): string {
  const canStart = state.players.length >= 2;
  return `
    <main class="shell lobby-shell">
      <section class="hero-panel panel-rise">
        <div class="hero-light"></div>
        <div class="brand-row">
          <img src="./assets/mascot.png" class="mascot-lobby" alt="Mascotte Pixel Card" />
          <div>
            <p class="eyebrow">Arcade lounge</p>
            <h1>Pixel Card</h1>
            <p class="subtitle">Jeu social premium · 50 sec / tour</p>
          </div>
          ${networkBadge(network)}
        </div>
        <div class="join-grid">
          <div class="room-card">
            <p class="label">Salle</p>
            <strong>${state.roomCode}</strong>
            <span>Scannez pour rejoindre</span>
          </div>
          <div class="qr-card">
            <p class="label">QR joueur</p>
            <canvas id="qr" width="236" height="236"></canvas>
          </div>
        </div>
        <div class="lobby-actions">
          <button class="primary-btn" data-action="start" ${canStart ? '' : 'disabled'}>Lancer la partie</button>
          <span>2 joueurs minimum · 9 max</span>
        </div>
      </section>
      <section class="players-panel panel-rise">
        <div class="panel-head">
          <h2>Joueurs</h2>
          <span>${state.players.length}/9</span>
        </div>
        <div class="player-list">
          ${state.players.map((player, index) => `
            <div class="player-row ${player.ready ? 'ready' : ''}">
              <span class="avatar">${index + 1}</span>
              <strong>${escapeHtml(player.name)}</strong>
              <small>${player.ready ? 'pret' : 'en attente'} · ${player.connected ? 'connecte' : 'hors ligne'}</small>
            </div>
          `).join('') || '<p class="empty">En attente des joueurs.</p>'}
        </div>
      </section>
    </main>
  `;
}

function tableMarkup(state: PublicGameState, network: NetworkStatus): string {
  const active = state.players.find((player) => player.id === state.turn?.activePlayerId);
  const winner = state.players.find((player) => player.id === state.winnerId);
  return `
    <main class="table-shell">
      <header class="table-topbar panel-rise">
        <div class="table-title">
          <p class="eyebrow">Salle ${state.roomCode}</p>
          <h1>${state.phase === 'game-over' ? `Victoire ${escapeHtml(winner?.name ?? 'joueur')}` : `Tour ${escapeHtml(active?.name ?? '-')}`}</h1>
        </div>
        ${timerMarkup(state)}
        <div class="topbar-actions">
          ${networkBadge(network)}
          <button class="ghost-btn" data-action="new-game">Nouvelle partie</button>
        </div>
      </header>
      <section class="felt">
        <img src="./assets/mascot.png" class="mascot-watermark" alt="" />
        <div class="felt-lines"></div>
        <div class="hands-ring">
          ${state.players.map((player, index) => playerSeat(player.name, player.handCount, player.id === state.turn?.activePlayerId, index, state.players.length)).join('')}
        </div>
        <div class="center-stack">
          <div class="deck pile">
            <span class="pixel-mark">PC</span>
            <span>Pioche</span>
            <strong>${state.deckCount}</strong>
          </div>
          ${cardMarkup(state.discardTop)}
          <div class="direction">
            <span>Direction</span>
            <strong>${state.turn?.direction === -1 ? 'Anti-horaire' : 'Horaire'}</strong>
          </div>
        </div>
        <div class="event-line">${escapeHtml(state.eventMessage)}</div>
      </section>
    </main>
  `;
}

function playerSeat(name: string, count: number, active: boolean, index: number, total: number): string {
  const angle = -90 + (360 / Math.max(total, 1)) * index;
  return `
    <div class="seat ${active ? 'active' : ''}" style="--angle:${angle}deg">
      <strong>${escapeHtml(name)}</strong>
      <div class="back-cards">${Array.from({ length: Math.min(count, 7) }, (_, i) => `<span class="card-back" style="--i:${i}"></span>`).join('')}</div>
      <small>${count} carte${count > 1 ? 's' : ''}</small>
    </div>
  `;
}

function cardMarkup(card?: PublicGameState['discardTop']): string {
  if (!card) return '<div class="play-card neutral"><span>Defausse</span><strong>-</strong></div>';
  return `
    <div class="play-card ${card.color} ${card.kind}">
      <i>${cardCorner(card)}</i>
      <span>${colorLabel(card.color)}</span>
      <strong>${cardLabel(card)}</strong>
      <small>${actionName(card)}</small>
    </div>
  `;
}

function timerMarkup(state: PublicGameState): string {
  const value = state.phase === 'playing' ? '00:50' : '00:00';
  return `
    <div class="timer-ring" data-timer-wrap style="--progress:100%">
      <div class="timer-core">
        <span class="timer" data-timer>${value}</span>
        <small>secondes</small>
      </div>
    </div>
  `;
}

export function updateTimer(publicState: PublicGameState): void {
  const timer = document.querySelector<HTMLElement>('[data-timer]');
  const wrap = document.querySelector<HTMLElement>('[data-timer-wrap]');
  if (!timer || publicState.phase !== 'playing' || !publicState.turn) return;
  const remaining = Math.max(0, publicState.turn.durationMs - (Date.now() - publicState.turn.startedAt));
  const seconds = Math.ceil(remaining / 1000);
  timer.textContent = `00:${String(seconds).padStart(2, '0')}`;
  const progress = Math.max(0, Math.min(100, (remaining / publicState.turn.durationMs) * 100));
  wrap?.style.setProperty('--progress', `${progress}%`);
  wrap?.classList.toggle('warning', remaining < 15_000);
  wrap?.classList.toggle('danger', remaining < 5_000);
}

function networkBadge(status: NetworkStatus): string {
  const label = status === 'connected' ? 'connecte' : status === 'local' ? 'demo local' : status === 'reconnecting' ? 'reconnexion' : 'deconnecte';
  return `<span class="net ${status}"><i></i>${label}</span>`;
}

function cardCorner(card: Card): string {
  if (card.kind === 'draw2') return '+2';
  if (card.kind === 'skip') return 'STOP';
  if (card.kind === 'reverse') return 'REV';
  if (card.kind === 'wild') return 'PC';
  return String(card.value ?? '');
}

function actionName(card: Card): string {
  if (card.kind === 'draw2') return 'Pioche 2';
  if (card.kind === 'skip') return 'Passer';
  if (card.kind === 'reverse') return 'Inverser';
  if (card.kind === 'wild') return 'Au choix';
  return 'Nombre';
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char] ?? char);
}
