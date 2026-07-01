import { getCardAlt, getCardImagePath } from '../game/cardAssets';
import { cardLabel, colorLabel, playableCards } from '../game/rules';
import type { Card, CardColor, NetworkStatus, PlayerPrivateState, PublicGameState } from '../game/types';

const mascot = {
  lobby: './assets/mascot/mascot-waving.png',
  phone: './assets/mascot/mascot-small.png',
  waiting: './assets/mascot/mascot-idle.png',
  victory: './assets/mascot/mascot-victory.png',
};

export interface PlayerRenderOptions {
  app: HTMLElement;
  roomCode: string;
  playerId: string;
  name: string;
  state?: PublicGameState;
  privateState?: PlayerPrivateState;
  network: NetworkStatus;
  pendingCardId?: string;
  error?: string;
  onJoin: (name: string) => void;
  onReady: () => void;
  onPlay: (card: Card, color?: Exclude<CardColor, 'wild'>) => void;
  onDraw: () => void;
  onPass: () => void;
}

export function renderPlayer(options: PlayerRenderOptions): void {
  const { app, state } = options;
  if (!options.name || !state || state.phase === 'lobby') {
    app.innerHTML = !options.name ? joinMarkup(options) : lobbyMarkup(options);
  } else {
    app.innerHTML = handMarkup(options);
  }
  bind(options);
}

function bind(options: PlayerRenderOptions): void {
  const form = options.app.querySelector<HTMLFormElement>('[data-join-form]');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = form.querySelector<HTMLInputElement>('input[name="name"]');
    const name = input?.value.trim() ?? '';
    if (name) options.onJoin(name);
  });
  options.app.querySelector<HTMLButtonElement>('[data-action="ready"]')?.addEventListener('click', options.onReady);
  options.app.querySelector<HTMLButtonElement>('[data-action="draw"]')?.addEventListener('click', options.onDraw);
  options.app.querySelector<HTMLButtonElement>('[data-action="pass"]')?.addEventListener('click', options.onPass);
  options.app.querySelectorAll<HTMLButtonElement>('[data-card-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const card = options.privateState?.hand.find((item) => item.id === button.dataset.cardId);
      if (!card) return;
      const color = card.kind === 'wild' || card.kind === 'wildDraw4' ? normalizeChosenColor(options.app.querySelector<HTMLSelectElement>('[data-color-choice]')?.value) : undefined;
      options.onPlay(card, color);
    });
  });
}

function joinMarkup(options: PlayerRenderOptions): string {
  return `
    <main class="phone-shell join-phone">
      <img src="${mascot.lobby}" class="mascot mascot--phone mascot-badge" alt="Mascotte Pixel Card" />
      <p class="eyebrow">Salle ${options.roomCode}</p>
      <h1>Pixel Card</h1>
      <p class="phone-subtitle">Entre ton pseudo pour rejoindre la table.</p>
      <form data-join-form class="join-form">
        <input name="name" maxlength="18" autocomplete="nickname" placeholder="Ton pseudo" required />
        <button class="primary-btn" type="submit">Rejoindre</button>
      </form>
      ${networkBadge(options.network)}
    </main>
  `;
}

function lobbyMarkup(options: PlayerRenderOptions): string {
  const current = options.state?.players.find((player) => player.id === options.playerId);
  return `
    <main class="phone-shell">
      <header class="phone-header">
        <div>
          <p class="eyebrow">Salle ${options.roomCode}</p>
          <h1>${escapeHtml(options.name)}</h1>
        </div>
        <img src="${mascot.phone}" class="mascot mascot--phone phone-mascot" alt="" />
        ${networkBadge(options.network)}
      </header>
      <section class="status-card panel-rise">
        <strong>${current?.ready ? 'Pret' : 'En attente'}</strong>
        <span>${options.state?.players.length ?? 0}/9 joueurs connectes</span>
      </section>
      <button class="primary-btn" data-action="ready">${current?.ready ? 'Annuler pret' : 'Je suis pret'}</button>
      <p class="hint">La partie demarre depuis la tablette.</p>
    </main>
  `;
}

