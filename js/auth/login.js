/* ============================================================
   LOGIN — pantallas de acceso del personal
   Movidas tal cual desde el IIFE original: renderLoginUnificado,
   renderStaffLogin, renderMeseroLogin, renderAdministradorLogin.

   NOTA DE DEPENDENCIAS (regla 11):
   Cada función de login llama, al autenticar con éxito, al panel
   correspondiente (renderSuperadmin, renderAdministrador,
   renderStaff, renderMesero). Esos paneles viven en sus propios
   módulos y, a su vez, llaman de vuelta a su login si no hay
   sesión (por ejemplo renderStaff() → renderStaffLogin() si no
   hay session). Esto genera un import circular entre login.js y
   cada módulo de panel. Es válido en módulos ES (las funciones
   son bindings vivos, no se ejecutan hasta que se llaman), y es
   la única forma de conservar el flujo exacto sin duplicar
   funciones (regla 11) ni fusionar módulos que en el original
   eran distintos (regla 7).
   ============================================================ */

import { supabase } from '../config/supabase.js';
import { RESTAURANT } from '../config/constants.js';
import { esc } from '../customer/customer.js';

import { renderSuperadmin } from '../superadmin/superadmin.js';
import { renderAdministrador } from '../admin/administrator.js';
import { renderStaff } from '../staff/staff.js';
import { renderMesero } from '../waiter/waiter.js';

/* ============================================================
   LOGIN UNIFICADO
============================================================ */
export function renderLoginUnificado(){
  const app = document.getElementById('app');

  app.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;">
      <div style="width:100%;max-width:360px;">
        <div style="text-align:center;margin-bottom:32px;">
          <div style="width:44px;height:44px;background:var(--rust);border-radius:10px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-family:'Archivo',sans-serif;font-weight:900;font-size:18px;color:#fff;">RL</div>
          <div class="display" style="font-size:26px;">${esc(RESTAURANT)}</div>
          <div style="font-size:12px;color:var(--ink-soft);margin-top:4px;">Sistema de gestión</div>
        </div>
        <div style="background:var(--paper);color:var(--ink);border-radius:10px;padding:28px 26px;box-shadow:0 10px 30px rgba(0,0,0,.2);">
          <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--rust);font-weight:700;margin-bottom:16px;">Iniciar sesión</div>
          <input id="ul-email" type="email" placeholder="Correo electrónico"
            style="width:100%;padding:11px 13px;margin-bottom:10px;font-family:'JetBrains Mono',monospace;font-size:13px;border:1px solid var(--paper-shadow);border-radius:6px;outline:none;color:var(--ink);background:#fff;">
          <input id="ul-pass" type="password" placeholder="Contraseña"
            style="width:100%;padding:11px 13px;margin-bottom:16px;font-family:'JetBrains Mono',monospace;font-size:13px;border:1px solid var(--paper-shadow);border-radius:6px;outline:none;color:var(--ink);background:#fff;">
          <button id="ul-btn" style="width:100%;padding:12px;background:var(--rust);color:#fff;border:none;border-radius:6px;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;cursor:pointer;letter-spacing:.04em;text-transform:uppercase;">Entrar</button>
          <div id="ul-error" style="margin-top:12px;font-size:12px;color:var(--rust);min-height:16px;text-align:center;"></div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('ul-btn').onclick = async () => {
    const email  = document.getElementById('ul-email').value.trim();
    const pass   = document.getElementById('ul-pass').value;
    const errEl  = document.getElementById('ul-error');
    const btn    = document.getElementById('ul-btn');

    errEl.textContent = '';
    if(!email || !pass){ errEl.textContent = 'Completa todos los campos.'; return; }

    btn.disabled = true;
    btn.textContent = 'Entrando…';

    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if(error){ errEl.textContent = 'Correo o contraseña incorrectos.'; btn.disabled = false; btn.textContent = 'Entrar'; return; }

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile }  = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const rol = profile?.role;

    btn.disabled = false;
    btn.textContent = 'Entrar';

    if(rol === 'superadmin')  { renderSuperadmin(); return; }
    if(rol === 'admin')       { renderAdministrador(); return; }
    if(rol === 'mozo')        { renderMesero(); return; }
    if(rol === 'cocina')      { renderStaff(); return; }

    await supabase.auth.signOut();
    errEl.textContent = 'Esta cuenta no tiene permisos asignados.';
  };
}

