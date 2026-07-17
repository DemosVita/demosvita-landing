(() => {
  'use strict';

  protectPage();

  async function protectPage() {
    try {
      const client = window.demosVitaSupabase;
      if (!client) throw new Error('No se ha cargado el servicio de acceso');

      const { data, error } = await client.auth.getSession();
      if (error) throw error;

      if (!data.session) {
        const returnTo = `${location.pathname}${location.search}${location.hash}`;
        location.replace(`/acceso.html?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }

      document.documentElement.classList.remove('auth-pending');
    } catch (error) {
      document.documentElement.classList.remove('auth-pending');
      document.body.innerHTML = `
        <main class="guard-error">
          <img src="/logo-green.png" alt="DemosVita" width="72" height="72">
          <h1>No hemos podido comprobar tu acceso.</h1>
          <p>Recarga la página o vuelve a iniciar sesión.</p>
          <a href="/acceso.html">Ir al acceso de Exploradores</a>
        </main>`;
      console.error(error);
    }
  }
})();