function handMarkup(options: PlayerRenderOptions): string {
  const state = options.state;
  const privateState = options.privateState;
  if (!state || !privateState) return '';
  const active = state.players.find((player) => player.id === state.turn?.activePlayerId);
  const isTurn = state.turn?.activePlayerId === options.playerId;
  const playable = new Set(playableCards(privateState.hand, state.discardTop).map((card) => card.id));
  const canDraw = isTurn && playable.size === 0;
  const canPass = isTurn && (privateState.drewThisTurn || playable.size === 0);
  const winner = state.players.find((player) => player.id === state.winnerId);
  return `
    <main class="phone-shell game-phone">
      <header class="phone-header">
        <div>
          <p class="eyebrow">${state.phase === 'game-over' ? 'Partie terminee' : isTurn ? "C'est ton tour" : `Tour de ${escapeHtml(active?.name ?? '-')}`}</p>
          <h1>${state.phase === 'game-over' ? `${escapeHtml(winner?.name ?? 'Joueur')} gagne` : escapeHtml(options.name)}</h1>
        </div>
        ${networkBadge(options.network)}
      </header>
      ${state.phase === 'game-over' ? `<div class="phone-waiting victory"><img src="${mascot.victory}" class="mascot mascot--victory" alt="" /><span>Partie terminee</span></div>` : !isTurn ? `<div class="phone-waiting"><img src="${mascot.waiting}" class="mascot mascot--phone" alt="" /><span>En attente de ton tour</span></div>` : ''}
      <section class="phone-center panel-rise ${isTurn ? 'is-turn' : ''}">
        ${miniCard(state.discardTop)}
        <div class="phone-timer-wrap timer--normal" data-phone-timer-wrap style="--progress:100%; --timer-progress:360deg">
          <div class="phone-timer" data-phone-timer>50</div>
          <small>${isTurn ? 'ton tour' : 'attente'}</small>
        </div>
      </section>
      ${options.error ? `<p class="error-line">${escapeHtml(options.error)}</p>` : ''}
      <section class="hand-grid">
        ${privateState.hand.map((card) => cardButton(card, isTurn && playable.has(card.id), options.pendingCardId === card.id)).join('')}
      </section>
      <section class="phone-actions">
        <select data-color-choice aria-label="Couleur joker">
          <option value="blue">Bleu</option>
          <option value="red">Magenta</option>
          <option value="green">Violette</option>
          <option value="yellow">Or</option>
        </select>
        <button class="secondary-btn" data-action="draw" ${canDraw ? '' : 'disabled'}>Piocher</button>
        <button class="ghost-btn" data-action="pass" ${canPass ? '' : 'disabled'}>Passer</button>
      </section>
    </main>
  `;
}

export function updatePhoneTimer(publicState?: PublicGameState): void {
  const value = document.querySelector<HTMLElement>('[data-phone-timer]');
  const timer = document.querySelector<HTMLElement>('[data-phone-timer-wrap]');
  if (!value || !timer || !publicState?.turn || publicState.phase !== 'playing') return;
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
}

function cardButton(card: Card, enabled: boolean, pending: boolean): string {
  return `
    <button class="hand-card ${enabled ? 'playable' : 'disabled'} ${pending ? 'pending' : ''}" data-card-id="${card.id}" aria-label="${getCardAlt(card)}" ${enabled && !pending ? '' : 'disabled'}>
      <img class="game-card game-card--image ${enabled ? 'game-card--playable' : 'game-card--disabled'}" src="${getCardImagePath(card)}" alt="${getCardAlt(card)}" draggable="false" />
      ${enabled ? '<b class="playable-badge">Jouable</b>' : ''}
      ${pending ? '<em>validation...</em>' : ''}
    </button>
  `;
}

function miniCard(card?: Card): string {
  if (!card) return '<div class="mini-card mini-card--empty"><span>Defausse</span><strong>-</strong></div>';
  return `
    <figure class="mini-card">
      <img class="game-card game-card--image" src="${getCardImagePath(card)}" alt="${getCardAlt(card)}" draggable="false" />
      ${activeColorMarkup(card)}
    </figure>
  `;
}

function networkBadge(status: NetworkStatus): string {
  const label = status === 'connected' ? 'connecte' : status === 'local' ? 'demo local' : status === 'reconnecting' ? 'reconnexion' : 'deconnecte';
  return `<span class="net ${status}"><i></i>${label}</span>`;
}

function activeColorMarkup(card: Card): string {
  if (card.kind !== 'wild' && card.kind !== 'wildDraw4') return '';
  return `<figcaption class="active-color active-color--phone">${cardLabel(card)} - couleur active : <strong>${colorLabel(card.color)}</strong></figcaption>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char] ?? char);
}

function normalizeChosenColor(value?: string): Exclude<CardColor, 'wild'> | undefined {
  return value === 'red' || value === 'blue' || value === 'green' || value === 'yellow' ? value : undefined;
}
