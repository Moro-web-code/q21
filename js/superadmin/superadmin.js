/* ============================================================
   SUPERADMIN — Panel de Superadministrador
   Movido tal cual desde el IIFE original: renderSuperadmin().
   Incluye también renderSuperadminProtegido(),
   renderAdministradorProtegido(), renderCocinaProtegido() y
   renderMeseroProtegido() (regla 13: se conservan, no se
   eliminan por parecer wrappers — solo se usan aquí, en los
   accesos rápidos del propio Superadmin).
   ============================================================ */

import { supabase } from '../config/supabase.js';
import { RESTAURANT } from '../config/constants.js';
import { esc } from '../customer/customer.js';
import { renderLoginUnificado } from '../auth/login.js';
import { renderAdministrador } from '../admin/administrator.js';
import {
  injectDiagnosticsStyles,
  renderDiagnosticoPage,   bindDiagnostico,
  renderErroresPage,       bindErrores,
  renderMonitoreoPage,     bindMonitoreo,
  renderAuditoriaPage,     bindAuditoria,
  renderMantenimientoPage, bindMantenimiento,
  renderRecuperacionPage,  bindRecuperacion,
  renderIncidentesPage,    bindIncidentes,
} from './sa-diagnostics.js';
import { renderStaff } from '../staff/staff.js';
import { renderMesero } from '../waiter/waiter.js';

