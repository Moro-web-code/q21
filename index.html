<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rail — Pedidos por mesa</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  :root{
    --ink:#211f1c;
    --ink-2:#2b2823;
    --paper:#f0e9d8;
    --paper-shadow:#d8cfb8;
    --rust:#c1502e;
    --mustard:#d6a130;
    --sage:#5c7a5a;
    --ink-soft:#55504a;
    --cream-text:#f0e9d8;
  }
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;}
  body{
    background:var(--ink);
    color:var(--cream-text);
    font-family:'JetBrains Mono',monospace;
    min-height:100vh;
  }
  .display{font-family:'Archivo',sans-serif;font-weight:900;letter-spacing:-0.02em;}
  .eyebrow{
    font-size:11px;letter-spacing:.18em;text-transform:uppercase;
    color:var(--mustard);font-weight:700;
  }
  a{color:inherit;}
  button{font-family:inherit;cursor:pointer;border:none;}
  ::selection{background:var(--rust);color:var(--paper);}

  /* ---------- layout shells ---------- */
  .screen{max-width:1100px;margin:0 auto;padding:28px 20px 80px;}
  .topbar{
    display:flex;align-items:baseline;justify-content:space-between;
    padding-bottom:18px;margin-bottom:26px;border-bottom:1px dashed #4a453d;
  }
  .brand{display:flex;align-items:baseline;gap:10px;}
  .brand .display{font-size:22px;}
  .backlink{font-size:12px;color:var(--paper-shadow);text-decoration:none;opacity:.8;}
  .backlink:hover{opacity:1;color:var(--mustard);}

  /* ---------- ticket paper look ---------- */
  .ticket{
    background:var(--paper);
    color:var(--ink);
    position:relative;
    border-radius:2px;
    box-shadow:0 10px 24px rgba(0,0,0,.35), 0 1px 0 rgba(255,255,255,.4) inset;
  }
  .ticket::before, .ticket::after{
    content:"";position:absolute;left:0;right:0;height:10px;
    background:
      radial-gradient(circle at 8px 5px, var(--ink) 5px, transparent 5.5px) repeat-x;
    background-size:16px 10px;
  }
  .ticket::before{top:-5px;}
  .ticket::after{bottom:-5px;transform:rotate(180deg);}

  /* ---------- HOME ---------- */
  .hero{padding:10px 0 36px;}
  .hero .display{font-size:clamp(34px,6vw,54px);line-height:1;}
  .hero p{color:var(--paper-shadow);max-width:520px;font-size:14px;line-height:1.6;}
  .table-grid{
    display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:22px;margin-top:10px;
  }
  .table-card{padding:22px 18px 26px;text-align:center;}
  .table-card .num{
    font-family:'Archivo',sans-serif;font-weight:900;font-size:13px;
    letter-spacing:.14em;color:var(--rust);text-transform:uppercase;
  }
  .table-card .name{font-family:'Archivo',sans-serif;font-weight:900;font-size:28px;margin:2px 0 14px;}
  .table-card img{width:150px;height:150px;image-rendering:pixelated;border:6px solid #fff;display:block;margin:0 auto 12px;}
  .table-card .url{font-size:10px;word-break:break-all;color:var(--ink-soft);}
  .admin-link{
    display:inline-flex;align-items:center;gap:8px;margin-top:34px;
    background:transparent;border:1px solid var(--paper-shadow);color:var(--cream-text);
    padding:12px 18px;border-radius:2px;text-decoration:none;font-size:13px;
  }
  .admin-link:hover{border-color:var(--mustard);color:var(--mustard);}
  .note-box{
    margin-top:40px;border-left:3px solid var(--mustard);padding:10px 16px;
    font-size:12px;color:var(--paper-shadow);line-height:1.6;background:rgba(255,255,255,.03);
  }

  /* ---------- CUSTOMER ---------- */
  .mesa-title{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;}
  .mesa-title .display{font-size:clamp(28px,5vw,40px);}
  .cat-block{margin:26px 0;}
  .cat-block h3{
    font-family:'Archivo',sans-serif;font-size:13px;letter-spacing:.16em;
    text-transform:uppercase;color:var(--mustard);border-bottom:1px dashed #4a453d;
    padding-bottom:8px;margin-bottom:4px;
  }
  .item-row{
    display:flex;align-items:center;justify-content:space-between;gap:14px;
    padding:14px 4px;border-bottom:1px dashed #3a362f;
  }
  .item-row .meta .name{font-size:14px;font-weight:500;}
  .item-row .meta .price{font-size:12px;color:var(--paper-shadow);margin-top:2px;}
  .stepper{display:flex;align-items:center;gap:10px;}
  .stepper button{
    width:30px;height:30px;border-radius:2px;background:var(--paper);color:var(--ink);
    font-size:16px;font-weight:700;line-height:1;
  }
  .stepper button:disabled{opacity:.3;cursor:default;}
  .stepper .qty{min-width:16px;text-align:center;font-size:14px;}
  .cart-bar{
    position:fixed;left:0;right:0;bottom:0;background:var(--paper);color:var(--ink);
    padding:14px 20px;display:flex;align-items:center;justify-content:space-between;
    box-shadow:0 -8px 24px rgba(0,0,0,.35);
  }
  .cart-bar .total{font-family:'Archivo',sans-serif;font-weight:900;font-size:18px;}
  .cart-bar .total span{display:block;font-family:'JetBrains Mono';font-weight:400;font-size:10px;letter-spacing:.1em;color:var(--ink-soft);text-transform:uppercase;}
  .send-btn{
    background:var(--rust);color:var(--paper);padding:12px 22px;border-radius:2px;
    font-weight:700;font-size:13px;letter-spacing:.04em;text-transform:uppercase;
  }
  .send-btn:disabled{background:#6b5f52;cursor:default;}
  .notes-field{width:100%;background:transparent;border:1px dashed #4a453d;color:var(--cream-text);
    padding:10px 12px;font-family:inherit;font-size:12px;border-radius:2px;margin-top:18px;resize:vertical;min-height:44px;}
  .notes-field::placeholder{color:#665f54;}

  .confirm-wrap{padding:20px 0;}
  .confirm-ticket{padding:26px 22px 30px;max-width:380px;margin:0 auto;}
  .confirm-ticket .eyebrow{color:var(--rust);}
  .confirm-ticket .ordid{font-family:'Archivo',sans-serif;font-weight:900;font-size:30px;margin:4px 0 16px;}
  .confirm-ticket ul{list-style:none;padding:0;margin:0 0 14px;font-size:13px;}
  .confirm-ticket li{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dotted #ccc4ac;}
  .status-pill{
    display:inline-block;padding:6px 14px;border-radius:999px;font-size:11px;
    text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-top:8px;
  }
  .status-pendiente{background:var(--mustard);color:#26200e;}
  .status-preparando{background:var(--rust);color:var(--paper);}
  .status-listo{background:var(--sage);color:var(--paper);}
  .new-order-btn{
    display:block;margin:22px auto 0;background:transparent;border:1px solid var(--paper-shadow);
    color:var(--cream-text);padding:10px 16px;border-radius:2px;font-size:12px;
  }

  /* ---------- STAFF ---------- */
  .board{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;align-items:start;}
  @media (max-width:820px){.board{grid-template-columns:1fr;}}
  .col-head{
    font-family:'Archivo',sans-serif;font-weight:900;font-size:13px;letter-spacing:.1em;
    text-transform:uppercase;padding-bottom:10px;border-bottom:2px solid;margin-bottom:16px;
    display:flex;justify-content:space-between;align-items:center;
  }
  .col-head .count{font-family:'JetBrains Mono';font-size:11px;font-weight:400;opacity:.7;}
  .col-pendiente .col-head{color:var(--mustard);border-color:var(--mustard);}
  .col-preparando .col-head{color:var(--rust);border-color:var(--rust);}
  .col-listo .col-head{color:var(--sage);border-color:var(--sage);}
  .order-ticket{padding:16px 16px 18px;margin-bottom:20px;}
  .order-ticket .row1{display:flex;justify-content:space-between;align-items:flex-start;}
  .order-ticket .mesa{font-family:'Archivo',sans-serif;font-weight:900;font-size:18px;}
  .order-ticket .elapsed{font-size:11px;color:var(--ink-soft);}
  .order-ticket ul{list-style:none;padding:0;margin:10px 0;font-size:12.5px;}
  .order-ticket li{display:flex;justify-content:space-between;padding:3px 0;}
  .order-ticket .notes{font-size:11.5px;font-style:italic;color:var(--ink-soft);margin-bottom:10px;}
  .order-ticket .action{
    width:100%;padding:10px;border-radius:2px;font-size:12px;font-weight:700;
    text-transform:uppercase;letter-spacing:.04em;
  }
  .action-preparar{background:var(--mustard);color:#26200e;}
  .action-listo{background:var(--rust);color:var(--paper);}
  .action-entregado{background:var(--sage);color:var(--paper);}
  .empty-col{font-size:12px;color:#665f54;padding:20px 4px;border:1px dashed #3a362f;text-align:center;border-radius:2px;}
  .staff-sub{color:var(--paper-shadow);font-size:12px;margin-top:-14px;margin-bottom:24px;}
</style>
</head>
<body>
<div id="app" class="screen">Cargando…</div>

<script>
(function(){
  const RESTAURANT = "RAIL";
  const MESAS = [
    {id:1, nombre:"Mesa 1"},
    {id:2, nombre:"Mesa 2"},
    {id:3, nombre:"Mesa 3"},
    {id:4, nombre:"Mesa 4"},
  ];
  const DEFAULT_MENU = [
    {cat:"Entradas", items:[
      {name:"Causa de pollo", price:12},
      {name:"Papa a la huancaína", price:10},
      {name:"Tequeños (6 un.)", price:14},
    ]},
    {cat:"Platos principales", items:[
      {name:"Lomo saltado", price:28},
      {name:"Arroz con pollo", price:22},
      {name:"Tallarines verdes", price:24},
      {name:"Pescado a lo macho", price:32},
    ]},
    {cat:"Bebidas", items:[
      {name:"Chicha morada", price:8},
      {name:"Gaseosa 500ml", price:6},
      {name:"Agua mineral", price:5},
    ]},
    {cat:"Postres", items:[
      {name:"Suspiro a la limeña", price:11},
      {name:"Mazamorra morada", price:9},
    ]},
  ];

  const app = document.getElementById('app');
  const params = new URLSearchParams(window.location.search);
  const mesaParam = params.get('mesa');
  const isAdmin = params.get('admin') === '1';
  const baseUrl = window.location.origin + window.location.pathname;

  function fmt(n){ return '$' + n.toFixed(2); }
  function qrUrl(targetUrl){
    return 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=' + encodeURIComponent(targetUrl);
  }

  async function getMenu(){
    try{
      const r = await window.storage.get('menu', true);
      return JSON.parse(r.value);
    }catch(e){
      try{ await window.storage.set('menu', JSON.stringify(DEFAULT_MENU), true); }catch(e2){}
      return DEFAULT_MENU;
    }
  }
  async function getOrders(){
    try{
      const r = await window.storage.get('orders', true);
      return JSON.parse(r.value);
    }catch(e){ return []; }
  }
  async function saveOrders(list){
    try{ await window.storage.set('orders', JSON.stringify(list), true); return true; }
    catch(e){ return false; }
  }

  function elapsedLabel(iso){
    const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime())/1000));
    const m = Math.floor(s/60), r = s%60;
    return m + ':' + String(r).padStart(2,'0');
  }

  /* ---------------- HOME ---------------- */
  function renderHome(){
    app.innerHTML = `
      <div class="topbar">
        <div class="brand"><span class="display">${RESTAURANT}</span></div>
      </div>
      <div class="hero">
        <div class="eyebrow">Pedidos por QR</div>
        <div class="display">Escanea, pide,<br>llega a cocina.</div>
        <p>Cada mesa tiene su propio código QR. El cliente escanea, arma su pedido desde el menú y este aparece al instante en el panel de cocina.</p>
      </div>
      <div class="table-grid">
        ${MESAS.map(m => {
          const url = new URL(baseUrl);
          url.search = '';
          url.searchParams.set('mesa', m.id);
          return `
          <div class="ticket table-card">
            <div class="num">Mesa N.º ${m.id}</div>
            <div class="name">${m.nombre}</div>
            <img src="${qrUrl(url.toString())}" alt="QR ${m.nombre}">
            <div class="url">${url.toString()}</div>
          </div>`;
        }).join('')}
      </div>
      <a class="admin-link" href="${baseUrl}?admin=1">→ Abrir panel de cocina</a>
      <div class="note-box">
        Los QR codifican la URL actual de esta página. Para que funcionen al escanearlos con un celular real, comparte/publica este artefacto primero — el enlace publicado es el que debe quedar codificado en el QR.
      </div>
    `;
  }

  /* ---------------- CUSTOMER ---------------- */
  async function renderCustomer(mesaId){
    const mesa = MESAS.find(m => m.id === mesaId) || {id:mesaId, nombre:'Mesa '+mesaId};
    const menu = await getMenu();
    const cart = {}; // name -> {name, price, qty}
    let lastOrderId = null;

    function cartTotal(){
      return Object.values(cart).reduce((s,i)=>s+i.price*i.qty,0);
    }
    function cartCount(){
      return Object.values(cart).reduce((s,i)=>s+i.qty,0);
    }

    function draw(){
      app.innerHTML = `
        <div class="topbar">
          <div class="brand"><span class="display">${RESTAURANT}</span></div>
          <a class="backlink" href="${baseUrl}">← salir</a>
        </div>
        <div class="mesa-title">
          <div>
            <div class="eyebrow">Estás pidiendo desde</div>
            <div class="display">${mesa.nombre}</div>
          </div>
        </div>
        <div id="menu-wrap"></div>
        <textarea id="notes" class="notes-field" placeholder="Notas para cocina (opcional): sin cebolla, poco picante, etc."></textarea>
        <div style="height:90px;"></div>
        <div class="cart-bar">
          <div class="total"><span>${cartCount()} ítem(s)</span>${fmt(cartTotal())}</div>
          <button class="send-btn" id="send-btn" ${cartCount()===0?'disabled':''}>Enviar pedido</button>
        </div>
      `;
      const wrap = document.getElementById('menu-wrap');
      wrap.innerHTML = menu.map(cat => `
        <div class="cat-block">
          <h3>${cat.cat}</h3>
          ${cat.items.map(it => {
            const qty = cart[it.name]?.qty || 0;
            return `
            <div class="item-row" data-name="${it.name}">
              <div class="meta">
                <div class="name">${it.name}</div>
                <div class="price">${fmt(it.price)}</div>
              </div>
              <div class="stepper">
                <button class="dec" ${qty===0?'disabled':''}>−</button>
                <span class="qty">${qty}</span>
                <button class="inc">+</button>
              </div>
            </div>`;
          }).join('')}
        </div>
      `).join('');

      wrap.querySelectorAll('.item-row').forEach(row => {
        const name = row.dataset.name;
        const item = menu.flatMap(c=>c.items).find(i=>i.name===name);
        row.querySelector('.inc').onclick = () => {
          if(!cart[name]) cart[name] = {name:item.name, price:item.price, qty:0};
          cart[name].qty++;
          draw();
        };
        row.querySelector('.dec').onclick = () => {
          if(!cart[name]) return;
          cart[name].qty--;
          if(cart[name].qty<=0) delete cart[name];
          draw();
        };
      });

      document.getElementById('send-btn').onclick = sendOrder;
    }

    async function sendOrder(){
      const btn = document.getElementById('send-btn');
      btn.disabled = true; btn.textContent = 'Enviando…';
      const notes = document.getElementById('notes').value.trim();
      const order = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
        table: mesa.nombre,
        tableId: mesa.id,
        items: Object.values(cart),
        total: cartTotal(),
        notes,
        status: 'pendiente',
        createdAt: new Date().toISOString(),
      };
      const current = await getOrders();
      current.push(order);
      await saveOrders(current);
      lastOrderId = order.id;
      renderConfirm(order);
    }

    function renderConfirm(order){
      app.innerHTML = `
        <div class="topbar">
          <div class="brand"><span class="display">${RESTAURANT}</span></div>
          <a class="backlink" href="${baseUrl}">← salir</a>
        </div>
        <div class="confirm-wrap">
          <div class="ticket confirm-ticket">
            <div class="eyebrow">Pedido enviado — ${order.table}</div>
            <div class="ordid">#${order.id.toUpperCase()}</div>
            <ul>
              ${order.items.map(i=>`<li><span>${i.qty}× ${i.name}</span><span>${fmt(i.price*i.qty)}</span></li>`).join('')}
            </ul>
            <div style="display:flex;justify-content:space-between;font-weight:700;font-size:14px;">
              <span>Total</span><span>${fmt(order.total)}</span>
            </div>
            <div id="status-pill"></div>
          </div>
          <button class="new-order-btn" id="again-btn">+ Agregar otro pedido a esta mesa</button>
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
      const label = status==='pendiente' ? 'Pendiente' : status==='preparando' ? 'En preparación' : status==='listo' ? '¡Listo!' : 'Entregado';
      el.innerHTML = `<div class="status-pill status-${status==='entregado'?'listo':status}">${label}</div>`;
    }

    async function pollStatus(orderId){
      const interval = setInterval(async () => {
        if(!document.getElementById('status-pill')){ clearInterval(interval); return; }
        const list = await getOrders();
        const o = list.find(x=>x.id===orderId);
        if(o) updateStatusPill(o.status);
      }, 4000);
    }

    draw();
  }

  /* ---------------- STAFF ---------------- */
  async function renderStaff(){
    app.innerHTML = `
      <div class="topbar">
        <div class="brand"><span class="display">${RESTAURANT}</span></div>
        <a class="backlink" href="${baseUrl}">← salir</a>
      </div>
      <div class="eyebrow">Panel de cocina</div>
      <div class="staff-sub">Los pedidos avanzan de izquierda a derecha. Se actualiza solo cada pocos segundos.</div>
      <div id="board" class="board"></div>
    `;
    async function tick(){
      const orders = await getOrders();
      draw(orders);
    }
    function draw(orders){
      const board = document.getElementById('board');
      if(!board) return;
      const cols = [
        {key:'pendiente', label:'Pendiente', cls:'col-pendiente', action:'preparando', actionLabel:'Empezar preparación', actionCls:'action-preparar'},
        {key:'preparando', label:'En preparación', cls:'col-preparando', action:'listo', actionLabel:'Marcar listo', actionCls:'action-listo'},
        {key:'listo', label:'Listo', cls:'col-listo', action:'entregado', actionLabel:'Entregado', actionCls:'action-entregado'},
      ];
      board.innerHTML = cols.map(col => {
        const list = orders.filter(o => o.status === col.key).sort((a,b)=> new Date(a.createdAt)-new Date(b.createdAt));
        return `
          <div class="${col.cls}">
            <div class="col-head"><span>${col.label}</span><span class="count">${list.length}</span></div>
            ${list.length===0 ? `<div class="empty-col">Sin pedidos</div>` : list.map(o => `
              <div class="ticket order-ticket" data-id="${o.id}">
                <div class="row1">
                  <span class="mesa">${o.table}</span>
                  <span class="elapsed">${elapsedLabel(o.createdAt)}</span>
                </div>
                <ul>
                  ${o.items.map(i=>`<li><span>${i.qty}× ${i.name}</span></li>`).join('')}
                </ul>
                ${o.notes ? `<div class="notes">“${o.notes}”</div>` : ''}
                <button class="action ${col.actionCls}" data-next="${col.action}">${col.actionLabel}</button>
              </div>
            `).join('')}
          </div>
        `;
      }).join('');

      board.querySelectorAll('.order-ticket').forEach(card => {
        const btn = card.querySelector('.action');
        btn.onclick = async () => {
          btn.disabled = true;
          const id = card.dataset.id;
          const next = btn.dataset.next;
          const list = await getOrders();
          const idx = list.findIndex(o=>o.id===id);
          if(idx>-1){
            if(next==='entregado'){ list.splice(idx,1); }
            else { list[idx].status = next; }
            await saveOrders(list);
          }
          tick();
        };
      });
    }
    tick();
    setInterval(tick, 4000);
  }

  /* ---------------- ROUTER ---------------- */
  // Si el QR trae ?mesa=1, ?mesa=2, etc., se abre
  // directamente la pantalla "Estás pidiendo desde Mesa X".
  if(isAdmin){
    renderStaff();
  } else if(mesaParam && MESAS.some(m=>m.id===Number(mesaParam))){
    renderCustomer(Number(mesaParam));
  } else {
    renderHome();
  }
})();
</script>
</body>
</html>
