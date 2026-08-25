/* ============================================================
   SA-DIAGNOSTICS — Módulo de diagnóstico, monitoreo,
   auditoría, seguridad y recuperación para Superadmin.
   Importado y usado exclusivamente desde superadmin.js.
   ============================================================ */

import { supabase } from '../config/supabase.js';
import { esc }      from '../customer/customer.js';

/* ============================================================
   UTILIDADES COMPARTIDAS
============================================================ */
function fmt(n){ return 'S/ ' + Number(n).toFixed(2); }

function timeAgo(iso){
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if(s < 60)   return 'hace ' + s + 's';
  if(s < 3600) return 'hace ' + Math.floor(s/60) + ' min';
  if(s < 86400)return 'hace ' + Math.floor(s/3600) + 'h';
  return 'hace ' + Math.floor(s/86400) + 'd';
}

function fmtDate(iso){
  if(!iso) return '—';
  return new Date(iso).toLocaleString('es-PE',{
    day:'2-digit', month:'2-digit', year:'numeric',
    hour:'2-digit', minute:'2-digit'
  });
}

function severityBadge(s){
  const map = {
    info:     ['#e8f4fd','#1a6a9a','INFO'],
    warning:  ['#fdf8ec','#b08a10','WARN'],
    error:    ['#fdf1ed','#c05228','ERROR'],
    critical: ['#fce8e8','#8b1a1a','CRIT'],
  };
  const [bg, color, label] = map[s] || ['#f5f3ef','#6b6560', s?.toUpperCase() || '—'];
  return `<span style="background:${bg};color:${color};border-radius:4px;padding:2px 7px;font-size:9px;font-weight:700;letter-spacing:.06em;">${label}</span>`;
}

function resultBadge(r){
  if(r === 'success') return `<span style="background:#edf4ec;color:#3d6b3a;border-radius:4px;padding:2px 7px;font-size:9px;font-weight:700;">OK</span>`;
  if(r === 'failure') return `<span style="background:#fdf1ed;color:#c05228;border-radius:4px;padding:2px 7px;font-size:9px;font-weight:700;">FAIL</span>`;
  return `<span style="background:#f5f3ef;color:#6b6560;border-radius:4px;padding:2px 7px;font-size:9px;font-weight:700;">${esc(r||'—')}</span>`;
}

function statusDot(ok){
  return ok
    ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#3d6b3a;margin-right:6px;"></span>`
    : `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#c05228;margin-right:6px;"></span>`;
}

