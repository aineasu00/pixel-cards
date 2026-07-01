import QRCode from 'qrcode';
import { getCardAlt, getCardBackAlt, getCardBackImagePath, getCardImagePath } from '../game/cardAssets';
import { colorLabel } from '../game/rules';
import type { Card, NetworkStatus, PublicGameState } from '../game/types';

const mascot = {
  lobby: './assets/mascot/mascot-waving.png',
  watermark: './assets/mascot/mascot-pointing.png',
  victory: './assets/mascot/mascot-victory.png',
};

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
          <img src="${mascot.lobby}" class="mascot mascot--lobby" alt="Mascotte Pixel Card" />
          <div>
            <p class="eyebrow">Arcade lounge</p>
            <h1>Pixel Card</h1>
            <p class="subtitle">Jeu social premium - 50 sec / tour</p>
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
          <span>${canStart ? 'Pret a jouer - 9 max' : 'En attente de 2 joueurs minimum'}</span>
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
              <small>${player.ready ? 'pret' : 'en attente'} - ${player.connected ? 'connecte' : 'hors ligne'}</small>
            </div>
          `).join('') || '<div class="empty-state"><span class="pixel-mark">PC</span><p>Scannez le QR code pour rejoindre la partie.</p></div>'}
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
        ${timerMarkup(state, active?.name ?? '-')}
        <div class="topbar-actions">
          ${networkBadge(network)}
          <button class="ghost-btn" data-action="new-game">Nouvelle partie</button>
        </div>
      </header>
      <section class="felt">
        <img src="${state.phase === 'game-over' ? mascot.victory : mascot.watermark}" class="mascot mascot--watermark ${state.phase === 'game-over' ? 'mascot--victory' : ''}" alt="" />
        <div class="felt-lines"></div>
        <div class="hands-ring">
          ${state.players.map((player, index) => playerSeat(player.name, player.handCount, player.id === state.turn?.activePlayerId, index, state.players.length)).join('')}
        </div>
        <div class="center-stack">
          <div class="deck pile">
            <img class="game-card game-card--back pile__image" src="${getCardBackImagePath()}" alt="${getCardBackAlt()}" draggable="false" />
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
      <div class="back-cards">${Array.from({ length: Math.min(count, 7) }, (_, i) => `<img class="game-card game-card--back card-back" src="${getCardBackImagePath()}" alt="${getCardBackAlt()}" draggable="false" style="--i:${i}" />`).join('')}</div>
      <small>${count} carte${count > 1 ? 's' : ''}</small>
    </div>
  `;
}

function cardMarkup(card?: PublicGameState['discardTop']): string {
  if (!card) return '<div class="discard-slot"><span>Defausse</span><strong>-</strong></div>';
  return `
    <figure class="discard-card">
      <img class="game-card game-card--image play-card" src="${getCardImagePath(card)}" alt="${getCardAlt(card)}" draggable="false" />
      ${activeColorMarkup(card)}
    </figure>
  `;
}

function timerMarkup(state: PublicGameState, activeName: string): string {
  const value = state.phase === 'playing' ? '50' : '0';
  return `
    <div class="timer timer--normal" data-timer-wrap style="--timer-progress:360deg; --progress:100%">
      <div class="timer__player">${escapeHtml(activeName)}</div>
      <div class="timer__ring">
        <div class="timer__core">
          <span class="timer__value" data-timer>${value}</span>
          <small class="timer__label">secondes</small>
        </div>
      </div>
      <div class="timer__status">Tour en cours</div>
      <div class="timer__bar"><span></span></div>
    </div>
  `;
}

export function updateTimer(publicState: PublicGameState): void {
  const value = document.querySelector<HTMLElement>('[data-timer]');
  const timer = document.querySelector<HTMLElement>('[data-timer-wrap]');
  if (!value || !timer || publicState.phase !== 'playing' || !publicState.turn) return;
  const remaining = Math.max(0, publicState.turn.durationMs - (Date.now() - publicState.turn.startedAt));
  const seconds = Math.ceil(remaining / 1000);
  const progress = Math.max(0, Math.min(100, (remaining / publicState.turn.durationMs) * 100));
  value.textContent = String(seconds);
  timer.style.setProperty('--progress', `${progress}%`);
  timer.style.setProperty('--timer-progress', `${progress * 3.6}deg`);
  timer.classList.toggle('timer--normal', remaining >= 15_000);
  timer.classList.toggle('timer--warning', remaining < 15_000 && remaining >= 5_000);
  timer.classList.toggle('timer--danger', remaining < 5_000 && remaining > 0);
  timer.classList.toggle('timer--expired', remaining === 0);
  const status = timer.querySelector<HTMLElement>('.timer__status');
  if (status) status.textContent = remaining === 0 ? 'Temps ecoule' : remaining < 5_000 ? 'Derniere chance' : remaining < 15_000 ? 'Attention' : 'Tour en cours';
}

function networkBadge(status: NetworkStatus): string {
  const label = status === 'connected' ? 'connecte' : status === 'local' ? 'demo local' : status === 'reconnecting' ? 'reconnexion' : 'deconnecte';
  return `<span class="net ${status}"><i></i>${label}</span>`;
}

function activeColorMarkup(card: Card): string {
  if (card.kind !== 'wild' && card.kind !== 'wildDraw4') return '';
  return `<figcaption class="active-color">Couleur active : <strong>${colorLabel(card.color)}</strong></figcaption>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char] ?? char);
}
