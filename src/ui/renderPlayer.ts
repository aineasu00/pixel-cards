import { cardLabel, playableCards } from '../game/rules';
import type { Card, CardColor, NetworkStatus, PlayerPrivateState, PublicGameState } from '../game/types';

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
      const color = card.kind === 'wild' ? normalizeChosenColor(options.app.querySelector<HTMLSelectElement>('[data-color-choice]')?.value) : undefined;
      options.onPlay(card, color);
    });
  });
}

function joinMarkup(options: PlayerRenderOptions): string {
  return `
    <main class="phone-shell join-phone">
      <img src="./assets/mascot.png" class="mascot-badge" alt="Mascotte Pixel Card" />
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
        <img src="./assets/mascot.png" class="phone-mascot" alt="" />
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
      <section class="phone-center panel-rise ${isTurn ? 'is-turn' : ''}">
        ${miniCard(state.discardTop)}
        <div class="phone-timer-wrap" data-phone-timer-wrap style="--progress:100%">
          <div class="phone-timer" data-phone-timer>00:50</div>
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
          <option value="red">Rouge</option>
          <option value="green">Vert</option>
          <option value="yellow">Jaune</option>
        </select>
        <button class="secondary-btn" data-action="draw" ${canDraw ? '' : 'disabled'}>Piocher</button>
        <button class="ghost-btn" data-action="pass" ${canPass ? '' : 'disabled'}>Passer</button>
      </section>
    </main>
  `;
}

export function updatePhoneTimer(publicState?: PublicGameState): void {
  const timer = document.querySelector<HTMLElement>('[data-phone-timer]');
  const wrap = document.querySelector<HTMLElement>('[data-phone-timer-wrap]');
  if (!timer || !publicState?.turn || publicState.phase !== 'playing') return;
  const remaining = Math.max(0, publicState.turn.durationMs - (Date.now() - publicState.turn.startedAt));
  const seconds = Math.ceil(remaining / 1000);
  timer.textContent = `00:${String(seconds).padStart(2, '0')}`;
  const progress = Math.max(0, Math.min(100, (remaining / publicState.turn.durationMs) * 100));
  wrap?.style.setProperty('--progress', `${progress}%`);
  wrap?.classList.toggle('warning', remaining < 15_000);
  wrap?.classList.toggle('danger', remaining < 5_000);
}

function cardButton(card: Card, enabled: boolean, pending: boolean): string {
  return `
    <button class="hand-card ${card.color} ${card.kind} ${enabled ? 'playable' : 'disabled'} ${pending ? 'pending' : ''}" data-card-id="${card.id}" ${enabled && !pending ? '' : 'disabled'}>
      <i>${cardCorner(card)}</i>
      <span>${card.kind === 'wild' ? 'joker' : card.color}</span>
      <strong>${cardLabel(card)}</strong>
      <small>${actionName(card)}</small>
      ${pending ? '<em>validation...</em>' : ''}
    </button>
  `;
}

function miniCard(card?: Card): string {
  if (!card) return '<div class="mini-card neutral"><span>Defausse</span><strong>-</strong></div>';
  return `<div class="mini-card ${card.color} ${card.kind}"><span>Defausse</span><strong>${cardLabel(card)}</strong><small>${actionName(card)}</small></div>`;
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

function normalizeChosenColor(value?: string): Exclude<CardColor, 'wild'> | undefined {
  return value === 'red' || value === 'blue' || value === 'green' || value === 'yellow' ? value : undefined;
}