/* ============================================================
   ESTILOS — inyectados una sola vez
============================================================ */
export function injectDiagnosticsStyles(){
  if(document.getElementById('sa-diag-style')) return;
  const st = document.createElement('style');
  st.id = 'sa-diag-style';
  st.textContent = `
    /* ── Layout de diagnóstico ── */
    .sad-grid-2{ display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:18px; }
    .sad-grid-3{ display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; margin-bottom:18px; }
    .sad-full  { margin-bottom:18px; }

    /* ── Status cards ── */
    .sad-status-card{
      background:#fff; border:1px solid #e7e4de;
      border-radius:10px; padding:16px 18px;
      display:flex; align-items:center; gap:14px;
    }
    .sad-status-icon{
      width:38px; height:38px; border-radius:9px;
      display:flex; align-items:center; justify-content:center;
      font-size:18px; flex-shrink:0;
    }
    .sad-status-label{ font-size:11px; color:#918b83; font-weight:500; }
    .sad-status-val{
      font-family:Archivo,sans-serif; font-weight:900;
      font-size:13px; color:#181715; margin-top:2px;
    }
    .sad-status-ind{
      margin-left:auto; width:10px; height:10px;
      border-radius:50%; flex-shrink:0;
    }
    .sad-ind-green { background:#3d6b3a; }
    .sad-ind-yellow{ background:#b08a10; }
    .sad-ind-red   { background:#c05228; }
    .sad-ind-gray  { background:#c8c5c0; }

    /* ── Botón de diagnóstico ── */
    .sad-run-btn{
      height:40px; padding:0 22px;
      background:#1d1c1a; color:#fff;
      border:none; border-radius:8px;
      font-family:inherit; font-size:12px; font-weight:700;
      cursor:pointer; display:inline-flex;
      align-items:center; gap:8px;
      transition:background .14s;
    }
    .sad-run-btn:hover{ background:#302e2b; }
    .sad-run-btn:disabled{ opacity:.5; cursor:not-allowed; }

    /* ── Resultados de diagnóstico ── */
    .sad-test-list{ display:flex; flex-direction:column; gap:6px; margin-top:16px; }
    .sad-test-row{
      display:flex; align-items:center; gap:10px;
      padding:10px 14px; border-radius:7px;
      background:#f7f6f3; border:1px solid #e7e4de;
      font-size:12px;
    }
    .sad-test-row.ok { border-left:3px solid #3d6b3a; }
    .sad-test-row.fail{ border-left:3px solid #c05228; }
    .sad-test-name{ flex:1; font-weight:500; color:#25231f; }
    .sad-test-detail{ color:#918b83; font-size:11px; }
    .sad-test-summary{
      margin-top:14px; padding:14px 16px;
      border-radius:8px; font-size:12px; font-weight:600;
      display:flex; align-items:center; gap:8px;
    }
    .sad-test-summary.all-ok{ background:#edf4ec; color:#3d6b3a; }
    .sad-test-summary.has-fail{ background:#fdf1ed; color:#c05228; }

    /* ── Tabla genérica ── */
    .sad-table-wrap{
      border:1px solid #e7e4de; border-radius:8px;
      overflow:hidden; background:#fff;
    }
    .sad-table{
      width:100%; border-collapse:collapse;
      font-size:11px;
    }
    .sad-table thead{ background:#faf9f7; }
    .sad-table th{
      padding:10px 14px; border-bottom:1px solid #e7e4de;
      color:#777169; font-size:9px; font-weight:800;
      text-transform:uppercase; letter-spacing:.07em;
      text-align:left; white-space:nowrap;
    }
    .sad-table td{
      padding:12px 14px; border-bottom:1px solid #efede9;
      color:#403c37; vertical-align:middle;
    }
    .sad-table tbody tr:last-child td{ border-bottom:none; }
    .sad-table tbody tr:hover{ background:#fcfbfa; }
    .sad-mono{ font-family:'JetBrains Mono',monospace; font-size:10px; color:#555; }

    /* ── Filtros / tabs ── */
    .sad-tabs{
      display:flex; gap:4px; flex-wrap:wrap;
      margin-bottom:14px;
    }
    .sad-tab{
      height:28px; padding:0 12px;
      border:1px solid #e7e4de; border-radius:6px;
      background:#fff; color:#6b6560;
      font-size:10.5px; font-weight:500;
      cursor:pointer; font-family:inherit;
      transition:all .12s;
    }
    .sad-tab:hover{ border-color:#c8c4bc; color:#1c1a17; }
    .sad-tab.active{
      background:#1d1c1a; border-color:#1d1c1a;
      color:#fff;
    }

    /* ── Maintenance toggle ── */
    .sad-maint-card{
      background:#fff; border:1px solid #e7e4de;
      border-radius:10px; padding:20px 22px;
      display:flex; align-items:center; justify-content:space-between;
      gap:16px; margin-bottom:14px;
    }
    .sad-maint-label{
      font-family:Archivo,sans-serif; font-weight:800;
      font-size:14px; color:#181715;
    }
    .sad-maint-sub{ font-size:11px; color:#918b83; margin-top:3px; }
    .sad-maint-badge{
      padding:5px 14px; border-radius:999px;
      font-size:11px; font-weight:700;
    }
    .sad-maint-badge.normal    { background:#edf4ec; color:#3d6b3a; }
    .sad-maint-badge.maintenance{ background:#fdf8ec; color:#b08a10; }
    .sad-maint-badge.emergency { background:#fce8e8; color:#8b1a1a; }

    /* ── Incidentes timeline ── */
    .sad-incident-card{
      background:#fff; border:1px solid #e7e4de;
      border-radius:10px; padding:18px 20px;
      margin-bottom:12px;
    }
    .sad-incident-head{
      display:flex; align-items:flex-start;
      justify-content:space-between; margin-bottom:10px;
    }
    .sad-incident-title{
      font-family:Archivo,sans-serif; font-weight:800;
      font-size:13px; color:#181715;
    }
    .sad-incident-time{ font-size:10px; color:#918b83; margin-top:3px; }
    .sad-incident-body{ font-size:11.5px; color:#5f5a53; line-height:1.6; }
    .sad-resolve-btn{
      height:30px; padding:0 12px;
      border:1px solid #e7e4de; border-radius:6px;
      background:#f5f3ef; color:#6b6560;
      font-size:10px; font-weight:600;
      cursor:pointer; font-family:inherit;
      transition:all .12s; white-space:nowrap;
    }
    .sad-resolve-btn:hover{ border-color:#3d6b3a; color:#3d6b3a; }
    .sad-resolve-btn:disabled{ opacity:.4; cursor:not-allowed; }

    /* ── Recuperación ── */
    .sad-recovery-card{
      background:#fff; border:1px solid #e7e4de;
      border-radius:10px; overflow:hidden;
      margin-bottom:12px;
    }
    .sad-recovery-head{
      padding:14px 18px;
      border-bottom:1px solid #f0ede8;
      display:flex; align-items:center;
      justify-content:space-between;
    }
    .sad-recovery-title{
      font-size:12px; font-weight:700; color:#181715;
    }
    .sad-recovery-body{ padding:14px 18px; }
    .sad-recovery-row{
      display:flex; align-items:center; gap:10px;
      margin-bottom:10px; flex-wrap:wrap;
    }
    .sad-input{
      height:34px; padding:0 10px;
      border:1px solid #ddd9d2; border-radius:6px;
      font-family:inherit; font-size:12px;
      color:#181715; outline:none;
      transition:border-color .12s;
    }
    .sad-input:focus{ border-color:#a8a29a; }
    .sad-action-btn{
      height:34px; padding:0 14px;
      border:1px solid #1d1c1a; border-radius:6px;
      background:#1d1c1a; color:#fff;
      font-size:11px; font-weight:700;
      cursor:pointer; font-family:inherit;
      transition:background .12s; white-space:nowrap;
    }
    .sad-action-btn:hover{ background:#302e2b; }
    .sad-action-btn:disabled{ opacity:.4; cursor:not-allowed; }
    .sad-action-btn.secondary{
      background:#fff; color:#4e4943;
      border-color:#ddd9d2;
    }
    .sad-action-btn.secondary:hover{
      background:#f5f3ef;
    }
    .sad-action-btn.danger{
      background:#fdf1ed; color:#c05228;
      border-color:#f0c4b4;
    }
    .sad-result-box{
      margin-top:10px; padding:10px 12px;
      border-radius:6px; font-size:11px;
      font-family:'JetBrains Mono',monospace;
      line-height:1.6; white-space:pre-wrap;
      word-break:break-all;
    }
    .sad-result-box.ok  { background:#edf4ec; color:#2d5a2b; }
    .sad-result-box.err { background:#fdf1ed; color:#a03020; }
    .sad-result-box.info{ background:#e8f4fd; color:#1a5a8a; }

    /* ── Empty / loading ── */
    .sad-loading{ padding:40px; text-align:center; color:#918b83; font-size:12px; }
    .sad-empty  { padding:40px; text-align:center; color:#b5b0a8; font-size:12px; }

    /* ── Monitoreo de pedidos ── */
    .sad-order-row{
      display:flex; align-items:center; gap:10px;
      padding:12px 14px; border-bottom:1px solid #f0ede8;
      font-size:11.5px;
    }
    .sad-order-row:last-child{ border-bottom:none; }
    .sad-order-id{
      font-family:'JetBrains Mono',monospace;
      font-size:10px; color:#918b83; width:80px; flex-shrink:0;
    }
    .sad-order-mesa{ font-weight:600; color:#181715; width:60px; flex-shrink:0; }
    .sad-order-status{ width:90px; flex-shrink:0; }
    .sad-order-time{ color:#918b83; flex:1; }
    .sad-order-warn{
      font-size:10px; color:#b08a10; font-weight:600;
      background:#fdf8ec; padding:2px 7px; border-radius:4px;
    }

    @media(max-width:900px){
      .sad-grid-2, .sad-grid-3{ grid-template-columns:1fr; }
    }
  `;
  document.head.appendChild(st);
}

