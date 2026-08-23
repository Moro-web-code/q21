/* ============================================================
   ADMINISTRATOR — Panel de Administrador
   Cambios respecto al original:
   - Eliminada dependencia de MESAS (constants.js)
   - Nueva sección "Mesas" en sidebar
   - cargarInicio() y cargarQR() usan getTables() desde Supabase
   - CRUD de mesas: crear, editar nombre, activar/desactivar, QR
   ============================================================ */

import { supabase }   from '../config/supabase.js';
import { RESTAURANT } from '../config/constants.js';
import { esc, getTableTokens, getTables } from '../customer/customer.js';
import { openMapEditor } from './map-editor.js';
import { renderAdministradorLogin } from '../auth/login.js';

const baseUrl = window.location.origin + window.location.pathname;

export async function renderAdministrador(){
  const app = document.getElementById('app');

  const { data: { session } } = await supabase.auth.getSession();
  if(!session){ renderAdministradorLogin(); return; }

  /* Obtener user id para RPCs que verifican rol */
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  /* Inyectar estilos del dashboard una sola vez */
  if(!document.getElementById('admin-dash-style')){
    const st = document.createElement('style');
    st.id = 'admin-dash-style';
    st.textContent = `
      #admin-layout{ display:flex; height:100vh; overflow:hidden; font-family:'JetBrains Mono',monospace; }
      #admin-sidebar{ width:220px; min-width:220px; background:#1a1814; border-right:1px solid #2e2b25; display:flex; flex-direction:column; }
      .sb-brand{ padding:20px 18px 16px; border-bottom:1px solid #2e2b25; }
      .sb-logo{ display:flex; align-items:center; gap:10px; }
      .sb-logo-box{ width:30px; height:30px; background:var(--rust); border-radius:6px; display:flex; align-items:center; justify-content:center; font-family:'Archivo',sans-serif; font-weight:900; font-size:13px; color:#fff; }
      .sb-logo-name{ font-family:'Archivo',sans-serif; font-weight:900; font-size:15px; color:var(--cream-text); }
      .sb-logo-sub{ font-size:10px; color:#55504a; margin-top:1px; }
      .sb-nav{ padding:10px 8px; flex:1; }
      .sb-section{ font-size:9px; letter-spacing:.14em; text-transform:uppercase; color:#55504a; padding:10px 10px 6px; }
      .sb-item{ display:flex; align-items:center; gap:10px; padding:9px 10px; border-radius:6px; cursor:pointer; color:#8a8278; font-size:12.5px; margin-bottom:2px; transition:background .12s,color .12s; border:none; background:none; width:100%; text-align:left; font-family:'JetBrains Mono',monospace; }
      .sb-item:hover{ background:#242019; color:var(--cream-text); }
      .sb-item.active{ background:#2a1f1a; color:var(--rust); }
      .sb-item i{ font-size:16px; width:18px; text-align:center; }
      .sb-footer{ padding:14px 16px; border-top:1px solid #2e2b25; }
      .sb-user{ display:flex; align-items:center; gap:10px; }
      .sb-avatar{ width:30px; height:30px; border-radius:50%; background:#2e2b25; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:#8a8278; }
      .sb-uname{ font-size:12px; font-weight:500; color:var(--cream-text); }
      .sb-urole{ font-size:10px; color:#55504a; }

      #admin-main{ flex:1; display:flex; flex-direction:column; overflow:hidden; background:#f5f3ef; }
      #admin-topbar{ height:54px; background:#fff; border-bottom:1px solid #e8e4dc; display:flex; align-items:center; justify-content:space-between; padding:0 26px; flex-shrink:0; }
      .atb-title{ font-family:'Archivo',sans-serif; font-weight:900; font-size:15px; color:#1c1a17; letter-spacing:-.01em; }
      .atb-right{ display:flex; align-items:center; gap:10px; }
      .atb-date{ background:#f5f3ef; border:1px solid #e8e4dc; border-radius:999px; font-size:11px; color:#6b6560; padding:4px 12px; }
      .atb-btn{ background:#fff; border:1px solid #e8e4dc; border-radius:6px; padding:7px 14px; font-size:12px; font-weight:500; color:#6b6560; cursor:pointer; display:flex; align-items:center; gap:6px; font-family:'JetBrains Mono',monospace; }
      .atb-btn:hover{ border-color:#c8c4bc; color:#1c1a17; }
      .atb-btn.primary{ background:var(--rust); color:#fff; border-color:var(--rust); }

      #admin-content{ flex:1; overflow-y:auto; padding:26px; }
      #admin-content::-webkit-scrollbar{ width:4px; }
      #admin-content::-webkit-scrollbar-thumb{ background:#d4cfc4; border-radius:4px; }

      .adash-page{ display:none; }
      .adash-page.active{ display:block; }

      .dash-stats{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:22px; }
      .dash-stat{ background:#fff; border:1px solid #e8e4dc; border-radius:10px; padding:16px 18px; }
      .ds-label{ font-size:11px; color:#9e9890; font-weight:500; letter-spacing:.02em; margin-bottom:8px; }
      .ds-value{ font-family:'Archivo',sans-serif; font-weight:900; font-size:26px; color:#1c1a17; letter-spacing:-.02em; line-height:1; }
      .ds-sub{ font-size:11px; color:#9e9890; margin-top:5px; }
      .ds-icon{ float:right; width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:16px; }
      .dsi-rust{ background:#fdf1ed; color:var(--rust); }
      .dsi-sage{ background:#edf4ec; color:#4a6e48; }
      .dsi-mustard{ background:#fdf8ec; color:#c49520; }
      .dsi-gray{ background:#f2f0ec; color:#6b6560; }

      .dash-two{ display:grid; grid-template-columns:1fr 1fr; gap:18px; }
      .dash-card{ background:#fff; border:1px solid #e8e4dc; border-radius:12px; overflow:hidden; }
      .dc-head{ padding:14px 18px; border-bottom:1px solid #f0ede8; display:flex; align-items:center; justify-content:space-between; }
      .dc-title{ font-size:13px; font-weight:600; color:#1c1a17; font-family:'Archivo',sans-serif; }
      .dc-sub{ font-size:11px; color:#9e9890; margin-top:2px; }
      .dc-body{ padding:14px 18px; }

      .mesas-tiles{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }
      .mesa-tile{ border:1px solid #e8e4dc; border-radius:8px; padding:11px 12px; display:flex; align-items:center; gap:10px; }
      .mt-dot{ width:10px; height:10px; border-radius:50%; flex-shrink:0; }
      .mt-name{ font-size:12.5px; font-weight:500; color:#1c1a17; }
      .mt-info{ font-size:11px; color:#9e9890; margin-top:1px; }
      .mt-badge{ margin-left:auto; font-size:10px; font-weight:600; padding:2px 8px; border-radius:999px; }
      .mtd-libre{ background:#c8c5c0; }
      .mtd-activa{ background:#4a6e48; }
      .mtd-pendiente{ background:#c49520; }
      .mtb-libre{ background:#f0ede8; color:#6b6560; }
      .mtb-activa{ background:#edf4ec; color:#4a6e48; }
      .mtb-pendiente{ background:#fdf8ec; color:#c49520; }

      .order-row{ padding:10px 0; border-bottom:1px solid #f0ede8; display:flex; align-items:center; gap:10px; font-size:12px; }
      .order-row:last-child{ border-bottom:none; }
      .or-mesa{ font-weight:600; color:#1c1a17; width:54px; flex-shrink:0; }
      .or-time{ color:#9e9890; width:42px; flex-shrink:0; }
      .or-items{ flex:1; color:#6b6560; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .or-total{ font-weight:600; color:#1c1a17; white-space:nowrap; }
      .or-pill{ font-size:10px; font-weight:600; padding:2px 8px; border-radius:999px; white-space:nowrap; }
      .op-prep{ background:#fdf1ed; color:var(--rust); }
      .op-listo{ background:#edf4ec; color:#4a6e48; }
      .op-pend{ background:#fdf8ec; color:#c49520; }
      .op-entr{ background:#f0ede8; color:#6b6560; }

      .adash-tabs{ display:flex; gap:2px; background:#e8e4dc; border-radius:8px; padding:3px; margin-bottom:18px; }
      .adash-tab{ padding:7px 14px; border-radius:6px; font-size:12px; font-weight:500; color:#6b6560; cursor:pointer; border:none; background:none; font-family:'JetBrains Mono',monospace; transition:background .12s; }
      .adash-tab.active{ background:#fff; color:#1c1a17; }
      .pedido-card{ background:#fff; border:1px solid #e8e4dc; border-radius:10px; padding:16px 18px; margin-bottom:12px; }
      .pc-id{ font-size:10px; font-weight:700; letter-spacing:.1em; color:#9e9890; text-transform:uppercase; }
      .pc-mesa{ font-family:'Archivo',sans-serif; font-weight:900; font-size:16px; color:#1c1a17; margin-top:2px; }
      .pc-time{ font-size:11px; color:#9e9890; margin-top:1px; }
      .pc-items-text{ font-size:12.5px; color:#6b6560; margin:10px 0; line-height:1.6; }
      .pc-foot{ display:flex; align-items:center; justify-content:space-between; padding-top:10px; border-top:1px solid #f0ede8; }
      .pc-total-val{ font-family:'Archivo',sans-serif; font-weight:900; font-size:16px; color:#1c1a17; }
      .pc-actions{ display:flex; gap:8px; }
      .pc-btn{ padding:7px 14px; border-radius:6px; font-size:11.5px; font-weight:500; cursor:pointer; border:1px solid #e8e4dc; background:#f5f3ef; color:#6b6560; font-family:'JetBrains Mono',monospace; }
      .pc-btn.advance{ background:var(--rust); color:#fff; border-color:var(--rust); }

      .page-header{ display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
      .ph-title{ font-family:'Archivo',sans-serif; font-weight:900; font-size:20px; color:#1c1a17; letter-spacing:-.02em; }
      .ph-sub{ font-size:12px; color:#9e9890; margin-top:3px; }
      .cat-sep{ display:flex; align-items:center; gap:10px; margin:20px 0 12px; }
      .cat-sep-label{ font-size:11.5px; font-weight:600; color:#6b6560; letter-spacing:.04em; white-space:nowrap; }
      .cat-sep-line{ flex:1; height:1px; background:#e8e4dc; }
      .menu-grid-dash{ display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:14px; }
      .menu-card-dash{ background:#fff; border:1px solid #e8e4dc; border-radius:10px; overflow:hidden; }
      .mc-img{ height:100px; background:#f5f3ef; display:flex; align-items:center; justify-content:center; color:#c8c5c0; font-size:32px; }
      .mc-body{ padding:12px 14px; }
      .mc-cat-label{ font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:#9e9890; font-weight:500; margin-bottom:4px; }
      .mc-name{ font-size:13.5px; font-weight:600; color:#1c1a17; margin-bottom:3px; font-family:'Archivo',sans-serif; }
      .mc-desc{ font-size:11.5px; color:#9e9890; line-height:1.5; margin-bottom:8px; }
      .mc-row{ display:flex; align-items:center; justify-content:space-between; }
      .mc-price{ font-family:'Archivo',sans-serif; font-weight:900; font-size:15px; color:#1c1a17; }
      .mc-on{ font-size:11px; color:#4a6e48; font-weight:500; display:flex; align-items:center; gap:4px; }
      .mc-on-dot{ width:6px; height:6px; border-radius:50%; background:#4a6e48; }
      .mc-off{ font-size:11px; color:#9e9890; font-weight:500; display:flex; align-items:center; gap:4px; }
      .mc-off-dot{ width:6px; height:6px; border-radius:50%; background:#c8c5c0; }
      .mc-actions{ display:flex; gap:6px; padding:0 14px 12px; }
      .mc-action-btn{ flex:1; padding:6px 0; border-radius:6px; font-size:11px; font-weight:500; cursor:pointer; border:1px solid #e8e4dc; background:#f5f3ef; color:#6b6560; font-family:'JetBrains Mono',monospace; text-align:center; }
      .mc-action-btn.del{ color:var(--rust); border-color:#f0c4b4; background:#fdf1ed; }

      .qr-intro{ font-size:13px; color:#6b6560; margin-bottom:20px; }
      .qr-grid-dash{ display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:16px; }
      .qr-card-dash{ background:#fff; border:1px solid #e8e4dc; border-radius:10px; padding:20px 16px; text-align:center; }
      .qr-card-name{ font-size:13px; font-weight:600; color:#1c1a17; margin-bottom:12px; font-family:'Archivo',sans-serif; }
      .qr-img-wrap{ width:110px; height:110px; background:#f5f3ef; border:1px solid #e8e4dc; border-radius:6px; margin:0 auto 14px; display:flex; align-items:center; justify-content:center; }
      .qr-dl-btn{ width:100%; padding:8px 0; border-radius:6px; font-size:12px; font-weight:500; cursor:pointer; border:1px solid #e8e4dc; background:#f5f3ef; color:#6b6560; display:flex; align-items:center; justify-content:center; gap:6px; font-family:'JetBrains Mono',monospace; }
      .qr-dl-btn:hover{ border-color:#c8c4bc; color:#1c1a17; }

      .dash-loading{ text-align:center; padding:40px; color:#9e9890; font-size:13px; }

      /* ── Sección Mesas ── */
      .tables-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:16px; }
      .table-mgmt-card{ background:#fff; border:1px solid #e8e4dc; border-radius:12px; overflow:hidden; transition:box-shadow .15s; }
      .table-mgmt-card:hover{ box-shadow:0 4px 18px rgba(0,0,0,.07); }
      .tmc-head{ padding:14px 16px; display:flex; align-items:center; gap:12px; border-bottom:1px solid #f0ede8; }
      .tmc-num{ width:34px; height:34px; border-radius:8px; background:#f5f3ef; display:flex; align-items:center; justify-content:center; font-family:'Archivo',sans-serif; font-weight:900; font-size:14px; color:#1c1a17; flex-shrink:0; }
      .tmc-info{ flex:1; min-width:0; }
      .tmc-name{ font-size:13.5px; font-weight:600; color:#1c1a17; font-family:'Archivo',sans-serif; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .tmc-id{ font-size:10px; color:#9e9890; margin-top:1px; }
      .tmc-badge{ font-size:10px; font-weight:600; padding:3px 9px; border-radius:999px; white-space:nowrap; }
      .tmc-badge.on{ background:#edf4ec; color:#4a6e48; }
      .tmc-badge.off{ background:#f5f3ef; color:#9e9890; }
      .tmc-qr{ padding:16px; display:flex; justify-content:center; background:#fafaf8; border-bottom:1px solid #f0ede8; }
      .tmc-qr img{ display:block; border-radius:4px; }
      .tmc-qr-notoken{ font-size:11px; color:#9e9890; padding:20px 0; text-align:center; }
      .tmc-actions{ padding:12px 14px; display:flex; gap:8px; flex-wrap:wrap; }
      .tmc-btn{ flex:1; min-width:70px; padding:7px 10px; border-radius:7px; font-size:11px; font-weight:500; cursor:pointer; border:1px solid #e8e4dc; background:#f5f3ef; color:#6b6560; font-family:'JetBrains Mono',monospace; text-align:center; transition:background .12s,border-color .12s; white-space:nowrap; }
      .tmc-btn:hover{ border-color:#c8c4bc; color:#1c1a17; }
      .tmc-btn.primary{ background:var(--rust); color:#fff; border-color:var(--rust); }
      .tmc-btn.primary:hover{ background:#c0502a; }
      .tmc-btn.danger{ color:var(--rust); border-color:#f0c4b4; background:#fdf1ed; }
      .tmc-btn.danger:hover{ background:#fae0d8; }
      .tmc-btn:disabled{ opacity:.5; cursor:not-allowed; }
    `;
    document.head.appendChild(st);
  }

  app.style.padding  = '0';
  app.style.maxWidth = 'none';

  app.innerHTML = `
    <div id="admin-layout">
      <aside id="admin-sidebar">
        <div class="sb-brand">
          <div class="sb-logo">
            <div class="sb-logo-box">RL</div>
            <div>
              <div class="sb-logo-name">${esc(RESTAURANT)}</div>
              <div class="sb-logo-sub">Panel de gestión</div>
            </div>
          </div>
        </div>
        <nav class="sb-nav">
          <div class="sb-section">General</div>
          <button class="sb-item active" data-adash="inicio">
            <i class="ti ti-layout-dashboard"></i> Inicio
          </button>
          <button class="sb-item" data-adash="pedidos">
            <i class="ti ti-receipt"></i> Pedidos
          </button>
          <button class="sb-item" data-adash="menu">
            <i class="ti ti-bowl"></i> Menú
          </button>
          <div class="sb-section">Configuración</div>
<button class="sb-item" data-adash="mesas">
  <i class="ti ti-armchair"></i> Mesas
</button>
<button class="sb-item" data-adash="qr">
  <i class="ti ti-qrcode"></i> Códigos QR
</button>
<button class="sb-item" data-adash="mapa">
  <i class="ti ti-layout-board"></i> Mapa
</button>
        </nav>
        <div class="sb-footer">
          <div class="sb-user">
            <div class="sb-avatar">AD</div>
            <div>
              <div class="sb-uname">Administrador</div>
              <div class="sb-urole">Admin</div>
            </div>
          </div>
        </div>
      </aside>

      <div id="admin-main">
        <div id="admin-topbar">
          <span class="atb-title" id="adash-topbar-title">Inicio</span>
          <div class="atb-right">
            <span class="atb-date" id="adash-date"></span>
            <button class="atb-btn" id="adash-refresh-btn">↻ Actualizar</button>
            <button class="atb-btn primary" id="adash-add-btn" style="display:none">+ Añadir</button>
            <button class="atb-btn" id="adash-logout-btn">← Salir</button>
          </div>
        </div>

        <div id="admin-content">

          <!-- INICIO -->
          <div class="adash-page active" id="adash-inicio">
            <div class="dash-stats" id="adash-stats">
              <div class="dash-stat"><div class="ds-icon dsi-rust">▣</div><div class="ds-label">Pedidos de hoy</div><div class="ds-value" id="ds-orders">—</div></div>
              <div class="dash-stat"><div class="ds-icon dsi-sage">S/</div><div class="ds-label">Ventas de hoy</div><div class="ds-value" id="ds-sales">—</div></div>
              <div class="dash-stat"><div class="ds-icon dsi-mustard">⊡</div><div class="ds-label">Mesas activas</div><div class="ds-value" id="ds-mesas">—</div></div>
              <div class="dash-stat"><div class="ds-icon dsi-gray">≡</div><div class="ds-label">Ticket promedio</div><div class="ds-value" id="ds-avg">—</div></div>
            </div>
            <div class="dash-two">
              <div class="dash-card">
                <div class="dc-head">
                  <div><div class="dc-title">Estado de mesas</div><div class="dc-sub">En tiempo real</div></div>
                </div>
                <div class="dc-body">
                  <div class="mesas-tiles" id="adash-mesas-tiles">
                    <div class="dash-loading">Cargando…</div>
                  </div>
                </div>
              </div>
              <div class="dash-card">
                <div class="dc-head">
                  <div><div class="dc-title">Pedidos recientes</div><div class="dc-sub">Últimos del día</div></div>
                </div>
                <div class="dc-body" style="padding-top:6px;">
                  <div id="adash-recent-orders"><div class="dash-loading">Cargando…</div></div>
                </div>
              </div>
            </div>
          </div>

          <!-- PEDIDOS -->
          <div class="adash-page" id="adash-pedidos">
            <div class="page-header">
              <div><div class="ph-title">Pedidos</div><div class="ph-sub">Gestión de pedidos activos</div></div>
            </div>
            <div class="adash-tabs" id="adash-tabs">
              <button class="adash-tab active" data-filter="todos">Todos</button>
              <button class="adash-tab" data-filter="pendiente">Pendientes</button>
              <button class="adash-tab" data-filter="preparando">En preparación</button>
              <button class="adash-tab" data-filter="listo">Listos</button>
              <button class="adash-tab" data-filter="entregado">Entregados</button>
            </div>
            <div id="adash-pedidos-list"><div class="dash-loading">Cargando…</div></div>
          </div>

          <!-- MENU -->
          <div class="adash-page" id="adash-menu">
            <div class="page-header">
              <div><div class="ph-title">Menú</div><div class="ph-sub">Productos del restaurante</div></div>
            </div>
            <div id="adash-menu-content"><div class="dash-loading">Cargando…</div></div>
          </div>

          <!-- MESAS -->
          <div class="adash-page" id="adash-mesas">
            <div class="page-header">
              <div><div class="ph-title">Mesas</div><div class="ph-sub">Gestión de mesas del restaurante</div></div>
            </div>
            <div class="tables-grid" id="adash-tables-grid">
              <div class="dash-loading">Cargando…</div>
            </div>
          </div>

          <!-- QR -->
          <div class="adash-page" id="adash-qr">
            <div class="page-header">
              <div><div class="ph-title">Códigos QR</div><div class="ph-sub">Uno por mesa</div></div>
            </div>
            <p class="qr-intro">Descarga los códigos QR para colocarlos en las mesas.</p>
            <div class="qr-grid-dash" id="adash-qr-grid"><div class="dash-loading">Cargando…</div></div>
          </div>

          <!-- MAPA -->
          <div class="adash-page" id="adash-mapa">
            <div class="page-header">
              <div>
                <div class="ph-title">Mapa</div>
                <div class="ph-sub">Diseño visual del restaurante</div>
              </div>
            </div>
            <div id="adash-mapa-content">
              <p style="font-size:13px;color:#9e9890;margin-bottom:20px;">
                Diseña la distribución del restaurante arrastrando mesas y elementos.
              </p>
              <button class="atb-btn primary" id="adash-open-editor" style="width:fit-content;">
                ✏ Abrir diseñador
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;

  /* Tabler Icons */
  if(!document.querySelector('link[href*="tabler-icons"]')){
    const lk = document.createElement('link');
    lk.rel  = 'stylesheet';
    lk.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.47.0/tabler-icons.min.css';
    document.head.appendChild(lk);
  }

  document.getElementById('adash-date').textContent =
    new Date().toLocaleDateString('es-PE',{weekday:'short',day:'numeric',month:'short'});

  /* Logout */
  document.getElementById('adash-logout-btn').onclick = async () => {
    app.style.padding  = '';
    app.style.maxWidth = '';
    await supabase.auth.signOut();
    renderAdministradorLogin();
  };

  /* Navegación */
  let paginaActual = 'inicio';
   const titulos = {
  inicio: 'Inicio',
  pedidos:'Pedidos',
  menu:   'Menú',
  mesas:  'Mesas',
  qr:     'Códigos QR',
  mapa:   'Mapa del restaurante'
};
const addBtnLabels = {
  menu:  '+ Añadir producto',
  mesas: '+ Nueva mesa',
  mapa:  'Diseñar mapa'
};
  document.querySelectorAll('.sb-item[data-adash]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.adash;
      document.querySelectorAll('.sb-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.adash-page').forEach(p => p.classList.remove('active'));
      document.getElementById('adash-' + key).classList.add('active');
      document.getElementById('adash-topbar-title').textContent = titulos[key];
      const addBtn = document.getElementById('adash-add-btn');
      if(addBtnLabels[key]){
        addBtn.style.display  = 'flex';
        addBtn.textContent    = addBtnLabels[key];
      } else {
        addBtn.style.display  = 'none';
      }
      paginaActual = key;
      cargarPagina(key);
    });
  });

  /* Tabs pedidos */
  let filtroActual = 'todos';
  document.querySelectorAll('.adash-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.adash-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filtroActual = tab.dataset.filter;
      renderPedidos(filtroActual);
    });
  });

  document.getElementById('adash-refresh-btn').onclick = () => cargarPagina(paginaActual);

  document.getElementById('adash-add-btn').onclick = () => {
    if(paginaActual === 'menu')  abrirModalProducto();
    if(paginaActual === 'mesas') abrirModalMesa();
  };

  /* ── Carga por página ── */
  async function cargarPagina(key){
    if(key === 'inicio')  await cargarInicio();
    if(key === 'pedidos') await cargarPedidos();
    if(key === 'menu')    await cargarMenu();
    if(key === 'mesas')   await cargarMesas();
    if(key === 'qr')      await cargarQR();
  }

  /* ══════════════════════════════════════════════════════════
     INICIO
  ══════════════════════════════════════════════════════════ */
  async function cargarInicio(){
    const inicioDia = new Date(
      new Date().toLocaleDateString('en-CA',{timeZone:'America/Lima'}) + 'T00:00:00-05:00'
    );

    const [
      { data: orders  },
      { data: sesiones },
      todasMesas
    ] = await Promise.all([
      supabase.from('orders').select('id,total,status,created_at,items,table_name,table_id')
        .gte('created_at', inicioDia.toISOString())
        .order('created_at',{ascending:false}),
      supabase.rpc('get_table_sessions'),
      getTables()
    ]);

    const ords = orders   || [];
    const sess = sesiones || [];

    const totalVentas  = ords.reduce((s,o) => s + Number(o.total||0), 0);
    const ticketProm   = ords.length > 0 ? totalVentas / ords.length : 0;
    const mesasActivas = todasMesas.filter(
      m => sess.find(s => Number(s.table_id) === m.id && s.status === 'active')
    ).length;

    document.getElementById('ds-orders').textContent = ords.length;
    document.getElementById('ds-sales').textContent  = `S/ ${totalVentas.toFixed(2)}`;
    document.getElementById('ds-mesas').textContent  = `${mesasActivas} / ${todasMesas.length}`;
    document.getElementById('ds-avg').textContent    = `S/ ${ticketProm.toFixed(2)}`;

    const pedidosActivos = ords.filter(o =>
      ['pendiente','preparando','listo'].includes(o.status)
    );

    /* Tiles de mesas */
    const tilesEl = document.getElementById('adash-mesas-tiles');
    tilesEl.innerHTML = todasMesas.map(mesa => {
      const sesActiva = sess.find(s => Number(s.table_id) === mesa.id && s.status === 'active');
      const pedMesa   = pedidosActivos.filter(o => Number(o.table_id||0) === mesa.id);
      const pend      = pedMesa.filter(o =>
        o.status === 'pendiente' || o.status === 'preparando'
      ).length;

      let dotCls = 'mtd-libre', badgeCls = 'mtb-libre', badgeTxt = 'Libre', infoTxt = 'Sin actividad';
      if(sesActiva && pend > 0){
        dotCls = 'mtd-pendiente'; badgeCls = 'mtb-pendiente';
        badgeTxt = 'Pendiente'; infoTxt = `${pend} pendiente${pend>1?'s':''}`;
      } else if(sesActiva){
        dotCls = 'mtd-activa'; badgeCls = 'mtb-activa';
        badgeTxt = 'Activa'; infoTxt = `${pedMesa.length} pedido${pedMesa.length!==1?'s':''}`;
      }

      if(!mesa.active){
        dotCls = 'mtd-libre'; badgeCls = 'mtb-libre'; badgeTxt = 'Inactiva'; infoTxt = 'Desactivada';
      }

      return `
        <div class="mesa-tile">
          <div class="mt-dot ${dotCls}"></div>
          <div>
            <div class="mt-name">${esc(mesa.nombre)}</div>
            <div class="mt-info">${infoTxt}</div>
          </div>
          <span class="mt-badge ${badgeCls}">${badgeTxt}</span>
        </div>`;
    }).join('');

    /* Pedidos recientes */
    const recEl     = document.getElementById('adash-recent-orders');
    const recientes = ords.slice(0, 8);
    if(recientes.length === 0){
      recEl.innerHTML = '<div class="dash-loading">Sin pedidos hoy.</div>';
    } else {
      recEl.innerHTML = recientes.map(o => {
        const hora    = new Date(o.created_at).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'});
        const items   = Array.isArray(o.items) ? o.items.map(i=>`${i.name} ×${i.qty}`).join(', ') : '';
        const pillCls = o.status==='preparando'?'op-prep':o.status==='listo'?'op-listo':o.status==='pendiente'?'op-pend':'op-entr';
        const pillTxt = o.status==='preparando'?'Preparando':o.status==='listo'?'Listo':o.status==='pendiente'?'Pendiente':'Entregado';
        return `
          <div class="order-row">
            <span class="or-mesa">${esc(o.table_name||'')}</span>
            <span class="or-time">${hora}</span>
            <span class="or-items">${esc(items)}</span>
            <span class="or-total">S/ ${Number(o.total).toFixed(2)}</span>
            <span class="or-pill ${pillCls}">${pillTxt}</span>
          </div>`;
      }).join('');
    }
  }

  /* ══════════════════════════════════════════════════════════
     PEDIDOS
  ══════════════════════════════════════════════════════════ */
  let todosLosPedidos = [];

  async function cargarPedidos(){
    const { data } = await supabase
      .from('orders').select('*')
      .order('created_at',{ascending:false}).limit(60);

    todosLosPedidos = (data || []).map(o => ({
      id:        o.id,
      table:     o.table_name,
      tableId:   o.table_id,
      items:     o.items,
      total:     Number(o.total),
      notes:     o.notes||'',
      status:    o.status,
      createdAt: o.created_at
    }));
    renderPedidos(filtroActual);
  }

  function renderPedidos(filtro){
    const lista = filtro === 'todos'
      ? todosLosPedidos
      : todosLosPedidos.filter(o => o.status === filtro);

    const el = document.getElementById('adash-pedidos-list');
    if(lista.length === 0){ el.innerHTML='<div class="dash-loading">Sin pedidos.</div>'; return; }

    const nextLabel = {
      pendiente: 'Empezar preparación',
      preparando:'Marcar listo',
      listo:     'Marcar entregado'
    };

    el.innerHTML = lista.slice(0,20).map(o => {
      const hora    = new Date(o.createdAt).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'});
      const mins    = Math.max(0, Math.floor((Date.now()-new Date(o.createdAt).getTime())/60000));
      const items   = Array.isArray(o.items) ? o.items.map(i=>`${esc(i.name)} ×${i.qty}`).join(' · ') : '';
      const pillCls = o.status==='preparando'?'op-prep':o.status==='listo'?'op-listo':o.status==='pendiente'?'op-pend':'op-entr';
      const pillTxt = o.status==='preparando'?'En preparación':o.status==='listo'?'Listo':o.status==='pendiente'?'Pendiente':'Entregado';
      const advBtn  = nextLabel[o.status]
        ? `<button class="pc-btn advance" data-id="${esc(o.id)}" data-next="${o.status==='pendiente'?'preparando':o.status==='preparando'?'listo':'entregado'}">${nextLabel[o.status]}</button>`
        : '';

      return `
        <div class="pedido-card">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;">
            <div>
              <div class="pc-id">Pedido #${esc(o.id.slice(0,8).toUpperCase())}</div>
              <div class="pc-mesa">${esc(o.table)}</div>
              <div class="pc-time">Hace ${mins} min · ${hora}</div>
            </div>
            <span class="or-pill ${pillCls}">${pillTxt}</span>
          </div>
          <div class="pc-items-text">${items}</div>
          ${o.notes ? `<div style="font-size:11px;color:#9e9890;font-style:italic;margin-bottom:6px;">"${esc(o.notes)}"</div>` : ''}
          <div class="pc-foot">
            <span class="pc-total-val">S/ ${o.total.toFixed(2)}</span>
            <div class="pc-actions">${advBtn}</div>
          </div>
        </div>`;
    }).join('');

    el.querySelectorAll('.advance').forEach(btn => {
      btn.onclick = async () => {
        btn.disabled    = true;
        btn.textContent = 'Actualizando…';
        await supabase.from('orders').update({status: btn.dataset.next}).eq('id', btn.dataset.id);
        await cargarPedidos();
      };
    });
  }

  /* ══════════════════════════════════════════════════════════
     MENÚ
  ══════════════════════════════════════════════════════════ */
  async function cargarMenu(){
    const { data } = await supabase
      .from('menu_items').select('*')
      .order('category').order('id');

    const items = data || [];
    const el    = document.getElementById('adash-menu-content');

    if(items.length === 0){ el.innerHTML='<div class="dash-loading">Sin productos.</div>'; return; }

    const porCategoria = {};
    items.forEach(it => {
      if(!porCategoria[it.category]) porCategoria[it.category] = [];
      porCategoria[it.category].push(it);
    });

    el.innerHTML = Object.entries(porCategoria).map(([cat, prods]) => `
      <div class="cat-sep">
        <span class="cat-sep-label">${esc(cat)}</span>
        <div class="cat-sep-line"></div>
      </div>
      <div class="menu-grid-dash">
        ${prods.map(p => `
          <div class="menu-card-dash">
            <div class="mc-img"><i class="ti ti-bowl" aria-hidden="true"></i></div>
            <div class="mc-body">
              <div class="mc-cat-label">${esc(p.category)}</div>
              <div class="mc-name">${esc(p.name)}</div>
              <div class="mc-desc">${esc(p.description||'')}</div>
              <div class="mc-row">
                <span class="mc-price">S/ ${Number(p.price).toFixed(2)}</span>
                ${p.active
                  ? `<span class="mc-on"><span class="mc-on-dot"></span> Disponible</span>`
                  : `<span class="mc-off"><span class="mc-off-dot"></span> No disponible</span>`}
              </div>
            </div>
            <div class="mc-actions">
              <button class="mc-action-btn edit-product-btn" data-id="${p.id}">Editar</button>
              <button class="mc-action-btn del delete-product-btn" data-id="${p.id}">Eliminar</button>
            </div>
          </div>`).join('')}
      </div>`).join('');

    el.querySelectorAll('.edit-product-btn').forEach(btn => {
      btn.onclick = () => {
        const producto = items.find(p => String(p.id) === String(btn.dataset.id));
        if(producto) abrirModalProducto(producto);
      };
    });

    el.querySelectorAll('.delete-product-btn').forEach(btn => {
      btn.onclick = async () => {
        const producto = items.find(p => String(p.id) === String(btn.dataset.id));
        if(!producto) return;
        if(!confirm(`¿Seguro que deseas eliminar "${producto.name}"?`)) return;
        btn.disabled    = true;
        btn.textContent = 'Eliminando…';
        const { error } = await supabase.from('menu_items').delete().eq('id', btn.dataset.id);
        if(error){
          alert('No se pudo eliminar.\n\n' + error.message);
          btn.disabled    = false;
          btn.textContent = 'Eliminar';
          return;
        }
        await cargarMenu();
      };
    });
  }

  /* ══════════════════════════════════════════════════════════
     MESAS — gestión completa
  ══════════════════════════════════════════════════════════ */
  async function cargarMesas(){
    const [mesas, tokens] = await Promise.all([
      getTables(),
      getTableTokens()
    ]);

    const el = document.getElementById('adash-tables-grid');

    if(mesas.length === 0){
      el.innerHTML = '<div class="dash-loading">No hay mesas. Crea la primera.</div>';
      return;
    }

    el.innerHTML = mesas.map(mesa => {
      const td  = tokens.find(t => t.table_id === mesa.id);
      const url = td ? (() => {
        const u = new URL(baseUrl);
        u.search = '';
        u.searchParams.set('token', td.token);
        return u.toString();
      })() : null;

      const qrSrc = url
        ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=6&data=${encodeURIComponent(url)}`
        : null;

      return `
        <div class="table-mgmt-card" data-table-id="${mesa.id}">
          <div class="tmc-head">
            <div class="tmc-num">${mesa.id}</div>
            <div class="tmc-info">
              <div class="tmc-name">${esc(mesa.nombre)}</div>
              <div class="tmc-id">ID #${mesa.id}</div>
            </div>
            <span class="tmc-badge ${mesa.active ? 'on' : 'off'}">
              ${mesa.active ? 'Activa' : 'Inactiva'}
            </span>
          </div>

          <div class="tmc-qr">
            ${qrSrc
              ? `<img src="${qrSrc}" width="120" height="120" alt="QR ${esc(mesa.nombre)}">`
              : `<div class="tmc-qr-notoken">Sin token QR<br><small>Usa "Nuevo QR"</small></div>`}
          </div>

          <div class="tmc-actions">
            <button class="tmc-btn tmc-edit" data-id="${mesa.id}" data-name="${esc(mesa.nombre)}">
              Editar
            </button>
            <button class="tmc-btn ${mesa.active ? 'danger tmc-deactivate' : 'primary tmc-activate'}"
              data-id="${mesa.id}" data-active="${mesa.active}">
              ${mesa.active ? 'Desactivar' : 'Activar'}
            </button>
            <button class="tmc-btn tmc-regen" data-id="${mesa.id}" title="Regenerar QR">
              ↻ QR
            </button>
            ${url
              ? `<a href="${`https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=10&data=${encodeURIComponent(url)}`}" download="QR-${esc(mesa.nombre)}.png" target="_blank" style="flex:1;min-width:70px;">
                   <button class="tmc-btn" style="width:100%">↓ QR</button>
                 </a>`
              : ''}
          </div>
        </div>`;
    }).join('');

    /* Editar nombre */
    el.querySelectorAll('.tmc-edit').forEach(btn => {
      btn.onclick = () => abrirModalMesa({ id: Number(btn.dataset.id), nombre: btn.dataset.name });
    });

    /* Activar / Desactivar */
    el.querySelectorAll('.tmc-deactivate, .tmc-activate').forEach(btn => {
      btn.onclick = async () => {
        const id     = Number(btn.dataset.id);
        const active = btn.dataset.active === 'true';
        const accion = active ? 'desactivar' : 'activar';
        if(!confirm(`¿Seguro que deseas ${accion} esta mesa?`)) return;
        btn.disabled    = true;
        btn.textContent = 'Guardando…';
        const { error } = await supabase
          .from('tables')
          .update({ active: !active })
          .eq('id', id);
        if(error){
          alert('No se pudo actualizar.\n\n' + error.message);
          btn.disabled = false;
          return;
        }
        await cargarMesas();
      };
    });

    /* Regenerar QR */
    el.querySelectorAll('.tmc-regen').forEach(btn => {
      btn.onclick = async () => {
        const id = Number(btn.dataset.id);
        if(!confirm('¿Regenerar el QR? El QR anterior dejará de funcionar.')) return;
        btn.disabled    = true;
        btn.textContent = '…';
        const { data, error } = await supabase.rpc('regenerate_table_token', {
  p_table_id: id
});
        if(error || !data?.success){
          alert('No se pudo regenerar.\n\n' + (error?.message || data?.error || ''));
          btn.disabled    = false;
          btn.textContent = '↻ QR';
          return;
        }
        await cargarMesas();
      };
    });
  }

  /* Modal crear / editar mesa */
  function abrirModalMesa(mesa = null){
    const editando = !!mesa;

    const overlay = document.createElement('div');
    overlay.id    = 'admin-table-modal';
    overlay.style.cssText = `
      position:fixed; inset:0;
      background:rgba(20,18,15,.55);
      backdrop-filter:blur(5px);
      z-index:9999;
      display:flex; align-items:center; justify-content:center;
      padding:20px; box-sizing:border-box;
    `;

    overlay.innerHTML = `
      <div style="width:min(420px,100%);background:#fff;border-radius:12px;border:1px solid #e7e4de;box-shadow:0 25px 70px rgba(0,0,0,.20);overflow:hidden;">
        <div style="padding:18px 20px;border-bottom:1px solid #e7e4de;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-family:Archivo,sans-serif;font-size:15px;font-weight:800;color:#181715;">
              ${editando ? 'Editar mesa' : 'Nueva mesa'}
            </div>
            <div style="margin-top:4px;font-size:10px;color:#918b83;">
              ${editando ? 'Modifica el nombre de la mesa' : 'La mesa recibirá un QR automáticamente'}
            </div>
          </div>
          <button id="tbl-modal-close" style="width:30px;height:30px;border:0;border-radius:6px;background:#f5f3ef;color:#6b6560;cursor:pointer;font-size:18px;">×</button>
        </div>

        <div style="padding:20px;">
          <div style="margin-bottom:16px;">
            <label style="display:block;margin-bottom:6px;font-size:10px;font-weight:700;color:#625d56;text-transform:uppercase;">
              Nombre de la mesa
            </label>
            <input id="tbl-modal-name" type="text"
              value="${esc(mesa?.nombre || '')}"
              placeholder="Ej. Mesa 5, VIP 1, Terraza A…"
              style="width:100%;height:40px;padding:0 11px;box-sizing:border-box;border:1px solid #ddd9d2;border-radius:7px;outline:none;font-family:inherit;font-size:13px;">
          </div>

          <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button id="tbl-modal-cancel" style="height:38px;padding:0 15px;border:1px solid #ddd9d2;border-radius:7px;background:#fff;color:#6b6560;cursor:pointer;font-family:inherit;">Cancelar</button>
            <button id="tbl-modal-save" style="height:38px;padding:0 17px;border:1px solid #1d1c1a;border-radius:7px;background:#1d1c1a;color:#fff;cursor:pointer;font-weight:700;font-family:inherit;">
              ${editando ? 'Guardar cambios' : 'Crear mesa'}
            </button>
          </div>

          <div id="tbl-modal-error" style="min-height:18px;margin-top:10px;color:#a9472f;font-size:11px;"></div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const cerrar = () => overlay.remove();
    document.getElementById('tbl-modal-close').onclick  = cerrar;
    document.getElementById('tbl-modal-cancel').onclick = cerrar;

    /* Focus automático */
    setTimeout(() => document.getElementById('tbl-modal-name')?.focus(), 50);

    document.getElementById('tbl-modal-save').onclick = async () => {
      const name     = document.getElementById('tbl-modal-name').value.trim();
      const errorEl  = document.getElementById('tbl-modal-error');
      const saveBtn  = document.getElementById('tbl-modal-save');

      errorEl.textContent = '';

      if(!name){
        errorEl.textContent = 'El nombre es obligatorio.';
        return;
      }

      saveBtn.disabled    = true;
      saveBtn.textContent = 'Guardando…';

      if(editando){
        /* Editar nombre */
        const { error } = await supabase
          .from('tables')
          .update({ name })
          .eq('id', mesa.id);

        if(error){
          errorEl.textContent = error.message;
          saveBtn.disabled    = false;
          saveBtn.textContent = 'Guardar cambios';
          return;
        }

      } else {
        /* Crear mesa + token QR via RPC */
        const { data, error } = await supabase.rpc('create_table_with_token', {
  p_name: name,
});

        if(error || !data?.success){
          errorEl.textContent = error?.message || data?.error || 'Error al crear la mesa.';
          saveBtn.disabled    = false;
          saveBtn.textContent = 'Crear mesa';
          return;
        }
      }

      cerrar();
      await cargarMesas();
    };
  }

  /* ══════════════════════════════════════════════════════════
     QR (página de solo visualización / descarga)
  ══════════════════════════════════════════════════════════ */
  async function cargarQR(){
    const [mesas, tokens] = await Promise.all([
      getTables(),
      getTableTokens()
    ]);

    const el = document.getElementById('adash-qr-grid');

    el.innerHTML = mesas.map(m => {
      const td = tokens.find(t => t.table_id === m.id);
      if(!td) return `
        <div class="qr-card-dash">
          <div class="qr-card-name">${esc(m.nombre)}</div>
          <div class="qr-img-wrap" style="color:#c8c5c0;font-size:12px;">Sin token</div>
        </div>`;

      const url    = new URL(baseUrl);
      url.search   = '';
      url.searchParams.set('token', td.token);
      const qrSrc  = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=6&data=${encodeURIComponent(url.toString())}`;
      const qrLarge= qrSrc.replace('200x200','600x600');

      return `
        <div class="qr-card-dash">
          <div class="qr-card-name">${esc(m.nombre)}</div>
          <div class="qr-img-wrap">
            <img src="${qrSrc}" width="100" height="100" alt="QR ${esc(m.nombre)}" style="display:block;">
          </div>
          <a href="${qrLarge}" download="QR-${esc(m.nombre)}.png" target="_blank">
            <button class="qr-dl-btn">↓ Descargar</button>
          </a>
        </div>`;
    }).join('');
  }

  /* ══════════════════════════════════════════════════════════
     MODAL PRODUCTO (sin cambios respecto al original)
  ══════════════════════════════════════════════════════════ */
  function abrirModalProducto(producto = null){
    const editando = !!producto;

    const overlay    = document.createElement('div');
    overlay.id       = 'admin-product-modal';
    overlay.style.cssText = `
      position:fixed; inset:0;
      background:rgba(20,18,15,.55);
      backdrop-filter:blur(5px);
      z-index:9999;
      display:flex; align-items:center; justify-content:center;
      padding:20px; box-sizing:border-box;
    `;

    overlay.innerHTML = `
      <div style="width:min(480px,100%);background:#fff;border-radius:12px;border:1px solid #e7e4de;box-shadow:0 25px 70px rgba(0,0,0,.20);overflow:hidden;">
        <div style="padding:18px 20px;border-bottom:1px solid #e7e4de;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-family:Archivo,sans-serif;font-size:15px;font-weight:800;color:#181715;">
              ${editando ? 'Editar producto' : 'Añadir producto'}
            </div>
            <div style="margin-top:4px;font-size:10px;color:#918b83;">
              ${editando ? 'Modifica la información del producto' : 'Añade un nuevo producto al menú'}
            </div>
          </div>
          <button id="admin-product-close" style="width:30px;height:30px;border:0;border-radius:6px;background:#f5f3ef;color:#6b6560;cursor:pointer;font-size:18px;">×</button>
        </div>

        <div style="padding:20px;">
          <div style="margin-bottom:14px;">
            <label style="display:block;margin-bottom:6px;font-size:10px;font-weight:700;color:#625d56;text-transform:uppercase;">Nombre</label>
            <input id="admin-product-name" type="text" value="${esc(producto?.name||'')}" placeholder="Ej. Lomo saltado"
              style="width:100%;height:40px;padding:0 11px;box-sizing:border-box;border:1px solid #ddd9d2;border-radius:7px;outline:none;font-family:inherit;">
          </div>
          <div style="margin-bottom:14px;">
            <label style="display:block;margin-bottom:6px;font-size:10px;font-weight:700;color:#625d56;text-transform:uppercase;">Categoría</label>
            <input id="admin-product-category" type="text" value="${esc(producto?.category||'')}" placeholder="Ej. Platos"
              style="width:100%;height:40px;padding:0 11px;box-sizing:border-box;border:1px solid #ddd9d2;border-radius:7px;outline:none;font-family:inherit;">
          </div>
          <div style="margin-bottom:14px;">
            <label style="display:block;margin-bottom:6px;font-size:10px;font-weight:700;color:#625d56;text-transform:uppercase;">Precio</label>
            <input id="admin-product-price" type="number" step="0.01" min="0" value="${producto?.price??''}" placeholder="0.00"
              style="width:100%;height:40px;padding:0 11px;box-sizing:border-box;border:1px solid #ddd9d2;border-radius:7px;outline:none;font-family:inherit;">
          </div>
          <div style="margin-bottom:14px;">
            <label style="display:block;margin-bottom:6px;font-size:10px;font-weight:700;color:#625d56;text-transform:uppercase;">Descripción</label>
            <textarea id="admin-product-description" placeholder="Descripción del producto"
              style="width:100%;min-height:80px;padding:10px 11px;box-sizing:border-box;border:1px solid #ddd9d2;border-radius:7px;outline:none;resize:vertical;font-family:inherit;"
            >${esc(producto?.description||'')}</textarea>
          </div>
          <label style="display:flex;align-items:center;gap:9px;font-size:11px;color:#4e4943;cursor:pointer;margin-bottom:20px;">
            <input id="admin-product-active" type="checkbox" ${producto?.active!==false?'checked':''}>
            Producto disponible
          </label>
          <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button id="admin-product-cancel" style="height:38px;padding:0 15px;border:1px solid #ddd9d2;border-radius:7px;background:#fff;color:#6b6560;cursor:pointer;">Cancelar</button>
            <button id="admin-product-save" style="height:38px;padding:0 17px;border:1px solid #1d1c1a;border-radius:7px;background:#1d1c1a;color:#fff;cursor:pointer;font-weight:700;">
              ${editando ? 'Guardar cambios' : 'Añadir producto'}
            </button>
          </div>
          <div id="admin-product-error" style="min-height:18px;margin-top:10px;color:#a9472f;font-size:11px;"></div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const cerrar = () => overlay.remove();
    document.getElementById('admin-product-close').onclick  = cerrar;
    document.getElementById('admin-product-cancel').onclick = cerrar;

    document.getElementById('admin-product-save').onclick = async () => {
      const name        = document.getElementById('admin-product-name').value.trim();
      const category    = document.getElementById('admin-product-category').value.trim();
      const price       = Number(document.getElementById('admin-product-price').value);
      const description = document.getElementById('admin-product-description').value.trim();
      const active      = document.getElementById('admin-product-active').checked;
      const errorEl     = document.getElementById('admin-product-error');
      const saveBtn     = document.getElementById('admin-product-save');

      errorEl.textContent = '';
      if(!name)                               { errorEl.textContent = 'El nombre es obligatorio.'; return; }
      if(!category)                           { errorEl.textContent = 'La categoría es obligatoria.'; return; }
      if(!Number.isFinite(price) || price < 0){ errorEl.textContent = 'Ingresa un precio válido.'; return; }

      saveBtn.disabled    = true;
      saveBtn.textContent = 'Guardando…';

      const datos = { name, category, price, description, active };
      const resultado = editando
        ? await supabase.from('menu_items').update(datos).eq('id', producto.id)
        : await supabase.from('menu_items').insert(datos);

      if(resultado.error){
        errorEl.textContent = resultado.error.message;
        saveBtn.disabled    = false;
        saveBtn.textContent = editando ? 'Guardar cambios' : 'Añadir producto';
        return;
      }

      cerrar();
      await cargarMenu();
    };
  }

  /* Carga inicial */
  await cargarInicio();
}
