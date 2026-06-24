import{p as T,c as k,f as L,v as j}from"./animations-DJckPH3P.js";function M(e){const{app:a,state:n,privateState:o}=e;!e.name||!n||n.phase==="lobby"?a.innerHTML=e.name?U(e):q(e):a.innerHTML=_(e),x(e)}function x(e){var n,o,c;const a=e.app.querySelector("[data-join-form]");a==null||a.addEventListener("submit",p=>{p.preventDefault();const l=a.querySelector('input[name="name"]'),u=(l==null?void 0:l.value.trim())??"";u&&e.onJoin(u)}),(n=e.app.querySelector('[data-action="ready"]'))==null||n.addEventListener("click",e.onReady),(o=e.app.querySelector('[data-action="draw"]'))==null||o.addEventListener("click",e.onDraw),(c=e.app.querySelector('[data-action="pass"]'))==null||c.addEventListener("click",e.onPass),e.app.querySelectorAll("[data-card-id]").forEach(p=>{p.addEventListener("click",()=>{var y,f;const l=(y=e.privateState)==null?void 0:y.hand.find(d=>d.id===p.dataset.cardId);if(!l)return;const u=l.kind==="wild"?H((f=e.app.querySelector("[data-color-choice]"))==null?void 0:f.value):void 0;e.onPlay(l,u)})})}function q(e){return`
    <main class="phone-shell join-phone">
      <img src="./assets/mascot.png" class="mascot-mini" alt="Mascotte Pixel Cards" />
      <p class="eyebrow">Room ${e.roomCode}</p>
      <h1>Rejoindre Pixel Cards</h1>
      <form data-join-form class="join-form">
        <input name="name" maxlength="18" autocomplete="nickname" placeholder="Ton pseudo" required />
        <button class="primary-btn" type="submit">Rejoindre</button>
      </form>
      ${P(e.network)}
    </main>
  `}function U(e){var n,o;const a=(n=e.state)==null?void 0:n.players.find(c=>c.id===e.playerId);return`
    <main class="phone-shell">
      <header class="phone-header">
        <div>
          <p class="eyebrow">Room ${e.roomCode}</p>
          <h1>${g(e.name)}</h1>
        </div>
        ${P(e.network)}
      </header>
      <section class="status-card">
        <strong>${a!=null&&a.ready?"Prêt":"En attente"}</strong>
        <span>${((o=e.state)==null?void 0:o.players.length)??0}/9 joueurs connectés</span>
      </section>
      <button class="primary-btn" data-action="ready">${a!=null&&a.ready?"Annuler prêt":"Je suis prêt"}</button>
      <p class="hint">La partie démarre depuis la tablette.</p>
    </main>
  `}function _(e){var f;const a=e.state,n=e.privateState;if(!a||!n)return"";const o=a.players.find(d=>{var C;return d.id===((C=a.turn)==null?void 0:C.activePlayerId)}),c=((f=a.turn)==null?void 0:f.activePlayerId)===e.playerId,p=new Set(T(n.hand,a.discardTop).map(d=>d.id)),l=c&&p.size===0,u=c&&(n.drewThisTurn||p.size===0),y=a.players.find(d=>d.id===a.winnerId);return`
    <main class="phone-shell game-phone">
      <header class="phone-header">
        <div>
          <p class="eyebrow">${a.phase==="game-over"?"Partie terminée":c?"C'est ton tour":`Tour de ${g((o==null?void 0:o.name)??"-")}`}</p>
          <h1>${a.phase==="game-over"?`${g((y==null?void 0:y.name)??"Joueur")} gagne`:g(e.name)}</h1>
        </div>
        ${P(e.network)}
      </header>
      <section class="phone-center">
        ${O(a.discardTop)}
        <div class="phone-timer" data-phone-timer>50</div>
      </section>
      ${e.error?`<p class="error-line">${g(e.error)}</p>`:""}
      <section class="hand-grid">
        ${n.hand.map(d=>J(d,c&&p.has(d.id),e.pendingCardId===d.id)).join("")}
      </section>
      <section class="phone-actions">
        <select data-color-choice aria-label="Couleur joker">
          <option value="blue">Bleu</option>
          <option value="red">Rouge</option>
          <option value="green">Vert</option>
          <option value="yellow">Jaune</option>
        </select>
        <button class="secondary-btn" data-action="draw" ${l?"":"disabled"}>Piocher</button>
        <button class="ghost-btn" data-action="pass" ${u?"":"disabled"}>Passer</button>
      </section>
    </main>
  `}function R(e){const a=document.querySelector("[data-phone-timer]");if(!a||!(e!=null&&e.turn)||e.phase!=="playing")return;const n=Math.max(0,e.turn.durationMs-(Date.now()-e.turn.startedAt));a.textContent=`${Math.ceil(n/1e3)}s`,a.classList.toggle("danger",n<1e4)}function J(e,a,n){return`
    <button class="hand-card ${e.color} ${a?"playable":"disabled"} ${n?"pending":""}" data-card-id="${e.id}" ${a&&!n?"":"disabled"}>
      <span>${e.kind==="wild"?"joker":e.color}</span>
      <strong>${k(e)}</strong>
      ${n?"<em>validation...</em>":""}
    </button>
  `}function O(e){return e?`<div class="mini-card ${e.color}"><span>Défausse</span><strong>${k(e)}</strong></div>`:'<div class="mini-card neutral"><strong>-</strong></div>'}function P(e){return`<span class="net ${e}"><i></i>${e==="connected"?"connecté":e==="local"?"demo local":e==="reconnecting"?"reconnexion":"déconnecté"}</span>`}function g(e){return e.replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[a]??a)}function H(e){return e==="red"||e==="blue"||e==="green"||e==="yellow"?e:void 0}const E=document.querySelector("#app");if(!E)throw new Error("App root missing");const z=E,B=new URLSearchParams(window.location.search),s=(B.get("room")??localStorage.getItem("pixel-cards-room")??"DEMO").toUpperCase(),i=localStorage.getItem("pixel-cards-player-id")??crypto.randomUUID();localStorage.setItem("pixel-cards-player-id",i);localStorage.setItem("pixel-cards-room",s);let v=localStorage.getItem(`pixel-cards-name-${s}`)??"",r,m,$,t,A="",D="reconnecting",I=!1;const b=L(s);b.onStatus(e=>{D=e,h(),v&&e!=="disconnected"&&S()});b.onEvent(e=>{e.roomCode===s&&N(e)});function N(e){var a;if(e.type==="GAME_OVER"){r=e.publicState,t=void 0,$=void 0,I=!1,h();return}e.type==="GAME_STATE_PATCH"&&(r=e.publicState,m=((a=e.privateStates)==null?void 0:a.find(n=>n.playerId===i))??m,t&&e.acceptedActionId===t&&(t=void 0,$=void 0,A=""),t&&e.rejectedActionId===t&&(t=void 0,$=void 0,A=e.reason??"Action refusée"),I=!1,h())}function S(){b.send({type:"JOIN_ROOM",roomCode:s,playerId:i,name:v})}function w(e){I||(I=!0,b.send(e),window.setTimeout(()=>{I=!1},450))}function h(){M({app:z,roomCode:s,playerId:i,name:v,state:r,privateState:m,network:D,pendingCardId:$,error:A,onJoin:e=>{v=e,localStorage.setItem(`pixel-cards-name-${s}`,v),S(),h()},onReady:()=>{var a;const e=!((a=r==null?void 0:r.players.find(n=>n.id===i))!=null&&a.ready);w({type:"PLAYER_READY",roomCode:s,playerId:i,ready:e})},onPlay:(e,a)=>{var n;((n=r==null?void 0:r.turn)==null?void 0:n.activePlayerId)!==i||t||(t=crypto.randomUUID(),$=e.id,m&&(m={...m,hand:m.hand.filter(o=>o.id!==e.id)}),j(),w({type:"PLAY_CARD",roomCode:s,playerId:i,cardId:e.id,chosenColor:a,clientActionId:t}),h())},onDraw:()=>{var e;((e=r==null?void 0:r.turn)==null?void 0:e.activePlayerId)!==i||t||(t=crypto.randomUUID(),w({type:"DRAW_CARD",roomCode:s,playerId:i,clientActionId:t}))},onPass:()=>{var e;((e=r==null?void 0:r.turn)==null?void 0:e.activePlayerId)!==i||t||(t=crypto.randomUUID(),w({type:"PASS_TURN",roomCode:s,playerId:i,clientActionId:t}))}}),R(r)}window.setInterval(()=>R(r),250);h();