/* ============================================================
   PÁGINA: DIAGNÓSTICO
============================================================ */
export function renderDiagnosticoPage(){
  return `
    <div class="sa-ph">
      <div>
        <div class="sa-ph-title">Diagnóstico del sistema</div>
        <div class="sa-ph-sub">Comprobación completa de todos los servicios</div>
      </div>
      <button class="sad-run-btn" id="sad-run-diag">
        ▶ Ejecutar diagnóstico
      </button>
    </div>

    <!-- Estado de servicios -->
    <div class="sad-grid-3" id="sad-service-status">
      ${['Base de datos','Menú','Mesas','QR','Pedidos','Sesiones','Perfiles','Configuración','Sistema'].map(s => `
        <div class="sad-status-card">
          <div>
            <div class="sad-status-label">${s}</div>
            <div class="sad-status-val">Sin comprobar</div>
          </div>
          <div class="sad-status-ind sad-ind-gray" data-service="${s}"></div>
        </div>`).join('')}
    </div>

    <!-- Resultados -->
    <div class="sa-card">
      <div class="sa-card-head">
        <div>
          <div class="sa-card-title">Resultados</div>
          <div class="sa-card-sub" id="sad-diag-meta">Pulsa "Ejecutar diagnóstico" para comenzar</div>
        </div>
      </div>
      <div class="sa-card-body">
        <div id="sad-diag-results">
          <div class="sad-empty">Sin resultados todavía.</div>
        </div>
      </div>
    </div>
  `;
}