/* ============================================================
   SUPERADMIN PANEL
============================================================ */
export async function renderSuperadmin(){
  const app = document.getElementById('app');

  const { data:{ session } } = await supabase.auth.getSession();
  if(!session){ renderLoginUnificado(); return; }

  /* ============================================================
     ESTILOS
  ============================================================ */
  if(!document.getElementById('sa-style')){
    const st = document.createElement('style');
    st.id = 'sa-style';
    st.textContent = `
      /* ============================================================
         SUPERADMIN — PROFESSIONAL UI
      ============================================================ */

      #sa-layout {
        display: flex;
        height: 100vh;
        overflow: hidden;
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #f6f5f2;
        color: #181715;
        letter-spacing: -.01em;
      }

      /* ============================================================
         SIDEBAR
      ============================================================ */

      #sa-sidebar {
        width: 248px;
        min-width: 248px;
        background: #1b1a18;
        color: #fff;
        border-right: 1px solid #292825;
        display: flex;
        flex-direction: column;
        position: sticky;
        top: 0;
        height: 100vh;
        box-sizing: border-box;
        z-index: 20;
      }

      .sa-brand {
        height: 82px;
        padding: 0 22px;
        display: flex;
        align-items: center;
        border-bottom: 1px solid rgba(255,255,255,.07);
        box-sizing: border-box;
      }

      .sa-brand-logo {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .sa-brand-mark {
        width: 38px;
        height: 38px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255,255,255,.14);
        border-radius: 9px;
        background: #292724;
        color: #fff;
        font-family: Archivo, sans-serif;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: -.04em;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
      }

      .sa-brand-text { min-width: 0; }

      .sa-brand-name {
        color: #fff;
        font-family: Archivo, sans-serif;
        font-size: 14px;
        font-weight: 800;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.2;
      }

      .sa-brand-sub {
        margin-top: 4px;
        color: #858079;
        font-size: 10px;
        font-weight: 500;
        letter-spacing: .02em;
      }

      /* ============================================================
         NAVIGATION
      ============================================================ */

      .sa-nav {
        flex: 1;
        padding: 22px 12px;
        overflow-y: auto;
      }

      .sa-nav-section {
        padding: 0 10px 8px;
        color: #68635c;
        font-size: 9px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: .13em;
      }

      .sa-nav-divider {
        height: 1px;
        margin: 17px 8px;
        background: rgba(255,255,255,.07);
      }

      .sa-nav-item {
        width: 100%;
        min-height: 42px;
        display: flex;
        align-items: center;
        gap: 11px;
        margin: 2px 0;
        padding: 0 11px;
        border: 1px solid transparent;
        border-radius: 8px;
        background: transparent;
        color: #9b958d;
        font-family: inherit;
        font-size: 12px;
        font-weight: 550;
        cursor: pointer;
        text-align: left;
        transition: background .16s ease, color .16s ease, border-color .16s ease;
      }

      .sa-nav-item i {
        width: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #78736c;
        font-size: 17px;
        transition: color .16s ease;
      }

      .sa-nav-item:hover {
        background: #252421;
        color: #e9e6e1;
      }

      .sa-nav-item:hover i { color: #c5c0b9; }

      .sa-nav-item.active {
        background: #302e2a;
        border-color: #3b3935;
        color: #fff;
        box-shadow: inset 2px 0 0 #fff;
      }

      .sa-nav-item.active i { color: #fff; }

      /* ============================================================
         SIDEBAR FOOTER
      ============================================================ */

      .sa-sidebar-footer {
        margin: 0 12px 14px;
        padding: 13px 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        border-top: 1px solid rgba(255,255,255,.07);
      }

      .sa-sidebar-avatar {
        width: 32px;
        height: 32px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        background: #302e2a;
        border: 1px solid rgba(255,255,255,.08);
        color: #fff;
        font-family: Archivo, sans-serif;
        font-size: 10px;
        font-weight: 800;
      }

      .sa-sidebar-uname {
        color: #e8e4df;
        font-size: 11px;
        font-weight: 650;
      }

      .sa-sidebar-urole {
        margin-top: 3px;
        color: #77726b;
        font-size: 9px;
      }

      /* ============================================================
         MAIN
      ============================================================ */

      #sa-main {
        min-width: 0;
        flex: 1;
        background: #f6f5f2;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      /* ============================================================
         TOPBAR
      ============================================================ */

      #sa-topbar {
        height: 68px;
        padding: 0 30px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(255,255,255,.92);
        border-bottom: 1px solid #e7e4de;
        box-sizing: border-box;
        position: sticky;
        top: 0;
        z-index: 15;
        backdrop-filter: blur(12px);
        flex-shrink: 0;
      }

      .sa-topbar-title {
        color: #181715;
        font-family: Archivo, sans-serif;
        font-size: 14px;
        font-weight: 800;
        letter-spacing: -.015em;
      }

      .sa-topbar-right {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .sa-topbar-date {
        margin-right: 7px;
        color: #918b83;
        font-size: 10px;
        font-weight: 550;
      }

      /* ============================================================
         BUTTONS
      ============================================================ */

      .sa-tbtn {
        height: 35px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        padding: 0 12px;
        border: 1px solid #d9d5ce;
        border-radius: 7px;
        background: #fff;
        color: #5f5a53;
        font-family: inherit;
        font-size: 11px;
        font-weight: 650;
        cursor: pointer;
        transition: background .15s ease, border-color .15s ease, color .15s ease, transform .1s ease;
      }

      .sa-tbtn:hover {
        background: #f7f6f3;
        border-color: #cfcac2;
        color: #181715;
      }

      .sa-tbtn:active { transform: translateY(1px); }

      .sa-tbtn.primary {
        background: #1d1c1a;
        border-color: #1d1c1a;
        color: #fff;
      }

      .sa-tbtn.primary:hover {
        background: #302e2b;
        border-color: #302e2b;
      }

      /* ============================================================
         CONTENT AREA
      ============================================================ */

      #sa-content {
        flex: 1;
        overflow-y: auto;
        max-width: 1440px;
        width: 100%;
        margin: 0 auto;
        padding: 30px;
        box-sizing: border-box;
      }

      #sa-content::-webkit-scrollbar { width: 4px; }
      #sa-content::-webkit-scrollbar-thumb { background: #d4cfc4; border-radius: 4px; }

      .sa-page { display: none; animation: sa-page-in .18s ease; }
      .sa-page.active { display: block; }

      @keyframes sa-page-in {
        from { opacity: 0; transform: translateY(3px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* ============================================================
         PAGE HEADER
      ============================================================ */

      .sa-ph {
        margin-bottom: 25px;
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
      }

      .sa-ph-title {
        color: #181715;
        font-family: Archivo, sans-serif;
        font-size: 26px;
        font-weight: 850;
        line-height: 1.1;
        letter-spacing: -.035em;
      }

      .sa-ph-sub {
        margin-top: 7px;
        color: #918b83;
        font-size: 11px;
        font-weight: 500;
      }

      /* ============================================================
         STAT CARDS
      ============================================================ */

      .sa-stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0,1fr));
        gap: 12px;
        margin-bottom: 18px;
      }

      .sa-stat {
        min-height: 132px;
        position: relative;
        padding: 19px;
        overflow: hidden;
        border: 1px solid #e7e4de;
        border-radius: 10px;
        background: #ffffff;
        box-sizing: border-box;
        box-shadow: 0 1px 2px rgba(28,26,23,.025);
        transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
      }

      .sa-stat:hover {
        border-color: #d8d4cd;
        box-shadow: 0 8px 24px rgba(28,26,23,.055);
        transform: translateY(-1px);
      }

      .sa-stat-accent {
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 3px;
      }

      .sa-stat-icon {
        width: 34px;
        height: 34px;
        margin-bottom: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        font-size: 16px;
      }

      .sa-stat-label {
        color: #918b83;
        font-size: 10px;
        font-weight: 650;
        text-transform: uppercase;
        letter-spacing: .055em;
      }

      .sa-stat-val {
        margin-top: 5px;
        color: #181715;
        font-family: Archivo, sans-serif;
        font-size: 24px;
        font-weight: 850;
        line-height: 1.1;
        letter-spacing: -.035em;
      }

      /* ============================================================
         CARDS
      ============================================================ */

      .sa-card {
        border: 1px solid #e7e4de;
        border-radius: 10px;
        background: #fff;
        box-shadow: 0 1px 2px rgba(28,26,23,.025);
        overflow: hidden;
        margin-bottom: 18px;
      }

      .sa-card-head {
        min-height: 68px;
        padding: 17px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #e7e4de;
        box-sizing: border-box;
      }

      .sa-card-title {
        color: #181715;
        font-family: Archivo, sans-serif;
        font-size: 13px;
        font-weight: 800;
      }

      .sa-card-sub {
        margin-top: 4px;
        color: #918b83;
        font-size: 10px;
        line-height: 1.4;
      }

      .sa-card-body { padding: 20px; }

      /* ============================================================
         ACCESS PANELS
      ============================================================ */

      .sa-acceso-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0,1fr));
        gap: 13px;
      }

      .sa-acceso-card {
        position: relative;
        padding: 20px;
        border: 1px solid #e7e4de;
        border-radius: 9px;
        background: #fff;
        box-sizing: border-box;
        transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease;
      }

      .sa-acceso-card:hover {
        border-color: #d5d1c9;
        box-shadow: 0 10px 25px rgba(28,26,23,.055);
        transform: translateY(-2px);
      }

      .sa-acceso-icon {
        width: 38px;
        height: 38px;
        margin-bottom: 17px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 9px;
        font-size: 18px;
      }

      .sa-acceso-title {
        color: #181715;
        font-family: Archivo, sans-serif;
        font-size: 14px;
        font-weight: 800;
        letter-spacing: -.015em;
      }

      .sa-acceso-desc {
        min-height: 40px;
        margin-top: 7px;
        color: #777169;
        font-size: 11px;
        line-height: 1.55;
      }

      .sa-acceso-btn {
        width: 100%;
        height: 36px;
        margin-top: 17px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        border-radius: 7px;
        font-family: inherit;
        font-size: 10.5px;
        font-weight: 700;
        cursor: pointer;
        transition: background .15s ease, transform .1s ease;
        border: none;
      }

      .sa-acceso-btn:hover { transform: translateY(-1px); }

      .sa-btn-rust  { background: #a9472f; color: #fff; }
      .sa-btn-rust:hover  { background: #933d29; }

      .sa-btn-mustard { background: #a57c22; color: #fff; }
      .sa-btn-mustard:hover { background: #8f6b1d; }

      .sa-btn-sage  { background: #557258; color: #fff; }
      .sa-btn-sage:hover  { background: #49624c; }

      /* ============================================================
         TABLES
      ============================================================ */

      .sa-table-wrap {
        width: 100%;
        overflow-x: auto;
        border: 1px solid #e7e4de;
        border-radius: 8px;
        background: #fff;
      }

      .sa-table, .sa-perms-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
      }

      .sa-table { min-width: 650px; }

      .sa-table thead, .sa-perms-table thead { background: #faf9f7; }

      .sa-table th, .sa-perms-table th {
        padding: 11px 14px;
        border-bottom: 1px solid #e7e4de;
        color: #777169;
        font-size: 9px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: .07em;
        text-align: left;
      }

      .sa-table td, .sa-perms-table td {
        padding: 13px 14px;
        border-bottom: 1px solid #efede9;
        color: #403c37;
        vertical-align: middle;
      }

      .sa-table tbody tr:last-child td,
      .sa-perms-table tbody tr:last-child td { border-bottom: none; }

      .sa-table tbody tr { transition: background .12s ease; }
      .sa-table tbody tr:hover { background: #fcfbfa; }

      .sa-td-name { color: #25231f; font-size: 11px; font-weight: 700; }
      .sa-td-id   { margin-top: 3px; color: #aaa49c; font-family: 'JetBrains Mono', monospace; font-size: 9px; }

      .sa-role-pill {
        display: inline-flex;
        align-items: center;
        min-height: 24px;
        padding: 0 8px;
        border-radius: 5px;
        font-size: 9px;
        font-weight: 750;
      }

      .srp-superadmin { background: #eee; color: #25231f; }
      .srp-admin      { background: #fdf1ed; color: #a9472f; }
      .srp-mozo       { background: #edf4ec; color: #557258; }
      .srp-cocina     { background: #fdf8ec; color: #96701d; }

      .sa-td-actions { display: flex; align-items: center; gap: 7px; }

      .sa-action-sel {
        height: 32px;
        padding: 0 28px 0 9px;
        border: 1px solid #ddd9d2;
        border-radius: 6px;
        background: #fff;
        color: #4e4943;
        font-family: inherit;
        font-size: 10px;
        outline: none;
        cursor: pointer;
      }

      .sa-action-sel:focus {
        border-color: #a8a29a;
        box-shadow: 0 0 0 3px rgba(28,26,23,.045);
      }

      .sa-action-btn {
        height: 32px;
        padding: 0 11px;
        border: 1px solid #1d1c1a;
        border-radius: 6px;
        background: #1d1c1a;
        color: #fff;
        font-family: inherit;
        font-size: 10px;
        font-weight: 700;
        cursor: pointer;
      }

      .sa-action-btn:hover { background: #302e2b; }

      /* ============================================================
         PERMISSIONS TABLE
      ============================================================ */

      .sa-perms-table th:not(:first-child),
      .sa-perms-table td:not(:first-child) { text-align: center; }

      .sa-perms-table td:first-child { color: #34312d; font-weight: 600; }

      .sa-check {
        width: 22px; height: 22px;
        margin: auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: #edf4ec;
        color: #557258;
        font-size: 11px;
        font-weight: 900;
      }

      .sa-dash { color: #c2bdb5; font-weight: 600; }

      /* ============================================================
         ACTIVITY
      ============================================================ */

      .sa-activity-list {
        border: 1px solid #e7e4de;
        border-radius: 8px;
        overflow: hidden;
      }

      .sa-activity-item {
        min-height: 65px;
        padding: 14px 16px;
        display: flex;
        align-items: flex-start;
        gap: 11px;
        border-bottom: 1px solid #efede9;
        box-sizing: border-box;
        background: #fff;
      }

      .sa-activity-item:last-child { border-bottom: none; }
      .sa-activity-item:hover { background: #fcfbfa; }

      .sa-activity-dot {
        width: 7px; height: 7px;
        margin-top: 5px;
        border-radius: 50%;
        flex-shrink: 0;
        box-shadow: 0 0 0 3px rgba(0,0,0,.025);
      }

      .sa-activity-text { color: #3b3833; font-size: 11px; line-height: 1.5; }
      .sa-activity-text strong { color: #1d1c1a; font-weight: 800; }
      .sa-activity-time { margin-top: 3px; color: #aaa49c; font-size: 9px; }

      /* ============================================================
         LOADING / EMPTY
      ============================================================ */

      .sa-loading {
        padding: 50px 20px;
        text-align: center;
        color: #99938b;
        font-size: 11px;
      }

      .sa-empty {
        padding: 45px 20px;
        text-align: center;
        color: #aaa49c;
        font-size: 11px;
      }

      /* ============================================================
         MODAL
      ============================================================ */

      .sa-overlay {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(18,17,15,.52);
        backdrop-filter: blur(5px);
        z-index: 200;
        align-items: center;
        justify-content: center;
      }

      .sa-overlay.open { display: flex; }

      .sa-modal {
        width: min(450px, calc(100vw - 30px));
        background: #fff;
        border: 1px solid rgba(255,255,255,.5);
        border-radius: 12px;
        box-shadow: 0 30px 80px rgba(0,0,0,.20);
        overflow: hidden;
        animation: sa-modal-in .18s ease;
      }

      @keyframes sa-modal-in {
        from { opacity: 0; transform: translateY(8px) scale(.985); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }

      .sa-modal-head {
        padding: 18px 21px;
        background: #fcfbfa;
        border-bottom: 1px solid #e7e4de;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .sa-modal-title {
        color: #181715;
        font-family: Archivo, sans-serif;
        font-size: 14px;
        font-weight: 800;
      }

      .sa-modal-close {
        width: 28px; height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        cursor: pointer;
        color: #918b83;
        border-radius: 6px;
        font-size: 16px;
        transition: background .15s ease, color .15s ease;
      }

      .sa-modal-close:hover { background: #efede9; color: #181715; }

      .sa-modal-body { padding: 21px; }

      .sa-field { margin-bottom: 16px; }

      .sa-label {
        display: block;
        color: #625d56;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .045em;
        margin-bottom: 6px;
      }

      .sa-input, .sa-select {
        width: 100%;
        min-height: 40px;
        padding: 0 12px;
        border: 1px solid #ddd9d2;
        border-radius: 7px;
        font-family: Inter, sans-serif;
        font-size: 12px;
        color: #181715;
        background: #fff;
        box-sizing: border-box;
        outline: none;
        transition: border-color .15s ease, box-shadow .15s ease;
      }

      .sa-input:focus, .sa-select:focus {
        border-color: #8c857d;
        box-shadow: 0 0 0 3px rgba(28,26,23,.045);
      }

      .sa-input.error { border-color: #a9472f; }

      .sa-input-wrap { position: relative; }

      .sa-eye {
        position: absolute;
        right: 10px; top: 50%;
        transform: translateY(-50%);
        background: none; border: none;
        cursor: pointer;
        color: #918b83; font-size: 16px;
        display: flex; align-items: center;
        padding: 2px;
      }

      .sa-eye:hover { color: #181715; }

      .sa-modal-error {
        font-size: 12px;
        color: #a9472f;
        margin-top: 10px;
        min-height: 16px;
      }

      .sa-modal-foot {
        padding: 0 21px 20px;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      /* ============================================================
         RESPONSIVE — TABLET
      ============================================================ */

      @media (max-width: 1050px) {
        #sa-sidebar { width: 68px; min-width: 68px; }
        .sa-brand { padding: 0; justify-content: center; }
        .sa-brand-text, .sa-nav-section, .sa-nav-item span,
        .sa-sidebar-uname, .sa-sidebar-urole { display: none; }
        .sa-nav-item { justify-content: center; padding: 0; min-height: 42px; }
        .sa-nav-item i { width: auto; }
        .sa-sidebar-footer { justify-content: center; margin-left: 8px; margin-right: 8px; }
        .sa-stats { grid-template-columns: repeat(2, minmax(0,1fr)); }
        .sa-acceso-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
      }

      /* ============================================================
         RESPONSIVE — MOBILE
      ============================================================ */

      @media (max-width: 700px) {
        #sa-topbar { height: 60px; padding: 0 16px; }
        .sa-topbar-date { display: none; }
        .sa-topbar-title { font-size: 13px; }
        .sa-tbtn { height: 33px; padding: 0 9px; font-size: 10px; }
        .sa-tbtn:not(.primary) span { display: none; }
        #sa-content { padding: 20px 14px; }
        .sa-ph { margin-bottom: 19px; }
        .sa-ph-title { font-size: 22px; }
        .sa-ph-sub { font-size: 10px; }
        .sa-stats { grid-template-columns: 1fr; gap: 9px; }
        .sa-stat { min-height: 112px; padding: 16px; }
        .sa-stat-icon { margin-bottom: 11px; }
        .sa-stat-val { font-size: 21px; }
        .sa-acceso-grid { grid-template-columns: 1fr; }
        .sa-card-body { padding: 14px; }
        .sa-card-head { padding: 15px; }
        .sa-card-title { font-size: 12px; }
        .sa-table { min-width: 620px; }
        .sa-perms-table { min-width: 620px; }
        .sa-modal { width: calc(100vw - 24px); }
      }

      /* ============================================================
         REDUCED MOTION
      ============================================================ */

      @media (prefers-reduced-motion: reduce) {
        #sa-layout *, #sa-layout *::before, #sa-layout *::after {
          animation-duration: .01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: .01ms !important;
        }
      }
    `;
    document.head.appendChild(st);
  }

  /* ============================================================
     TABLER ICONS
  ============================================================ */
  if(!document.querySelector('link[href*="tabler-icons"]')){
    const lk = document.createElement('link');
    lk.rel = 'stylesheet';
    lk.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.47.0/tabler-icons.min.css';
    document.head.appendChild(lk);
  }

  app.style.padding = '0';
  app.style.maxWidth = 'none';
  app.style.background = '#f6f5f2';

  /* ============================================================
     HTML
  ============================================================ */
const btnVolver = document.getElementById('sa-back-btn');

if(btnVolver){
  btnVolver.remove();
}

app.innerHTML = `
    <div id="sa-layout">

      <!-- SIDEBAR -->
      <aside id="sa-sidebar">

        <div class="sa-brand">
          <div class="sa-brand-logo">
            <div class="sa-brand-mark">SA</div>

            <div class="sa-brand-text">
              <div class="sa-brand-name">${esc(RESTAURANT)}</div>
              <div class="sa-brand-sub">Centro de control</div>
            </div>
          </div>
        </div>

        <nav class="sa-nav">

          <div class="sa-nav-section">General</div>

          <button class="sa-nav-item active" data-sapage="inicio">
            <i class="ti ti-layout-dashboard" aria-hidden="true"></i>
            <span>Inicio</span>
          </button>

          <button class="sa-nav-item" data-sapage="usuarios">
            <i class="ti ti-users" aria-hidden="true"></i>
            <span>Usuarios</span>
          </button>

          <button class="sa-nav-item" data-sapage="permisos">
            <i class="ti ti-shield-check" aria-hidden="true"></i>
            <span>Roles y permisos</span>
          </button>

          <button class="sa-nav-item" data-sapage="actividad">
            <i class="ti ti-activity" aria-hidden="true"></i>
            <span>Actividad</span>
          </button>

          <div class="sa-nav-divider"></div>

          <div class="sa-nav-section">Sistema</div>

          <button class="sa-nav-item" data-sapage="diagnostico">
            <i class="ti ti-heart-rate-monitor" aria-hidden="true"></i>
            <span>Diagnóstico</span>
          </button>

          <button class="sa-nav-item" data-sapage="errores">
            <i class="ti ti-alert-triangle" aria-hidden="true"></i>
            <span>Errores</span>
          </button>

          <button class="sa-nav-item" data-sapage="monitoreo">
            <i class="ti ti-clock" aria-hidden="true"></i>
            <span>Monitoreo</span>
          </button>

          <div class="sa-nav-divider"></div>

          <div class="sa-nav-section">Seguridad</div>

          <button class="sa-nav-item" data-sapage="auditoria">
            <i class="ti ti-file-description" aria-hidden="true"></i>
            <span>Auditoría</span>
          </button>

          <button class="sa-nav-item" data-sapage="incidentes">
            <i class="ti ti-bug" aria-hidden="true"></i>
            <span>Incidentes</span>
          </button>

          <div class="sa-nav-divider"></div>

          <div class="sa-nav-section">Operaciones</div>

          <button class="sa-nav-item" data-sapage="recuperacion">
            <i class="ti ti-tool" aria-hidden="true"></i>
            <span>Recuperación</span>
          </button>

          <button class="sa-nav-item" data-sapage="mantenimiento">
            <i class="ti ti-settings" aria-hidden="true"></i>
            <span>Mantenimiento</span>
          </button>

          <div class="sa-nav-divider"></div>

          <div class="sa-nav-section">Accesos</div>

          <button class="sa-nav-item" data-sapage="accesos">
            <i class="ti ti-apps" aria-hidden="true"></i>
            <span>Paneles</span>
          </button>

          <button class="sa-nav-item" id="sa-quick-admin">
            <i class="ti ti-layout-dashboard" aria-hidden="true" style="color:#c1502e;"></i>
            <span>Administrador</span>
          </button>

          <button class="sa-nav-item" id="sa-quick-cocina">
            <i class="ti ti-bowl" aria-hidden="true" style="color:#c49520;"></i>
            <span>Cocina</span>
          </button>

          <button class="sa-nav-item" id="sa-quick-mesero">
            <i class="ti ti-table" aria-hidden="true" style="color:#5c7a5a;"></i>
            <span>Mesero</span>
          </button>

        </nav>

        <div class="sa-sidebar-footer">
          <div class="sa-sidebar-avatar">SA</div>

          <div>
            <div class="sa-sidebar-uname">Superadmin</div>
            <div class="sa-sidebar-urole">Acceso total</div>
          </div>
        </div>

      </aside>

      <!-- MAIN -->
      <div id="sa-main">

        <div id="sa-topbar">

          <span class="sa-topbar-title" id="sa-topbar-title">
            Centro de control
          </span>

          <div class="sa-topbar-right">

            <span class="sa-topbar-date" id="sa-topbar-date"></span>

            <button class="sa-tbtn primary" id="sa-nuevo-btn" style="display:none;">
              <i class="ti ti-plus" aria-hidden="true"></i>
              Nuevo usuario
            </button>

            <button class="sa-tbtn" id="sa-logout-btn">
              <i class="ti ti-logout" aria-hidden="true"></i>
              Salir
            </button>

          </div>

        </div>

        <div id="sa-content">

          <!-- ==================================================
               INICIO
          =================================================== -->
          <div class="sa-page active" id="sapage-inicio">

            <div class="sa-ph">
              <div>
                <div class="sa-ph-title">Centro de control</div>
                <div class="sa-ph-sub">Vista general del sistema</div>
              </div>
            </div>

            <div class="sa-stats">

              <div class="sa-stat">
                <div class="sa-stat-accent" style="background:#c1502e;"></div>

                <div class="sa-stat-icon"
                     style="background:#fdf1ed;color:#c1502e;">
                  <i class="ti ti-users"></i>
                </div>

                <div class="sa-stat-label">Usuarios totales</div>
                <div class="sa-stat-val" id="sa-s-users">—</div>
              </div>

              <div class="sa-stat">
                <div class="sa-stat-accent" style="background:#5c7a5a;"></div>

                <div class="sa-stat-icon"
                     style="background:#edf4ec;color:#4a6e48;">
                  <i class="ti ti-table"></i>
                </div>

                <div class="sa-stat-label">Mesas activas</div>
                <div class="sa-stat-val" id="sa-s-mesas">—</div>
              </div>

              <div class="sa-stat">
                <div class="sa-stat-accent" style="background:#c49520;"></div>

                <div class="sa-stat-icon"
                     style="background:#fdf8ec;color:#c49520;">
                  <i class="ti ti-receipt"></i>
                </div>

                <div class="sa-stat-label">Pedidos hoy</div>
                <div class="sa-stat-val" id="sa-s-orders">—</div>
              </div>

              <div class="sa-stat">
                <div class="sa-stat-accent" style="background:#55504a;"></div>

                <div class="sa-stat-icon"
                     style="background:#f2f0ec;color:#6b6560;">
                  <i class="ti ti-cash"></i>
                </div>

                <div class="sa-stat-label">Ventas hoy</div>
                <div class="sa-stat-val" id="sa-s-ventas">—</div>
              </div>

              <div class="sa-stat">
                <div class="sa-stat-accent" style="background:#1c1a17;"></div>

                <div class="sa-stat-icon"
                     style="background:#f2f0ec;color:#1c1a17;">
                  <i class="ti ti-shield-check"></i>
                </div>

                <div class="sa-stat-label">Administradores</div>
                <div class="sa-stat-val" id="sa-s-admins">—</div>
              </div>

              <div class="sa-stat">
                <div class="sa-stat-accent" style="background:#5c7a5a;"></div>

                <div class="sa-stat-icon"
                     style="background:#edf4ec;color:#4a6e48;">
                  <i class="ti ti-bowl"></i>
                </div>

                <div class="sa-stat-label">Cocina / Meseros</div>
                <div class="sa-stat-val" id="sa-s-staff">—</div>
              </div>

            </div>

            <div class="sa-card">

              <div class="sa-card-head">
                <div>
                  <div class="sa-card-title">Acceso rápido a paneles</div>
                  <div class="sa-card-sub">
                    Abre cualquier panel sin cerrar sesión
                  </div>
                </div>
              </div>

              <div class="sa-card-body">

                <div class="sa-acceso-grid">

                  <div class="sa-acceso-card">

                    <div class="sa-acceso-icon"
                         style="background:#fdf1ed;color:#c1502e;">
                      <i class="ti ti-layout-dashboard"></i>
                    </div>

                    <div class="sa-acceso-title">
                      Administrador
                    </div>

                    <div class="sa-acceso-desc">
                      Gestión general del restaurante, menú,
                      estadísticas y QR.
                    </div>

                    <button class="sa-acceso-btn sa-btn-rust"
                            id="sa-go-admin">
                      <i class="ti ti-arrow-right"></i>
                      Abrir panel
                    </button>

                  </div>

                  <div class="sa-acceso-card">

                    <div class="sa-acceso-icon"
                         style="background:#fdf8ec;color:#c49520;">
                      <i class="ti ti-bowl"></i>
                    </div>

                    <div class="sa-acceso-title">
                      Cocina
                    </div>

                    <div class="sa-acceso-desc">
                      Panel KDS para gestión de pedidos
                      en tiempo real.
                    </div>

                    <button class="sa-acceso-btn sa-btn-mustard"
                            id="sa-go-cocina">
                      <i class="ti ti-arrow-right"></i>
                      Abrir panel
                    </button>

                  </div>

                  <div class="sa-acceso-card">

                    <div class="sa-acceso-icon"
                         style="background:#edf4ec;color:#4a6e48;">
                      <i class="ti ti-table"></i>
                    </div>

                    <div class="sa-acceso-title">
                      Mesero
                    </div>

                    <div class="sa-acceso-desc">
                      Mapa de mesas, sesiones y atención
                      al cliente.
                    </div>

                    <button class="sa-acceso-btn sa-btn-sage"
                            id="sa-go-mesero">
                      <i class="ti ti-arrow-right"></i>
                      Abrir panel
                    </button>

                  </div>

                </div>

              </div>
            </div>

          </div>


          <!-- ==================================================
               USUARIOS
          =================================================== -->
          <div class="sa-page" id="sapage-usuarios">

            <div class="sa-ph">
              <div>
                <div class="sa-ph-title">Usuarios</div>
                <div class="sa-ph-sub">
                  Gestión de accesos y roles del sistema
                </div>
              </div>
            </div>

            <div class="sa-card">

              <div class="sa-card-body" style="padding-top:12px;">

                <div id="sa-users-content">
                  <div class="sa-loading">
                    Cargando usuarios…
                  </div>
                </div>

              </div>

            </div>

          </div>


          <!-- ==================================================
               PERMISOS
          =================================================== -->
          <div class="sa-page" id="sapage-permisos">

            <div class="sa-ph">
              <div>
                <div class="sa-ph-title">Roles y permisos</div>
                <div class="sa-ph-sub">
                  Qué puede hacer cada rol en el sistema
                </div>
              </div>
            </div>

            <div class="sa-card">

              <div class="sa-card-body">

                <div class="sa-table-wrap">

                  <table class="sa-perms-table">

                    <thead>
                      <tr>
                        <th style="width:38%;">Permiso</th>
                        <th>Superadmin</th>
                        <th>Admin</th>
                        <th>Mesero</th>
                        <th>Cocina</th>
                      </tr>
                    </thead>

                    <tbody>

                      ${[
                        ['Ver pedidos',true,true,true,true],
                        ['Cambiar estado pedido',true,true,false,true],
                        ['Gestionar mesas',true,true,true,false],
                        ['Abrir / cerrar mesas',true,true,true,false],
                        ['Panel de cocina',true,true,false,true],
                        ['Modificar menú',true,true,false,false],
                        ['Ver estadísticas',true,true,false,false],
                        ['Ver códigos QR',true,true,false,false],
                        ['Gestionar usuarios',true,false,false,false],
                        ['Acceso a todos los paneles',true,false,false,false],
                        ['Configuración del sistema',true,false,false,false]
                      ].map(([label,...vals]) => `
                        <tr>
                          <td>${esc(label)}</td>

                          ${vals.map(v => `
                            <td>
                              ${
                                v
                                ? '<span class="sa-check">✓</span>'
                                : '<span class="sa-dash">—</span>'
                              }
                            </td>
                          `).join('')}

                        </tr>
                      `).join('')}

                    </tbody>

                  </table>

                </div>

              </div>

            </div>

          </div>


          <!-- ==================================================
               ACTIVIDAD
          =================================================== -->
          <div class="sa-page" id="sapage-actividad">

            <div class="sa-ph">
              <div>
                <div class="sa-ph-title">Actividad reciente</div>
                <div class="sa-ph-sub">
                  Últimos pedidos registrados en el sistema
                </div>
              </div>
            </div>

            <div class="sa-card">

              <div class="sa-card-body">

                <div id="sa-actividad-content">
                  <div class="sa-loading">
                    Cargando actividad…
                  </div>
                </div>

              </div>

            </div>

          </div>


          <!-- ==================================================
               PANELES
          =================================================== -->
          <div class="sa-page" id="sapage-accesos">

            <div class="sa-ph">
              <div>
                <div class="sa-ph-title">Paneles del sistema</div>
                <div class="sa-ph-sub">
                  Acceso directo a cada módulo operativo
                </div>
              </div>
            </div>

            <div class="sa-acceso-grid">

              <div class="sa-acceso-card">

                <div class="sa-acceso-icon"
                     style="background:#fdf1ed;color:#c1502e;">
                  <i class="ti ti-layout-dashboard"></i>
                </div>

                <div class="sa-acceso-title">
                  Administrador
                </div>

                <div class="sa-acceso-desc">
                  Menú, estadísticas, pedidos y códigos QR.
                </div>

                <button class="sa-acceso-btn sa-btn-rust"
                        id="sa-go-admin2">
                  <i class="ti ti-arrow-right"></i>
                  Abrir panel
                </button>

              </div>


              <div class="sa-acceso-card">

                <div class="sa-acceso-icon"
                     style="background:#fdf8ec;color:#c49520;">
                  <i class="ti ti-bowl"></i>
                </div>

                <div class="sa-acceso-title">
                  Cocina — KDS
                </div>

                <div class="sa-acceso-desc">
                  Kitchen Display System para seguimiento
                  de pedidos en tiempo real.
                </div>

                <button class="sa-acceso-btn sa-btn-mustard"
                        id="sa-go-cocina2">
                  <i class="ti ti-arrow-right"></i>
                  Abrir panel
                </button>

              </div>


              <div class="sa-acceso-card">

                <div class="sa-acceso-icon"
                     style="background:#edf4ec;color:#4a6e48;">
                  <i class="ti ti-table"></i>
                </div>

                <div class="sa-acceso-title">
                  Mesero
                </div>

                <div class="sa-acceso-desc">
                  Mapa de mesas, sesiones activas y gestión
                  de atención.
                </div>

                <button class="sa-acceso-btn sa-btn-sage"
                        id="sa-go-mesero2">
                  <i class="ti ti-arrow-right"></i>
                  Abrir panel
                </button>

              </div>

            </div>

          </div>
                   <!-- DIAGNÓSTICO -->
          <div class="sa-page" id="sapage-diagnostico"></div>

          <!-- ERRORES -->
          <div class="sa-page" id="sapage-errores"></div>

          <!-- MONITOREO -->
          <div class="sa-page" id="sapage-monitoreo"></div>

          <!-- AUDITORÍA -->
          <div class="sa-page" id="sapage-auditoria"></div>

          <!-- INCIDENTES -->
          <div class="sa-page" id="sapage-incidentes"></div>

          <!-- RECUPERACIÓN -->
          <div class="sa-page" id="sapage-recuperacion"></div>

          <!-- MANTENIMIENTO -->
          <div class="sa-page" id="sapage-mantenimiento"></div>

        </div>

      </div>
    </div>


    <!-- ========================================================
         MODAL NUEVO USUARIO
    ========================================================= -->
    <div class="sa-overlay" id="sa-modal-overlay">

      <div class="sa-modal">

        <div class="sa-modal-head">

          <span class="sa-modal-title">
            Nuevo usuario
          </span>

          <button class="sa-modal-close" id="sa-modal-x">
            ✕
          </button>

        </div>

        <div class="sa-modal-body">

          <div class="sa-field">

            <label class="sa-label">
              Nombre completo
            </label>

            <input
              class="sa-input"
              id="sa-f-name"
              type="text"
              placeholder="Juan García"
            >

          </div>


          <div class="sa-field">

            <label class="sa-label">
              Correo electrónico
            </label>

            <input
              class="sa-input"
              id="sa-f-email"
              type="email"
              placeholder="correo@ejemplo.com"
            >

          </div>


          <div class="sa-field">

            <label class="sa-label">
              Contraseña
            </label>

            <div class="sa-input-wrap">

              <input
                class="sa-input"
                id="sa-f-pass"
                type="password"
                placeholder="Mínimo 8 caracteres"
                style="padding-right:38px;"
              >

              <button
                class="sa-eye"
                id="sa-f-eye"
                type="button"
                tabindex="-1"
              >
                <i class="ti ti-eye"></i>
              </button>

            </div>

          </div>


          <div class="sa-field">

            <label class="sa-label">
              Rol
            </label>

            <select class="sa-select" id="sa-f-role">

              <option value="mozo">
                Mesero
              </option>

              <option value="cocina">
                Cocina
              </option>

              <option value="admin">
                Administrador
              </option>



            </select>

          </div>


          <div class="sa-modal-error" id="sa-modal-err"></div>

        </div>


        <div class="sa-modal-foot">

          <button class="sa-tbtn" id="sa-modal-cancel">
            Cancelar
          </button>

          <button class="sa-tbtn primary" id="sa-modal-submit">
            Crear usuario
          </button>

        </div>

      </div>

    </div>
  `;


  /* ============================================================
     FECHA
  ============================================================ */
  const fechaEl = document.getElementById('sa-topbar-date');

  if(fechaEl){
    fechaEl.textContent =
      new Date().toLocaleDateString('es-PE',{
        weekday:'short',
        day:'numeric',
        month:'short'
      });
  }


  /* ============================================================
     LOGOUT
  ============================================================ */
  document.getElementById('sa-logout-btn').onclick = async () => {
    
    // Restaurar fondo original al cerrar sesión
    document.body.style.background = '';
    document.body.style.minHeight  = '';
    limpiarApp();
    await supabase.auth.signOut();
    renderLoginUnificado();
  };


  /* ============================================================
     ACCESOS RAPIDOS
  ============================================================ */
  function limpiarApp(){
    app.style.padding    = '';
    app.style.maxWidth   = '';
    app.style.display    = '';
    app.style.height     = '';
    app.style.overflow   = '';
    app.style.background = '#f6f5f2';
    app.innerHTML        = '';
    // Forzar fondo del body para paneles internos
    document.body.style.background = '#f6f5f2';
    document.body.style.minHeight  = '100vh';
  }
function inyectarBotonVolver(labelPanel){

  setTimeout(() => {

    const existente = document.getElementById('sa-back-btn');

    if(existente){
      existente.remove();
    }

    const btn = document.createElement('button');

    btn.id = 'sa-back-btn';

    btn.innerHTML = `
      <i class="ti ti-arrow-left"></i>
      Volver a Superadmin
    `;

    btn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 99999;

      height: 40px;
      padding: 0 16px;

      display: flex;
      align-items: center;
      gap: 7px;

      background: #1b1a18;
      color: #f0e9d8;

      border: 1px solid #3b3935;
      border-radius: 8px;

      font-family: Inter, sans-serif;
      font-size: 12px;
      font-weight: 600;

      cursor: pointer;

      box-shadow: 0 5px 20px rgba(0,0,0,.25);

      transition:
        background .15s ease,
        transform .15s ease;
    `;

    btn.onmouseenter = () => {
      btn.style.background = '#302e2a';
      btn.style.transform = 'translateY(-2px)';
    };

    btn.onmouseleave = () => {
      btn.style.background = '#1b1a18';
      btn.style.transform = 'translateY(0)';
    };

    btn.onclick = async () => {

      if(window.staffInterval){
        clearInterval(window.staffInterval);
        window.staffInterval = null;
      }

      btn.remove();

      limpiarApp();

      await renderSuperadmin();

    };

    document.body.appendChild(btn);

  }, 400);

}
const goAdmin = async () => {

  limpiarApp();

  try {

    await renderAdministradorProtegido();

    inyectarBotonVolver('Administrador');

  } catch(error) {

    console.error('Error abriendo Administrador:', error);

    alert('No se pudo abrir el panel de Administrador.');

  }

};


const goCocina = async () => {

  limpiarApp();

  try {

    await renderCocinaProtegido();

    inyectarBotonVolver('Cocina');

  } catch(error) {

    console.error('Error abriendo Cocina:', error);

    alert('No se pudo abrir el panel de Cocina.');

  }

};


const goMesero = async () => {

  limpiarApp();

  try {

    await renderMeseroProtegido();

    inyectarBotonVolver('Mesero');

  } catch(error) {

    console.error('Error abriendo Mesero:', error);

    alert('No se pudo abrir el panel de Mesero.');

  }

};


  [
    'sa-go-admin',
    'sa-go-admin2',
    'sa-quick-admin'
  ].forEach(id => {

    const el = document.getElementById(id);

    if(el) el.onclick = goAdmin;

  });


  [
    'sa-go-cocina',
    'sa-go-cocina2',
    'sa-quick-cocina'
  ].forEach(id => {

    const el = document.getElementById(id);

    if(el) el.onclick = goCocina;

  });


  [
    'sa-go-mesero',
    'sa-go-mesero2',
    'sa-quick-mesero'
  ].forEach(id => {

    const el = document.getElementById(id);

    if(el) el.onclick = goMesero;

  });


  /* ============================================================
     NAVEGACIÓN
  ============================================================ */
  const saTitulos = {
    inicio:        'Centro de control',
    usuarios:      'Usuarios',
    permisos:      'Roles y permisos',
    actividad:     'Actividad reciente',
    accesos:       'Paneles del sistema',
    diagnostico:   'Diagnóstico del sistema',
    errores:       'Errores del sistema',
    monitoreo:     'Monitoreo de pedidos',
    auditoria:     'Auditoría',
    incidentes:    'Incidentes',
    recuperacion:  'Recuperación',
    mantenimiento: 'Mantenimiento',
  };


  document
    .querySelectorAll('.sa-nav-item[data-sapage]')
    .forEach(btn => {

      btn.addEventListener('click', async () => {

        const key = btn.dataset.sapage;

        document
          .querySelectorAll('.sa-nav-item')
          .forEach(b => b.classList.remove('active'));

        btn.classList.add('active');

        document
          .querySelectorAll('.sa-page')
          .forEach(p => p.classList.remove('active'));

        const page = document.getElementById(
          'sapage-' + key
        );

        if(page){
          page.classList.add('active');
        }

        document.getElementById(
          'sa-topbar-title'
        ).textContent = saTitulos[key] || key;

        document.getElementById(
          'sa-nuevo-btn'
        ).style.display =
          key === 'usuarios' ? 'flex' : 'none';


        if(key === 'inicio')    await cargarInicio();
        if(key === 'usuarios')  await cargarUsuarios();
        if(key === 'actividad') await cargarActividad();

        /* ── Páginas del módulo de diagnóstico ── */
        if(key === 'diagnostico'){
          page.innerHTML = renderDiagnosticoPage();
          await bindDiagnostico();
        }
        if(key === 'errores'){
          page.innerHTML = renderErroresPage();
          await bindErrores();
        }
        if(key === 'monitoreo'){
          page.innerHTML = renderMonitoreoPage();
          await bindMonitoreo();
        }
        if(key === 'auditoria'){
          page.innerHTML = renderAuditoriaPage();
          await bindAuditoria();
        }
        if(key === 'incidentes'){
          page.innerHTML = renderIncidentesPage();
          await bindIncidentes();
        }
        if(key === 'recuperacion'){
          page.innerHTML = renderRecuperacionPage();
          await bindRecuperacion();
        }
        if(key === 'mantenimiento'){
          page.innerHTML = renderMantenimientoPage();
          await bindMantenimiento();
        }
      });

    });


  /* ============================================================
     MODAL
  ============================================================ */
  const overlay =
    document.getElementById('sa-modal-overlay');


  function limpiarModal(){

    [
      'sa-f-name',
      'sa-f-email',
      'sa-f-pass'
    ].forEach(id => {

      const el = document.getElementById(id);

      if(el){
        el.value = '';
        el.classList.remove('error');
      }

    });


    document.getElementById(
      'sa-f-role'
    ).value = 'mozo';


    document.getElementById(
      'sa-modal-err'
    ).textContent = '';


    const btn =
      document.getElementById('sa-modal-submit');

    btn.disabled = false;
    btn.textContent = 'Crear usuario';


    const pass =
      document.getElementById('sa-f-pass');

    const icon =
      document.querySelector('#sa-f-eye i');

    pass.type = 'password';

    if(icon){
      icon.className = 'ti ti-eye';
    }

  }


  document.getElementById('sa-nuevo-btn').onclick = () => {

    limpiarModal();

    overlay.classList.add('open');

  };


  document.getElementById('sa-modal-x').onclick = () => {

    overlay.classList.remove('open');

  };


  document.getElementById('sa-modal-cancel').onclick = () => {

    overlay.classList.remove('open');

  };


  overlay.addEventListener('click', e => {

    if(e.target === overlay){
      overlay.classList.remove('open');
    }

  });


  /* ============================================================
     MOSTRAR / OCULTAR CONTRASEÑA
  ============================================================ */
  document.getElementById('sa-f-eye').onclick = () => {

    const inp =
      document.getElementById('sa-f-pass');

    const icon =
      document.querySelector('#sa-f-eye i');

    const showing =
      inp.type === 'text';

    inp.type =
      showing ? 'password' : 'text';

    icon.className =
      showing
        ? 'ti ti-eye'
        : 'ti ti-eye-off';

  };


  /* ============================================================
     CREAR USUARIO
  ============================================================ */
  document.getElementById('sa-modal-submit').onclick =
    async () => {

      const name =
        document.getElementById('sa-f-name')
          .value.trim();

      const email =
        document.getElementById('sa-f-email')
          .value.trim();

      const pass =
        document.getElementById('sa-f-pass')
          .value;

      const role =
        document.getElementById('sa-f-role')
          .value;

      const errEl =
        document.getElementById('sa-modal-err');

      const btn =
        document.getElementById('sa-modal-submit');


      errEl.textContent = '';

      document
        .querySelectorAll('.sa-input')
        .forEach(el => el.classList.remove('error'));


      let valid = true;


      if(!name){

        document
          .getElementById('sa-f-name')
          .classList.add('error');

        valid = false;

      }


      if(!email || !email.includes('@')){

        document
          .getElementById('sa-f-email')
          .classList.add('error');

        valid = false;

      }


      if(pass.length < 8){

        document
          .getElementById('sa-f-pass')
          .classList.add('error');

        valid = false;

      }


      if(!valid){

        errEl.textContent =
          'Completa todos los campos correctamente.';

        return;

      }


      btn.disabled = true;
      btn.textContent = 'Creando…';


      try{

        /*
          IMPORTANTE:

          Esta parte utiliza signUp porque el frontend
          solamente dispone de la clave pública de Supabase.

          La creación administrativa definitiva de usuarios
          debería realizarse mediante una Edge Function
          utilizando service_role en el servidor.
        */

        const { data, error } =
          await supabase.auth.signUp({
            email,
            password:pass
          });


        if(error){

          errEl.textContent =
            error.message ||
            'No se pudo crear el usuario.';

          btn.disabled = false;
          btn.textContent = 'Crear usuario';

          return;

        }


        if(!data || !data.user){

          errEl.textContent =
            'Supabase no devolvió el usuario creado.';

          btn.disabled = false;
          btn.textContent = 'Crear usuario';

          return;

        }


        /*
          Guardamos el perfil.

          El nombre se intenta guardar solamente si
          la columna full_name existe en profiles.
          Si tu tabla no tiene esa columna, se utiliza
          únicamente id + role.
        */

        let profileResult =
          await supabase
            .from('profiles')
            .upsert({
              id:data.user.id,
              role:role,
              full_name:name
            });


        /*
          Si full_name no existe en profiles,
          hacemos nuevamente el upsert únicamente
          con las columnas conocidas.
        */

        if(profileResult.error){

          profileResult =
            await supabase
              .from('profiles')
              .upsert({
                id:data.user.id,
                role:role
              });

        }


        if(profileResult.error){

          errEl.textContent =
            'El usuario fue creado, pero no se pudo guardar su rol: ' +
            profileResult.error.message;

          btn.disabled = false;
          btn.textContent = 'Crear usuario';

          return;

        }


        overlay.classList.remove('open');

        limpiarModal();

        await cargarUsuarios();

        await cargarInicio();

      }catch(error){

        console.error(
          'Error creando usuario:',
          error
        );

        errEl.textContent =
          error.message ||
          'Ocurrió un error inesperado.';

        btn.disabled = false;
        btn.textContent = 'Crear usuario';

      }

    };


  /* ============================================================
     CARGAR INICIO
  ============================================================ */
  async function cargarInicio(){

    try{

      const inicioDia =
        new Date(
          new Date().toLocaleDateString(
            'en-CA',
            {timeZone:'America/Lima'}
          ) + 'T00:00:00-05:00'
        );


      const [
        {data:profiles,error:profilesError},
        {data:sesiones,error:sesionesError},
        {data:orders,error:ordersError}
      ] = await Promise.all([

        supabase
          .from('profiles')
          .select('id,role'),

        supabase
          .rpc('get_table_sessions'),

        supabase
          .from('orders')
          .select('id,total,status,created_at')
          .gte(
            'created_at',
            inicioDia.toISOString()
          )

      ]);


      if(profilesError){
        console.error(
          'Error cargando profiles:',
          profilesError
        );
      }

      if(sesionesError){
        console.error(
          'Error cargando sesiones:',
          sesionesError
        );
      }

      if(ordersError){
        console.error(
          'Error cargando pedidos:',
          ordersError
        );
      }


      const profs =
        profiles || [];

      const sess =
        sesiones || [];

      const ords =
        orders || [];


const tableIds = [
  ...new Set(
    sess
      .map(s => Number(s.table_id))
      .filter(Number.isFinite)
  )
];

const mesasActivas =
  sess.filter(
    s => s.status === 'active'
  ).length;


      const ventas =
        ords.reduce(
          (sum,o) =>
            sum + Number(o.total || 0),
          0
        );


      const admins =
        profs.filter(
          p =>
            p.role === 'admin' ||
            p.role === 'superadmin'
        ).length;


      const staff =
        profs.filter(
          p =>
            p.role === 'cocina' ||
            p.role === 'mozo'
        ).length;


      const set = (id,val) => {

        const el =
          document.getElementById(id);

        if(el){
          el.textContent = val;
        }

      };


      set(
        'sa-s-users',
        profs.length
      );


set(
  'sa-s-mesas',
  mesasActivas
);


      set(
        'sa-s-orders',
        ords.length
      );


      set(
        'sa-s-ventas',
        `S/ ${ventas.toFixed(2)}`
      );


      set(
        'sa-s-admins',
        admins
      );


      set(
        'sa-s-staff',
        staff
      );

    }catch(error){

      console.error(
        'Error en cargarInicio:',
        error
      );

    }

  }


  /* ============================================================
     CARGAR USUARIOS
  ============================================================ */
  async function cargarUsuarios(){

    const el =
      document.getElementById(
        'sa-users-content'
      );


    if(!el) return;


    el.innerHTML =
      '<div class="sa-loading">Cargando usuarios…</div>';


    try{

      const {
        data:profiles,
        error
      } = await supabase
        .from('profiles')
        .select('id,role')
        .order('role');


      if(error){

        console.error(
          'Error cargando usuarios:',
          error
        );

        el.innerHTML =
          '<div class="sa-loading">No se pudieron cargar los usuarios.</div>';

        return;

      }


      if(!profiles || profiles.length === 0){

        el.innerHTML =
          '<div class="sa-empty">No hay usuarios registrados.</div>';

        return;

      }


      const rolLabel = {
        superadmin:'Superadmin',
        admin:'Administrador',
        mozo:'Mesero',
        cocina:'Cocina'
      };


      const rolCls = {
        superadmin:'srp-superadmin',
        admin:'srp-admin',
        mozo:'srp-mozo',
        cocina:'srp-cocina'
      };


      el.innerHTML = `

        <div class="sa-table-wrap">

          <table class="sa-table">

            <thead>

              <tr>

                <th>Usuario</th>
                <th>Rol</th>
                <th>Acciones</th>

              </tr>

            </thead>

            <tbody>

              ${profiles.map(p => `

                <tr>

                  <td>

                    <div class="sa-td-name">
                      Usuario
                    </div>

                    <div class="sa-td-id">
                      ${esc(String(p.id).slice(0,16))}…
                    </div>

                  </td>


                  <td>

                    <span class="sa-role-pill ${rolCls[p.role] || 'srp-admin'}">
                      ${esc(
                        rolLabel[p.role] ||
                        p.role ||
                        'Sin rol'
                      )}
                    </span>

                  </td>


                  <td>

                    <div class="sa-td-actions">

                      <select
                        class="sa-action-sel"
                        data-uid="${esc(p.id)}"
                      >

                        <option
                          value="mozo"
                          ${p.role === 'mozo' ? 'selected' : ''}
                        >
                          Mesero
                        </option>

                        <option
                          value="cocina"
                          ${p.role === 'cocina' ? 'selected' : ''}
                        >
                          Cocina
                        </option>

                        <option
                          value="admin"
                          ${p.role === 'admin' ? 'selected' : ''}
                        >
                          Administrador
                        </option>


                      </select>


                      <button
                        class="sa-action-btn save"
                        data-uid="${esc(p.id)}"
                        data-action="save"
                      >
                        Guardar
                      </button>

                    </div>

                  </td>

                </tr>

              `).join('')}

            </tbody>

          </table>

        </div>
      `;


      el
        .querySelectorAll('[data-action="save"]')
        .forEach(btn => {

          btn.onclick = async () => {

            const uid =
              btn.dataset.uid;


            const sel =
              el.querySelector(
                `select[data-uid="${uid}"]`
              );


            if(!sel) return;


            const nuevoRol =
              sel.value;


            btn.disabled = true;
            btn.textContent = 'Guardando…';


            try{

              const {
                error:updateError
              } = await supabase
                .from('profiles')
                .update({
                  role:nuevoRol
                })
                .eq('id',uid);


              if(updateError){

                alert(
                  'No se pudo actualizar el rol: ' +
                  updateError.message
                );

                return;

              }


              await cargarUsuarios();

              await cargarInicio();

            }catch(error){

              console.error(
                'Error actualizando rol:',
                error
              );

              alert(
                'Ocurrió un error al actualizar el rol.'
              );

            }finally{

              btn.disabled = false;
              btn.textContent = 'Guardar';

            }

          };

        });

    }catch(error){

      console.error(
        'Error en cargarUsuarios:',
        error
      );

      el.innerHTML =
        '<div class="sa-loading">No se pudieron cargar los usuarios.</div>';

    }

  }


  /* ============================================================
     CARGAR ACTIVIDAD
  ============================================================ */
  async function cargarActividad(){

    const el =
      document.getElementById(
        'sa-actividad-content'
      );


    if(!el) return;


    el.innerHTML =
      '<div class="sa-loading">Cargando actividad…</div>';


    try{

      const {data:orders,error} =
        await supabase
          .from('orders')
          .select('id,table_id,total,status,created_at')
          .order(
            'created_at',
            {ascending:false}
          )
          .limit(20);


      if(error){

        console.error(
          'Error cargando actividad:',
          error
        );

        el.innerHTML =
          '<div class="sa-empty">No se pudo cargar la actividad.</div>';

        return;

      }


      if(!orders || orders.length === 0){

        el.innerHTML =
          '<div class="sa-empty">No hay actividad registrada.</div>';

        return;

      }


      const statusLabel = {
        pending:'Pendiente',
        confirmed:'Confirmado',
        preparing:'En preparación',
        ready:'Listo',
        delivered:'Entregado',
        completed:'Completado',
        cancelled:'Cancelado'
      };


      el.innerHTML = `

        <div class="sa-activity-list">

          ${orders.map(order => {

            const fecha =
              order.created_at
                ? new Date(
                    order.created_at
                  ).toLocaleString(
                    'es-PE',
                    {
                      day:'2-digit',
                      month:'2-digit',
                      hour:'2-digit',
                      minute:'2-digit'
                    }
                  )
                : 'Sin fecha';


            let dot =
              '#c49520';


            if(
              order.status === 'completed' ||
              order.status === 'delivered'
            ){
              dot = '#5c7a5a';
            }


            if(
              order.status === 'cancelled'
            ){
              dot = '#c1502e';
            }


            return `

              <div class="sa-activity-item">

                <div
                  class="sa-activity-dot"
                  style="background:${dot};"
                ></div>

                <div>

                  <div class="sa-activity-text">

                    Pedido
                    <strong>
                      #${esc(String(order.id).slice(0,8))}
                    </strong>

                    ${
                      order.table_id != null
                      ? ` · Mesa ${esc(String(order.table_id))}`
                      : ''
                    }

                    ·
                    ${
                      statusLabel[order.status] ||
                      order.status ||
                      'Sin estado'
                    }

                    ${
                      order.total != null
                      ? ` · S/ ${Number(order.total).toFixed(2)}`
                      : ''
                    }

                  </div>

                  <div class="sa-activity-time">
                    ${esc(fecha)}
                  </div>

                </div>

              </div>

            `;

          }).join('')}

        </div>

      `;

    }catch(error){

      console.error(
        'Error en cargarActividad:',
        error
      );

      el.innerHTML =
        '<div class="sa-empty">No se pudo cargar la actividad.</div>';

    }

  }


  /* ============================================================
     CARGA INICIAL
  ============================================================ */
  await cargarInicio();

}

/* ============================================================
   PROTECCIÓN REAL DE LOS PANELES
   (regla 13: se conservan tal cual, no se eliminan)
============================================================ */

export async function renderSuperadminProtegido(){

  await renderSuperadmin();

}


export async function renderAdministradorProtegido(){

  await renderAdministrador();

}


export async function renderCocinaProtegido(){

  await renderStaff();

}


export async function renderMeseroProtegido(){

  await renderMesero();

}
