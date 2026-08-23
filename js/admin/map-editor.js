/* ============================================================
   MAP EDITOR — Editor visual del mapa del restaurante
   Usado exclusivamente por el Administrador.
   El Mesero solo lee el resultado desde waiter.js.

   Exporta: openMapEditor(app, onClose)
   ============================================================ */

import { supabase }  from '../config/supabase.js';
import { RESTAURANT } from '../config/constants.js';
import { esc }        from '../customer/customer.js';

/* ============================================================
   CONSTANTES DEL EDITOR
============================================================ */
const GRID_SIZE   = 2;      // % del canvas — tamaño de celda de cuadrícula
const SNAP_THRESH = 1.5;    // % — umbral de snap a cuadrícula
const CANVAS_W    = 100;    // unidades lógicas (%)
const CANVAS_H    = 100;

const ELEMENT_TYPES = {
  wall:     { label: 'Pared',   color: '#d4cfc4', textColor: '#6b6560' },
  door:     { label: 'Puerta',  color: '#e8e4dc', textColor: '#6b6560' },
  entrance: { label: 'Entrada', color: '#edf4ec', textColor: '#4a6e48' },
  kitchen:  { label: 'Cocina',  color: '#f0ede8', textColor: '#6b6560' },
  bar:      { label: 'Barra',   color: '#f5f3ef', textColor: '#6b6560' },
  cashier:  { label: 'Caja',    color: '#f5f3ef', textColor: '#6b6560' },
  bathroom: { label: 'Baño',    color: '#f0ede8', textColor: '#6b6560' },
  zone:     { label: 'Zona',    color: '#fafaf8', textColor: '#9e9890' },
};

const SHAPE_DEFAULTS = {
  round:     { width: 8,  height: 8  },
  square:    { width: 9,  height: 9  },
  rectangle: { width: 14, height: 8  },
};

