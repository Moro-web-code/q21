/* ============================================================
   WAITER — Panel de Mesero
   Cambios respecto al original:
   - Eliminada dependencia de MESAS (constants.js)
   - Eliminada constante POSICIONES hardcodeada
   - getTables() carga las mesas desde public.tables
   - calcularPosiciones() genera grid dinámico para cualquier N
   - mesasActuales almacena la lista en memoria durante el render
   - accionCerrar() ya no busca mesa en MESAS[], usa mesasActuales
   - renderPanel() ya no busca mesa en MESAS[], usa mesasActuales
   - El resto del comportamiento es idéntico al original
   ============================================================ */

import { supabase }   from '../config/supabase.js';
import { RESTAURANT } from '../config/constants.js';
import { esc, getTables, getMapElements } from '../customer/customer.js';
import { renderMeseroLogin } from '../auth/login.js';

/* ============================================================
   MESERO PANEL — KDS VISUAL
============================================================ */
export async function renderMesero(){
  const app = document.getElementById('app');

  const { data:{ session } } = await supabase.auth.getSession();
  if(!session){ renderMeseroLogin(); return; }

  if(!document.getElementById('mv-style')){
    const st = document.createElement('style');
    st.id = 'mv-style';
    st.textContent = `
      #mv-layout{ display:flex; flex-direction:column; height:100vh; overflow:hidden; background:#f5f3ef; font-family:'JetBrains Mono',monospace; }

      /* TOPBAR */
      #mv-topbar{ height:54px; background:#fff; border-bottom:1px solid #e8e4dc; display:flex; align-items:center; justify-content:space-between; padding:0 24px; flex-shrink:0; }
      .mv-brand{ display:flex; align-items:center; gap:10px; }
      .mv-brand-box{ width:30px; height:30px; background:#5c7a5a; border-radius:7px; display:flex; align-items:center; justify-content:center; font-family:'Archivo',sans-serif; font-weight:900; font-size:12px; color:#fff; }
      .mv-brand-name{ font-family:'Archivo',sans-serif; font-weight:900; font-size:15px; color:#1c1a17; }
      .mv-brand-role{ font-size:10px; color:#9e9890; margin-left:6px; }
      .mv-topbar-center{ display:flex; align-items:center; gap:14px; }
      .mv-online{ display:flex; align-items:center; gap:5px; font-size:11px; color:#4a6e48; }
      .mv-online-dot{ width:7px; height:7px; border-radius:50%; background:#4a6e48; animation:mv-pulse 2s infinite; }
      @keyframes mv-pulse{ 0%,100%{opacity:1;} 50%{opacity:.4;} }
      .mv-clock{ font-size:12px; color:#9e9890; font-variant-numeric:tabular-nums; }
      .mv-topbar-right{ display:flex; align-items:center; gap:8px; }
      .mv-btn{ background:#fff; border:1px solid #e8e4dc; border-radius:6px; padding:7px 14px; font-size:12px; font-weight:500; color:#6b6560; cursor:pointer; display:flex; align-items:center; gap:6px; font-family:'JetBrains Mono',monospace; transition:border-color .12s,color .12s; }
      .mv-btn:hover{ border-color:#c8c4bc; color:#1c1a17; }
      .mv-btn.sage{ background:#5c7a5a; color:#fff; border-color:#5c7a5a; }
      .mv-btn.sage:hover{ background:#4a6e48; }
      .mv-btn.danger{ color:#c1502e; border-color:#f0c4b4; background:#fdf1ed; }

      /* BODY */
      #mv-body{ flex:1; display:flex; overflow:hidden; }

      /* MAPA AREA */
      #mv-mapa-area{ flex:1; overflow-y:auto; padding:22px; }
      #mv-mapa-area::-webkit-scrollbar{ width:4px; }
      #mv-mapa-area::-webkit-scrollbar-thumb{ background:#d4cfc4; border-radius:4px; }

      .mv-view-tabs{ display:flex; gap:2px; background:#e8e4dc; border-radius:8px; padding:3px; margin-bottom:20px; width:fit-content; }
      .mv-view-tab{ padding:6px 16px; border-radius:6px; font-size:12px; font-weight:500; color:#6b6560; cursor:pointer; border:none; background:none; font-family:'JetBrains Mono',monospace; transition:background .12s; }
      .mv-view-tab.active{ background:#fff; color:#1c1a17; }

      /* LEYENDA */
      .mv-leyenda{ display:flex; gap:16px; flex-wrap:wrap; margin-bottom:18px; }
      .mv-ley-item{ display:flex; align-items:center; gap:6px; font-size:11px; color:#9e9890; }
      .mv-ley-dot{ width:10px; height:10px; border-radius:50%; flex-shrink:0; }

      /* MAPA VISUAL */
      .mv-mapa-canvas{
        position:relative;
        background:#fff;
        border:1px solid #e8e4dc;
        border-radius:14px;
        width:100%;
        aspect-ratio:16/9;
        min-height:300px;
        max-height:520px;
        overflow:hidden;
      }

      /* Zonas del restaurante */
      .mv-zona{
        position:absolute;
        background:#f5f3ef;
        border:1px solid #e8e4dc;
        border-radius:8px;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:10px;
        letter-spacing:.12em;
        text-transform:uppercase;
        color:#c8c5c0;
        font-weight:500;
        user-select:none;
        pointer-events:none;
      }

      /* Mesas en el mapa */
      .mv-mesa-node{
        position:absolute;
        transform:translate(-50%,-50%);
        display:flex;
        flex-direction:column;
        align-items:center;
        cursor:pointer;
        transition:transform .15s;
      }
      .mv-mesa-node:hover{ transform:translate(-50%,-50%) scale(1.06); }

      .mv-mesa-circle{
        width:72px; height:72px;
        border-radius:50%;
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        border:2.5px solid transparent;
        transition:border-color .15s,background .15s;
        position:relative;
      }
      .mv-mesa-circle.libre{
        background:#f5f3ef;
        border-color:#e8e4dc;
      }
      .mv-mesa-circle.activa{
        background:rgba(92,122,90,.1);
        border-color:#5c7a5a;
      }
      .mv-mesa-circle.pendiente{
        background:rgba(196,149,32,.1);
        border-color:#c49520;
      }
      .mv-mesa-circle.selected{
        box-shadow:0 0 0 3px rgba(92,122,90,.3);
      }

      .mv-mesa-num{
        font-family:'Archivo',sans-serif;
        font-weight:900;
        font-size:16px;
        line-height:1;
      }
      .mv-mesa-circle.libre .mv-mesa-num{ color:#c8c5c0; }
      .mv-mesa-circle.activa .mv-mesa-num{ color:#5c7a5a; }
      .mv-mesa-circle.pendiente .mv-mesa-num{ color:#c49520; }

      .mv-mesa-sub{
        font-size:8px;
        letter-spacing:.06em;
        text-transform:uppercase;
        margin-top:2px;
        opacity:.8;
      }
      .mv-mesa-circle.libre .mv-mesa-sub{ color:#c8c5c0; }
      .mv-mesa-circle.activa .mv-mesa-sub{ color:#5c7a5a; }
      .mv-mesa-circle.pendiente .mv-mesa-sub{ color:#c49520; }

      .mv-mesa-badge{
        position:absolute;
        top:-4px; right:-4px;
        background:#c49520; color:#26200e;
        border-radius:999px;
        min-width:18px; height:18px;
        font-size:9px; font-weight:700;
        display:flex; align-items:center; justify-content:center;
        padding:0 4px;
        border:2px solid #fff;
      }

      .mv-mesa-label{
        margin-top:6px;
        font-size:10px;
        color:#9e9890;
        text-align:center;
        white-space:nowrap;
      }

      /* GRID VIEW (móvil / tablet) */
      .mv-grid-view{ display:none; }
      .mv-grid-view.visible{ display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:12px; }

      .mv-grid-card{ background:#fff; border:1px solid #e8e4dc; border-radius:10px; padding:16px 14px 12px; cursor:pointer; transition:border-color .14s; border-left:4px solid; }
      .mv-grid-card.libre{ border-left-color:#e8e4dc; }
      .mv-grid-card.activa{ border-left-color:#5c7a5a; }
      .mv-grid-card.pendiente{ border-left-color:#c49520; }
      .mv-grid-card:hover{ border-color:#c8c4bc; }

      .mv-gc-top{ display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:10px; }
      .mv-gc-num{ font-family:'Archivo',sans-serif; font-weight:900; font-size:20px; color:#1c1a17; }
      .mv-gc-badge{ font-size:10px; font-weight:600; padding:2px 8px; border-radius:999px; }
      .mv-gcb-libre{ background:#f0ede8; color:#9e9890; }
      .mv-gcb-activa{ background:#edf4ec; color:#4a6e48; }
      .mv-gcb-pendiente{ background:#fdf8ec; color:#c49520; }

      .mv-gc-stats{ display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:10px; }
      .mv-gc-stat{ background:#f5f3ef; border-radius:6px; padding:6px 8px; }
      .mv-gc-stat-val{ font-family:'Archivo',sans-serif; font-weight:900; font-size:16px; color:#1c1a17; }
      .mv-gc-stat-label{ font-size:9px; text-transform:uppercase; letter-spacing:.07em; color:#9e9890; }

      .mv-gc-info{ font-size:11px; color:#9e9890; }
      .mv-gc-btn{ width:100%; margin-top:10px; padding:8px; border-radius:6px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; cursor:pointer; border:none; font-family:'JetBrains Mono',monospace; }
      .mv-gc-btn-abrir{ background:#edf4ec; color:#4a6e48; }
      .mv-gc-btn-cerrar{ background:#fdf1ed; color:#c1502e; }

      /* PANEL LATERAL */
      #mv-panel{ width:320px; min-width:320px; background:#fff; border-left:1px solid #e8e4dc; display:flex; flex-direction:column; overflow:hidden; transition:width .2s,min-width .2s; }
      #mv-panel.cerrado{ width:0; min-width:0; border-left:none; overflow:hidden; }

      .mv-panel-inner{ width:320px; display:flex; flex-direction:column; height:100%; }

      .mv-panel-head{ padding:18px 18px 14px; border-bottom:1px solid #e8e4dc; display:flex; align-items:flex-start; justify-content:space-between; flex-shrink:0; }
      .mv-panel-nombre{ font-family:'Archivo',sans-serif; font-weight:900; font-size:22px; color:#1c1a17; }
      .mv-panel-estado{ font-size:11px; margin-top:4px; }
      .mv-panel-x{ background:none; border:none; cursor:pointer; color:#9e9890; font-size:18px; padding:2px; line-height:1; }
      .mv-panel-x:hover{ color:#1c1a17; }

      .mv-panel-stats{ display:grid; grid-template-columns:repeat(3,1fr); gap:8px; padding:12px 18px; border-bottom:1px solid #e8e4dc; flex-shrink:0; }
      .mv-ps{ background:#f5f3ef; border-radius:8px; padding:10px 8px; text-align:center; }
      .mv-ps-val{ font-family:'Archivo',sans-serif; font-weight:900; font-size:18px; color:#1c1a17; }
      .mv-ps-label{ font-size:9px; text-transform:uppercase; letter-spacing:.07em; color:#9e9890; margin-top:2px; }

      .mv-panel-body{ flex:1; overflow-y:auto; padding:14px 18px; }
      .mv-panel-body::-webkit-scrollbar{ width:3px; }
      .mv-panel-body::-webkit-scrollbar-thumb{ background:#e8e4dc; border-radius:3px; }

      .mv-panel-sec{ font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:#9e9890; font-weight:500; margin-bottom:10px; }

      .mv-pedido-card{ border:1px solid #e8e4dc; border-radius:8px; padding:12px 13px; margin-bottom:10px; }
      .mv-pedido-top{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
      .mv-pedido-id{ font-size:10px; font-weight:700; color:#9e9890; letter-spacing:.06em; }
      .mv-pedido-pill{ font-size:9.5px; font-weight:600; padding:2px 8px; border-radius:999px; }
      .mvp-pendiente{ background:#fdf8ec; color:#c49520; }
      .mvp-preparando{ background:#fdf1ed; color:#c1502e; }
      .mvp-listo{ background:#edf4ec; color:#4a6e48; }
      .mv-pedido-items{ font-size:12px; color:#6b6560; line-height:1.7; }
      .mv-pedido-total{ font-size:12px; font-weight:600; color:#1c1a17; text-align:right; margin-top:6px; padding-top:6px; border-top:1px solid #f0ede8; }

      .mv-panel-footer{ padding:14px 18px; border-top:1px solid #e8e4dc; display:flex; flex-direction:column; gap:8px; flex-shrink:0; }
      .mv-pfooter-btn{ width:100%; padding:10px; border-radius:7px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; cursor:pointer; border:none; font-family:'JetBrains Mono',monospace; display:flex; align-items:center; justify-content:center; gap:6px; }
      .mv-pfooter-abrir{ background:#5c7a5a; color:#fff; }
      .mv-pfooter-abrir:hover{ background:#4a6e48; }
      .mv-pfooter-cerrar{ background:#fdf1ed; color:#c1502e; border:1px solid #f0c4b4; }
      .mv-pfooter-cerrar:hover{ background:#f9e0d8; }

      .mv-empty{ text-align:center; padding:28px 10px; font-size:12px; color:#c8c5c0; line-height:1.6; }
      .mv-msg{ margin-top:12px; font-size:12px; color:#4a6e48; min-height:16px; }

      @media(max-width:900px){
        #mv-panel{
          position:fixed; right:0; top:54px; bottom:0;
          z-index:50; box-shadow:-4px 0 20px rgba(0,0,0,.1);
          width:300px; min-width:300px;
        }
        #mv-panel.cerrado{ width:0; min-width:0; }
        .mv-panel-inner{ width:300px; }
      }
      @media(max-width:600px){
        .mv-mapa-canvas{ display:none; }
        .mv-view-tabs{ display:none; }
        .mv-grid-view{ display:grid !important; }
      }
    `;
    document.head.appendChild(st);
  }

  if(!document.querySelector('link[href*="tabler-icons"]')){
    const lk = document.createElement('link');
    lk.rel = 'stylesheet';
    lk.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.47.0/tabler-icons.min.css';
    document.head.appendChild(lk);
  }

  app.style.padding  = '0';
  app.style.maxWidth = 'none';

  /* ============================================================
     POSICIONES DINÁMICAS
     Grid de 2 columnas en el área izquierda del canvas (0–62%).
     Cada nueva mesa ocupa la siguiente celda del grid.
     Funciona para cualquier número de mesas sin hardcodear.
  ============================================================ */
  /* Las posiciones vienen directamente de Supabase (position_x, position_y).
     Esta función ya no es necesaria. */

  /* Zonas decorativas del restaurante — estáticas */
  /* Las zonas ahora vienen de public.map_elements via Supabase. */

  app.innerHTML = `
    <div id="mv-layout">
      <div id="mv-topbar">
        <div class="mv-brand">
          <div class="mv-brand-box">MS</div>
          <span class="mv-brand-name">${esc(RESTAURANT)}</span>
          <span class="mv-brand-role">Mesero</span>
        </div>
        <div class="mv-topbar-center">
          <div class="mv-online"><div class="mv-online-dot"></div> En línea</div>
          <div class="mv-clock" id="mv-clock"></div>
        </div>
        <div class="mv-topbar-right">
          <button class="mv-btn" id="mv-refresh"><i class="ti ti-refresh" aria-hidden="true"></i> Actualizar</button>
          <button class="mv-btn" id="mv-logout"><i class="ti ti-logout" aria-hidden="true"></i> Salir</button>
        </div>
      </div>

      <div id="mv-body">
        <div id="mv-mapa-area">

          <div class="mv-view-tabs">
            <button class="mv-view-tab active" data-view="mapa">Mapa</button>
            <button class="mv-view-tab" data-view="lista">Lista</button>
          </div>

          <div class="mv-leyenda">
            <div class="mv-ley-item"><div class="mv-ley-dot" style="background:#e8e4dc;border:1.5px solid #d4cfc4;"></div>Disponible</div>
            <div class="mv-ley-item"><div class="mv-ley-dot" style="background:#5c7a5a;"></div>Activa</div>
            <div class="mv-ley-item"><div class="mv-ley-dot" style="background:#c49520;"></div>Con pedidos pendientes</div>
          </div>

          <!-- MAPA VISUAL -->
          <div class="mv-mapa-canvas" id="mv-mapa-canvas">
            <div id="mv-zonas-container"></div>
            <div id="mv-mesas-nodes"></div>
          </div>

          <!-- GRID LISTA -->
          <div class="mv-grid-view" id="mv-grid-view"></div>

          <div class="mv-msg" id="mv-msg"></div>
        </div>

        <!-- PANEL LATERAL -->
        <div id="mv-panel" class="cerrado">
          <div class="mv-panel-inner">
            <div class="mv-panel-head">
              <div>
                <div class="mv-panel-nombre" id="mv-panel-nombre">—</div>
                <div class="mv-panel-estado" id="mv-panel-estado"></div>
              </div>
              <button class="mv-panel-x" id="mv-panel-close">✕</button>
            </div>
            <div class="mv-panel-stats" id="mv-panel-stats"></div>
            <div class="mv-panel-body"  id="mv-panel-body"></div>
            <div class="mv-panel-footer" id="mv-panel-footer"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  /* ── Reloj ── */
  function tickClock(){
    const el = document.getElementById('mv-clock');
    if(el) el.textContent = new Date().toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'});
  }
  tickClock();
  const clockInt = setInterval(tickClock, 30000);

  /* ── Logout ── */
  document.getElementById('mv-logout').onclick = async () => {
    clearInterval(clockInt);
    app.style.padding  = '';
    app.style.maxWidth = '';
    await supabase.auth.signOut();
    renderMeseroLogin();
  };

  document.getElementById('mv-refresh').onclick  = () => cargarDatos();
  document.getElementById('mv-panel-close').onclick = () => cerrarPanel();

  /* ── Tabs vista ── */
  let vistaActual = 'mapa';
  document.querySelectorAll('.mv-view-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.mv-view-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      vistaActual = tab.dataset.view;
      const canvas = document.getElementById('mv-mapa-canvas');
      const grid   = document.getElementById('mv-grid-view');
      if(vistaActual === 'mapa'){
        canvas.style.display = '';
        grid.classList.remove('visible');
      } else {
        canvas.style.display = 'none';
        grid.classList.add('visible');
      }
    });
  });

  /* ============================================================
     ESTADO LOCAL
     mesasActuales reemplaza MESAS — se recarga en cada
     cargarDatos() para reflejar altas/bajas sin recargar la página.
  ============================================================ */
  let mesasActuales     = [];
  let elementosActuales = [];
  let datosActuales     = { sesiones:[], pedidos:[] };
  let mesaSeleccionada  = null;
  /* ── Cargar datos ── */
  async function cargarDatos(){
    const [
      mesas,
      elementos,
      { data: sesiones },
      { data: pedidos }
    ] = await Promise.all([
      getTables(),
      getMapElements(),
      supabase.rpc('get_table_sessions'),
      supabase
        .from('orders')
        .select('id,table_id,status,items,total,created_at,session_id,notes')
        .in('status', ['pendiente','preparando','listo'])
    ]);

    mesasActuales     = mesas.filter(m => m.active);
    elementosActuales = elementos;
    datosActuales     = { sesiones: sesiones||[], pedidos: pedidos||[] };

    dibujarMapa();
    dibujarGrid();
    if(mesaSeleccionada !== null) renderPanel(mesaSeleccionada);
  }

  /* ── Helpers de estado ── */
  function estadoMesa(mesa){
    const { sesiones, pedidos } = datosActuales;
    const sesion = sesiones.find(
      s => Number(s.table_id) === mesa.id && s.status === 'active'
    );
    const pedidosMesa = sesion
      ? pedidos.filter(
          o => Number(o.table_id) === mesa.id && o.session_id === sesion.id
        )
      : [];
    const pendientes = pedidosMesa.filter(
      o => o.status === 'pendiente' || o.status === 'preparando'
    ).length;
    const total = pedidosMesa.reduce((s,o) => s + Number(o.total||0), 0);
    const mins  = sesion
      ? Math.max(0, Math.floor((Date.now() - new Date(sesion.started_at).getTime()) / 60000))
      : 0;

    let estado = 'libre';
    if(sesion && pendientes > 0) estado = 'pendiente';
    else if(sesion)              estado = 'activa';

    return { sesion, pedidosMesa, pendientes, total, mins, estado };
  }

  /* ── Dibujar mapa ── */
  function dibujarMapa(){
    /* Dibujar elementos estructurales desde Supabase */
    const zonasEl = document.getElementById('mv-zonas-container');
    if(zonasEl){
      zonasEl.innerHTML = elementosActuales.map(el => `
        <div class="mv-zona" style="
          left:${el.position_x}%;
          top:${el.position_y}%;
          width:${el.width}%;
          height:${el.height}%;
          transform:translate(-50%,-50%) rotate(${el.rotation || 0}deg);
        ">
          ${esc(el.label || el.type)}
        </div>`).join('');
    }

    /* Dibujar mesas desde Supabase */
    const nodesEl = document.getElementById('mv-mesas-nodes');
    if(!nodesEl) return;

    nodesEl.innerHTML = mesasActuales.map(mesa => {
      const { estado, pendientes } = estadoMesa(mesa);
      const isSelected = mesaSeleccionada === mesa.id;
      const subTxt = estado === 'libre'     ? 'Libre'
                   : estado === 'pendiente' ? 'Pendiente'
                   : 'Activa';

      /* Forma visual de la mesa */
      const borderRadius = mesa.shape === 'round' ? '50%'
                         : mesa.shape === 'square' ? '6px'
                         : '4px';

      return `
        <div class="mv-mesa-node" data-mesa-id="${mesa.id}"
          style="
            left:${mesa.position_x}%;
            top:${mesa.position_y}%;
            width:${mesa.width * 7}px;
            height:${mesa.height * 7}px;
            transform:translate(-50%,-50%) rotate(${mesa.rotation || 0}deg);
          ">
          <div class="mv-mesa-circle ${estado}${isSelected ? ' selected' : ''}"
            style="
              width:100%; height:100%;
              border-radius:${borderRadius};
            ">
            ${pendientes > 0
              ? `<div class="mv-mesa-badge">${pendientes}</div>`
              : ''}
            <span class="mv-mesa-num">${mesa.id}</span>
            <span class="mv-mesa-sub">${subTxt}</span>
          </div>
          <div class="mv-mesa-label">${esc(mesa.nombre)}</div>
        </div>`;
    }).join('');

    nodesEl.querySelectorAll('.mv-mesa-node').forEach(node => {
      node.onclick = () => {
        const id = Number(node.dataset.mesaId);
        mesaSeleccionada === id ? cerrarPanel() : abrirPanel(id);
      };
    });
  }

  /* ── Dibujar grid lista ── */
  function dibujarGrid(){
    const grid = document.getElementById('mv-grid-view');
    if(!grid) return;

    grid.innerHTML = mesasActuales.map(mesa => {
      const { estado, pedidosMesa, pendientes, total, mins, sesion } = estadoMesa(mesa);
      const badgeCls = {
        libre:     'mv-gcb-libre',
        activa:    'mv-gcb-activa',
        pendiente: 'mv-gcb-pendiente'
      }[estado];
      const badgeTxt = {
        libre:     'Disponible',
        activa:    'Activa',
        pendiente: 'Pendiente'
      }[estado];

      return `
        <div class="mv-grid-card ${estado}" data-mesa-id="${mesa.id}">
          <div class="mv-gc-top">
            <div class="mv-gc-num">${esc(mesa.nombre)}</div>
            <span class="mv-gc-badge ${badgeCls}">${badgeTxt}</span>
          </div>
          ${sesion ? `
            <div class="mv-gc-stats">
              <div class="mv-gc-stat">
                <div class="mv-gc-stat-val">${pedidosMesa.length}</div>
                <div class="mv-gc-stat-label">Pedidos</div>
              </div>
              <div class="mv-gc-stat">
                <div class="mv-gc-stat-val">${pendientes}</div>
                <div class="mv-gc-stat-label">Pendientes</div>
              </div>
            </div>
            <div class="mv-gc-info">Activa hace ${mins} min · S/ ${total.toFixed(2)}</div>
            <button class="mv-gc-btn mv-gc-btn-cerrar" data-close="${mesa.id}">Cerrar mesa</button>
          ` : `
            <div class="mv-gc-info" style="margin:8px 0 14px;">Sin actividad</div>
            <button class="mv-gc-btn mv-gc-btn-abrir" data-open="${mesa.id}">Abrir mesa</button>
          `}
        </div>`;
    }).join('');

    /* Click en card → panel */
    grid.querySelectorAll('.mv-grid-card').forEach(card => {
      card.addEventListener('click', e => {
        if(e.target.closest('button')) return;
        const id = Number(card.dataset.mesaId);
        mesaSeleccionada === id ? cerrarPanel() : abrirPanel(id);
      });
    });

    /* Botones abrir/cerrar en grid */
    grid.querySelectorAll('[data-open]').forEach(btn => {
      btn.onclick = async e => {
        e.stopPropagation();
        await accionAbrir(Number(btn.dataset.open), btn);
      };
    });
    grid.querySelectorAll('[data-close]').forEach(btn => {
      btn.onclick = async e => {
        e.stopPropagation();
        await accionCerrar(Number(btn.dataset.close), btn);
      };
    });
  }

  /* ── Acciones abrir/cerrar ── */
  async function accionAbrir(mesaId, btn){
    btn.disabled    = true;
    btn.textContent = 'Abriendo…';
    const { error } = await supabase.rpc('open_table_session', { p_table_id: mesaId });
    if(error){
      btn.disabled    = false;
      btn.textContent = 'Abrir mesa';
      mostrarMsg('No se pudo abrir la mesa.');
      return;
    }
    mesaSeleccionada = mesaId;
    await cargarDatos();
    abrirPanel(mesaId);
  }

  async function accionCerrar(mesaId, btn){
    /* Buscar en mesasActuales en lugar de MESAS */
    const mesa = mesasActuales.find(m => m.id === mesaId);
    if(!mesa) return;

    const { pendientes, sesion } = estadoMesa(mesa);
    const ok = pendientes > 0
      ? confirm(`La mesa tiene ${pendientes} pedido(s) en proceso.\n¿Seguro que deseas cerrarla?`)
      : confirm('¿Cerrar esta mesa?');

    if(!ok) return;

    btn.disabled    = true;
    btn.textContent = 'Cerrando…';

    const { error } = await supabase.rpc('close_table_session', { p_table_id: mesaId });
    if(error){
      btn.disabled    = false;
      btn.textContent = 'Cerrar mesa';
      mostrarMsg('No se pudo cerrar la mesa.');
      return;
    }
    if(mesaSeleccionada === mesaId) cerrarPanel();
    await cargarDatos();
  }

  /* ── Panel lateral ── */
  function abrirPanel(mesaId){
    mesaSeleccionada = mesaId;
    document.getElementById('mv-panel').classList.remove('cerrado');
    renderPanel(mesaId);
    dibujarMapa();
    dibujarGrid();
  }

  function cerrarPanel(){
    mesaSeleccionada = null;
    document.getElementById('mv-panel').classList.add('cerrado');
    dibujarMapa();
    dibujarGrid();
  }

  function renderPanel(mesaId){
    /* Buscar en mesasActuales en lugar de MESAS */
    const mesa = mesasActuales.find(m => m.id === mesaId);
    if(!mesa) return;

    const { sesion, pedidosMesa, pendientes, total, mins, estado } = estadoMesa(mesa);

    const estadoColor = estado === 'pendiente' ? '#c49520'
                      : estado === 'activa'    ? '#4a6e48'
                      : '#9e9890';
    const estadoTxt   = estado === 'pendiente' ? 'Con pedidos pendientes'
                      : estado === 'activa'    ? 'Activa'
                      : 'Disponible';

    document.getElementById('mv-panel-nombre').textContent =
      mesa.nombre || `Mesa ${mesaId}`;
    document.getElementById('mv-panel-estado').innerHTML =
      `<span style="color:${estadoColor};">● ${estadoTxt}</span>`;

    /* Stats */
    document.getElementById('mv-panel-stats').innerHTML = sesion ? `
      <div class="mv-ps"><div class="mv-ps-val">${mins}</div><div class="mv-ps-label">Min</div></div>
      <div class="mv-ps"><div class="mv-ps-val">${pedidosMesa.length}</div><div class="mv-ps-label">Pedidos</div></div>
      <div class="mv-ps"><div class="mv-ps-val" style="font-size:14px;">S/${total.toFixed(0)}</div><div class="mv-ps-label">Total</div></div>
    ` : `
      <div class="mv-ps" style="grid-column:1/-1;text-align:center;">
        <div class="mv-ps-val" style="font-size:13px;color:#9e9890;">Sin sesión</div>
      </div>`;

    /* Body — pedidos */
    const bodyEl = document.getElementById('mv-panel-body');
    if(!sesion){
      bodyEl.innerHTML = `
        <div class="mv-empty">Mesa disponible.<br>Ábrela cuando llegue el cliente.</div>`;
    } else if(pedidosMesa.length === 0){
      bodyEl.innerHTML = `
        <div class="mv-empty">Sin pedidos en esta sesión.</div>`;
    } else {
      const pillCls = {
        pendiente: 'mvp-pendiente',
        preparando:'mvp-preparando',
        listo:     'mvp-listo'
      };
      const pillTxt = {
        pendiente: 'Pendiente',
        preparando:'Preparando',
        listo:     'Listo'
      };
      bodyEl.innerHTML = `
        <div class="mv-panel-sec">Pedidos de esta sesión</div>
        ${pedidosMesa.map(o => {
          const items = Array.isArray(o.items)
            ? o.items.map(i => `${esc(String(i.qty))}× ${esc(i.name)}`).join('<br>')
            : '';
          return `
            <div class="mv-pedido-card">
              <div class="mv-pedido-top">
                <span class="mv-pedido-id">#${esc(o.id.slice(0,8).toUpperCase())}</span>
                <span class="mv-pedido-pill ${pillCls[o.status]||''}">${pillTxt[o.status]||o.status}</span>
              </div>
              <div class="mv-pedido-items">${items}</div>
              ${o.notes
                ? `<div style="font-size:11px;color:#9e9890;font-style:italic;margin-top:4px;">"${esc(o.notes)}"</div>`
                : ''}
              <div class="mv-pedido-total">S/ ${Number(o.total).toFixed(2)}</div>
            </div>`;
        }).join('')}`;
    }

    /* Footer */
    const footerEl = document.getElementById('mv-panel-footer');
    if(sesion){
      footerEl.innerHTML = `
        <button class="mv-pfooter-btn mv-pfooter-cerrar" id="mv-fp-cerrar">
          <i class="ti ti-lock" aria-hidden="true"></i> Cerrar mesa
        </button>`;
      document.getElementById('mv-fp-cerrar').onclick = async () => {
        await accionCerrar(mesaId, document.getElementById('mv-fp-cerrar'));
      };
    } else {
      footerEl.innerHTML = `
        <button class="mv-pfooter-btn mv-pfooter-abrir" id="mv-fp-abrir">
          <i class="ti ti-lock-open" aria-hidden="true"></i> Abrir mesa
        </button>`;
      document.getElementById('mv-fp-abrir').onclick = async () => {
        await accionAbrir(mesaId, document.getElementById('mv-fp-abrir'));
      };
    }
  }

  function mostrarMsg(txt){
    const el = document.getElementById('mv-msg');
    if(!el) return;
    el.textContent = txt;
    setTimeout(() => { if(el.textContent === txt) el.textContent = ''; }, 4000);
  }

  /* ── Carga inicial ── */
  await cargarDatos();

  /* ── Realtime — sin cambios ── */
  supabase.channel('mv-realtime')
    .on('postgres_changes', { event:'*', schema:'public', table:'orders' },
      async () => { await cargarDatos(); })
    .on('postgres_changes', { event:'*', schema:'public', table:'table_sessions' },
      async () => { await cargarDatos(); })
    .subscribe();
}