export async function bindDiagnostico(){
  const btn = document.getElementById('sad-run-diag');
  if(!btn) return;

  btn.addEventListener('click', async () => {
    btn.disabled    = true;
    btn.textContent = '⏳ Comprobando…';

    const resultsEl = document.getElementById('sad-diag-results');
    const metaEl    = document.getElementById('sad-diag-meta');
    resultsEl.innerHTML = '<div class="sad-loading">Ejecutando pruebas…</div>';

    const { data, error } = await supabase.rpc('run_system_diagnostics');

    btn.disabled    = false;
    btn.innerHTML   = '▶ Ejecutar diagnóstico';

    if(error || !data?.success){
      resultsEl.innerHTML = `
        <div class="sad-result-box err">
          Error: ${esc(error?.message || data?.error || 'Desconocido')}
        </div>`;
      return;
    }

    const { results, passed, failed, total, ran_at } = data;

    metaEl.textContent =
      `${passed}/${total} pruebas correctas · ${fmtDate(ran_at)}`;

    const rows = (results || []).map(r => `
      <div class="sad-test-row ${r.ok ? 'ok' : 'fail'}">
        ${statusDot(r.ok)}
        <span class="sad-test-name">${esc(r.name)}</span>
        <span class="sad-test-detail">${esc(r.detail || '')}</span>
      </div>`).join('');

    const summary = failed === 0
      ? `<div class="sad-test-summary all-ok">✓ Sistema operativo — ${passed}/${total} pruebas correctas</div>`
      : `<div class="sad-test-summary has-fail">✕ ${failed} problema(s) detectado(s) — ${passed}/${total} correctas</div>`;

    resultsEl.innerHTML = `
      <div class="sad-test-list">${rows}</div>
      ${summary}
    `;
  });
}

/* ============================================================
   PÁGINA: ERRORES DEL SISTEMA
============================================================ */
export function renderErroresPage(){
  return `
    <div class="sa-ph">
      <div>
        <div class="sa-ph-title">Errores del sistema</div>
        <div class="sa-ph-sub">Registro de eventos y errores</div>
      </div>
    </div>

    <div class="sad-tabs" id="sad-err-tabs">
      <button class="sad-tab active" data-filter="all">Todos</button>
      <button class="sad-tab" data-filter="critical">Críticos</button>
      <button class="sad-tab" data-filter="error">Errores</button>
      <button class="sad-tab" data-filter="warning">Advertencias</button>
      <button class="sad-tab" data-filter="info">Info</button>
      <button class="sad-tab" data-filter="unresolved">Sin resolver</button>
    </div>

    <div id="sad-err-content">
      <div class="sad-loading">Cargando…</div>
    </div>
  `;
}

export async function bindErrores(){
  let filtroActual = 'all';

  async function cargar(){
    const el = document.getElementById('sad-err-content');
    if(!el) return;
    el.innerHTML = '<div class="sad-loading">Cargando…</div>';

    let query = supabase
      .from('system_logs')
      .select('id,created_at,severity,module,error_code,message,resolved,resolved_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if(filtroActual === 'unresolved') query = query.eq('resolved', false);
    else if(filtroActual !== 'all')   query = query.eq('severity', filtroActual);

    const { data, error } = await query;

    if(error){
      el.innerHTML = `<div class="sad-result-box err">Error: ${esc(error.message)}</div>`;
      return;
    }

    if(!data || data.length === 0){
      el.innerHTML = '<div class="sad-empty">Sin registros para este filtro.</div>';
      return;
    }

    el.innerHTML = `
      <div class="sad-table-wrap">
        <table class="sad-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Severidad</th>
              <th>Módulo</th>
              <th>Mensaje</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(log => `
              <tr>
                <td class="sad-mono">${fmtDate(log.created_at)}</td>
                <td>${severityBadge(log.severity)}</td>
                <td><span class="sad-mono">${esc(log.module||'—')}</span></td>
                <td style="max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                  ${esc(log.message)}
                </td>
                <td>
                  ${log.resolved
                    ? `<span style="color:#3d6b3a;font-size:10px;font-weight:600;">✓ Resuelto</span>`
                    : `<span style="color:#c05228;font-size:10px;font-weight:600;">● Abierto</span>`}
                </td>
                <td>
                  ${!log.resolved ? `
                    <button class="sad-resolve-btn" data-log-id="${log.id}">
                      Resolver
                    </button>` : '—'}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;

    /* Botones resolver */
    el.querySelectorAll('.sad-resolve-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const logId = Number(btn.dataset.logId);
        btn.disabled    = true;
        btn.textContent = '…';

        const { data: res, error: resErr } = await supabase.rpc('resolve_system_log', {
          p_log_id: logId,
          p_notes:  'Resuelto desde panel superadmin'
        });

        if(resErr || !res?.success){
          alert('No se pudo resolver: ' + (resErr?.message || res?.error || ''));
          btn.disabled    = false;
          btn.textContent = 'Resolver';
          return;
        }
        await cargar();
      });
    });
  }

  /* Tabs */
  document.querySelectorAll('#sad-err-tabs .sad-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#sad-err-tabs .sad-tab')
        .forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filtroActual = tab.dataset.filter;
      cargar();
    });
  });

  await cargar();
}