/* ============================================================
   INYECTAR ESTILOS — una sola vez
============================================================ */
function injectStyles(){
  if(document.getElementById('map-editor-style')) return;
  const st = document.createElement('style');
  st.id = 'map-editor-style';
  st.textContent = `
    /* ── Layout principal ── */
    #me-layout{
      position:fixed; inset:0; z-index:1000;
      display:flex; flex-direction:column;
      background:#f0ede8;
      font-family:'JetBrains Mono',monospace;
    }

    /* ── Topbar ── */
    #me-topbar{
      height:48px; background:#1a1814;
      border-bottom:1px solid #2e2b25;
      display:flex; align-items:center;
      justify-content:space-between;
      padding:0 16px; flex-shrink:0; gap:12px;
    }
    .me-topbar-left{ display:flex; align-items:center; gap:10px; }
    .me-back-btn{
      display:flex; align-items:center; gap:6px;
      background:none; border:none; color:#8a8278;
      font-size:12px; cursor:pointer; padding:6px 8px;
      border-radius:5px; font-family:inherit;
      transition:color .12s, background .12s;
    }
    .me-back-btn:hover{ background:#242019; color:var(--cream-text,#e8e4dc); }
    .me-topbar-title{
      font-family:'Archivo',sans-serif; font-weight:900;
      font-size:13px; color:var(--cream-text,#e8e4dc);
      letter-spacing:-.01em;
    }
    .me-topbar-sub{ font-size:10px; color:#55504a; margin-left:4px; }

    .me-topbar-center{ flex:1; display:flex; justify-content:center; }
    .me-save-status{
      font-size:11px; padding:4px 12px; border-radius:999px;
      display:flex; align-items:center; gap:5px;
    }
    .me-save-status.saved{
      background:#1e2e1e; color:#6aaa68;
    }
    .me-save-status.dirty{
      background:#2e2518; color:#c49520;
    }
    .me-save-status.saving{
      background:#242019; color:#8a8278;
    }
    .me-save-status.error{
      background:#2e1a18; color:#c1502e;
    }

    .me-topbar-right{ display:flex; align-items:center; gap:8px; }
    .me-top-btn{
      height:32px; padding:0 14px; border-radius:6px;
      font-size:11.5px; font-weight:500; cursor:pointer;
      border:1px solid #3e3b35; background:#242019;
      color:#8a8278; font-family:inherit;
      transition:background .12s, color .12s, border-color .12s;
      display:flex; align-items:center; gap:6px;
    }
    .me-top-btn:hover{ background:#2e2b25; color:var(--cream-text,#e8e4dc); }
    .me-top-btn.primary{
      background:#a94a2a; border-color:#a94a2a; color:#fff;
    }
    .me-top-btn.primary:hover{ background:#c0502a; }
    .me-top-btn:disabled{ opacity:.4; cursor:not-allowed; }

    /* ── Body ── */
    #me-body{ flex:1; display:flex; overflow:hidden; }

    /* ── Sidebar izquierdo ── */
    #me-sidebar{
      width:180px; min-width:180px;
      background:#1a1814; border-right:1px solid #2e2b25;
      display:flex; flex-direction:column;
      overflow-y:auto; flex-shrink:0;
    }
    #me-sidebar::-webkit-scrollbar{ width:3px; }
    #me-sidebar::-webkit-scrollbar-thumb{ background:#2e2b25; }

    .me-sb-section{
      font-size:9px; letter-spacing:.14em; text-transform:uppercase;
      color:#3e3b35; padding:14px 14px 6px; font-weight:600;
    }
    .me-tool-btn{
      display:flex; align-items:center; gap:8px;
      padding:8px 14px; cursor:pointer; color:#8a8278;
      font-size:11.5px; border:none; background:none;
      width:100%; text-align:left; font-family:inherit;
      transition:background .1s, color .1s; border-radius:0;
    }
    .me-tool-btn:hover{ background:#242019; color:var(--cream-text,#e8e4dc); }
    .me-tool-btn.active{ background:#2a1f1a; color:var(--rust,#c0502a); }
    .me-tool-btn .me-tool-icon{
      width:22px; height:22px; border-radius:4px;
      display:flex; align-items:center; justify-content:center;
      font-size:12px; flex-shrink:0;
      background:#242019; color:#8a8278;
    }
    .me-tool-btn.active .me-tool-icon{ background:#3a2018; color:var(--rust,#c0502a); }
    .me-tool-sep{
      height:1px; background:#2e2b25; margin:8px 14px;
    }

    /* ── Canvas área ── */
    #me-canvas-area{
      flex:1; display:flex; flex-direction:column;
      overflow:hidden; position:relative;
    }

    /* Barra de canvas */
    #me-canvas-bar{
      height:36px; background:#fff;
      border-bottom:1px solid #e8e4dc;
      display:flex; align-items:center;
      justify-content:space-between;
      padding:0 14px; flex-shrink:0; gap:10px;
    }
    .me-canvas-bar-left{ display:flex; align-items:center; gap:8px; }
    .me-zoom-btn{
      width:26px; height:26px; border-radius:5px;
      border:1px solid #e8e4dc; background:#f5f3ef;
      color:#6b6560; cursor:pointer; font-size:14px;
      display:flex; align-items:center; justify-content:center;
      transition:border-color .1s;
    }
    .me-zoom-btn:hover{ border-color:#c8c4bc; color:#1c1a17; }
    .me-zoom-val{
      font-size:11px; color:#9e9890; min-width:38px; text-align:center;
    }
    .me-canvas-bar-right{ display:flex; align-items:center; gap:6px; }
    .me-bar-btn{
      height:26px; padding:0 10px; border-radius:5px;
      border:1px solid #e8e4dc; background:#f5f3ef;
      color:#6b6560; font-size:11px; cursor:pointer;
      font-family:inherit; white-space:nowrap;
      transition:border-color .1s;
    }
    .me-bar-btn:hover{ border-color:#c8c4bc; color:#1c1a17; }
    .me-bar-btn.active{ background:#1c1a17; color:#fff; border-color:#1c1a17; }
    .me-grid-toggle{ display:flex; align-items:center; gap:5px; font-size:11px; color:#9e9890; cursor:pointer; }
    .me-grid-toggle input{ cursor:pointer; }

    /* Viewport del canvas */
    #me-viewport{
      flex:1; overflow:hidden; position:relative;
      cursor:default; touch-action:none;
    }
    #me-viewport.tool-element{ cursor:crosshair; }
    #me-viewport.panning{ cursor:grabbing; }

    /* Canvas transformable */
    #me-canvas{
      position:absolute;
      transform-origin:0 0;
      width:900px; height:600px;
      background:#fff;
      border:1px solid #d4cfc4;
      border-radius:4px;
      box-shadow:0 2px 20px rgba(0,0,0,.08);
    }

    /* Cuadrícula SVG dentro del canvas */
    #me-grid-svg{
      position:absolute; inset:0;
      pointer-events:none;
      opacity:.4;
    }

    /* Objetos en el canvas */
    .me-obj{
      position:absolute;
      transform-origin:center center;
      cursor:pointer;
      user-select:none;
      box-sizing:border-box;
    }
    .me-obj:hover .me-obj-inner{
      outline:1.5px solid #c8c4bc;
    }
    .me-obj.selected .me-obj-inner{
      outline:2px solid #1c1a17 !important;
      outline-offset:1px;
    }

    /* Inner — el contenido visual real */
    .me-obj-inner{
      width:100%; height:100%;
      display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      border-radius:inherit;
      position:relative;
      transition:outline .1s;
      box-sizing:border-box;
      overflow:hidden;
    }

    /* Mesas */
    .me-obj.mesa .me-obj-inner{
      border:2px solid #c8c5c0;
      background:#fff;
    }
    .me-obj.mesa.round .me-obj-inner{
      border-radius:50%;
    }
    .me-obj.mesa.square .me-obj-inner{
      border-radius:6px;
    }
    .me-obj.mesa.rectangle .me-obj-inner{
      border-radius:6px;
    }
    .me-obj.mesa .me-obj-label{
      font-family:'Archivo',sans-serif;
      font-weight:700;
      font-size:10px;
      color:#1c1a17;
      text-align:center;
      line-height:1.2;
      padding:2px 4px;
    }
    .me-obj.mesa .me-obj-id{
      font-size:8px;
      color:#9e9890;
      margin-top:1px;
    }

    /* Elementos estructurales */
    .me-obj.element .me-obj-inner{
      border:1px solid #e8e4dc;
      border-radius:4px;
    }
    .me-obj.element .me-obj-label{
      font-size:9px;
      letter-spacing:.08em;
      text-transform:uppercase;
      font-weight:600;
      text-align:center;
      padding:2px 4px;
    }

    /* Pared */
    .me-obj.element.wall .me-obj-inner{
      background:#d4cfc4;
      border-color:#c8c5c0;
    }
    /* Puerta */
    .me-obj.element.door .me-obj-inner{
      background:#e8e4dc;
      border:1.5px dashed #c8c5c0;
    }

    /* Handles de selección */
    .me-handle{
      position:absolute;
      width:8px; height:8px;
      background:#fff;
      border:1.5px solid #1c1a17;
      border-radius:2px;
      cursor:nwse-resize;
      z-index:10;
    }
    .me-handle.nw{ top:-4px; left:-4px; cursor:nw-resize; }
    .me-handle.ne{ top:-4px; right:-4px; cursor:ne-resize; }
    .me-handle.sw{ bottom:-4px; left:-4px; cursor:sw-resize; }
    .me-handle.se{ bottom:-4px; right:-4px; cursor:se-resize; }
    .me-handle.rot{
      top:-20px; left:50%; transform:translateX(-50%);
      border-radius:50%; cursor:grab;
      background:#1c1a17;
      border-color:#fff;
    }

    /* Guías de alineación */
    .me-guide{
      position:absolute; pointer-events:none; z-index:20;
      background:#4a9eff;
    }
    .me-guide.h{ height:1px; left:0; right:0; }
    .me-guide.v{ width:1px;  top:0; bottom:0; }

    /* ── Panel de propiedades ── */
    #me-props{
      width:200px; min-width:200px;
      background:#fff; border-left:1px solid #e8e4dc;
      display:flex; flex-direction:column;
      overflow-y:auto; flex-shrink:0;
    }
    #me-props::-webkit-scrollbar{ width:3px; }
    #me-props::-webkit-scrollbar-thumb{ background:#e8e4dc; }

    .me-props-empty{
      padding:24px 16px; font-size:11px; color:#c8c5c0;
      text-align:center; line-height:1.6;
    }
    .me-props-head{
      padding:14px 16px 10px;
      border-bottom:1px solid #f0ede8;
    }
    .me-props-title{
      font-family:'Archivo',sans-serif;
      font-weight:900; font-size:14px; color:#1c1a17;
    }
    .me-props-type{
      font-size:10px; color:#9e9890; margin-top:2px;
      text-transform:uppercase; letter-spacing:.06em;
    }
    .me-props-section{
      padding:12px 16px 0;
    }
    .me-props-label{
      font-size:9px; letter-spacing:.1em; text-transform:uppercase;
      color:#9e9890; font-weight:600; margin-bottom:6px;
      display:block;
    }
    .me-props-row{
      display:grid; grid-template-columns:1fr 1fr; gap:6px;
      margin-bottom:10px;
    }
    .me-props-field{
      display:flex; flex-direction:column; gap:3px;
    }
    .me-props-field label{
      font-size:9px; color:#9e9890; letter-spacing:.06em;
    }
    .me-props-input{
      height:28px; border:1px solid #e8e4dc; border-radius:5px;
      padding:0 8px; font-family:inherit; font-size:11px;
      color:#1c1a17; background:#f5f3ef; outline:none;
      transition:border-color .1s;
      width:100%; box-sizing:border-box;
    }
    .me-props-input:focus{ border-color:#c8c4bc; background:#fff; }
    .me-props-input:read-only{ color:#9e9890; cursor:not-allowed; }

    .me-shape-row{
      display:flex; gap:6px; margin-bottom:10px;
    }
    .me-shape-btn{
      flex:1; height:32px; border-radius:5px;
      border:1px solid #e8e4dc; background:#f5f3ef;
      color:#6b6560; cursor:pointer; font-size:11px;
      font-family:inherit; transition:all .1s;
      display:flex; align-items:center; justify-content:center;
    }
    .me-shape-btn:hover{ border-color:#c8c4bc; }
    .me-shape-btn.active{
      background:#1c1a17; color:#fff; border-color:#1c1a17;
    }

    .me-props-divider{
      height:1px; background:#f0ede8; margin:8px 16px;
    }
    .me-props-actions{
      padding:10px 16px 16px;
      display:flex; flex-direction:column; gap:6px;
    }
    .me-props-btn{
      width:100%; height:32px; border-radius:6px;
      font-size:11px; font-weight:500; cursor:pointer;
      border:1px solid #e8e4dc; background:#f5f3ef;
      color:#6b6560; font-family:inherit;
      transition:all .1s;
    }
    .me-props-btn:hover{ border-color:#c8c4bc; color:#1c1a17; }
    .me-props-btn.danger{
      color:var(--rust,#c0502a);
      border-color:#f0c4b4; background:#fdf1ed;
    }
    .me-props-btn.danger:hover{ background:#fae0d8; }

    /* Atajos */
    .me-shortcuts{
      padding:12px 16px; border-top:1px solid #f0ede8;
      margin-top:auto;
    }
    .me-shortcuts-title{
      font-size:9px; letter-spacing:.1em; text-transform:uppercase;
      color:#c8c5c0; font-weight:600; margin-bottom:8px;
    }
    .me-shortcut-row{
      display:flex; justify-content:space-between;
      font-size:10px; color:#c8c5c0; margin-bottom:4px;
    }
    .me-shortcut-key{
      background:#f5f3ef; border:1px solid #e8e4dc;
      border-radius:3px; padding:1px 5px;
      font-size:9px; color:#9e9890;
    }

    /* Modal confirmar salida */
    #me-exit-modal{
      position:fixed; inset:0; z-index:2000;
      background:rgba(20,18,15,.6);
      display:flex; align-items:center; justify-content:center;
      padding:20px;
    }
    .me-exit-box{
      background:#fff; border-radius:10px;
      border:1px solid #e8e4dc;
      padding:24px; width:min(340px,100%);
      box-shadow:0 20px 60px rgba(0,0,0,.15);
    }
    .me-exit-title{
      font-family:'Archivo',sans-serif; font-weight:900;
      font-size:15px; color:#1c1a17; margin-bottom:8px;
    }
    .me-exit-sub{ font-size:12px; color:#9e9890; margin-bottom:20px; }
    .me-exit-btns{ display:flex; gap:8px; justify-content:flex-end; }
    .me-exit-btn{
      height:34px; padding:0 16px; border-radius:6px;
      font-size:12px; font-weight:500; cursor:pointer;
      font-family:inherit;
    }
    .me-exit-btn.cancel{
      border:1px solid #e8e4dc; background:#fff; color:#6b6560;
    }
    .me-exit-btn.confirm{
      border:1px solid #1c1a17; background:#1c1a17; color:#fff;
    }

    @media(max-width:900px){
      #me-sidebar{ width:140px; min-width:140px; }
      #me-props{ width:160px; min-width:160px; }
    }
    @media(max-width:680px){
      #me-props{ display:none; }
    }
  `;
  document.head.appendChild(st);
}

