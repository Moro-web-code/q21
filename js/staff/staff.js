/* ============================================================
   STAFF — Panel de Cocina (KDS)
   Movido tal cual desde el IIFE original: renderStaff().
   renderStaffLogin() se conserva en auth/login.js (no se duplica,
   regla 11) y se importa aquí.
   ============================================================ */

import { supabase } from '../config/supabase.js';
import { RESTAURANT } from '../config/constants.js';
import { esc, getOrders } from '../customer/customer.js';
import { renderStaffLogin } from '../auth/login.js';

/* Antes era `let staffInterval = null;` a nivel del IIFE.
   Ahora vive a nivel de módulo, con el mismo comportamiento. */
let staffInterval = null;

/* ============================================================
   STAFF PANEL — KDS
============================================================ */
export async function renderStaff(){
  const app = document.getElementById('app');

  const { data:{ session } } = await supabase.auth.getSession();
  if(!session){ renderStaffLogin(); return; }
  if(staffInterval) clearInterval(staffInterval);

  if(!document.getElementById('kds-style')){
    const st = document.createElement('style');
    st.id = 'kds-style';
    st.textContent = `
      #kds-layout{ display:flex; flex-direction:column; height:100vh; overflow:hidden; background:#111009; font-family:'JetBrains Mono',monospace; }
      #kds-topbar{ height:52px; background:#1a1814; border-bottom:1px solid #2e2b25; display:flex; align-items:center; justify-content:space-between; padding:0 22px; flex-shrink:0; }
      .kds-brand{ display:flex; align-items:center; gap:10px; }
      .kds-brand-box{ width:28px; height:28px; background:var(--rust); border-radius:6px; display:flex; align-items:center; justify-content:center; font-family:'Archivo',sans-serif; font-weight:900; font-size:12px; color:#fff; }
      .kds-brand-name{ font-family:'Archivo',sans-serif; font-weight:900; font-size:14px; color:#f0e9d8; }
      .kds-brand-role{ font-size:10px; color:#55504a; margin-left:6px; }
      .kds-topbar-center{ display:flex; align-items:center; gap:16px; }
      .kds-online{ display:flex; align-items:center; gap:5px; font-size:11px; color:#5c7a5a; }
      .kds-online-dot{ width:7px; height:7px; border-radius:50%; background:#5c7a5a; }
      .kds-clock{ font-size:13px; color:#8a8278; font-variant-numeric:tabular-nums; }
      .kds-topbar-right{ display:flex; align-items:center; gap:8px; }
      .kds-btn{ background:transparent; border:1px solid #2e2b25; border-radius:6px; padding:6px 12px; font-size:11.5px; color:#8a8278; cursor:pointer; font-family:'JetBrains Mono',monospace; transition:border-color .12s,color .12s; }
      .kds-btn:hover{ border-color:#4a453d; color:#f0e9d8; }

      #kds-board{ flex:1; display:grid; grid-template-columns:repeat(3,1fr); gap:0; overflow:hidden; }
      .kds-col{ display:flex; flex-direction:column; border-right:1px solid #1e1c18; overflow:hidden; }
      .kds-col:last-child{ border-right:none; }
      .kds-col-head{ padding:14px 18px 12px; border-bottom:1px solid #1e1c18; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
      .kds-col-label{ font-size:10px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; }
      .kds-col-count{ font-size:11px; font-weight:700; padding:2px 8px; border-radius:999px; }
      .kds-col-pendiente .kds-col-label{ color:#c49520; }
      .kds-col-pendiente .kds-col-count{ background:rgba(196,149,32,.15); color:#c49520; }
      .kds-col-preparando .kds-col-label{ color:#c1502e; }
      .kds-col-preparando .kds-col-count{ background:rgba(193,80,46,.15); color:#c1502e; }
      .kds-col-listo .kds-col-label{ color:#5c7a5a; }
      .kds-col-listo .kds-col-count{ background:rgba(92,122,90,.15); color:#5c7a5a; }

      .kds-cards{ flex:1; overflow-y:auto; padding:14px; display:flex; flex-direction:column; gap:12px; }
      .kds-cards::-webkit-scrollbar{ width:3px; }
      .kds-cards::-webkit-scrollbar-thumb{ background:#2e2b25; border-radius:3px; }

      .kds-card{
  background:#1a1814;
  border:1px solid #2e2b25;
  border-radius:10px;
  padding:16px 16px 14px;
}
      @keyframes kds-in{ from{ opacity:0; transform:translateY(8px); } to{ opacity:1; transform:translateY(0); } }
      .kds-card.estado-pendiente{ border-left:3px solid #c49520; }
      .kds-card.estado-preparando{ border-left:3px solid #c1502e; }
      .kds-card.estado-listo{ border-left:3px solid #5c7a5a; }

      .kds-card-top{ display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:12px; }
      .kds-card-id{ font-size:10px; font-weight:700; letter-spacing:.1em; color:#55504a; text-transform:uppercase; margin-bottom:2px; }
      .kds-card-mesa{ font-family:'Archivo',sans-serif; font-weight:900; font-size:20px; color:#f0e9d8; line-height:1; }
      .kds-card-time{ font-size:11px; color:#55504a; margin-top:3px; }
      .kds-timer{ font-size:12px; font-weight:700; font-variant-numeric:tabular-nums; padding:4px 10px; border-radius:6px; }
      .kds-timer-ok{ background:rgba(92,122,90,.15); color:#5c7a5a; }
      .kds-timer-warn{ background:rgba(196,149,32,.15); color:#c49520; }
      .kds-timer-late{ background:rgba(193,80,46,.2); color:#c1502e; }

      .kds-items{ margin:0 0 12px; }
      .kds-item{ display:flex; align-items:baseline; gap:10px; padding:7px 0; border-bottom:1px solid #242019; }
      .kds-item:last-child{ border-bottom:none; }
      .kds-item-qty{ font-family:'Archivo',sans-serif; font-weight:900; font-size:22px; color:#f0e9d8; line-height:1; min-width:28px; }
      .kds-item-name{ font-size:13px; color:#d4cdc0; line-height:1.3; }
      .kds-item-note{ font-size:11px; color:#c49520; font-style:italic; margin-top:1px; }

      .kds-notes{ background:#1e1c18; border-radius:6px; padding:8px 10px; margin-bottom:12px; font-size:11.5px; color:#8a8278; font-style:italic; line-height:1.5; }

      .kds-action{ width:100%; padding:11px; border-radius:7px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; cursor:pointer; border:none; font-family:'JetBrains Mono',monospace; transition:opacity .12s; }
      .kds-action:hover{ opacity:.88; }
      .kds-action:disabled{ opacity:.4; cursor:default; }
      .kds-action-preparar{ background:#c49520; color:#1a1400; }
      .kds-action-listo{ background:#c1502e; color:#fff; }
      .kds-action-entregado{ background:#2e4a2c; color:#a8c4a6; }

      .kds-empty{ text-align:center; padding:40px 20px; font-size:12px; color:#2e2b25; border:1px dashed #2e2b25; border-radius:8px; }

      @media(max-width:820px){
        #kds-board{ grid-template-columns:1fr; overflow-y:auto; }
        .kds-col{ border-right:none; border-bottom:1px solid #1e1c18; overflow:visible; }
        .kds-cards{ overflow:visible; }
      }
    `;
    document.head.appendChild(st);
  }

  app.style.padding = '0';
  app.style.maxWidth = 'none';

  app.innerHTML = `
    <div id="kds-layout">
      <div id="kds-topbar">
        <div class="kds-brand">
          <div class="kds-brand-box">RL</div>
          <span class="kds-brand-name">${esc(RESTAURANT)}</span>
          <span class="kds-brand-role">Cocina</span>
        </div>
        <div class="kds-topbar-center">
          <div class="kds-online"><div class="kds-online-dot"></div> En línea</div>
          <div class="kds-clock" id="kds-clock"></div>
        </div>
        <div class="kds-topbar-right">
          <button class="kds-btn" id="kds-refresh">↻ Actualizar</button>
          <button class="kds-btn" id="kds-logout">← Salir</button>
        </div>
      </div>
      <div id="kds-board">
        <div class="kds-col kds-col-pendiente">
          <div class="kds-col-head">
            <span class="kds-col-label">Nuevos</span>
            <span class="kds-col-count" id="kds-count-pendiente">0</span>
          </div>
          <div class="kds-cards" id="kds-cards-pendiente"></div>
        </div>
        <div class="kds-col kds-col-preparando">
          <div class="kds-col-head">
            <span class="kds-col-label">En preparación</span>
            <span class="kds-col-count" id="kds-count-preparando">0</span>
          </div>
          <div class="kds-cards" id="kds-cards-preparando"></div>
        </div>
        <div class="kds-col kds-col-listo">
          <div class="kds-col-head">
            <span class="kds-col-label">Listos</span>
            <span class="kds-col-count" id="kds-count-listo">0</span>
          </div>
          <div class="kds-cards" id="kds-cards-listo"></div>
        </div>
      </div>
    </div>
  `;

  /* Reloj */
  function tickClock(){
    const el = document.getElementById('kds-clock');
    if(el) el.textContent = new Date().toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  }
  tickClock();
  const clockInterval = setInterval(tickClock, 1000);

  document.getElementById('kds-logout').onclick = async () => {
    clearInterval(staffInterval);
    clearInterval(clockInterval);
    staffInterval = null;
    app.style.padding = '';
    app.style.maxWidth = '';
    await supabase.auth.signOut();
    renderStaffLogin();
  };

  document.getElementById('kds-refresh').onclick = () => tick();

  function timerClass(mins){
    if(mins < 8) return 'kds-timer-ok';
    if(mins < 15) return 'kds-timer-warn';
    return 'kds-timer-late';
  }

  function renderCol(orders, colId, status, actionLabel, actionCls, nextStatus){
    const col = document.getElementById('kds-cards-' + colId);
    const count = document.getElementById('kds-count-' + colId);
    if(!col || !count) return;

    const lista = orders.filter(o => o.status === status)
      .sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));

    count.textContent = lista.length;

    if(lista.length === 0){
      col.innerHTML = `<div class="kds-empty">Sin pedidos</div>`;
      return;
    }

    col.innerHTML = lista.map(o => {
      const mins = Math.max(0, Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000));
      const hora = new Date(o.createdAt).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'});
      const items = Array.isArray(o.items) ? o.items : [];

      return `
        <div class="kds-card estado-${status}" data-id="${esc(o.id)}">
          <div class="kds-card-top">
            <div>
              <div class="kds-card-id">#${esc(o.id.slice(0,8).toUpperCase())}</div>
              <div class="kds-card-mesa">${esc(o.table)}</div>
              <div class="kds-card-time">${hora}</div>
            </div>
            <div class="kds-timer ${timerClass(mins)}">${mins}m</div>
          </div>
          <div class="kds-items">
            ${items.map(i => `
              <div class="kds-item">
                <span class="kds-item-qty">${esc(String(i.qty))}</span>
                <div>
                  <div class="kds-item-name">${esc(i.name)}</div>
                </div>
              </div>`).join('')}
          </div>
          ${o.notes ? `<div class="kds-notes">"${esc(o.notes)}"</div>` : ''}
          <button class="kds-action ${actionCls}" data-next="${nextStatus}">
            ${actionLabel}
          </button>
        </div>`;
    }).join('');

    col.querySelectorAll('.kds-card').forEach(card => {
      const btn = card.querySelector('.kds-action');
      btn.onclick = async () => {
        btn.disabled = true;
        btn.textContent = '…';
        const { error } = await supabase
          .from('orders')
          .update({ status: btn.dataset.next })
          .eq('id', card.dataset.id);
        if(error){ btn.disabled = false; btn.textContent = actionLabel; return; }
        await tick();
      };
    });
  }

  async function tick(){
    const { data:{ session: s } } = await supabase.auth.getSession();
    if(!s){
      clearInterval(staffInterval);
      clearInterval(clockInterval);
      staffInterval = null;
      app.style.padding = '';
      app.style.maxWidth = '';
      renderStaffLogin();
      return;
    }
    const orders = await getOrders();
    renderCol(orders, 'pendiente',  'pendiente',  'Empezar preparación', 'kds-action-preparar',  'preparando');
    renderCol(orders, 'preparando', 'preparando', 'Marcar listo',        'kds-action-listo',     'listo');
    renderCol(orders, 'listo',      'listo',      'Entregado',           'kds-action-entregado', 'entregado');
  }

  await tick();
  staffInterval = setInterval(tick, 5000);

  /* Realtime */
  supabase.channel('kds-orders')
    .on('postgres_changes',{ event:'*', schema:'public', table:'orders' },
      async () => { await tick(); })
    .subscribe();
}