/* ============================================================
   PÁGINA: MONITOREO DE PEDIDOS
============================================================ */
export function renderMonitoreoPage(){
  return `
    <div class="sa-ph">
      <div>
        <div class="sa-ph-title">Monitoreo de pedidos</div>
        <div class="sa-ph-sub">Estado en tiempo real</div>
      </div>
      <button class="sad-run-btn" id="sad-mon-refresh">↻ Actualizar</button>
    </div>

    <div class="sad-grid-3" id="sad-mon-stats">
      <div class="sa-stat">
        <div class="sa-stat-label">Pendientes</div>
        <div class="sa-stat-val" id="sad-mon-pend">—</div>
      </div>
      <div class="sa-stat">
        <div class="sa-stat-label">Preparando</div>
        <div class="sa-stat-val" id="sad-mon-prep">—</div>
      </div>
      <div class="sa-stat">
        <div class="sa-stat-label">Listos</div>
        <div class="sa-stat-val" id="sad-mon-list">—</div>
      </div>
    </div>

    <div class="sa-card">
      <div class="sa-card-head">
        <div class="sa-card-title">Pedidos activos</div>
      </div>
      <div class="sa-card-body" style="padding:0;" id="sad-mon-content">
        <div class="sad-loading">Cargando…</div>
      </div>
    </div>
  `;
}

export async function bindMonitoreo(alertMinutes = 30){
  async function cargar(){
    const el = document.getElementById('sad-mon-content');
    if(!el) return;

    const { data, error } = await supabase
      .from('orders')
      .select('id,table_name,table_id,status,created_at,total,items')
      .in('status', ['pendiente','preparando','listo'])
      .order('created_at', { ascending: true })
      .limit(60);

    if(error){
      el.innerHTML = `<div class="sad-result-box err">Error: ${esc(error.message)}</div>`;
      return;
    }

    const orders = data || [];
    const pend = orders.filter(o => o.status === 'pendiente').length;
    const prep = orders.filter(o => o.status === 'preparando').length;
    const list = orders.filter(o => o.status === 'listo').length;

    const setV = (id, v) => { const e = document.getElementById(id); if(e) e.textContent = v; };
    setV('sad-mon-pend', pend);
    setV('sad-mon-prep', prep);
    setV('sad-mon-list', list);

    if(orders.length === 0){
      el.innerHTML = '<div class="sad-empty">Sin pedidos activos ahora.</div>';
      return;
    }

    const statusPill = {
      pendiente:  ['#fdf8ec','#b08a10','Pendiente'],
      preparando: ['#fdf1ed','#c05228','Preparando'],
      listo:      ['#edf4ec','#3d6b3a','Listo'],
    };

    el.innerHTML = orders.map(o => {
      const mins = Math.max(0, Math.floor(
        (Date.now() - new Date(o.created_at).getTime()) / 60000
      ));
      const [bg, col, label] = statusPill[o.status] || ['#f5f3ef','#6b6560',o.status];
      const warn = mins >= alertMinutes;

      return `
        <div class="sad-order-row">
          <span class="sad-order-id">#${esc(o.id.slice(0,8).toUpperCase())}</span>
          <span class="sad-order-mesa">${esc(o.table_name||('Mesa '+o.table_id))}</span>
          <span class="sad-order-status">
            <span style="background:${bg};color:${col};border-radius:4px;padding:2px 7px;font-size:10px;font-weight:700;">
              ${label}
            </span>
          </span>
          <span class="sad-order-time">${timeAgo(o.created_at)}</span>
          ${warn ? `<span class="sad-order-warn">⚠ +${mins} min</span>` : ''}
        </div>`;
    }).join('');
  }

  document.getElementById('sad-mon-refresh')?.addEventListener('click', cargar);
  await cargar();
}

/* ============================================================
   PÁGINA: AUDITORÍA
============================================================ */
export function renderAuditoriaPage(){
  return `
    <div class="sa-ph">
      <div>
        <div class="sa-ph-title">Auditoría</div>
        <div class="sa-ph-sub">Registro de acciones administrativas</div>
      </div>
    </div>

    <div id="sad-audit-content">
      <div class="sad-loading">Cargando…</div>
    </div>
  `;
}

