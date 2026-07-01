import{p as x,h as L,j as A,c as R,a as j,k as q,v as U}from"./animations-CHLj99NH.js";const I={lobby:"./assets/mascot/mascot-waving.png",phone:"./assets/mascot/mascot-small.png",waiting:"./assets/mascot/mascot-idle.png",victory:"./assets/mascot/mascot-victory.png"};function _(e){const{app:a,state:t}=e;!e.name||!t||t.phase==="lobby"?a.innerHTML=e.name?H(e):O(e):a.innerHTML=z(e),J(e)}function J(e){var t,n,s;const a=e.app.querySelector("[data-join-form]");a==null||a.addEventListener("submit",c=>{c.preventDefault();const m=a.querySelector('input[name="name"]'),u=(m==null?void 0:m.value.trim())??"";u&&e.onJoin(u)}),(t=e.app.querySelector('[data-action="ready"]'))==null||t.addEventListener("click",e.onReady),(n=e.app.querySelector('[data-action="draw"]'))==null||n.addEventListener("click",e.onDraw),(s=e.app.querySelector('[data-action="pass"]'))==null||s.addEventListener("click",e.onPass),e.app.querySelectorAll("[data-card-id]").forEach(c=>{c.addEventListener("click",()=>{var g,h;const m=(g=e.privateState)==null?void 0:g.hand.find(l=>l.id===c.dataset.cardId);if(!m)return;const u=m.kind==="wild"||m.kind==="wildDraw4"?G((h=e.app.querySelector("[data-color-choice]"))==null?void 0:h.value):void 0;e.onPlay(m,u)})})}function O(e){return`
    <main class="phone-shell join-phone">
      <img src="${I.lobby}" class="mascot mascot--phone mascot-badge" alt="Mascotte Pixel Card" />
      <p class="eyebrow">Salle ${e.roomCode}</p>
      <h1>Pixel Card</h1>
      <p class="phone-subtitle">Entre ton pseudo pour rejoindre la table.</p>
      <form data-join-form class="join-form">
        <input name="name" maxlength="18" autocomplete="nickname" placeholder="Ton pseudo" required />
        <button class="primary-btn" type="submit">Rejoindre</button>
      </form>
      ${k(e.network)}
    </main>
  `}function H(e){var t,n;const a=(t=e.state)==null?void 0:t.players.find(s=>s.id===e.playerId);return`
    <main class="phone-shell">
      <header class="phone-header">
        <div>
          <p class="eyebrow">Salle ${e.roomCode}</p>
          <h1>${f(e.name)}</h1>
        </div>
        <img src="${I.phone}" class="mascot mascot--phone phone-mascot" alt="" />
        ${k(e.network)}
      </header>
      <section class="status-card panel-rise">
        <strong>${a!=null&&a.ready?"Pret":"En attente"}</strong>
        <span>${((n=e.state)==null?void 0:n.players.length)??0}/9 joueurs connectes</span>
      </section>
      <button class="primary-btn" data-action="ready">${a!=null&&a.ready?"Annuler pret":"Je suis pret"}</button>
      <p class="hint">La partie demarre depuis la tablette.</p>
    </main>
  `}function z(e){var h;const a=e.state,t=e.privateState;if(!a||!t)return"";const n=a.players.find(l=>{var E;return l.id===((E=a.turn)==null?void 0:E.activePlayerId)}),s=((h=a.turn)==null?void 0:h.activePlayerId)===e.playerId,c=new Set(x(t.hand,a.discardTop).map(l=>l.id)),m=s&&c.size===0,u=s&&(t.drewThisTurn||c.size===0),g=a.players.find(l=>l.id===a.winnerId);return`
    <main class="phone-shell game-phone">
      <header class="phone-header">
        <div>
          <p class="eyebrow">${a.phase==="game-over"?"Partie terminee":s?"C'est ton tour":`Tour de ${f((n==null?void 0:n.name)??"-")}`}</p>
          <h1>${a.phase==="game-over"?`${f((g==null?void 0:g.name)??"Joueur")} gagne`:f(e.name)}</h1>
        </div>
        ${k(e.network)}
      </header>
      ${a.phase==="game-over"?`<div class="phone-waiting victory"><img src="${I.victory}" class="mascot mascot--victory" alt="" /><span>Partie terminee</span></div>`:s?"":`<div class="phone-waiting"><img src="${I.waiting}" class="mascot mascot--phone" alt="" /><span>En attente de ton tour</span></div>`}
      <section class="phone-center panel-rise ${s?"is-turn":""}">
        ${N(a.discardTop)}
        <div class="phone-timer-wrap timer--normal" data-phone-timer-wrap style="--progress:100%; --timer-progress:360deg">
          <div class="phone-timer" data-phone-timer>50</div>
          <small>${s?"ton tour":"attente"}</small>
        </div>
      </section>
      ${e.error?`<p class="error-line">${f(e.error)}</p>`:""}
      <section class="hand-grid">
        ${t.hand.map(l=>B(l,s&&c.has(l.id),e.pendingCardId===l.id)).join("")}
      </section>
      <section class="phone-actions">
        <select data-color-choice aria-label="Couleur joker">
          <option value="blue">Bleu</option>
          <option value="red">Magenta</option>
          <option value="green">Violette</option>
          <option value="yellow">Or</option>
        </select>
        <button class="secondary-btn" data-action="draw" ${m?"":"disabled"}>Piocher</button>
        <button class="ghost-btn" data-action="pass" ${u?"":"disabled"}>Passer</button>
      </section>
    </main>
  `}function M(e){const a=document.querySelector("[data-phone-timer]"),t=document.querySelector("[data-phone-timer-wrap]");if(!a||!t||!(e!=null&&e.turn)||e.phase!=="playing")return;const n=Math.max(0,e.turn.durationMs-(Date.now()-e.turn.startedAt)),s=Math.ceil(n/1e3),c=Math.max(0,Math.min(100,n/e.turn.durationMs*100));a.textContent=String(s),t.style.setProperty("--progress",`${c}%`),t.style.setProperty("--timer-progress",`${c*3.6}deg`),t.classList.toggle("timer--normal",n>=15e3),t.classList.toggle("timer--warning",n<15e3&&n>=5e3),t.classList.toggle("timer--danger",n<5e3&&n>0),t.classList.toggle("timer--expired",n===0)}function B(e,a,t){return`
    <button class="hand-card ${a?"playable":"disabled"} ${t?"pending":""}" data-card-id="${e.id}" aria-label="${A(e)}" ${a&&!t?"":"disabled"}>
      <img class="game-card game-card--image ${a?"game-card--playable":"game-card--disabled"}" src="${L(e)}" alt="${A(e)}" draggable="false" />
      ${a?'<b class="playable-badge">Jouable</b>':""}
      ${t?"<em>validation...</em>":""}
    </button>
  `}function N(e){return e?`
    <figure class="mini-card">
      <img class="game-card game-card--image" src="${L(e)}" alt="${A(e)}" draggable="false" />
      ${Y(e)}
    </figure>
  `:'<div class="mini-card mini-card--empty"><span>Defausse</span><strong>-</strong></div>'}function k(e){return`<span class="net ${e}"><i></i>${e==="connected"?"connecte":e==="local"?"demo local":e==="reconnecting"?"reconnexion":"deconnecte"}</span>`}function Y(e){return e.kind!=="wild"&&e.kind!=="wildDraw4"?"":`<figcaption class="active-color active-color--phone">${R(e)} - couleur active : <strong>${j(e.color)}</strong></figcaption>`}function f(e){return e.replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[a]??a)}function G(e){return e==="red"||e==="blue"||e==="green"||e==="yellow"?e:void 0}const D=document.querySelector("#app");if(!D)throw new Error("App root missing");const V=D,W=new URLSearchParams(window.location.search),d=(W.get("room")??localStorage.getItem("pixel-cards-room")??"DEMO").toUpperCase(),i=localStorage.getItem("pixel-cards-player-id")??crypto.randomUUID();localStorage.setItem("pixel-cards-player-id",i);localStorage.setItem("pixel-cards-room",d);let v=localStorage.getItem(`pixel-cards-name-${d}`)??"",r,p,$,o,C="",S="reconnecting",w=!1;const P=q(d);P.onStatus(e=>{S=e,y(),v&&e!=="disconnected"&&T()});P.onEvent(e=>{e.roomCode===d&&F(e)});function F(e){var a;if(e.type==="GAME_OVER"){r=e.publicState,o=void 0,$=void 0,w=!1,y();return}e.type==="GAME_STATE_PATCH"&&(r=e.publicState,p=((a=e.privateStates)==null?void 0:a.find(t=>t.playerId===i))??p,o&&e.acceptedActionId===o&&(o=void 0,$=void 0,C=""),o&&e.rejectedActionId===o&&(o=void 0,$=void 0,C=e.reason??"Action refusée"),w=!1,y())}function T(){P.send({type:"JOIN_ROOM",roomCode:d,playerId:i,name:v})}function b(e){w||(w=!0,P.send(e),window.setTimeout(()=>{w=!1},450))}function y(){_({app:V,roomCode:d,playerId:i,name:v,state:r,privateState:p,network:S,pendingCardId:$,error:C,onJoin:e=>{v=e,localStorage.setItem(`pixel-cards-name-${d}`,v),T(),y()},onReady:()=>{var a;const e=!((a=r==null?void 0:r.players.find(t=>t.id===i))!=null&&a.ready);b({type:"PLAYER_READY",roomCode:d,playerId:i,ready:e})},onPlay:(e,a)=>{var t;((t=r==null?void 0:r.turn)==null?void 0:t.activePlayerId)!==i||o||(o=crypto.randomUUID(),$=e.id,p&&(p={...p,hand:p.hand.filter(n=>n.id!==e.id)}),U(),b({type:"PLAY_CARD",roomCode:d,playerId:i,cardId:e.id,chosenColor:a,clientActionId:o}),y())},onDraw:()=>{var e;((e=r==null?void 0:r.turn)==null?void 0:e.activePlayerId)!==i||o||(o=crypto.randomUUID(),b({type:"DRAW_CARD",roomCode:d,playerId:i,clientActionId:o}))},onPass:()=>{var e;((e=r==null?void 0:r.turn)==null?void 0:e.activePlayerId)!==i||o||(o=crypto.randomUUID(),b({type:"PASS_TURN",roomCode:d,playerId:i,clientActionId:o}))}}),M(r)}window.setInterval(()=>M(r),250);y();
