/* ============================================================
   CUSTOMER — acceso del cliente vía QR (?token=...)

   REDISEÑO VISUAL:
   - Interfaz móvil-first para clientes
   - Cabecera compacta
   - Categorías desplazables
   - Tarjetas de productos
   - Carrito flotante
   - Pantalla de confirmación renovada
   - Timeline visual del estado del pedido

   LÓGICA CONSERVADA:
   - validate_qr_token
   - get_table_qr_codes
   - tables
   - map_elements
   - menu_items
   - orders
   - get_order_by_token
   - create_order
   - tokens QR
   - IDs y clases utilizados por JS
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
  const s = Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  );

  const m = Math.floor(s / 60);
  const r = s % 60;

  return m + ':' + String(r).padStart(2,'0');
}


/* ============================================================
   getTableByToken
============================================================ */

export async function getTableByToken(token){

  const cleanToken = String(token || '').trim();

  if(!cleanToken){
    return {
      valid: false,
      reason: 'qr_invalido'
    };
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if(!uuidRegex.test(cleanToken)){
    console.error(
      'Token QR no tiene formato UUID:',
      cleanToken
    );

    return {
      valid: false,
      reason: 'qr_invalido'
    };
  }

  const { data, error } = await supabase.rpc(
    'validate_qr_token',
    {
      p_token: cleanToken
    }
  );

  if(error){
    console.error(
      'Error validate_qr_token:',
      error
    );

    return {
      valid: false,
      reason: 'error'
    };
  }

  if(!data || !data.valid){

    console.warn(
      'QR rechazado:',
      data
    );

    return {
      valid: false,
      reason: data?.reason || 'qr_invalido'
    };
  }

  const tableId = Number(data.table_id);

  const { data: tableRow, error: tableError } =
    await supabase
      .from('tables')
      .select('id, name, active')
      .eq('id', tableId)
      .single();

  if(tableError || !tableRow){

    console.error(
      'Mesa no encontrada en public.tables:',
      tableId,
      tableError
    );

    return {
      valid: false,
      reason: 'qr_invalido'
    };
  }

  const mesa = {
    id: tableRow.id,
    nombre: tableRow.name
  };

  return {
    valid: true,
    mesa,
    session_id: data.session_id
  };
}


/* ============================================================
   getTableTokens
============================================================ */

export async function getTableTokens(){

  const { data, error } =
    await supabase.rpc('get_table_qr_codes');

  if(error){

    console.error(
      'Error leyendo tokens:',
      error
    );

    return [];
  }

  return data || [];
}


/* ============================================================
   getTables
============================================================ */

export async function getTables(){

  const { data, error } =
    await supabase
      .from('tables')
      .select(
        'id, name, active, position_x, position_y, width, height, rotation, shape'
      )
      .order('id', {
        ascending: true
      });

  if(error){

    console.error(
      'Error cargando mesas:',
      error
    );

    return [];
  }

  return (data || []).map(t => ({

    id: t.id,

    nombre: t.name,

    active: t.active,

    position_x:
      t.position_x ?? 20,

    position_y:
      t.position_y ?? 20,

    width:
      t.width ?? 8,

    height:
      t.height ?? 8,

    rotation:
      t.rotation ?? 0,

    shape:
      t.shape ?? 'round'

  }));
}


/* ============================================================
   getMapElements
============================================================ */

export async function getMapElements(){

  const { data, error } =
    await supabase
      .from('map_elements')
      .select(
        'id, type, label, position_x, position_y, width, height, rotation'
      )
      .order('id');

  if(error){

    console.error(
      'Error cargando elementos del mapa:',
      error
    );

    return [];
  }

  return data || [];
}


/* ============================================================
   getMenu
============================================================ */

export async function getMenu(){

  const { data, error } =
    await supabase
      .from('menu_items')
      .select(
        'id, name, category, price'
      )
      .eq('active', true)
      .order('id');

  if(error){

    console.error(
      'Error cargando menú:',
      error
    );

    return [];
  }

  const categories = {};

  data.forEach(item => {

    if(!categories[item.category]){
      categories[item.category] = [];
    }

    categories[item.category].push({

      id:
        item.id,

      name:
        item.name,

      price:
        Number(item.price)

    });

  });

  return Object.entries(categories)
    .map(([cat, items]) => ({
      cat,
      items
    }));
}


/* ============================================================
   getOrders
============================================================ */

export async function getOrders(){

  const { data, error } =
    await supabase
      .from('orders')
      .select('*')
      .order('created_at', {
        ascending: true
      });

  if(error){

    console.error(
      'Error cargando pedidos:',
      error
    );

    return [];
  }

  return data.map(o => ({

    id:
      o.id,

    table:
      o.table_name,

    tableId:
      o.table_id,

    items:
      o.items,

    total:
      Number(o.total),

    notes:
      o.notes || '',

    status:
      o.status,

    createdAt:
      o.created_at

  }));
}


/* ============================================================
   getOrder
============================================================ */

export async function getOrder(orderId){

  const token =
    localStorage.getItem(
      'order_token_' + orderId
    );

  if(!token){
    return null;
  }

  const { data, error } =
    await supabase.rpc(
      'get_order_by_token',
      {
        p_order_id:
          orderId,

        p_access_token:
          token
      }
    );

  if(
    error ||
    !data ||
    data.length === 0
  ){
    return null;
  }

  const o = data[0];

  return {

    id:
      o.id,

    table:
      o.table_name,

    tableId:
      o.table_id,

    items:
      o.items,

    total:
      Number(o.total),

    notes:
      o.notes || '',

    status:
      o.status,

    createdAt:
      o.created_at

  };
}


/* ============================================================
   bloquearNavegacionMesa
============================================================ */

export function bloquearNavegacionMesa(token){

  const urlMesa =
    baseUrl +
    '?token=' +
    encodeURIComponent(token);

  history.replaceState(
    null,
    '',
    urlMesa
  );

  history.pushState(
    null,
    '',
    urlMesa
  );

  window.addEventListener(
    'popstate',
    function(){

      history.pushState(
        null,
        '',
        urlMesa
      );

    }
  );
}


/* ============================================================
   ESTILOS DEL CLIENTE
============================================================ */

function injectCustomerStyles(){

  if(
    document.getElementById(
      'customer-ui-style'
    )
  ){
    return;
  }

  const st =
    document.createElement('style');

  st.id =
    'customer-ui-style';

  st.textContent = `

    /* ========================================================
       RESET
    ======================================================== */

    #customer-root,
    #customer-root *,
    #customer-root *::before,
    #customer-root *::after{
      box-sizing:border-box;
    }


    /* ========================================================
       VARIABLES
    ======================================================== */

    #customer-root{

      --cq-bg:#f5f4f1;

      --cq-surface:#ffffff;

      --cq-surface-soft:#faf9f7;

      --cq-border:#e7e4de;

      --cq-border-strong:#d7d3cb;

      --cq-text:#181714;

      --cq-text-soft:#65615a;

      --cq-text-muted:#96918a;

      --cq-accent:#b84d25;

      --cq-accent-dark:#963d1d;

      --cq-accent-soft:#f8ece7;

      --cq-success:#3d7047;

      --cq-success-soft:#edf5ee;

      --cq-warning:#a47813;

      --cq-warning-soft:#faf4df;

      --cq-shadow:
        0 8px 30px rgba(0,0,0,.08);

      --cq-radius:14px;

      --cq-radius-sm:9px;

      min-height:100dvh;

      background:
        var(--cq-bg);

      color:
        var(--cq-text);

      font-family:
        Arial,
        Helvetica,
        sans-serif;

      -webkit-font-smoothing:
        antialiased;

      padding-bottom:1px;

    }


    /* ========================================================
       BODY
    ======================================================== */

    body:has(#customer-root){

      margin:0;

      background:
        #f5f4f1;

    }


    /* ========================================================
       HEADER
    ======================================================== */

    .cq-header{

      position:sticky;

      top:0;

      z-index:100;

      background:
        rgba(255,255,255,.96);

      backdrop-filter:
        blur(12px);

      -webkit-backdrop-filter:
        blur(12px);

      border-bottom:
        1px solid
        var(--cq-border);

      padding:
        14px 16px;

    }


    .cq-header-inner{

      max-width:720px;

      margin:auto;

      display:flex;

      align-items:center;

      justify-content:space-between;

      gap:12px;

    }


    .cq-brand-block{

      min-width:0;

    }


    .cq-brand{

      font-size:17px;

      line-height:1.1;

      font-weight:800;

      letter-spacing:-.03em;

      color:
        var(--cq-text);

      white-space:nowrap;

      overflow:hidden;

      text-overflow:ellipsis;

    }


    .cq-subtitle{

      margin-top:4px;

      font-size:10px;

      text-transform:uppercase;

      letter-spacing:.1em;

      font-weight:700;

      color:
        var(--cq-text-muted);

    }


    .cq-mesa-chip{

      flex-shrink:0;

      display:flex;

      align-items:center;

      gap:7px;

      padding:
        7px 11px;

      border:
        1px solid
        #ead0c6;

      border-radius:
        999px;

      background:
        var(--cq-accent-soft);

      color:
        var(--cq-accent);

      font-size:11px;

      font-weight:700;

      white-space:nowrap;

    }


    .cq-mesa-dot{

      width:6px;

      height:6px;

      border-radius:50%;

      background:
        var(--cq-accent);

      box-shadow:
        0 0 0 3px
        rgba(184,77,37,.10);

    }


    /* ========================================================
       HERO / INTRO
    ======================================================== */

    .cq-intro{

      max-width:720px;

      margin:auto;

      padding:
        22px 16px 4px;

    }


    .cq-intro-eyebrow{

      font-size:10px;

      text-transform:uppercase;

      letter-spacing:.12em;

      color:
        var(--cq-text-muted);

      font-weight:700;

      margin-bottom:6px;

    }


    .cq-intro-title{

      margin:0;

      font-size:25px;

      line-height:1.1;

      letter-spacing:-.045em;

      font-weight:800;

      color:
        var(--cq-text);

    }


    .cq-intro-text{

      margin:
        7px 0 0;

      color:
        var(--cq-text-soft);

      font-size:12px;

      line-height:1.55;

    }


    /* ========================================================
       CATEGORÍAS
    ======================================================== */

    .cq-categories{

      max-width:720px;

      margin:auto;

      padding:
        17px 16px 5px;

      overflow:hidden;

    }


    .cq-categories-scroll{

      display:flex;

      gap:7px;

      overflow-x:auto;

      padding-bottom:8px;

      scrollbar-width:none;

      -webkit-overflow-scrolling:touch;

    }


    .cq-categories-scroll::-webkit-scrollbar{
      display:none;
    }


    .cq-category-btn{

      flex-shrink:0;

      border:
        1px solid
        var(--cq-border-strong);

      background:
        var(--cq-surface);

      color:
        var(--cq-text-soft);

      height:34px;

      padding:
        0 14px;

      border-radius:
        999px;

      font-size:11px;

      font-weight:700;

      cursor:pointer;

      transition:
        .18s ease;

      font-family:
        Arial,
        Helvetica,
        sans-serif;

    }


    .cq-category-btn:active{

      transform:
        scale(.97);

    }


    .cq-category-btn.active{

      background:
        var(--cq-text);

      border-color:
        var(--cq-text);

      color:
        #fff;

    }


    /* ========================================================
       CONTENT
    ======================================================== */

    .cq-content{

      max-width:720px;

      margin:auto;

      padding:
        12px 16px 150px;

    }


    /* ========================================================
       CATEGORY SECTION
    ======================================================== */

    .cq-category-section{

      margin-bottom:25px;

    }


    .cq-category-title{

      display:flex;

      align-items:center;

      justify-content:space-between;

      margin:
        0 0 10px;

    }


    .cq-category-name{

      font-size:11px;

      font-weight:800;

      text-transform:uppercase;

      letter-spacing:.1em;

      color:
        var(--cq-text-muted);

    }


    .cq-category-line{

      flex:1;

      height:1px;

      background:
        var(--cq-border);

      margin-left:12px;

    }


    /* ========================================================
       PRODUCT LIST
    ======================================================== */

    .cq-products{

      display:flex;

      flex-direction:column;

      gap:8px;

    }


    .item-row{

      display:flex;

      align-items:center;

      gap:14px;

      background:
        var(--cq-surface);

      border:
        1px solid
        var(--cq-border);

      border-radius:
        var(--cq-radius);

      padding:
        14px;

      min-height:76px;

      transition:
        border-color .18s ease,
        transform .12s ease;

    }


    .item-row:active{

      transform:
        scale(.995);

    }


    .cq-product-info{

      flex:1;

      min-width:0;

    }


    .cq-product-name{

      font-size:14px;

      line-height:1.3;

      font-weight:750;

      color:
        var(--cq-text);

      margin-bottom:5px;

      overflow:hidden;

      text-overflow:ellipsis;

      white-space:nowrap;

    }


    .cq-product-price{

      font-size:13px;

      font-weight:800;

      color:
        var(--cq-text);

    }


    .cq-product-right{

      flex-shrink:0;

    }


    /* ========================================================
       STEPPER
    ======================================================== */

    .stepper{

      display:flex;

      align-items:center;

      border:
        1px solid
        var(--cq-border-strong);

      border-radius:
        10px;

      overflow:hidden;

      background:
        var(--cq-surface-soft);

      height:36px;

    }


    .stepper .dec,
    .stepper .inc{

      width:34px;

      height:34px;

      border:0;

      background:
        transparent;

      color:
        var(--cq-text);

      font-size:18px;

      line-height:1;

      cursor:pointer;

      display:flex;

      align-items:center;

      justify-content:center;

      font-family:
        Arial,
        Helvetica,
        sans-serif;

    }


    .stepper .inc{

      background:
        var(--cq-text);

      color:
        #fff;

    }


    .stepper .dec:disabled{

      color:
        #c8c4bd;

      cursor:not-allowed;

    }


    .stepper .qty{

      min-width:29px;

      text-align:center;

      font-size:12px;

      font-weight:800;

      color:
        var(--cq-text);

    }


    /* ========================================================
       NOTES
    ======================================================== */

    .cq-notes-section{

      margin-top:25px;

      background:
        var(--cq-surface);

      border:
        1px solid
        var(--cq-border);

      border-radius:
        var(--cq-radius);

      padding:
        15px;

    }


    .cq-notes-title{

      font-size:12px;

      font-weight:800;

      margin-bottom:4px;

      color:
        var(--cq-text);

    }


    .cq-notes-description{

      font-size:10px;

      line-height:1.45;

      color:
        var(--cq-text-muted);

      margin-bottom:10px;

    }


    .notes-field{

      display:block;

      width:100%;

      min-height:78px;

      resize:none;

      border:
        1px solid
        var(--cq-border);

      border-radius:
        var(--cq-radius-sm);

      background:
        var(--cq-surface-soft);

      color:
        var(--cq-text);

      padding:
        11px 12px;

      outline:none;

      font-family:
        Arial,
        Helvetica,
        sans-serif;

      font-size:12px;

      line-height:1.5;

      transition:
        border-color .18s ease,
        background .18s ease;

    }


    .notes-field:focus{

      border-color:
        var(--cq-border-strong);

      background:
        #fff;

    }


    .notes-field::placeholder{

      color:
        #aaa59e;

    }


    /* ========================================================
       CART BAR
    ======================================================== */

    .cart-bar{

      position:fixed;

      z-index:200;

      left:0;

      right:0;

      bottom:0;

      padding:
        10px 12px
        calc(12px + env(safe-area-inset-bottom));

      background:
        linear-gradient(
          to top,
          rgba(245,244,241,.98),
          rgba(245,244,241,.88),
          rgba(245,244,241,0)
        );

      pointer-events:none;

    }


    .cq-cart-inner{

      max-width:696px;

      margin:auto;

      display:flex;

      align-items:center;

      gap:10px;

      padding:
        10px;

      border-radius:
        15px;

      background:
        var(--cq-text);

      box-shadow:
        0 10px 35px
        rgba(0,0,0,.20);

      pointer-events:auto;

    }


    .cq-cart-info{

      flex:1;

      min-width:0;

    }


    .cq-cart-label{

      display:block;

      color:
        rgba(255,255,255,.55);

      font-size:9px;

      text-transform:uppercase;

      letter-spacing:.08em;

      font-weight:700;

      margin-bottom:2px;

    }


    .cq-cart-total{

      color:#fff;

      font-size:16px;

      font-weight:800;

      letter-spacing:-.02em;

    }


    .cq-cart-count{

      flex-shrink:0;

      width:27px;

      height:27px;

      border-radius:50%;

      background:
        var(--cq-accent);

      color:#fff;

      display:flex;

      align-items:center;

      justify-content:center;

      font-size:10px;

      font-weight:800;

    }


    .send-btn{

      flex-shrink:0;

      height:42px;

      padding:
        0 17px;

      border:0;

      border-radius:
        10px;

      background:
        var(--cq-accent);

      color:#fff;

      font-size:11px;

      font-weight:800;

      cursor:pointer;

      font-family:
        Arial,
        Helvetica,
        sans-serif;

      transition:
        .18s ease;

    }


    .send-btn:active:not(:disabled){

      transform:
        scale(.97);

    }


    .send-btn:disabled{

      background:
        #484743;

      color:
        #77756f;

      cursor:not-allowed;

    }


    /* ========================================================
       ERROR
    ======================================================== */

    .error-msg{

      display:none;

      max-width:696px;

      margin:
        0 auto 8px;

      padding:
        11px 13px;

      border:
        1px solid
        #e8b9a9;

      border-radius:
        9px;

      background:
        #fff0eb;

      color:
        #9c3f22;

      font-size:11px;

      line-height:1.4;

    }


    .error-msg.visible{

      display:block;

    }


    /* ========================================================
       CONFIRMATION
    ======================================================== */

    .confirm-wrap{

      max-width:520px;

      min-height:
        calc(100dvh - 60px);

      margin:auto;

      padding:
        28px 16px
        40px;

      display:flex;

      flex-direction:column;

      align-items:center;

    }


    .confirm-success{

      width:64px;

      height:64px;

      border-radius:50%;

      display:flex;

      align-items:center;

      justify-content:center;

      background:
        var(--cq-success-soft);

      color:
        var(--cq-success);

      font-size:27px;

      font-weight:800;

      margin-bottom:14px;

    }


    .confirm-title{

      margin:0;

      font-size:23px;

      line-height:1.15;

      letter-spacing:-.04em;

      font-weight:850;

      text-align:center;

    }


    .confirm-subtitle{

      margin:
        7px 0 20px;

      color:
        var(--cq-text-soft);

      font-size:11px;

      line-height:1.5;

      text-align:center;

    }


    .confirm-ticket{

      width:100%;

      background:
        var(--cq-surface);

      border:
        1px solid
        var(--cq-border);

      border-radius:
        var(--cq-radius);

      overflow:hidden;

      box-shadow:
        0 4px 22px
        rgba(0,0,0,.05);

    }


    .cq-ticket-head{

      padding:
        17px;

      border-bottom:
        1px solid
        var(--cq-border);

      display:flex;

      align-items:center;

      justify-content:space-between;

      gap:10px;

    }


    .cq-ticket-label{

      font-size:9px;

      color:
        var(--cq-text-muted);

      text-transform:uppercase;

      letter-spacing:.1em;

      font-weight:800;

    }


    .cq-order-number{

      font-size:14px;

      font-weight:850;

      color:
        var(--cq-text);

    }


    .cq-ticket-items{

      list-style:none;

      padding:
        6px 17px;

      margin:0;

    }


    .cq-ticket-item{

      display:flex;

      justify-content:space-between;

      align-items:center;

      gap:15px;

      padding:
        11px 0;

      border-bottom:
        1px solid
        var(--cq-border);

      font-size:11px;

    }


    .cq-ticket-item:last-child{

      border-bottom:0;

    }


    .cq-ticket-item-name{

      color:
        var(--cq-text);

      font-weight:650;

    }


    .cq-ticket-item-price{

      color:
        var(--cq-text-soft);

      font-weight:700;

      white-space:nowrap;

    }


    .cq-ticket-total{

      margin:
        0 17px;

      padding:
        14px 0 17px;

      border-top:
        1px solid
        var(--cq-border);

      display:flex;

      justify-content:space-between;

      align-items:center;

    }


    .cq-ticket-total-label{

      font-size:10px;

      text-transform:uppercase;

      letter-spacing:.08em;

      color:
        var(--cq-text-muted);

      font-weight:800;

    }


    .cq-ticket-total-value{

      font-size:19px;

      font-weight:850;

    }


    /* ========================================================
       STATUS
    ======================================================== */

    #status-pill{

      display:block;

    }


    .cq-status{

      border-top:
        1px solid
        var(--cq-border);

      padding:
        17px;

    }


    .cq-status-heading{

      font-size:9px;

      text-transform:uppercase;

      letter-spacing:.1em;

      color:
        var(--cq-text-muted);

      font-weight:800;

      margin-bottom:16px;

    }


    .cq-timeline{

      display:flex;

      align-items:flex-start;

      width:100%;

    }


    .cq-timeline-step{

      flex:1;

      position:relative;

      display:flex;

      flex-direction:column;

      align-items:center;

      min-width:0;

    }


    .cq-timeline-step:not(:last-child)::after{

      content:'';

      position:absolute;

      top:10px;

      left:calc(50% + 10px);

      right:calc(-50% + 10px);

      height:2px;

      background:
        var(--cq-border);

    }


    .cq-timeline-step.done:not(:last-child)::after{

      background:
        var(--cq-success);

    }


    .cq-timeline-dot{

      position:relative;

      z-index:2;

      width:21px;

      height:21px;

      border-radius:50%;

      border:
        2px solid
        var(--cq-border-strong);

      background:
        var(--cq-surface);

      display:flex;

      align-items:center;

      justify-content:center;

      color:
        transparent;

      font-size:9px;

      font-weight:900;

    }


    .cq-timeline-step.done
    .cq-timeline-dot{

      background:
        var(--cq-success);

      border-color:
        var(--cq-success);

      color:#fff;

    }


    .cq-timeline-step.current
    .cq-timeline-dot{

      background:
        var(--cq-accent);

      border-color:
        var(--cq-accent);

      color:#fff;

      box-shadow:
        0 0 0 4px
        var(--cq-accent-soft);

    }


    .cq-timeline-label{

      margin-top:7px;

      font-size:8px;

      line-height:1.25;

      text-align:center;

      color:
        var(--cq-text-muted);

      font-weight:700;

      max-width:70px;

    }


    .cq-timeline-step.done
    .cq-timeline-label{

      color:
        var(--cq-success);

    }


    .cq-timeline-step.current
    .cq-timeline-label{

      color:
        var(--cq-accent);

    }


    /* ========================================================
       NEW ORDER
    ======================================================== */

    .new-order-btn{

      width:100%;

      height:45px;

      margin-top:12px;

      border:
        1px solid
        var(--cq-border-strong);

      border-radius:
        var(--cq-radius);

      background:
        var(--cq-surface);

      color:
        var(--cq-text);

      font-size:11px;

      font-weight:800;

      cursor:pointer;

      font-family:
        Arial,
        Helvetica,
        sans-serif;

    }


    .new-order-btn:active{

      transform:
        scale(.99);

    }


    /* ========================================================
       SKELETON
    ======================================================== */

    .cq-loading{

      max-width:720px;

      margin:auto;

      padding:
        20px 16px;

    }


    .cq-skeleton-card{

      height:78px;

      border-radius:
        var(--cq-radius);

      background:
        linear-gradient(
          90deg,
          #ebe9e4 25%,
          #f5f4f1 50%,
          #ebe9e4 75%
        );

      background-size:
        200% 100%;

      animation:
        cq-shimmer 1.4s infinite;

      margin-bottom:8px;

    }


    @keyframes cq-shimmer{

      0%{
        background-position:
          200% 0;
      }

      100%{
        background-position:
          -200% 0;
      }

    }


    /* ========================================================
       EMPTY
    ======================================================== */

    .cq-empty{

      padding:
        55px 20px;

      text-align:center;

      color:
        var(--cq-text-muted);

    }


    .cq-empty-icon{

      font-size:28px;

      margin-bottom:9px;

    }


    .cq-empty-title{

      font-size:13px;

      font-weight:800;

      color:
        var(--cq-text-soft);

      margin-bottom:4px;

    }


    .cq-empty-text{

      font-size:11px;

      line-height:1.5;

    }


    /* ========================================================
       RESPONSIVE
    ======================================================== */

    @media(max-width:390px){

      .cq-brand{

        font-size:15px;

      }

      .cq-intro-title{

        font-size:22px;

      }

      .item-row{

        gap:9px;

        padding:12px;

      }

      .cq-product-name{

        font-size:13px;

      }

      .stepper .dec,
      .stepper .inc{

        width:31px;

      }

      .send-btn{

        padding:
          0 13px;

      }

    }


    @media(min-width:700px){

      .cq-content{

        padding-left:0;

        padding-right:0;

      }

      .cq-categories{

        padding-left:0;

        padding-right:0;

      }

      .cq-intro{

        padding-left:0;

        padding-right:0;

      }

    }

  `;

  document.head.appendChild(st);
}


/* ============================================================
   renderCustomer
============================================================ */

export async function renderCustomer(
  mesaId,
  qrToken
){

  injectCustomerStyles();

  const app =
    document.getElementById('app');

  /* ==========================================================
     OBTENER MESA
  ========================================================== */

  const {
    data: tableRow
  } = await supabase
    .from('tables')
    .select('id, name')
    .eq('id', mesaId)
    .single();

  const mesa = tableRow
    ? {
        id:
          tableRow.id,

        nombre:
          tableRow.name
      }
    : {
        id:
          mesaId,

        nombre:
          'Mesa ' + mesaId
      };


  /* ==========================================================
     LOADING
  ========================================================== */

  app.innerHTML = `

    <div id="customer-root">

      <header class="cq-header">

        <div class="cq-header-inner">

          <div class="cq-brand-block">

            <div class="cq-brand">
              ${esc(RESTAURANT)}
            </div>

            <div class="cq-subtitle">
              Menú digital
            </div>

          </div>

          <div class="cq-mesa-chip">

            <span class="cq-mesa-dot"></span>

            ${esc(mesa.nombre)}

          </div>

        </div>

      </header>


      <div class="cq-loading">

        <div class="cq-skeleton-card"></div>
        <div class="cq-skeleton-card"></div>
        <div class="cq-skeleton-card"></div>
        <div class="cq-skeleton-card"></div>
        <div class="cq-skeleton-card"></div>

      </div>

    </div>

  `;


  /* ==========================================================
     MENU
  ========================================================== */

  const menu =
    await getMenu();

const cart = {};

let activeCat =
  'todos';

let customerNotes = '';

  /* ==========================================================
     CART
  ========================================================== */

  function cartTotal(){

    return Object.values(cart)
      .reduce(
        (s,i) =>
          s + i.price * i.qty,
        0
      );

  }


  function cartCount(){

    return Object.values(cart)
      .reduce(
        (s,i) =>
          s + i.qty,
        0
      );

  }


  /* ==========================================================
     CATEGORÍAS
  ========================================================== */

  const categories =
    menu.map(
      c => c.cat
    );


  /* ==========================================================
     DRAW
  ========================================================== */

  function draw(){
   const currentNotes =
  document.getElementById('notes')?.value;

if(currentNotes !== undefined){
  customerNotes = currentNotes;
}
    const visibleMenu =
      activeCat === 'todos'
        ? menu
        : menu.filter(
            c =>
              c.cat === activeCat
          );


    const count =
      cartCount();

    const total =
      cartTotal();


    app.innerHTML = `

      <div id="customer-root">


        <!-- ================================================
             HEADER
        ================================================= -->

        <header class="cq-header">

          <div class="cq-header-inner">

            <div class="cq-brand-block">

              <div class="cq-brand">
                ${esc(RESTAURANT)}
              </div>

              <div class="cq-subtitle">
                Menú digital
              </div>

            </div>


            <div class="cq-mesa-chip">

              <span class="cq-mesa-dot"></span>

              ${esc(mesa.nombre)}

            </div>

          </div>

        </header>



        <!-- ================================================
             INTRO
        ================================================= -->

        <section class="cq-intro">

          <div class="cq-intro-eyebrow">
            Tu mesa
          </div>

          <h1 class="cq-intro-title">
            ¿Qué te gustaría pedir?
          </h1>

          <p class="cq-intro-text">
            Explora nuestro menú y agrega tus productos al pedido.
          </p>

        </section>



        <!-- ================================================
             CATEGORÍAS
        ================================================= -->

        <div class="cq-categories">

          <div class="cq-categories-scroll">

            <button
              class="cq-category-btn ${activeCat === 'todos' ? 'active' : ''}"
              data-cat="todos"
            >
              Todo
            </button>

            ${categories.map(cat => `

              <button
                class="cq-category-btn ${activeCat === cat ? 'active' : ''}"
                data-cat="${esc(cat)}"
              >
                ${esc(cat)}
              </button>

            `).join('')}

          </div>

        </div>



        <!-- ================================================
             CONTENT
        ================================================= -->

        <main class="cq-content">

          <div id="menu-wrap">

            ${
              visibleMenu.length === 0

              ?

              `
                <div class="cq-empty">

                  <div class="cq-empty-icon">
                    —
                  </div>

                  <div class="cq-empty-title">
                    No hay productos
                  </div>

                  <div class="cq-empty-text">
                    No encontramos productos disponibles
                    en esta categoría.
                  </div>

                </div>
              `

              :

              visibleMenu.map(cat => `

                <section
                  class="cq-category-section"
                >

                  <div class="cq-category-title">

                    <span class="cq-category-name">
                      ${esc(cat.cat)}
                    </span>

                    <span class="cq-category-line"></span>

                  </div>


                  <div class="cq-products">

                    ${cat.items.map(it => {

                      const qty =
                        cart[it.name]?.qty || 0;

                      return `

                        <div
                          class="item-row"
                          data-name="${esc(it.name)}"
                        >

                          <div class="cq-product-info">

                            <div class="cq-product-name">
                              ${esc(it.name)}
                            </div>

                            <div class="cq-product-price">
                              ${fmt(it.price)}
                            </div>

                          </div>


                          <div class="cq-product-right">

                            <div class="stepper">

                              <button
                                class="dec"
                                ${qty === 0 ? 'disabled' : ''}
                                aria-label="Disminuir cantidad"
                              >
                                −
                              </button>

                              <span class="qty">
                                ${qty}
                              </span>

                              <button
                                class="inc"
                                aria-label="Aumentar cantidad"
                              >
                                +
                              </button>

                            </div>

                          </div>

                        </div>

                      `;

                    }).join('')}

                  </div>

                </section>

              `).join('')

            }

          </div>



          <!-- ================================================
               NOTES
          ================================================= -->

          <section class="cq-notes-section">

            <div class="cq-notes-title">
              ¿Alguna indicación?
            </div>

            <div class="cq-notes-description">
              Puedes dejar una nota para cocina.
            </div>

<textarea
  id="notes"
  class="notes-field"
  placeholder="Ej.: sin cebolla, poco picante..."
  maxlength="300"
>${esc(customerNotes)}</textarea>

          </section>


        </main>



        <!-- ================================================
             CART
        ================================================= -->

        <div class="cart-bar">

          <div class="cq-cart-inner">

            <div class="cq-cart-count">
              ${count}
            </div>


            <div class="cq-cart-info">

              <span class="cq-cart-label">
                Tu pedido
              </span>

              <div class="cq-cart-total">
                ${fmt(total)}
              </div>

            </div>


            <button
              class="send-btn"
              id="send-btn"
              ${count === 0 ? 'disabled' : ''}
            >
              ${count === 0 ? 'Agregar productos' : 'Enviar pedido'}
            </button>

          </div>

        </div>


      </div>

    `;


    /* ========================================================
       CATEGORÍAS
    ======================================================== */

    app
      .querySelectorAll('.cq-category-btn')
      .forEach(btn => {

        btn.addEventListener(
          'click',
          () => {

            activeCat =
              btn.dataset.cat;

            draw();

          }
        );

      });


    /* ========================================================
       STEPPERS
    ======================================================== */

    const wrap =
      document.getElementById(
        'menu-wrap'
      );

    if(wrap){

      wrap
        .querySelectorAll('.item-row')
        .forEach(row => {

          const name =
            row.dataset.name;

          const item =
            menu
              .flatMap(
                c => c.items
              )
              .find(
                i =>
                  i.name === name
              );

          if(!item){
            return;
          }


          row
            .querySelector('.inc')
            .onclick = () => {

              if(!cart[name]){

                cart[name] = {

                  menuItemId:
                    item.id,

                  name:
                    item.name,

                  price:
                    item.price,

                  qty:
                    0

                };

              }

              cart[name].qty++;

              draw();

            };


          row
            .querySelector('.dec')
            .onclick = () => {

              if(!cart[name]){
                return;
              }

              cart[name].qty--;

              if(
                cart[name].qty <= 0
              ){

                delete cart[name];

              }

              draw();

            };

        });

    }


    /* ========================================================
       SEND
    ======================================================== */

    const sendBtn =
      document.getElementById(
        'send-btn'
      );

    if(sendBtn){

      sendBtn.onclick =
        sendOrder;

    }

  }


  /* ============================================================
     SEND ORDER
  ============================================================ */

  async function sendOrder(){

    const btn =
      document.getElementById(
        'send-btn'
      );

    if(!btn){
      return;
    }

    btn.disabled =
      true;

    btn.textContent =
      'Enviando…';


    const notes =
      (
        document
          .getElementById('notes')
          ?.value || ''
      )
      .trim()
      .slice(0,300);


    const accessToken =
      crypto.randomUUID();

    const orderId =
      crypto.randomUUID();


    const order = {

      id:
        orderId,

      table_name:
        mesa.nombre,

      table_id:
        mesa.id,

      items:
        Object.values(cart),

      notes,

      status:
        'pendiente',

      created_at:
        new Date().toISOString(),

      access_token:
        accessToken

    };


    const {
      data,
      error
    } = await supabase.rpc(
      'create_order',
      {

        p_id:
          order.id,

        p_table_id:
          order.table_id,

        p_table_name:
          order.table_name,

        p_items:
          order.items,

        p_notes:
          order.notes,

        p_access_token:
          order.access_token,

        p_qr_token:
          qrToken

      }
    );


    if(error){

      console.error(
        'Error creando pedido:',
        error
      );

      btn.disabled =
        false;

      btn.textContent =
        'Enviar pedido';


      const errDiv =
        document.querySelector(
          '.error-msg'
        ) ||

        (() => {

          const d =
            document.createElement(
              'div'
            );

          d.className =
            'error-msg';

          const cartBar =
            document.querySelector(
              '.cart-bar'
            );

          if(cartBar){

            cartBar.before(d);

          }

          return d;

        })();


      errDiv.textContent =
        'No se pudo enviar el pedido. Intentá de nuevo.';

      errDiv.classList.add(
        'visible'
      );

      return;

    }


    localStorage.setItem(
      'order_token_' + order.id,
      accessToken
    );


    renderConfirm({

      ...order,

      total:
        data.total,

      items:
        data.items

    });

  }


  /* ============================================================
     RENDER CONFIRM
  ============================================================ */

  function renderConfirm(order){

    app.innerHTML = `

      <div id="customer-root">


        <!-- ================================================
             HEADER
        ================================================= -->

        <header class="cq-header">

          <div class="cq-header-inner">

            <div class="cq-brand-block">

              <div class="cq-brand">
                ${esc(RESTAURANT)}
              </div>

              <div class="cq-subtitle">
                Pedido
              </div>

            </div>


            <div class="cq-mesa-chip">

              <span class="cq-mesa-dot"></span>

              ${esc(order.table_name)}

            </div>

          </div>

        </header>



        <!-- ================================================
             CONFIRMATION
        ================================================= -->

        <div class="confirm-wrap">


          <div class="confirm-success">
            ✓
          </div>


          <h1 class="confirm-title">
            Pedido recibido
          </h1>


          <p class="confirm-subtitle">
            Tu pedido fue enviado correctamente.
            Puedes seguir su estado desde aquí.
          </p>



          <!-- ============================================
               TICKET
          ============================================= -->

          <div class="confirm-ticket">


            <div class="cq-ticket-head">

              <div>

                <div class="cq-ticket-label">
                  Pedido
                </div>

                <div class="cq-order-number">
                  #${esc(
                    order.id
                      .slice(0,8)
                      .toUpperCase()
                  )}
                </div>

              </div>


              <div class="cq-ticket-label">
                ${esc(order.table_name)}
              </div>

            </div>



            <ul class="cq-ticket-items">

              ${order.items.map(i => `

                <li class="cq-ticket-item">

                  <span class="cq-ticket-item-name">
                    ${esc(String(i.qty))}×
                    ${esc(i.name)}
                  </span>

                  <span class="cq-ticket-item-price">
                    ${fmt(
                      i.price * i.qty
                    )}
                  </span>

                </li>

              `).join('')}

            </ul>



            <div class="cq-ticket-total">

              <span class="cq-ticket-total-label">
                Total
              </span>

              <span class="cq-ticket-total-value">
                ${fmt(order.total)}
              </span>

            </div>



            <!-- ==========================================
                 STATUS
            =========================================== -->

            <div id="status-pill"></div>


          </div>



          <!-- ============================================
               NEW ORDER
          ============================================= -->

          <button
            class="new-order-btn"
            id="again-btn"
          >
            + Agregar otro pedido
          </button>


        </div>

      </div>

    `;


    updateStatusPill(
      order.status
    );


    document
      .getElementById('again-btn')
      .onclick = () => {

        for(
          const k in cart
        ){

          delete cart[k];

        }

        draw();

      };


    pollStatus(
      order.id
    );

  }


  /* ============================================================
     UPDATE STATUS
  ============================================================ */

  function updateStatusPill(status){

    const el =
      document.getElementById(
        'status-pill'
      );

    if(!el){
      return;
    }


    const steps = [

      {
        key:
          'pendiente',

        label:
          'Recibido'
      },

      {
        key:
          'preparando',

        label:
          'Preparando'
      },

      {
        key:
          'listo',

        label:
          '¡Listo!'
      },

      {
        key:
          'entregado',

        label:
          'Entregado'
      }

    ];


    const order = {

      pendiente:
        0,

      preparando:
        1,

      listo:
        2,

      entregado:
        3

    };


    const currentIndex =
      order[status] ??
      0;


    el.innerHTML = `

      <div class="cq-status">

        <div class="cq-status-heading">
          Estado del pedido
        </div>


        <div class="cq-timeline">

          ${steps.map(
            (step,index) => {

              const done =
                index <
                currentIndex;

              const current =
                index ===
                currentIndex;

              const className =
                done
                  ? 'done'
                  : current
                    ? 'current'
                    : '';


              const icon =
                done
                  ? '✓'
                  : current
                    ? '•'
                    : '';


              return `

                <div
                  class="cq-timeline-step ${className}"
                >

                  <div
                    class="cq-timeline-dot"
                  >
                    ${icon}
                  </div>

                  <div
                    class="cq-timeline-label"
                  >
                    ${esc(step.label)}
                  </div>

                </div>

              `;

            }
          ).join('')}

        </div>

      </div>

    `;

  }


  /* ============================================================
     POLL STATUS
  ============================================================ */

  async function pollStatus(orderId){

    let ultimoEstado =
      'pendiente';


    const estados = {

      pendiente:
        0,

      preparando:
        1,

      listo:
        2,

      entregado:
        3

    };


    const interval =
      setInterval(
        async () => {

          if(
            !document
              .getElementById(
                'status-pill'
              )
          ){

            clearInterval(
              interval
            );

            return;

          }

const o =
  await getOrder(
    orderId
  );

console.log(
  'CLIENTE - pedido:',
  orderId,
  'respuesta:',
  o
);

if(!o){
  console.log('CLIENTE - getOrder devolvió null');
  return;
}

console.log(
  'CLIENTE - estado recibido:',
  o.status
);


          if(
            estados[o.status] >=
            estados[ultimoEstado]
          ){

            ultimoEstado =
              o.status;

            updateStatusPill(
              o.status
            );

          }


          if(
            o.status ===
            'entregado'
          ){

            clearInterval(
              interval
            );

          }

        },
        4000
      );

  }


  /* ============================================================
     INICIAR
  ============================================================ */

  draw();

}