export async function bindAuditoria(){
  const el = document.getElementById('sad-audit-content');
  if(!el) return;

  const { data, error } = await supabase
    .from('audit_log')
    .select('id,created_at,user_id,user_role,action,resource_type,resource_id,result,notes')
    .order('created_at', { ascending: false })
    .limit(60);

  if(error){
    el.innerHTML = `<div class="sad-result-box err">Error: ${esc(error.message)}</div>`;
    return;
  }

  if(!data || data.length === 0){
    el.innerHTML = '<div class="sad-empty">Sin registros de auditoría.</div>';
    return;
  }

  el.innerHTML = `
    <div class="sad-table-wrap">
      <table class="sad-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Rol</th>
            <th>Acción</th>
            <th>Recurso</th>
            <th>ID Recurso</th>
            <th>Resultado</th>
            <th>Notas</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(a => `
            <tr>
              <td class="sad-mono">${fmtDate(a.created_at)}</td>
              <td>
                <span style="background:#f0ede8;color:#5f5a53;border-radius:4px;padding:2px 7px;font-size:9px;font-weight:700;">
                  ${esc(a.user_role||'—')}
                </span>
              </td>
              <td><span class="sad-mono">${esc(a.action||'—')}</span></td>
              <td>${esc(a.resource_type||'—')}</td>
              <td class="sad-mono">${esc(a.resource_id ? a.resource_id.slice(0,12)+'…' : '—')}</td>
              <td>${resultBadge(a.result)}</td>
              <td style="font-size:10px;color:#918b83;max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${esc(a.notes||'—')}
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ============================================================
   PÁGINA: MANTENIMIENTO
============================================================ */
export function renderMantenimientoPage(){
  return `
    <div class="sa-ph">
      <div>
        <div class="sa-ph-title">Mantenimiento</div>
        <div class="sa-ph-sub">Control del modo de operación del sistema</div>
      </div>
    </div>

    <div id="sad-maint-status">
      <div class="sad-loading">Cargando estado…</div>
    </div>

    <div class="sa-card" style="margin-top:16px;">
      <div class="sa-card-head">
        <div class="sa-card-title">Cambiar modo</div>
      </div>
      <div class="sa-card-body">
        <div class="sad-recovery-row">
          <select class="sad-input" id="sad-maint-level" style="width:180px;">
            <option value="normal">🟢 Normal</option>
            <option value="maintenance">🟡 Mantenimiento</option>
            <option value="emergency">🔴 Emergencia</option>
          </select>
          <input class="sad-input" id="sad-maint-msg"
            type="text" placeholder="Mensaje para el cliente (opcional)"
            style="flex:1; min-width:200px;">
          <button class="sad-action-btn" id="sad-maint-save">Aplicar</button>
        </div>
        <div id="sad-maint-result"></div>
      </div>
    </div>
  `;
}

export async function bindMantenimiento(){
  async function cargarEstado(){
    const el = document.getElementById('sad-maint-status');
    if(!el) return;

    const { data, error } = await supabase
      .from('system_config')
      .select('value,updated_at')
      .eq('key', 'maintenance_mode')
      .single();

    if(error || !data){
      el.innerHTML = '<div class="sad-result-box err">No se pudo leer la configuración.</div>';
      return;
    }

    const cfg    = data.value || {};
    const active = cfg.active  || false;
    const level  = cfg.level   || 'normal';
    const msg    = cfg.message || '';

    el.innerHTML = `
      <div class="sad-maint-card">
        <div>
          <div class="sad-maint-label">Estado actual del sistema</div>
          <div class="sad-maint-sub">
            ${msg ? esc(msg) : 'Sin mensaje de mantenimiento'}
            · Actualizado ${fmtDate(data.updated_at)}
          </div>
        </div>
        <span class="sad-maint-badge ${level}">
          ${level === 'normal' ? '🟢 Normal' : level === 'maintenance' ? '🟡 Mantenimiento' : '🔴 Emergencia'}
        </span>
      </div>
    `;

    /* Pre-seleccionar nivel actual */
    const sel = document.getElementById('sad-maint-level');
    if(sel) sel.value = level;
    const inp = document.getElementById('sad-maint-msg');
    if(inp) inp.value = msg;
  }

  await cargarEstado();

  document.getElementById('sad-maint-save')?.addEventListener('click', async () => {
    const btn    = document.getElementById('sad-maint-save');
    const level  = document.getElementById('sad-maint-level').value;
    const msg    = document.getElementById('sad-maint-msg').value.trim();
    const active = level !== 'normal';
    const resEl  = document.getElementById('sad-maint-result');

    btn.disabled    = true;
    btn.textContent = 'Aplicando…';

    const { data, error } = await supabase.rpc('set_maintenance_mode', {
      p_active:  active,
      p_message: msg,
      p_level:   level
    });

    btn.disabled    = false;
    btn.textContent = 'Aplicar';

    if(error || !data?.success){
      resEl.innerHTML = `<div class="sad-result-box err">Error: ${esc(error?.message || data?.error || '')}</div>`;
      return;
    }

    resEl.innerHTML = `<div class="sad-result-box ok">✓ Modo actualizado a "${level}"</div>`;
    await cargarEstado();
  });
}

/* ============================================================
   PÁGINA: RECUPERACIÓN
============================================================ */
export function renderRecuperacionPage(){
  return `
    <div class="sa-ph">
      <div>
        <div class="sa-ph-title">Recuperación</div>
        <div class="sa-ph-sub">Herramientas de diagnóstico y corrección controlada</div>
      </div>
    </div>

    <!-- Buscar pedido -->
    <div class="sad-recovery-card">
      <div class="sad-recovery-head">
        <div class="sad-recovery-title">Consultar pedido por ID</div>
      </div>
      <div class="sad-recovery-body">
        <div class="sad-recovery-row">
          <input class="sad-input" id="sad-rec-order-id"
            type="text" placeholder="UUID del pedido"
            style="flex:1; min-width:200px; max-width:340px;">
          <button class="sad-action-btn" id="sad-rec-order-btn">Consultar</button>
        </div>
        <div id="sad-rec-order-result"></div>
      </div>
    </div>

    <!-- Validar QR -->
    <div class="sad-recovery-card">
      <div class="sad-recovery-head">
        <div class="sad-recovery-title">Validar token QR</div>
      </div>
      <div class="sad-recovery-body">
        <div class="sad-recovery-row">
          <input class="sad-input" id="sad-rec-qr-token"
            type="text" placeholder="UUID del token QR"
            style="flex:1; min-width:200px; max-width:340px;">
          <button class="sad-action-btn" id="sad-rec-qr-btn">Validar</button>
        </div>
        <div id="sad-rec-qr-result"></div>
      </div>
    </div>

    <!-- Integridad de datos -->
    <div class="sad-recovery-card">
      <div class="sad-recovery-head">
        <div class="sad-recovery-title">Integridad de datos</div>
      </div>
      <div class="sad-recovery-body">
        <button class="sad-action-btn secondary" id="sad-integrity-btn">
          Comprobar integridad
        </button>
        <div id="sad-integrity-result"></div>
      </div>
    </div>
  `;
}

export async function bindRecuperacion(){

  /* ── Buscar pedido ── */
  document.getElementById('sad-rec-order-btn')?.addEventListener('click', async () => {
    const btn    = document.getElementById('sad-rec-order-btn');
    const idVal  = document.getElementById('sad-rec-order-id').value.trim();
    const resEl  = document.getElementById('sad-rec-order-result');

    if(!idVal){ resEl.innerHTML = `<div class="sad-result-box err">Introduce el UUID del pedido.</div>`; return; }

    btn.disabled = true; btn.textContent = '…';

    const { data, error } = await supabase
      .from('orders')
      .select('id,table_name,table_id,status,total,created_at,items,notes')
      .eq('id', idVal)
      .single();

    btn.disabled = false; btn.textContent = 'Consultar';

    if(error || !data){
      resEl.innerHTML = `<div class="sad-result-box err">Pedido no encontrado o error: ${esc(error?.message||'')}</div>`;
      return;
    }

    const itemsStr = Array.isArray(data.items)
      ? data.items.map(i => `${i.qty}× ${i.name}`).join(', ')
      : '—';

    resEl.innerHTML = `
      <div class="sad-result-box info">
ID:        ${esc(data.id)}
Mesa:      ${esc(data.table_name||String(data.table_id))}
Estado:    ${esc(data.status)}
Total:     ${fmt(data.total)}
Items:     ${esc(itemsStr)}
Notas:     ${esc(data.notes||'—')}
Creado:    ${fmtDate(data.created_at)}
      </div>`;
  });

  /* ── Validar QR ── */
  document.getElementById('sad-rec-qr-btn')?.addEventListener('click', async () => {
    const btn   = document.getElementById('sad-rec-qr-btn');
    const token = document.getElementById('sad-rec-qr-token').value.trim();
    const resEl = document.getElementById('sad-rec-qr-result');

    if(!token){ resEl.innerHTML = `<div class="sad-result-box err">Introduce el UUID del token.</div>`; return; }

    btn.disabled = true; btn.textContent = '…';

    const { data, error } = await supabase.rpc('validate_qr_token', { p_token: token });

    btn.disabled = false; btn.textContent = 'Validar';

    if(error){
      resEl.innerHTML = `<div class="sad-result-box err">Error RPC: ${esc(error.message)}</div>`;
      return;
    }

    if(data?.valid){
      resEl.innerHTML = `
        <div class="sad-result-box ok">
✓ Token válido
Mesa ID:    ${esc(String(data.table_id))}
Sesión ID:  ${esc(data.session_id||'—')}
        </div>`;
    } else {
      resEl.innerHTML = `
        <div class="sad-result-box err">
✕ Token inválido
Razón: ${esc(data?.reason||'desconocida')}
        </div>`;
    }
  });

  /* ── Integridad de datos ── */
  document.getElementById('sad-integrity-btn')?.addEventListener('click', async () => {
    const btn   = document.getElementById('sad-integrity-btn');
    const resEl = document.getElementById('sad-integrity-result');
    btn.disabled = true; btn.textContent = 'Comprobando…';

    const checks = await Promise.all([
      supabase.from('orders').select('id', { count:'exact', head:true }).is('table_id', null),
      supabase.from('orders').select('id', { count:'exact', head:true }).is('items', null),
      supabase.from('menu_items').select('id', { count:'exact', head:true }).eq('active', true).lte('price', 0),
      supabase.from('tables').select('id', { count:'exact', head:true }).eq('active', true),
    ]);

    btn.disabled = false; btn.textContent = 'Comprobar integridad';

    const [ordNoMesa, ordNoItems, menuPrecio, mesasActivas] = checks;
    const anomalias = [];

    if(ordNoMesa.count  > 0) anomalias.push(`${ordNoMesa.count} pedido(s) sin mesa`);
    if(ordNoItems.count > 0) anomalias.push(`${ordNoItems.count} pedido(s) sin items`);
    if(menuPrecio.count > 0) anomalias.push(`${menuPrecio.count} producto(s) activo(s) con precio ≤ 0`);

    if(anomalias.length === 0){
      resEl.innerHTML = `<div class="sad-result-box ok">✓ Sin anomalías detectadas · ${mesasActivas.count} mesas activas</div>`;
    } else {
      resEl.innerHTML = `<div class="sad-result-box err">⚠ ${anomalias.length} anomalía(s):\n${anomalias.join('\n')}</div>`;
    }
  });
}

/* ============================================================
   PÁGINA: INCIDENTES
============================================================ */
export function renderIncidentesPage(){
  return `
    <div class="sa-ph">
      <div>
        <div class="sa-ph-title">Incidentes</div>
        <div class="sa-ph-sub">Historial de errores críticos sin resolver</div>
      </div>
    </div>
    <div id="sad-incidents-content">
      <div class="sad-loading">Cargando…</div>
    </div>
  `;
}

export async function bindIncidentes(){
  const el = document.getElementById('sad-incidents-content');
  if(!el) return;

  const { data, error } = await supabase
    .from('system_logs')
    .select('id,created_at,severity,module,message,details,resolved,resolved_at,resolved_by')
    .in('severity', ['critical','error'])
    .order('created_at', { ascending: false })
    .limit(30);

  if(error){
    el.innerHTML = `<div class="sad-result-box err">Error: ${esc(error.message)}</div>`;
    return;
  }

  if(!data || data.length === 0){
    el.innerHTML = '<div class="sad-empty">Sin incidentes registrados. 🟢</div>';
    return;
  }

  el.innerHTML = data.map(inc => `
    <div class="sad-incident-card">
      <div class="sad-incident-head">
        <div>
          <div class="sad-incident-title">
            ${severityBadge(inc.severity)}
            &nbsp;${esc(inc.module||'Sistema')} — ${esc(inc.message)}
          </div>
          <div class="sad-incident-time">${fmtDate(inc.created_at)}</div>
        </div>
        ${!inc.resolved ? `
          <button class="sad-resolve-btn" data-inc-id="${inc.id}">
            Marcar resuelto
          </button>` : `
          <span style="font-size:10px;color:#3d6b3a;font-weight:600;">
            ✓ Resuelto ${fmtDate(inc.resolved_at)}
          </span>`}
      </div>
      <div class="sad-incident-body">
        ${inc.details
          ? `<pre style="font-size:10px;color:#6b6560;white-space:pre-wrap;margin:0;">${esc(JSON.stringify(inc.details, null, 2))}</pre>`
          : '<span style="color:#c8c5c0;font-size:11px;">Sin detalles adicionales.</span>'}
      </div>
    </div>`).join('');

  el.querySelectorAll('.sad-resolve-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const incId = Number(btn.dataset.incId);
      btn.disabled = true; btn.textContent = '…';

      const { data: res, error: resErr } = await supabase.rpc('resolve_system_log', {
        p_log_id: incId,
        p_notes:  'Resuelto desde panel de incidentes'
      });

      if(resErr || !res?.success){
        alert('Error: ' + (resErr?.message || res?.error || ''));
        btn.disabled = false; btn.textContent = 'Marcar resuelto';
        return;
      }
      await bindIncidentes();
    });
  });
}
