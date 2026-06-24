import QRCode from 'qrcode';
import { cardLabel, colorLabel } from '../game/rules';
import type { NetworkStatus, PublicGameState } from '../game/types';

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

  const start = app.querySelector<HTMLButtonElement>('[data-action="start"]');
  start?.addEventListener('click', options.onStart);
  const restart = app.querySelector<HTMLButtonElement>('[data-action="new-game"]');
  restart?.addEventListener('click', options.onNewGame);

  const canvas = app.querySelector<HTMLCanvasElement>('#qr');
  if (canvas) await QRCode.toCanvas(canvas, joinUrl, { width: 232, margin: 1, color: { dark: '#050505', light: '#f4e9d0' } });
}

function lobbyMarkup(state: PublicGameState, network: NetworkStatus): string {
  const canStart = state.players.length >= 2;
  return `
    <main class="shell lobby-shell">
      <section class="hero-panel">
        <div class="brand-row">
          <img src="./assets/mascot.png" class="mascot-mini" alt="Mascotte Pixel Cards" />
          <div>
            <p class="eyebrow">Pixel Cards</p>
            <h1>Table ${state.roomCode}</h1>
          </div>
          ${networkBadge(network)}
        </div>
        <div class="join-grid">
          <div class="room-card">
            <p class="label">Code room</p>
            <strong>${state.roomCode}</strong>
            <span>Scanne le QR ou ouvre le lien joueur.</span>
          </div>
          <div class="qr-card">
            <canvas id="qr" width="232" height="232"></canvas>
          </div>
        </div>
        <button class="primary-btn" data-action="start" ${canStart ? '' : 'disabled'}>Lancer la partie</button>
      </section>
      <section class="players-panel">
        <div class="panel-head">
          <h2>Joueurs</h2>
          <span>${state.players.length}/9</span>
        </div>
        <div class="player-list">
          ${state.players.map((player, index) => `
            <div class="player-row">
              <span class="avatar">${index + 1}</span>
              <strong>${escapeHtml(player.name)}</strong>
              <small>${player.ready ? 'prêt' : 'non prêt'} · ${player.connected ? 'connecté' : 'hors ligne'}</small>
            </div>
          `).join('') || '<p class="empty">En attente des téléphones.</p>'}
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
      <header class="table-topbar">
        <div>
          <p class="eyebrow">Room ${state.roomCode}</p>
          <h1>${state.phase === 'game-over' ? `Victoire de ${escapeHtml(winner?.name ?? 'joueur')}` : `Tour de ${escapeHtml(active?.name ?? '-')}`}</h1>
        </div>
        <div class="timer" data-timer>${state.phase === 'playing' ? '50' : '00'}</div>
        <div class="topbar-actions">
          ${networkBadge(network)}
          <button class="ghost-btn" data-action="new-game">Nouvelle partie</button>
        </div>
      </header>
      <section class="felt">
        <img src="./assets/mascot.png" class="mascot-watermark" alt="" />
        <div class="hands-ring">
          ${state.players.map((player, index) => playerSeat(player.name, player.handCount, player.id === state.turn?.activePlayerId, index, state.players.length)).join('')}
        </div>
        <div class="center-stack">
          <div class="deck pile">
            <span>Pioche</span>
            <strong>${state.deckCount}</strong>
          </div>
          ${cardMarkup(state.discardTop)}
          <div class="direction">${state.turn?.direction === -1 ? 'Anti-horaire' : 'Horaire'}</div>
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
      <div class="back-cards">${Array.from({ length: Math.min(count, 7) }, (_, i) => `<span style="--i:${i}"></span>`).join('')}</div>
      <small>${count} carte${count > 1 ? 's' : ''}</small>
    </div>
  `;
}

function cardMarkup(card?: PublicGameState['discardTop']): string {
  if (!card) return '<div class="play-card neutral"><strong>-</strong></div>';
  return `
    <div class="play-card ${card.color}">
      <span>${colorLabel(card.color)}</span>
      <strong>${cardLabel(card)}</strong>
    </div>
  `;
}

export function updateTimer(publicState: PublicGameState): void {
  const timer = document.querySelector<HTMLElement>('[data-timer]');
  if (!timer || publicState.phase !== 'playing' || !publicState.turn) return;
  const remaining = Math.max(0, publicState.turn.durationMs - (Date.now() - publicState.turn.startedAt));
  timer.textContent = String(Math.ceil(remaining / 1000)).padStart(2, '0');
  timer.classList.toggle('danger', remaining < 10_000);
}

function networkBadge(status: NetworkStatus): string {
  const label = status === 'connected' ? 'connecté' : status === 'local' ? 'demo local' : status === 'reconnecting' ? 'reconnexion' : 'déconnecté';
  return `<span class="net ${status}"><i></i>${label}</span>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char] ?? char);
}
