/* ============================================================
   CONSTANTES COMPARTIDAS
   RESTAURANT y MESAS estaban declaradas dentro del IIFE original
   y eran usadas por renderHome, renderCustomer, renderStaff,
   renderMesero, renderAdministrador y renderSuperadmin.
   Como ahora cada uno vive en su propio módulo, se centralizan
   aquí (regla 15: archivo adicional permitido para resolver una
   dependencia real) SIN cambiar sus valores ni su forma.
   ============================================================ */

export const RESTAURANT = "RAIL";

export const MESAS = [
  {id:1, nombre:"Mesa 1"},
  {id:2, nombre:"Mesa 2"},
  {id:3, nombre:"Mesa 3"},
  {id:4, nombre:"Mesa 4"},
];