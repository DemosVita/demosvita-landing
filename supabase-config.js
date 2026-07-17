(() => {
  'use strict';

  const SUPABASE_URL = 'https://owepverkysoxiansozzh.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_EtvwjQNj1nGlKuCrXi5FkA_5RNQjeek';

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    throw new Error('No se pudo cargar el acceso seguro de DemosVita.');
  }

  window.demosVitaSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
})();