/* ============================================================
   STAFF LOGIN
============================================================ */
export function renderStaffLogin(){
  const app = document.getElementById('app');

  /* CORRECCIÓN 7: El panel de cocina ahora requiere login */
  app.innerHTML = `
    <div class="topbar">
      <div class="brand"><span class="display">${esc(RESTAURANT)}</span></div>
    </div>

    <div style="max-width:380px;margin:60px auto;">
      <div class="eyebrow">Acceso de cocina</div>
      <div class="display" style="font-size:36px;margin:8px 0 25px;">Iniciar sesión</div>

      <input id="login-email" type="email" placeholder="Correo"
        style="width:100%;padding:13px;margin-bottom:10px;font-family:inherit;">
      <input id="login-password" type="password" placeholder="Contraseña"
        style="width:100%;padding:13px;margin-bottom:15px;font-family:inherit;">

      <button id="login-btn" class="send-btn" style="width:100%;">Entrar</button>
      <div id="login-error" style="margin-top:15px;color:#c1502e;font-size:12px;"></div>
    </div>
  `;

  document.getElementById('login-btn').onclick = async () => {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl  = document.getElementById('login-error');
    const btn      = document.getElementById('login-btn');

    errorEl.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Entrando…';

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if(error){
      errorEl.textContent = 'Correo o contraseña incorrectos.';
      btn.disabled = false;
      btn.textContent = 'Entrar';
      return;
    }

    /* CORRECCIÓN 7 continúa: verificar que tenga rol cocina o admin */
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile }  = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if(!profile || !['cocina','admin','superadmin'].includes(profile.role)){
      await supabase.auth.signOut();
      errorEl.textContent = 'Esta cuenta no tiene acceso al panel de cocina.';
      btn.disabled = false;
      btn.textContent = 'Entrar';
      return;
    }

    renderStaff();
  };
}

/* ============================================================
   MESERO LOGIN
============================================================ */
export function renderMeseroLogin(){
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="topbar">
      <div class="brand">
        <span class="display">${esc(RESTAURANT)}</span>
      </div>
    </div>

    <div style="max-width:380px;margin:60px auto;">

      <div class="eyebrow">Panel de mesero</div>

      <div class="display"
           style="font-size:36px;margin:8px 0 25px;">
        Iniciar sesión
      </div>

      <input
        id="mesero-email"
        type="email"
        placeholder="Correo"
        style="width:100%;padding:13px;margin-bottom:10px;font-family:inherit;"
      >

      <input
        id="mesero-password"
        type="password"
        placeholder="Contraseña"
        style="width:100%;padding:13px;margin-bottom:15px;font-family:inherit;"
      >

      <button
        id="mesero-login-btn"
        class="send-btn"
        style="width:100%;">
        Entrar
      </button>

      <div
        id="mesero-login-error"
        style="margin-top:15px;color:#c1502e;font-size:12px;">
      </div>

    </div>
  `;

  document.getElementById('mesero-login-btn').onclick = async () => {

    const email =
      document.getElementById('mesero-email').value.trim();

    const password =
      document.getElementById('mesero-password').value;

    const errorEl =
      document.getElementById('mesero-login-error');

    const btn =
      document.getElementById('mesero-login-btn');

    errorEl.textContent = '';

    btn.disabled = true;
    btn.textContent = 'Entrando…';

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if(error){

      errorEl.textContent =
        'Correo o contraseña incorrectos.';

      btn.disabled = false;
      btn.textContent = 'Entrar';

      return;
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    const {
      data: profile,
      error: profileError
    } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if(
      profileError ||
      !profile ||
      !['mozo', 'admin', 'superadmin'].includes(profile.role)
    ){

      await supabase.auth.signOut();

      errorEl.textContent =
        'Esta cuenta no tiene permisos para manejar mesas.';

      btn.disabled = false;
      btn.textContent = 'Entrar';

      return;
    }

    renderMesero();
  };
}

/* ============================================================
   ADMIN LOGIN
============================================================ */
export function renderAdministradorLogin(){
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="topbar">
      <div class="brand"><span class="display">${esc(RESTAURANT)}</span></div>
    </div>

    <div style="max-width:380px;margin:60px auto;">
      <div class="eyebrow">Administración</div>
      <div class="display" style="font-size:36px;margin:8px 0 25px;">Iniciar sesión</div>

      <input id="admin-email" type="email" placeholder="Correo"
        style="width:100%;padding:13px;margin-bottom:10px;font-family:inherit;">
      <input id="admin-password" type="password" placeholder="Contraseña"
        style="width:100%;padding:13px;margin-bottom:15px;font-family:inherit;">

      <button id="admin-login-btn" class="send-btn" style="width:100%;">Entrar</button>
      <div id="admin-login-error" style="margin-top:15px;color:#c1502e;font-size:12px;"></div>
    </div>
  `;

  document.getElementById('admin-login-btn').onclick = async () => {
    const email    = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    const errorEl  = document.getElementById('admin-login-error');
    const btn      = document.getElementById('admin-login-btn');

    errorEl.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Entrando…';

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if(error){
      errorEl.textContent = 'Correo o contraseña incorrectos.';
      btn.disabled = false;
      btn.textContent = 'Entrar';
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if(profileError || !profile || !['admin','superadmin'].includes(profile.role)){
      await supabase.auth.signOut();
      errorEl.textContent = 'Esta cuenta no tiene permisos de administrador.';
      btn.disabled = false;
      btn.textContent = 'Entrar';
      return;
    }

    renderAdministrador();
  };
}