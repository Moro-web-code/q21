/* ============================================================
   ROUTER — punto de entrada de la aplicación.
   Es el equivalente modular del IIFE original.
   Los `return` que antes terminaban el IIFE ahora terminan
   la función init() — mismo comportamiento exacto.
   ============================================================ */

import { supabase } from './config/supabase.js';
import { getTableByToken, bloquearNavegacionMesa, renderCustomer } from './customer/customer.js';
import { renderLoginUnificado } from './auth/login.js';
import { renderSuperadmin } from './superadmin/superadmin.js';
import { renderAdministrador } from './admin/administrator.js';
import { renderStaff } from './staff/staff.js';
import { renderMesero } from './waiter/waiter.js';

async function init(){

  const app = document.getElementById('app');
  const params = new URLSearchParams(window.location.search);

  const tokenParam       = params.get('token');
  const isAdmin          = params.get('admin') === '1';
  const isAdministrador  = params.get('administrador') === '1';
  const isMesero         = params.get('mesero') === '1';

  /* ============================================================
     ACCESO PRINCIPAL — LOGIN UNIFICADO + CONTROL POR ROL
     ============================================================ */

  const {
    data: { session: initSession }
  } = await supabase.auth.getSession();


  /* ============================================================
     1. ACCESO CLIENTE MEDIANTE QR
     ============================================================ */

  if(tokenParam){

    const resultado = await getTableByToken(tokenParam);

    if(!resultado.valid){

      if(resultado.reason === 'mesa_inactiva'){

        app.innerHTML = `
          <div class="access-state">
            <div class="access-state-icon">
              <i class="ti ti-lock"></i>
            </div>

            <div class="eyebrow">Mesa no disponible</div>

            <div class="display">
              Mesa cerrada
            </div>

            <p>
              Esta mesa todavía no ha sido habilitada
              para realizar pedidos.
            </p>
          </div>
        `;

      }else{

        app.innerHTML = `
          <div class="access-state">
            <div class="access-state-icon">
              <i class="ti ti-qrcode-off"></i>
            </div>

            <div class="eyebrow">Acceso no válido</div>

            <div class="display">
              Código no reconocido
            </div>

            <p>
              Este código QR no corresponde
              a una mesa válida.
            </p>
          </div>
        `;
      }

      return;
    }


    /*
      IMPORTANTE:
      El cliente entra únicamente mediante token.
      Nunca se utiliza el login del personal.
    */

    bloquearNavegacionMesa(tokenParam);

    renderCustomer(resultado.mesa.id, tokenParam);

    return;
  }


  /* ============================================================
     2. SIN TOKEN = ACCESO EXCLUSIVO PARA PERSONAL
     ============================================================ */

  if(!initSession){

    renderLoginUnificado();

    return;
  }


  /* ============================================================
     3. EXISTE SESIÓN → OBTENER USUARIO
     ============================================================ */

  const {
    data: {
      user
    },
    error: userError
  } = await supabase.auth.getUser();


  if(userError || !user){

    await supabase.auth.signOut();

    renderLoginUnificado();

    return;
  }


  /* ============================================================
     4. OBTENER ROL DESDE PROFILES
     ============================================================ */

  const {
    data: profile,
    error: profileError
  } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();


  if(profileError || !profile){

    console.error(
      'No se pudo obtener el perfil:',
      profileError
    );

    await supabase.auth.signOut();

    app.innerHTML = `
      <div class="access-state">
        <div class="access-state-icon">
          <i class="ti ti-shield-x"></i>
        </div>

        <div class="eyebrow">
          Acceso no autorizado
        </div>

        <div class="display">
          Perfil no configurado
        </div>

        <p>
          Tu usuario no tiene un perfil válido
          dentro del sistema.
        </p>

        <button
          class="access-state-btn"
          onclick="location.reload()"
        >
          Volver
        </button>
      </div>
    `;

    return;
  }


  const rol = String(profile.role || '')
    .trim()
    .toLowerCase();


  /* ============================================================
     5. AUTORIZACIÓN REAL POR ROL
     ============================================================ */


  /* ------------------------------------------------------------
     SUPERADMIN
     ------------------------------------------------------------ */

  if(rol === 'superadmin'){

    renderSuperadmin();

    return;
  }


  /* ------------------------------------------------------------
     ADMIN
     ------------------------------------------------------------ */

  if(rol === 'admin'){

    renderAdministrador();

    return;
  }


  /* ------------------------------------------------------------
     COCINA
     ------------------------------------------------------------ */

  if(rol === 'cocina'){

    renderStaff();

    return;
  }


  /* ------------------------------------------------------------
     MESERO
     ------------------------------------------------------------ */

  if(
    rol === 'mesero' ||
    rol === 'mozo'
  ){

    renderMesero();

    return;
  }


  /* ============================================================
     6. ROL DESCONOCIDO
     ============================================================ */

  console.error(
    'Rol no reconocido:',
    rol
  );

  await supabase.auth.signOut();

  renderLoginUnificado();

  return;

}

init();