/* ============================================================
   FUNCIÓN PRINCIPAL
============================================================ */
export async function openMapEditor(app, onClose){
  injectStyles();

  /* ── Estado del editor ── */
  const state = {
    tables:        [],    // { id, name, position_x, position_y, width, height, rotation, shape }
    elements:      [],    // { id(local), type, label, position_x, position_y, width, height, rotation }
    selected:      null,  // { kind:'mesa'|'element', id }
    tool:          'select',
    zoom:          1,
    panX:          0,
    panY:          0,
    showGrid:      true,
    dirty:         false,
    saving:        false,
    nextLocalId:   1,
  };

  /* ── Cargar datos de Supabase ── */
  async function loadData(){
    const [tablesRes, elementsRes] = await Promise.all([
      supabase.from('tables')
        .select('id,name,active,position_x,position_y,width,height,rotation,shape')
        .eq('active', true)
        .order('id'),
      supabase.from('map_elements')
        .select('id,type,label,position_x,position_y,width,height,rotation')
        .order('id'),
    ]);

    state.tables = (tablesRes.data || []).map(t => ({
      id:         t.id,
      name:       t.name,
      position_x: t.position_x ?? 20,
      position_y: t.position_y ?? 20,
      width:      t.width      ?? 8,
      height:     t.height     ?? 8,
      rotation:   t.rotation   ?? 0,
      shape:      t.shape      ?? 'round',
    }));

    state.elements = (elementsRes.data || []).map(e => ({
      _id:        state.nextLocalId++,
      id:         e.id,
      type:       e.type,
      label:      e.label,
      position_x: e.position_x,
      position_y: e.position_y,
      width:      e.width,
      height:     e.height,
      rotation:   e.rotation ?? 0,
    }));
  }

  /* ── Render shell ── */
  function renderShell(){
    app.style.padding  = '0';
    app.style.maxWidth = 'none';

    app.innerHTML = `
      <div id="me-layout">

        <div id="me-topbar">
          <div class="me-topbar-left">
            <button class="me-back-btn" id="me-back">
              ← Mesas
            </button>
            <span class="me-topbar-title">${esc(RESTAURANT)}</span>
            <span class="me-topbar-sub">/ Diseñador</span>
          </div>

          <div class="me-topbar-center">
            <div class="me-save-status saved" id="me-save-status">
              ✓ Guardado
            </div>
          </div>

          <div class="me-topbar-right">
            <button class="me-top-btn" id="me-reload-btn">↺ Recargar</button>
            <button class="me-top-btn primary" id="me-save-btn">Guardar</button>
          </div>
        </div>

        <div id="me-body">

          <!-- Sidebar izquierdo -->
          <div id="me-sidebar">
            <div class="me-sb-section">Selección</div>
            <button class="me-tool-btn active" data-tool="select">
              <span class="me-tool-icon">↖</span>
              Seleccionar
            </button>

            <div class="me-tool-sep"></div>
            <div class="me-sb-section">Elementos</div>

            <button class="me-tool-btn" data-element="wall">
              <span class="me-tool-icon" style="background:#d4cfc4;">─</span>
              Pared
            </button>
            <button class="me-tool-btn" data-element="door">
              <span class="me-tool-icon" style="border:1px dashed #c8c5c0;">⇥</span>
              Puerta
            </button>
            <button class="me-tool-btn" data-element="entrance">
              <span class="me-tool-icon" style="background:#edf4ec;color:#4a6e48;">↗</span>
              Entrada
            </button>
            <button class="me-tool-btn" data-element="kitchen">
              <span class="me-tool-icon">▣</span>
              Cocina
            </button>
            <button class="me-tool-btn" data-element="bar">
              <span class="me-tool-icon">▬</span>
              Barra
            </button>
            <button class="me-tool-btn" data-element="cashier">
              <span class="me-tool-icon">$</span>
              Caja
            </button>
            <button class="me-tool-btn" data-element="bathroom">
              <span class="me-tool-icon">▫</span>
              Baño
            </button>
            <button class="me-tool-btn" data-element="zone">
              <span class="me-tool-icon" style="border:1px dashed #c8c5c0;">◌</span>
              Zona
            </button>
          </div>

          <!-- Canvas área -->
          <div id="me-canvas-area">
            <div id="me-canvas-bar">
              <div class="me-canvas-bar-left">
                <button class="me-zoom-btn" id="me-zoom-out">−</button>
                <span class="me-zoom-val" id="me-zoom-val">100%</span>
                <button class="me-zoom-btn" id="me-zoom-in">+</button>
                <button class="me-bar-btn" id="me-fit-btn">Ajustar</button>
                <button class="me-bar-btn" id="me-center-btn">Centrar</button>
              </div>
              <div class="me-canvas-bar-right">
                <label class="me-grid-toggle">
                  <input type="checkbox" id="me-grid-check" checked>
                  Cuadrícula
                </label>
              </div>
            </div>

            <div id="me-viewport" tabindex="0">
              <div id="me-canvas">
                <svg id="me-grid-svg" width="100%" height="100%">
                  <defs>
                    <pattern id="me-grid-pat" width="18" height="12"
                      patternUnits="userSpaceOnUse">
                      <path d="M 18 0 L 0 0 0 12"
                        fill="none" stroke="#e8e4dc" stroke-width=".5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%"
                    fill="url(#me-grid-pat)"/>
                </svg>
                <div id="me-objects"></div>
              </div>
            </div>
          </div>

          <!-- Panel de propiedades -->
          <div id="me-props">
            <div class="me-props-empty" id="me-props-empty">
              Selecciona un objeto para ver sus propiedades
            </div>
            <div id="me-props-content" style="display:none;">
              <div class="me-props-head">
                <div class="me-props-title" id="me-props-name">—</div>
                <div class="me-props-type"  id="me-props-type">—</div>
              </div>

              <div class="me-props-section">
                <span class="me-props-label">Posición</span>
                <div class="me-props-row">
                  <div class="me-props-field">
                    <label>X</label>
                    <input class="me-props-input" id="me-px" type="number" step="0.5">
                  </div>
                  <div class="me-props-field">
                    <label>Y</label>
                    <input class="me-props-input" id="me-py" type="number" step="0.5">
                  </div>
                </div>

                <span class="me-props-label">Tamaño</span>
                <div class="me-props-row">
                  <div class="me-props-field">
                    <label>Ancho</label>
                    <input class="me-props-input" id="me-pw" type="number" step="0.5" min="2">
                  </div>
                  <div class="me-props-field">
                    <label>Alto</label>
                    <input class="me-props-input" id="me-ph" type="number" step="0.5" min="2">
                  </div>
                </div>

                <span class="me-props-label">Rotación</span>
                <div class="me-props-row">
                  <div class="me-props-field" style="grid-column:1/-1;">
                    <label>Grados</label>
                    <input class="me-props-input" id="me-prot" type="number" step="1" min="0" max="360">
                  </div>
                </div>

                <div id="me-shape-section">
                  <span class="me-props-label">Forma</span>
                  <div class="me-shape-row">
                    <button class="me-shape-btn" data-shape="round"     title="Redonda">○</button>
                    <button class="me-shape-btn" data-shape="square"    title="Cuadrada">□</button>
                    <button class="me-shape-btn" data-shape="rectangle" title="Rectangular">▭</button>
                  </div>
                </div>

                <div id="me-label-section">
                  <span class="me-props-label">Etiqueta</span>
                  <div class="me-props-row">
                    <div class="me-props-field" style="grid-column:1/-1;">
                      <input class="me-props-input" id="me-plabel" type="text" placeholder="Nombre…">
                    </div>
                  </div>
                </div>
              </div>

              <div class="me-props-divider"></div>
              <div class="me-props-actions">
                <button class="me-props-btn" id="me-duplicate-btn">Duplicar</button>
                <button class="me-props-btn danger" id="me-delete-btn">Eliminar</button>
              </div>
            </div>

            <div class="me-shortcuts">
              <div class="me-shortcuts-title">Atajos</div>
              <div class="me-shortcut-row">
                <span>Eliminar</span>
                <span class="me-shortcut-key">Del</span>
              </div>
              <div class="me-shortcut-row">
                <span>Duplicar</span>
                <span class="me-shortcut-key">Ctrl+D</span>
              </div>
              <div class="me-shortcut-row">
                <span>Guardar</span>
                <span class="me-shortcut-key">Ctrl+S</span>
              </div>
              <div class="me-shortcut-row">
                <span>Deselect.</span>
                <span class="me-shortcut-key">Esc</span>
              </div>
              <div class="me-shortcut-row">
                <span>Mover</span>
                <span class="me-shortcut-key">↑↓←→</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;
  }

  /* ============================================================
     CANVAS — coordenadas y transformaciones
  ============================================================ */
  function getCanvas(){ return document.getElementById('me-canvas'); }
  function getViewport(){ return document.getElementById('me-viewport'); }
  function getObjectsEl(){ return document.getElementById('me-objects'); }

  /* Convertir % lógico → px en el canvas */
  function pctToPx(pct, axis){
    const cvs = getCanvas();
    return axis === 'x'
      ? (pct / 100) * cvs.offsetWidth
      : (pct / 100) * cvs.offsetHeight;
  }

  /* Convertir px del canvas → % lógico */
  function pxToPct(px, axis){
    const cvs = getCanvas();
    return axis === 'x'
      ? (px / cvs.offsetWidth)  * 100
      : (px / cvs.offsetHeight) * 100;
  }

  /* Snap a cuadrícula */
  function snap(val){
    if(!state.showGrid) return val;
    return Math.round(val / GRID_SIZE) * GRID_SIZE;
  }

  /* Aplicar transformación del viewport */
  function applyTransform(){
    const cvs = getCanvas();
    cvs.style.transform =
      `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
    document.getElementById('me-zoom-val').textContent =
      Math.round(state.zoom * 100) + '%';
  }

  function fitCanvas(){
    const vp  = getViewport();
    const cvs = getCanvas();
    const zx  = (vp.offsetWidth  - 40) / cvs.offsetWidth;
    const zy  = (vp.offsetHeight - 40) / cvs.offsetHeight;
    state.zoom = Math.min(zx, zy, 1.2);
    state.panX = (vp.offsetWidth  - cvs.offsetWidth  * state.zoom) / 2;
    state.panY = (vp.offsetHeight - cvs.offsetHeight * state.zoom) / 2;
    applyTransform();
  }

  function centerCanvas(){
    const vp  = getViewport();
    const cvs = getCanvas();
    state.panX = (vp.offsetWidth  - cvs.offsetWidth  * state.zoom) / 2;
    state.panY = (vp.offsetHeight - cvs.offsetHeight * state.zoom) / 2;
    applyTransform();
  }

  /* ============================================================
     RENDER DE OBJETOS
  ============================================================ */
  function renderAll(){
    const container = getObjectsEl();
    if(!container) return;
    container.innerHTML = '';

    state.elements.forEach(el => renderElementNode(el, container));
    state.tables.forEach(t  => renderTableNode(t,   container));
  }

  function getObjStyle(obj){
    const cvs = getCanvas();
    const px  = (obj.position_x / 100) * cvs.offsetWidth;
    const py  = (obj.position_y / 100) * cvs.offsetHeight;
    const pw  = (obj.width      / 100) * cvs.offsetWidth;
    const ph  = (obj.height     / 100) * cvs.offsetHeight;
    return {
      left:   px - pw/2,
      top:    py - ph/2,
      width:  pw,
      height: ph,
    };
  }

  function renderTableNode(table, container){
    const s   = getObjStyle(table);
    const div = document.createElement('div');
    const isSel = state.selected?.kind === 'mesa' && state.selected.id === table.id;

    div.className = `me-obj mesa ${table.shape}${isSel ? ' selected' : ''}`;
    div.dataset.kind = 'mesa';
    div.dataset.id   = table.id;
    div.style.cssText = `
      left:${s.left}px; top:${s.top}px;
      width:${s.width}px; height:${s.height}px;
      transform:rotate(${table.rotation}deg);
    `;

    div.innerHTML = `
      <div class="me-obj-inner">
        <div class="me-obj-label">${esc(table.name)}</div>
        <div class="me-obj-id">Mesa ${table.id}</div>
        ${isSel ? handles() : ''}
      </div>
    `;

    bindObjEvents(div, 'mesa', table.id);
    container.appendChild(div);
  }

  function renderElementNode(el, container){
    const s   = getObjStyle(el);
    const cfg = ELEMENT_TYPES[el.type] || ELEMENT_TYPES.zone;
    const isSel = state.selected?.kind === 'element' && state.selected.id === el._id;

    const div = document.createElement('div');
    div.className = `me-obj element ${el.type}${isSel ? ' selected' : ''}`;
    div.dataset.kind  = 'element';
    div.dataset.lid   = el._id;
    div.style.cssText = `
      left:${s.left}px; top:${s.top}px;
      width:${s.width}px; height:${s.height}px;
      transform:rotate(${el.rotation}deg);
    `;

    div.innerHTML = `
      <div class="me-obj-inner" style="
        background:${cfg.color};
        border-color:${cfg.color === '#fff' ? '#e8e4dc' : cfg.color};
      ">
        <div class="me-obj-label" style="color:${cfg.textColor};">
          ${esc(el.label || cfg.label)}
        </div>
        ${isSel ? handles() : ''}
      </div>
    `;

    bindObjEvents(div, 'element', el._id);
    container.appendChild(div);
  }

  function handles(){
    return `
      <div class="me-handle nw" data-handle="nw"></div>
      <div class="me-handle ne" data-handle="ne"></div>
      <div class="me-handle sw" data-handle="sw"></div>
      <div class="me-handle se" data-handle="se"></div>
      <div class="me-handle rot" data-handle="rot"></div>
    `;
  }

  /* ============================================================
     SELECCIÓN
  ============================================================ */
  function selectObject(kind, id){
    state.selected = { kind, id };
    renderAll();
    updatePropsPanel();
  }

  function deselectAll(){
    state.selected = null;
    renderAll();
    updatePropsPanel();
  }

  function getSelectedObj(){
    if(!state.selected) return null;
    if(state.selected.kind === 'mesa')
      return state.tables.find(t => t.id === state.selected.id) || null;
    return state.elements.find(e => e._id === state.selected.id) || null;
  }

  /* ============================================================
     PANEL DE PROPIEDADES
  ============================================================ */
  function updatePropsPanel(){
    const empty   = document.getElementById('me-props-empty');
    const content = document.getElementById('me-props-content');
    const obj     = getSelectedObj();

    if(!obj){
      empty.style.display   = '';
      content.style.display = 'none';
      return;
    }

    empty.style.display   = 'none';
    content.style.display = '';

    const isMesa = state.selected.kind === 'mesa';

    document.getElementById('me-props-name').textContent =
      obj.name || obj.label || ELEMENT_TYPES[obj.type]?.label || '—';
    document.getElementById('me-props-type').textContent =
      isMesa ? 'Mesa' : (ELEMENT_TYPES[obj.type]?.label || obj.type);

    document.getElementById('me-px').value   = obj.position_x.toFixed(1);
    document.getElementById('me-py').value   = obj.position_y.toFixed(1);
    document.getElementById('me-pw').value   = obj.width.toFixed(1);
    document.getElementById('me-ph').value   = obj.height.toFixed(1);
    document.getElementById('me-prot').value = obj.rotation.toFixed(0);

    /* Forma — solo mesas */
    const shapeSection = document.getElementById('me-shape-section');
    shapeSection.style.display = isMesa ? '' : 'none';
    if(isMesa){
      document.querySelectorAll('.me-shape-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.shape === obj.shape);
      });
    }

    /* Etiqueta — solo elementos */
    const labelSection = document.getElementById('me-label-section');
    labelSection.style.display = isMesa ? 'none' : '';
    if(!isMesa){
      document.getElementById('me-plabel').value = obj.label || '';
    }

    /* Eliminar — solo elementos (no mesas, que viven en public.tables) */
    document.getElementById('me-delete-btn').style.display =
      isMesa ? 'none' : '';
  }

  function bindPropsInputs(){
    const sync = () => {
      const obj = getSelectedObj();
      if(!obj) return;
      const px  = parseFloat(document.getElementById('me-px').value)   || obj.position_x;
      const py  = parseFloat(document.getElementById('me-py').value)   || obj.position_y;
      const pw  = parseFloat(document.getElementById('me-pw').value)   || obj.width;
      const ph  = parseFloat(document.getElementById('me-ph').value)   || obj.height;
      const rot = parseFloat(document.getElementById('me-prot').value) || 0;

      obj.position_x = Math.max(0, Math.min(100, px));
      obj.position_y = Math.max(0, Math.min(100, py));
      obj.width      = Math.max(2, pw);
      obj.height     = Math.max(2, ph);
      obj.rotation   = ((rot % 360) + 360) % 360;

      if(state.selected.kind !== 'mesa'){
        obj.label = document.getElementById('me-plabel').value;
      }

      markDirty();
      renderAll();
    };

    ['me-px','me-py','me-pw','me-ph','me-prot','me-plabel'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.addEventListener('change', sync);
    });

    /* Forma */
    document.querySelectorAll('.me-shape-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const obj = getSelectedObj();
        if(!obj || state.selected.kind !== 'mesa') return;
        obj.shape  = btn.dataset.shape;
        const def  = SHAPE_DEFAULTS[obj.shape];
        obj.width  = def.width;
        obj.height = def.height;
        markDirty();
        renderAll();
        updatePropsPanel();
      });
    });

    /* Acciones */
    document.getElementById('me-duplicate-btn').addEventListener('click', duplicateSelected);
    document.getElementById('me-delete-btn').addEventListener('click',    deleteSelected);
  }

  /* ============================================================
     DRAG — mover objetos
  ============================================================ */
  function bindObjEvents(div, kind, id){
    div.addEventListener('pointerdown', e => {
      if(e.target.dataset.handle) return; // lo maneja resize/rot
      if(state.tool !== 'select') return;
      e.stopPropagation();
      e.preventDefault();

      selectObject(kind, id);

      const obj  = getSelectedObj();
      if(!obj) return;

      const cvs  = getCanvas();
      const rect = cvs.getBoundingClientRect();
      const startX = (e.clientX - rect.left) / state.zoom;
      const startY = (e.clientY - rect.top)  / state.zoom;
      const origX  = obj.position_x;
      const origY  = obj.position_y;

      function onMove(ev){
        const cx  = (ev.clientX - rect.left) / state.zoom;
        const cy  = (ev.clientY - rect.top)  / state.zoom;
        const dx  = pxToPct(cx - startX, 'x');
        const dy  = pxToPct(cy - startY, 'y');
        obj.position_x = snap(Math.max(0, Math.min(100, origX + dx)));
        obj.position_y = snap(Math.max(0, Math.min(100, origY + dy)));
        renderAll();
        updatePropsPanel();
      }

      function onUp(){
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup',   onUp);
        markDirty();
      }

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup',   onUp);
    });

    /* Resize handles */
    div.querySelectorAll('[data-handle]').forEach(handle => {
      if(handle.dataset.handle === 'rot'){
        bindRotateHandle(handle, kind, id);
      } else {
        bindResizeHandle(handle, kind, id, handle.dataset.handle);
      }
    });
  }

  function bindResizeHandle(handle, kind, id, corner){
    handle.addEventListener('pointerdown', e => {
      e.stopPropagation();
      e.preventDefault();

      const obj  = getSelectedObj();
      if(!obj) return;

      const cvs  = getCanvas();
      const rect = cvs.getBoundingClientRect();
      const origX = obj.position_x, origY = obj.position_y;
      const origW = obj.width,      origH = obj.height;
      const startX = (e.clientX - rect.left) / state.zoom;
      const startY = (e.clientY - rect.top)  / state.zoom;

      function onMove(ev){
        const cx = (ev.clientX - rect.left) / state.zoom;
        const cy = (ev.clientY - rect.top)  / state.zoom;
        const dx = pxToPct(cx - startX, 'x');
        const dy = pxToPct(cy - startY, 'y');

        if(corner === 'se'){
          obj.width  = Math.max(2, snap(origW + dx * 2));
          obj.height = Math.max(2, snap(origH + dy * 2));
        } else if(corner === 'sw'){
          obj.width  = Math.max(2, snap(origW - dx * 2));
          obj.height = Math.max(2, snap(origH + dy * 2));
        } else if(corner === 'ne'){
          obj.width  = Math.max(2, snap(origW + dx * 2));
          obj.height = Math.max(2, snap(origH - dy * 2));
        } else if(corner === 'nw'){
          obj.width  = Math.max(2, snap(origW - dx * 2));
          obj.height = Math.max(2, snap(origH - dy * 2));
        }

        renderAll();
        updatePropsPanel();
      }

      function onUp(){
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup',   onUp);
        markDirty();
      }

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup',   onUp);
    });
  }

  function bindRotateHandle(handle, kind, id){
    handle.addEventListener('pointerdown', e => {
      e.stopPropagation();
      e.preventDefault();

      const obj = getSelectedObj();
      if(!obj) return;

      const cvs  = getCanvas();
      const rect = cvs.getBoundingClientRect();
      const cxPx = rect.left + (obj.position_x / 100) * cvs.offsetWidth  * state.zoom + state.panX;
      const cyPx = rect.top  + (obj.position_y / 100) * cvs.offsetHeight * state.zoom + state.panY;

      function onMove(ev){
        const angle = Math.atan2(ev.clientY - cyPx, ev.clientX - cxPx) * (180 / Math.PI) + 90;
        obj.rotation = ((Math.round(angle) % 360) + 360) % 360;
        renderAll();
        updatePropsPanel();
      }

      function onUp(){
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup',   onUp);
        markDirty();
      }

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup',   onUp);
    });
  }

  /* ============================================================
     PAN del canvas
  ============================================================ */
  function initPan(){
    const vp = getViewport();
    let panning = false, startX, startY, origPanX, origPanY;

    vp.addEventListener('pointerdown', e => {
      if(state.tool !== 'select') return;
      if(e.target !== vp && e.target !== getCanvas() &&
         e.target !== document.getElementById('me-objects') &&
         e.target !== document.getElementById('me-grid-svg') &&
         !e.target.classList.contains('me-grid-svg')) return;

      panning  = true;
      startX   = e.clientX;
      startY   = e.clientY;
      origPanX = state.panX;
      origPanY = state.panY;
      vp.classList.add('panning');
      deselectAll();
    });

    window.addEventListener('pointermove', e => {
      if(!panning) return;
      state.panX = origPanX + (e.clientX - startX);
      state.panY = origPanY + (e.clientY - startY);
      applyTransform();
    });

    window.addEventListener('pointerup', () => {
      if(!panning) return;
      panning = false;
      vp.classList.remove('panning');
    });

    /* Zoom con rueda */
    vp.addEventListener('wheel', e => {
      e.preventDefault();
      const delta  = e.deltaY > 0 ? 0.9 : 1.1;
      const newZ   = Math.max(0.3, Math.min(3, state.zoom * delta));
      const rect   = vp.getBoundingClientRect();
      const mx     = e.clientX - rect.left;
      const my     = e.clientY - rect.top;
      state.panX   = mx - (mx - state.panX) * (newZ / state.zoom);
      state.panY   = my - (my - state.panY) * (newZ / state.zoom);
      state.zoom   = newZ;
      applyTransform();
    }, { passive: false });
  }

  /* ============================================================
     HERRAMIENTA — colocar elemento nuevo
  ============================================================ */
  function initElementTool(){
    const vp = getViewport();

    vp.addEventListener('pointerdown', e => {
      if(state.tool !== 'element') return;
      if(e.target !== vp &&
         e.target !== getCanvas() &&
         !e.target.id.includes('me-grid') &&
         !e.target.id.includes('me-objects')) return;

      e.preventDefault();
      const cvs    = getCanvas();
      const rect   = cvs.getBoundingClientRect();
      const px     = ((e.clientX - rect.left) / state.zoom / cvs.offsetWidth)  * 100;
      const py     = ((e.clientY - rect.top)  / state.zoom / cvs.offsetHeight) * 100;
      const type   = state.pendingElementType;
      const cfg    = ELEMENT_TYPES[type];
      const newEl  = {
        _id:        state.nextLocalId++,
        id:         null,
        type,
        label:      cfg.label,
        position_x: snap(Math.max(0, Math.min(100, px))),
        position_y: snap(Math.max(0, Math.min(100, py))),
        width:      type === 'wall' ? 20 : type === 'bar' ? 18 : 12,
        height:     type === 'wall' ? 2  : 10,
        rotation:   0,
      };

      state.elements.push(newEl);
      setTool('select');
      selectObject('element', newEl._id);
      markDirty();
    });
  }

  /* ============================================================
     TOOLBAR
  ============================================================ */
  function setTool(tool, elementType = null){
    state.tool = tool;
    state.pendingElementType = elementType;
    const vp = getViewport();
    vp.classList.toggle('tool-element', tool === 'element');

    document.querySelectorAll('.me-tool-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    if(tool === 'select'){
      document.querySelector('[data-tool="select"]')?.classList.add('active');
    } else if(elementType){
      document.querySelector(`[data-element="${elementType}"]`)?.classList.add('active');
    }
  }

  function bindToolbar(){
    document.querySelector('[data-tool="select"]')?.addEventListener('click', () => {
      setTool('select');
    });

    document.querySelectorAll('[data-element]').forEach(btn => {
      btn.addEventListener('click', () => {
        setTool('element', btn.dataset.element);
      });
    });
  }

  /* ============================================================
     ACCIONES
  ============================================================ */
  function duplicateSelected(){
    const obj = getSelectedObj();
    if(!obj) return;

    if(state.selected.kind === 'mesa'){
      /* Las mesas duplicadas en el editor solo mueven la posición
         de la original — no creamos mesas fantasma.
         En su lugar, mostramos un aviso. */
      alert('Para crear nuevas mesas ve a la sección Mesas del panel.');
      return;
    }

    const copy = {
      ...obj,
      _id:        state.nextLocalId++,
      id:         null,
      position_x: Math.min(100, obj.position_x + 4),
      position_y: Math.min(100, obj.position_y + 4),
    };
    state.elements.push(copy);
    selectObject('element', copy._id);
    markDirty();
  }

  function deleteSelected(){
    const sel = state.selected;
    if(!sel) return;

    if(sel.kind === 'mesa'){
      alert('Las mesas se gestionan desde la sección Mesas.');
      return;
    }

    state.elements = state.elements.filter(e => e._id !== sel.id);
    deselectAll();
    markDirty();
  }

  /* ============================================================
     GUARDAR
  ============================================================ */
  function markDirty(){
    state.dirty = true;
    setSaveStatus('dirty');
  }

  function setSaveStatus(status){
    const el = document.getElementById('me-save-status');
    if(!el) return;
    el.className = `me-save-status ${status}`;
    el.textContent = {
      saved:  '✓ Guardado',
      dirty:  '● Cambios sin guardar',
      saving: '… Guardando',
      error:  '✕ Error al guardar',
    }[status];
  }

  async function saveLayout(){
    if(state.saving) return;
    state.saving = true;
    setSaveStatus('saving');

    const tablesPayload = state.tables.map(t => ({
      id:         t.id,
      position_x: t.position_x,
      position_y: t.position_y,
      width:      t.width,
      height:     t.height,
      rotation:   t.rotation,
      shape:      t.shape,
    }));

    const elementsPayload = state.elements.map(e => ({
      type:       e.type,
      label:      e.label,
      position_x: e.position_x,
      position_y: e.position_y,
      width:      e.width,
      height:     e.height,
      rotation:   e.rotation,
    }));

    const { data, error } = await supabase.rpc('save_map_layout', {
      p_tables:   tablesPayload,
      p_elements: elementsPayload,
    });

    state.saving = false;

    if(error || !data?.success){
      console.error('Error guardando mapa:', error || data?.error);
      setSaveStatus('error');
      return;
    }

    state.dirty = false;
    setSaveStatus('saved');
  }

  /* ============================================================
     SALIR
  ============================================================ */
  function tryExit(){
    if(!state.dirty){
      doExit();
      return;
    }
    showExitModal();
  }

  function showExitModal(){
    const modal = document.createElement('div');
    modal.id = 'me-exit-modal';
    modal.innerHTML = `
      <div class="me-exit-box">
        <div class="me-exit-title">Cambios sin guardar</div>
        <div class="me-exit-sub">¿Quieres salir sin guardar el mapa?</div>
        <div class="me-exit-btns">
          <button class="me-exit-btn cancel" id="me-exit-cancel">Cancelar</button>
          <button class="me-exit-btn confirm" id="me-exit-confirm">Salir sin guardar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('me-exit-cancel').onclick  = () => modal.remove();
    document.getElementById('me-exit-confirm').onclick = () => { modal.remove(); doExit(); };
  }

  function doExit(){
    cleanup();
    onClose();
  }

  /* ============================================================
     ATAJOS DE TECLADO
  ============================================================ */
  function bindKeyboard(){
    function onKey(e){
      const tag = document.activeElement?.tagName;
      if(tag === 'INPUT' || tag === 'TEXTAREA') return;

      if(e.key === 'Escape'){
        deselectAll();
        setTool('select');
        return;
      }

      if(e.key === 'Delete' || e.key === 'Backspace'){
        deleteSelected();
        return;
      }

      if(e.ctrlKey && e.key === 'd'){
        e.preventDefault();
        duplicateSelected();
        return;
      }

      if(e.ctrlKey && e.key === 's'){
        e.preventDefault();
        saveLayout();
        return;
      }

      const step = e.shiftKey ? 2 : 0.5;
      const obj  = getSelectedObj();
      if(!obj) return;

      if(e.key === 'ArrowLeft' ){ obj.position_x = Math.max(0,   obj.position_x - step); }
      if(e.key === 'ArrowRight'){ obj.position_x = Math.min(100, obj.position_x + step); }
      if(e.key === 'ArrowUp'   ){ obj.position_y = Math.max(0,   obj.position_y - step); }
      if(e.key === 'ArrowDown' ){ obj.position_y = Math.min(100, obj.position_y + step); }

      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
        e.preventDefault();
        markDirty();
        renderAll();
        updatePropsPanel();
      }
    }

    window.addEventListener('keydown', onKey);
    state._keyHandler = onKey;
  }

  /* ============================================================
     CLEANUP — eliminar listeners al salir
  ============================================================ */
  function cleanup(){
    if(state._keyHandler){
      window.removeEventListener('keydown', state._keyHandler);
    }
    const layout = document.getElementById('me-layout');
    if(layout) layout.remove();
    app.style.padding  = '';
    app.style.maxWidth = '';
  }

  /* ============================================================
     BIND DE CONTROLES FIJOS
  ============================================================ */
  function bindControls(){
    document.getElementById('me-back').addEventListener('click', tryExit);

    document.getElementById('me-save-btn').addEventListener('click', saveLayout);

    document.getElementById('me-reload-btn').addEventListener('click', async () => {
      if(state.dirty && !confirm('¿Recargar? Se perderán los cambios sin guardar.')) return;
      await loadData();
      renderAll();
      setSaveStatus('saved');
      state.dirty = false;
    });

    document.getElementById('me-zoom-in').addEventListener('click', () => {
      state.zoom = Math.min(3, state.zoom * 1.15);
      applyTransform();
    });
    document.getElementById('me-zoom-out').addEventListener('click', () => {
      state.zoom = Math.max(0.3, state.zoom / 1.15);
      applyTransform();
    });
    document.getElementById('me-fit-btn').addEventListener('click',    fitCanvas);
    document.getElementById('me-center-btn').addEventListener('click', centerCanvas);

    document.getElementById('me-grid-check').addEventListener('change', e => {
      state.showGrid = e.target.checked;
      const svg = document.getElementById('me-grid-svg');
      if(svg) svg.style.display = state.showGrid ? '' : 'none';
    });
  }

  /* ============================================================
     INIT COMPLETO
  ============================================================ */
  await loadData();
  renderShell();
  bindControls();
  bindToolbar();
  bindPropsInputs();
  initPan();
  initElementTool();
  bindKeyboard();

  /* Fit inicial después de que el DOM esté pintado */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      fitCanvas();
      renderAll();
    });
  });
}
