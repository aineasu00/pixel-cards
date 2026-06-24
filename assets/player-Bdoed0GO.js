import{p as T,c as C,f as L,v as x}from"./animations-BdyYksr-.js";function j(e){const{app:n,state:a}=e;!e.name||!a||a.phase==="lobby"?n.innerHTML=e.name?_(e):U(e):n.innerHTML=J(e),q(e)}function q(e){var a,r,i;const n=e.app.querySelector("[data-join-form]");n==null||n.addEventListener("submit",c=>{c.preventDefault();const p=n.querySelector('input[name="name"]'),m=(p==null?void 0:p.value.trim())??"";m&&e.onJoin(m)}),(a=e.app.querySelector('[data-action="ready"]'))==null||a.addEventListener("click",e.onReady),(r=e.app.querySelector('[data-action="draw"]'))==null||r.addEventListener("click",e.onDraw),(i=e.app.querySelector('[data-action="pass"]'))==null||i.addEventListener("click",e.onPass),e.app.querySelectorAll("[data-card-id]").forEach(c=>{c.addEventListener("click",()=>{var h,f;const p=(h=e.privateState)==null?void 0:h.hand.find(d=>d.id===c.dataset.cardId);if(!p)return;const m=p.kind==="wild"?z((f=e.app.querySelector("[data-color-choice]"))==null?void 0:f.value):void 0;e.onPlay(p,m)})})}function U(e){return`
    <main class="phone-shell join-phone">
      <img src="./assets/mascot.png" class="mascot-badge" alt="Mascotte Pixel Card" />
      <p class="eyebrow">Salle ${e.roomCode}</p>
      <h1>Pixel Card</h1>
      <p class="phone-subtitle">Entre ton pseudo pour rejoindre la table.</p>
      <form data-join-form class="join-form">
        <input name="name" maxlength="18" autocomplete="nickname" placeholder="Ton pseudo" required />
        <button class="primary-btn" type="submit">Rejoindre</button>
      </form>
      ${P(e.network)}
    </main>
  `}function _(e){var a,r;const n=(a=e.state)==null?void 0:a.players.find(i=>i.id===e.playerId);return`
    <main class="phone-shell">
      <header class="phone-header">
        <div>
          <p class="eyebrow">Salle ${e.roomCode}</p>
          <h1>${g(e.name)}</h1>
        </div>
        <img src="./assets/mascot.png" class="phone-mascot" alt="" />
        ${P(e.network)}
      </header>
      <section class="status-card panel-rise">
        <strong>${n!=null&&n.ready?"Pret":"En attente"}</strong>
        <span>${((r=e.state)==null?void 0:r.players.length)??0}/9 joueurs connectes</span>
      </section>
      <button class="primary-btn" data-action="ready">${n!=null&&n.ready?"Annuler pret":"Je suis pret"}</button>
      <p class="hint">La partie demarre depuis la tablette.</p>
    </main>
  `}function J(e){var f;const n=e.state,a=e.privateState;if(!n||!a)return"";const r=n.players.find(d=>{var A;return d.id===((A=n.turn)==null?void 0:A.activePlayerId)}),i=((f=n.turn)==null?void 0:f.activePlayerId)===e.playerId,c=new Set(T(a.hand,n.discardTop).map(d=>d.id)),p=i&&c.size===0,m=i&&(a.drewThisTurn||c.size===0),h=n.players.find(d=>d.id===n.winnerId);return`
    <main class="phone-shell game-phone">
      <header class="phone-header">
        <div>
          <p class="eyebrow">${n.phase==="game-over"?"Partie terminee":i?"C'est ton tour":`Tour de ${g((r==null?void 0:r.name)??"-")}`}</p>
          <h1>${n.phase==="game-over"?`${g((h==null?void 0:h.name)??"Joueur")} gagne`:g(e.name)}</h1>
        </div>
        ${P(e.network)}
      </header>
      <section class="phone-center panel-rise ${i?"is-turn":""}">
        ${N(n.discardTop)}
        <div class="phone-timer-wrap" data-phone-timer-wrap style="--progress:100%">
          <div class="phone-timer" data-phone-timer>00:50</div>
          <small>${i?"ton tour":"attente"}</small>
        </div>
      </section>
      ${e.error?`<p class="error-line">${g(e.error)}</p>`:""}
      <section class="hand-grid">
        ${a.hand.map(d=>O(d,i&&c.has(d.id),e.pendingCardId===d.id)).join("")}
      </section>
      <section class="phone-actions">
        <select data-color-choice aria-label="Couleur joker">
          <option value="blue">Bleu</option>
          <option value="red">Rouge</option>
          <option value="green">Vert</option>
          <option value="yellow">Jaune</option>
        </select>
        <button class="secondary-btn" data-action="draw" ${p?"":"disabled"}>Piocher</button>
        <button class="ghost-btn" data-action="pass" ${m?"":"disabled"}>Passer</button>
      </section>
    </main>
  `}function S(e){const n=document.querySelector("[data-phone-timer]"),a=document.querySelector("[data-phone-timer-wrap]");if(!n||!(e!=null&&e.turn)||e.phase!=="playing")return;const r=Math.max(0,e.turn.durationMs-(Date.now()-e.turn.startedAt)),i=Math.ceil(r/1e3);n.textContent=`00:${String(i).padStart(2,"0")}`;const c=Math.max(0,Math.min(100,r/e.turn.durationMs*100));a==null||a.style.setProperty("--progress",`${c}%`),a==null||a.classList.toggle("warning",r<15e3),a==null||a.classList.toggle("danger",r<5e3)}function O(e,n,a){return`
    <button class="hand-card ${e.color} ${e.kind} ${n?"playable":"disabled"} ${a?"pending":""}" data-card-id="${e.id}" ${n&&!a?"":"disabled"}>
      <i>${H(e)}</i>
      <span>${e.kind==="wild"?"joker":e.color}</span>
      <strong>${C(e)}</strong>
      <small>${E(e)}</small>
      ${a?"<em>validation...</em>":""}
    </button>
  `}function N(e){return e?`<div class="mini-card ${e.color} ${e.kind}"><span>Defausse</span><strong>${C(e)}</strong><small>${E(e)}</small></div>`:'<div class="mini-card neutral"><span>Defausse</span><strong>-</strong></div>'}function P(e){return`<span class="net ${e}"><i></i>${e==="connected"?"connecte":e==="local"?"demo local":e==="reconnecting"?"reconnexion":"deconnecte"}</span>`}function H(e){return e.kind==="draw2"?"+2":e.kind==="skip"?"STOP":e.kind==="reverse"?"REV":e.kind==="wild"?"PC":String(e.value??"")}function E(e){return e.kind==="draw2"?"Pioche 2":e.kind==="skip"?"Passer":e.kind==="reverse"?"Inverser":e.kind==="wild"?"Au choix":"Nombre"}function g(e){return e.replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[n]??n)}function z(e){return e==="red"||e==="blue"||e==="green"||e==="yellow"?e:void 0}const D=document.querySelector("#app");if(!D)throw new Error("App root missing");const B=D,V=new URLSearchParams(window.location.search),l=(V.get("room")??localStorage.getItem("pixel-cards-room")??"DEMO").toUpperCase(),s=localStorage.getItem("pixel-cards-player-id")??crypto.randomUUID();localStorage.setItem("pixel-cards-player-id",s);localStorage.setItem("pixel-cards-room",l);let $=localStorage.getItem(`pixel-cards-name-${l}`)??"",t,u,v,o,b="",M="reconnecting",I=!1;const k=L(l);k.onStatus(e=>{M=e,y(),$&&e!=="disconnected"&&R()});k.onEvent(e=>{e.roomCode===l&&Y(e)});function Y(e){var n;if(e.type==="GAME_OVER"){t=e.publicState,o=void 0,v=void 0,I=!1,y();return}e.type==="GAME_STATE_PATCH"&&(t=e.publicState,u=((n=e.privateStates)==null?void 0:n.find(a=>a.playerId===s))??u,o&&e.acceptedActionId===o&&(o=void 0,v=void 0,b=""),o&&e.rejectedActionId===o&&(o=void 0,v=void 0,b=e.reason??"Action refusée"),I=!1,y())}function R(){k.send({type:"JOIN_ROOM",roomCode:l,playerId:s,name:$})}function w(e){I||(I=!0,k.send(e),window.setTimeout(()=>{I=!1},450))}function y(){j({app:B,roomCode:l,playerId:s,name:$,state:t,privateState:u,network:M,pendingCardId:v,error:b,onJoin:e=>{$=e,localStorage.setItem(`pixel-cards-name-${l}`,$),R(),y()},onReady:()=>{var n;const e=!((n=t==null?void 0:t.players.find(a=>a.id===s))!=null&&n.ready);w({type:"PLAYER_READY",roomCode:l,playerId:s,ready:e})},onPlay:(e,n)=>{var a;((a=t==null?void 0:t.turn)==null?void 0:a.activePlayerId)!==s||o||(o=crypto.randomUUID(),v=e.id,u&&(u={...u,hand:u.hand.filter(r=>r.id!==e.id)}),x(),w({type:"PLAY_CARD",roomCode:l,playerId:s,cardId:e.id,chosenColor:n,clientActionId:o}),y())},onDraw:()=>{var e;((e=t==null?void 0:t.turn)==null?void 0:e.activePlayerId)!==s||o||(o=crypto.randomUUID(),w({type:"DRAW_CARD",roomCode:l,playerId:s,clientActionId:o}))},onPass:()=>{var e;((e=t==null?void 0:t.turn)==null?void 0:e.activePlayerId)!==s||o||(o=crypto.randomUUID(),w({type:"PASS_TURN",roomCode:l,playerId:s,clientActionId:o}))}}),S(t)}window.setInterval(()=>S(t),250);y();
