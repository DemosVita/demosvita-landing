(() => {
  'use strict';

  const client = window.demosVitaSupabase;
  const params = new URLSearchParams(location.search);
  const source = String(params.get('source') || 'app').replace(/[^0-9A-Za-z_-]/g, '').slice(0, 80);
  const form = document.querySelector('#mission-proposal-form');
  const status = document.querySelector('#proposal-status');
  const button = form.querySelector('.submit-button');
  button.disabled = true;
  let session;

  init();

  async function init() {
    try {
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (sessionError || !sessionData.session) {
        location.replace(`/acceso.html?returnTo=${encodeURIComponent(location.pathname + location.search)}`);
        return;
      }
      session = sessionData.session;

      const { data: profile, error } = await client
        .from('profiles')
        .select('email,explorer_number,archetype')
        .eq('user_id', session.user.id)
        .single();
      if (error) throw error;

      document.querySelector('#proposal-profile-name').textContent = `Explorador #${profile.explorer_number} · ${capitalize(profile.archetype || 'explorador')}`;
      document.querySelector('#proposal-profile-email').textContent = profile.email;
      button.disabled = false;
    } catch (error) {
      showError('No hemos podido cargar tu perfil. Recarga la página.');
      button.disabled = true;
      console.error(error);
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity() || !session) return;

    setBusy(true);
    status.textContent = '';

    try {
      const data = new FormData(form);
      const { error } = await client.from('mission_proposals').insert({
        user_id: session.user.id,
        source,
        title: value(data, 'title'),
        category: value(data, 'category'),
        action_description: value(data, 'actionDescription'),
        purpose: value(data, 'purpose'),
        conditions: value(data, 'conditions') || null,
        difficulty: value(data, 'difficulty'),
        estimated_duration: value(data, 'duration'),
        why: value(data, 'why'),
        contact_permission: data.get('contactPermission') === 'Sí'
      });

      if (error) throw error;

      form.hidden = true;
      document.querySelector('#proposal-success').hidden = false;
      window.scrollTo({ top: document.querySelector('.form-shell').offsetTop - 100, behavior: 'smooth' });
    } catch (error) {
      showError(error.message || 'No se pudo guardar la propuesta. Inténtalo de nuevo.');
      setBusy(false);
      console.error(error);
    }
  });

  function value(data, key) {
    return String(data.get(key) || '').trim();
  }

  function capitalize(input) {
    const text = String(input || '');
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function setBusy(busy) {
    button.disabled = busy;
    button.textContent = busy ? 'Guardando propuesta…' : 'Enviar propuesta';
  }

  function showError(message) {
    status.textContent = message;
    status.style.color = '#a32620';
  }
})();
