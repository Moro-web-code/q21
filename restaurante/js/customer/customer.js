/* ============================================================
   CUSTOMER — acceso del cliente vía QR (?token=...)
   Cambio principal: MESAS eliminada.
   getTableByToken() ahora consulta public.tables en Supabase.
   renderCustomer() recibe el objeto mesa desde Supabase.
   Resto del comportamiento idéntico al original.
   ============================================================ */

import { supabase } from '../config/supabase.js';
import { RESTAURANT } from '../config/constants.js';

const baseUrl = window.location.origin + window.location.pathname;

/* ============================================================
   UTILIDADES
============================================================ */
export function esc(str){
  return String(str ?? '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

export function fmt(n){
  return 'S/ ' + Number(n).toFixed(2);
}

export function qrUrl(targetUrl){
  return 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data='
    + encodeURIComponent(targetUrl);
}

export function elapsedLabel(iso){
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m + ':' + String(r).padStart(2,'0');
}

/* ============================================================
   getTableByToken
   Flujo: validate_qr_token → table_id → public.tables
   Retorna el mismo contrato que antes:
   { valid, mesa: { id, nombre }, session_id }
   router.js no necesita cambios.
============================================================ */
export async function getTableByToken(token){

  const cleanToken = String(token || '').trim();

  if(!cleanToken){
    return { valid: false, reason: 'qr_invalido' };
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if(!uuidRegex.test(cleanToken)){
    console.error('Token QR no tiene formato UUID:', cleanToken);
    return { valid: false, reason: 'qr_invalido' };
  }

  /* 1. Validar token contra Supabase */
  const { data, error } = await supabase.rpc('validate_qr_token', {
    p_token: cleanToken
  });

  if(error){
    console.error('Error validate_qr_token:', error);
    return { valid: false, reason: 'error' };
  }

  if(!data || !data.valid){
    console.warn('QR rechazado:', data);
    return { valid: false, reason: data?.reason || 'qr_invalido' };
  }

  const tableId = Number(data.table_id);

  /* 2. Obtener datos reales de la mesa desde public.tables */
  const { data: tableRow, error: tableError } = await supabase
    .from('tables')
    .select('id, name, active')
    .eq('id', tableId)
    .single();

  if(tableError || !tableRow){
    console.error('Mesa no encontrada en public.tables:', tableId, tableError);
    return { valid: false, reason: 'qr_invalido' };
  }

  /* Construir objeto mesa con la misma forma que antes */
  const mesa = {
    id:     tableRow.id,
    nombre: tableRow.name
  };

  return {
    valid:      true,
    mesa,
    session_id: data.session_id
  };
}

/* ============================================================
   getTableTokens
   Sin cambios de interfaz. Sigue usando get_table_qr_codes.
============================================================ */
export async function getTableTokens(){
  const { data, error } = await supabase.rpc('get_table_qr_codes');

  if(error){
    console.error('Error leyendo tokens:', error);
    return [];
  }

  return data || [];
}

/* ============================================================
   getTables
   Nueva función exportada: carga todas las mesas desde
   public.tables. Usada por administrator.js y waiter.js.
============================================================ */
export async function getTables(){
  const { data, error } = await supabase
    .from('tables')
    .select('id, name, active')
    .order('id', { ascending: true });

  if(error){
    console.error('Error cargando mesas:', error);
    return [];
  }

  return (data || []).map(t => ({
    id:     t.id,
    nombre: t.name,
    active: t.active
  }));
}

/* ============================================================
   getMenu
============================================================ */
export async function getMenu(){
  const { data, error } = await supabase
    .from('menu_items')
    .select('id, name, category, price')
    .eq('active', true)
    .order('id');

  if(error) return [];

  const categories = {};
  data.forEach(item => {
    if(!categories[item.category]) categories[item.category] = [];
    categories[item.category].push({
      id:    item.id,
      name:  item.name,
      price: Number(item.price)
    });
  });

  return Object.entries(categories).map(([cat, items]) => ({ cat, items }));
}

/* ============================================================
   getOrders — también usado por staff/staff.js
============================================================ */
export async function getOrders(){
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: true });

  if(error) return [];

  return data.map(o => ({
    id:        o.id,
    table:     o.table_name,
    tableId:   o.table_id,
    items:     o.items,
    total:     Number(o.total),
    notes:     o.notes || '',
    status:    o.status,
    createdAt: o.created_at
  }));
}

export async function getOrder(orderId){
  const token = localStorage.getItem('order_token_' + orderId);
  if(!token) return null;

  const { data, error } = await supabase.rpc('get_order_by_token', {
    p_order_id:     orderId,
    p_access_token: token
  });

  if(error || !data || data.length === 0) return null;

  const o = data[0];
  return {
    id:        o.id,
    table:     o.table_name,
    tableId:   o.table_id,
    items:     o.items,
    total:     Number(o.total),
    notes:     o.notes || '',
    status:    o.status,
    createdAt: o.created_at
  };
}

/* ============================================================
   bloquearNavegacionMesa — sin cambios
============================================================ */
export function bloquearNavegacionMesa(token){
  const urlMesa = baseUrl + '?token=' + encodeURIComponent(token);
  history.replaceState(null, '', urlMesa);
  history.pushState(null, '', urlMesa);
  window.addEventListener('popstate', function(){
    history.pushState(null, '', urlMesa);
  });
}

/* ============================================================
   renderCustomer — sin cambios de comportamiento.
   Recibe mesaId (integer) y qrToken (uuid string).
   Construye el objeto mesa desde Supabase si es necesario,
   o usa el fallback { id, nombre } igual que antes.
============================================================ */
export async function renderCustomer(mesaId, qrToken){
  const app = document.getElementById('app');

  /* Cargar datos reales de la mesa */
  const { data: tableRow } = await supabase
    .from('tables')
    .select('id, name')
    .eq('id', mesaId)
    .single();

  const mesa = tableRow
    ? { id: tableRow.id, nombre: tableRow.name }
    : { id: mesaId, nombre: 'Mesa ' + mesaId };

  const menu = await getMenu();
  const cart = {};

  function cartTotal(){
    return Object.values(cart).reduce((s,i) => s + i.price * i.qty, 0);
  }
  function cartCount(){
    return Object.values(cart).reduce((s,i) => s + i.qty, 0);
  }

  function draw(){
    app.innerHTML = `
      <div class="topbar">
        <div class="brand"><span class="display">${esc(RESTAURANT)}</span></div>
      </div>

      <div class="mesa-title">
        <div>
          <div class="eyebrow">Estás pidiendo desde</div>
          <div class="display">${esc(mesa.nombre)}</div>
        </div>
      </div>

      <div id="menu-wrap"></div>

      <textarea id="notes" class="notes-field"
        placeholder="Notas para cocina (opcional): sin cebolla, poco picante, etc."
        maxlength="300"
      ></textarea>

      <div style="height:90px;"></div>

      <div class="cart-bar">
        <div class="total">
          <span>${cartCount()} ítem(s)</span>
          ${fmt(cartTotal())}
        </div>
        <button class="send-btn" id="send-btn" ${cartCount()===0?'disabled':''}>
          Enviar pedido
        </button>
      </div>
    `;

    const wrap = document.getElementById('menu-wrap');

    wrap.innerHTML = menu.map(cat => `
      <div class="cat-block">
        <h3>${esc(cat.cat)}</h3>
        ${cat.items.map(it => {
          const qty = cart[it.name]?.qty || 0;
          return `
            <div class="item-row" data-name="${esc(it.name)}">
              <div class="meta">
                <div class="name">${esc(it.name)}</div>
                <div class="price">${fmt(it.price)}</div>
              </div>
              <div class="stepper">
                <button class="dec" ${qty===0?'disabled':''}>−</button>
                <span class="qty">${qty}</span>
                <button class="inc">+</button>
              </div>
            </div>`;
        }).join('')}
      </div>`).join('');

    wrap.querySelectorAll('.item-row').forEach(row => {
      const name = row.dataset.name;
      const item = menu.flatMap(c => c.items).find(i => i.name === name);

      row.querySelector('.inc').onclick = () => {
        if(!cart[name]){
          cart[name] = { menuItemId: item.id, name: item.name, price: item.price, qty: 0 };
        }
        cart[name].qty++;
        draw();
      };

      row.querySelector('.dec').onclick = () => {
        if(!cart[name]) return;
        cart[name].qty--;
        if(cart[name].qty <= 0) delete cart[name];
        draw();
      };
    });

    document.getElementById('send-btn').onclick = sendOrder;
  }

  async function sendOrder(){
    const btn = document.getElementById('send-btn');
    btn.disabled = true;
    btn.textContent = 'Enviando…';

    const notes       = (document.getElementById('notes').value || '').trim().slice(0, 300);
    const accessToken = crypto.randomUUID();
    const orderId     = crypto.randomUUID();

    const order = {
      id:           orderId,
      table_name:   mesa.nombre,
      table_id:     mesa.id,
      items:        Object.values(cart),
      notes,
      status:       'pendiente',
      created_at:   new Date().toISOString(),
      access_token: accessToken
    };

    const { data, error } = await supabase.rpc('create_order', {
      p_id:           order.id,
      p_table_id:     order.table_id,
      p_table_name:   order.table_name,
      p_items:        order.items,
      p_notes:        order.notes,
      p_access_token: order.access_token,
      p_qr_token:     qrToken
    });

    if(error){
      btn.disabled  = false;
      btn.textContent = 'Enviar pedido';
      const errDiv = document.querySelector('.error-msg') || (() => {
        const d = document.createElement('div');
        d.className = 'error-msg';
        document.querySelector('.cart-bar').before(d);
        return d;
      })();
      errDiv.textContent = 'No se pudo enviar el pedido. Intentá de nuevo.';
      errDiv.classList.add('visible');
      return;
    }

    localStorage.setItem('order_token_' + order.id, accessToken);
    renderConfirm({ ...order, total: data.total, items: data.items });
  }

  function renderConfirm(order){
    app.innerHTML = `
      <div class="topbar">
        <div class="brand"><span class="display">${esc(RESTAURANT)}</span></div>
      </div>

      <div class="confirm-wrap">
        <div class="ticket confirm-ticket">
          <div class="eyebrow">Pedido enviado — ${esc(order.table_name)}</div>
          <div class="ordid">#${esc(order.id.toUpperCase())}</div>
          <ul>
            ${order.items.map(i => `
              <li>
                <span>${esc(String(i.qty))}× ${esc(i.name)}</span>
                <span>${fmt(i.price * i.qty)}</span>
              </li>`).join('')}
          </ul>
          <div style="display:flex;justify-content:space-between;font-weight:700;font-size:14px;">
            <span>Total</span>
            <span>${fmt(order.total)}</span>
          </div>
          <div id="status-pill"></div>
        </div>

        <button class="new-order-btn" id="again-btn">
          + Agregar otro pedido a esta mesa
        </button>
      </div>
    `;

    updateStatusPill(order.status);
    document.getElementById('again-btn').onclick = () => {
      for(const k in cart) delete cart[k];
      draw();
    };
    pollStatus(order.id);
  }

  function updateStatusPill(status){
    const el = document.getElementById('status-pill');
    if(!el) return;
    const label =
      status === 'pendiente'  ? 'Pendiente'      :
      status === 'preparando' ? 'En preparación' :
      status === 'listo'      ? '¡Listo!'        : 'Entregado';

    el.innerHTML = `
      <div class="status-pill status-${esc(status === 'entregado' ? 'listo' : status)}">
        ${esc(label)}
      </div>`;
  }

  async function pollStatus(orderId){
    let ultimoEstado = 'pendiente';
    const estados = { pendiente:0, preparando:1, listo:2, entregado:3 };

    const interval = setInterval(async () => {
      if(!document.getElementById('status-pill')){
        clearInterval(interval);
        return;
      }
      const o = await getOrder(orderId);
      if(!o) return;
      if(estados[o.status] >= estados[ultimoEstado]){
        ultimoEstado = o.status;
        updateStatusPill(o.status);
      }
      if(o.status === 'entregado') clearInterval(interval);
    }, 4000);
  }

  draw();
}
