/* ============================================================
   CONFIGURACIÓN DE SUPABASE
   Extraído tal cual del <script> original de index.html.
   Solo inicializa el cliente y lo exporta. No contiene SQL
   ni lógica de negocio.
   ============================================================ */

const SUPABASE_URL = "https://ubvxxamgguqgyayzgdxi.supabase.co";
const SUPABASE_KEY = "sb_publishable_a9bjE0XB_Q42trAFqZ172Q_XyZcYt1V";

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Se conserva la misma referencia global que usaba el original,
// por si algún fragmento de código restante dependiera de ella.
window.appSupabase = supabase;