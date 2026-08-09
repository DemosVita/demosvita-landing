(() => {
  'use strict';
  const client = window.demosVitaSupabase;
  const code = String(new URLSearchParams(location.search).get('mission') || '').replace(/[^0-9A-Za-z_-]/g, '').slice(0, 80);
  const form = document.querySelector('#special-form');
  const status = document.querySelector('#special-status');
  let mission;

  init();

  async function init() {
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) return;
    if (!code) return close('No se ha indicado ninguna misión especial.');
    const { data, error } = await client.from('special_missions').select('*').eq('code', code).eq('is_published', true).maybeSingle();
    if (error || !data) return close('Esta misión especial no está disponible.');
    mission = data;
    renderMission();
    const now = Date.now();
    if (now < new Date(mission.claim_starts_at).getTime()) return close(`El registro se abrirá el ${formatDate(mission.claim_starts_at)}.`);
    if (now > new Date(mission.claim_ends_at).getTime()) return close('El plazo para conseguir esta insignia ha terminado.');
    const { data: existing } = await client.from('user_badges').select('id').eq('special_mission_id', mission.id).maybeSingle();
    if (existing) return success(true);
    document.querySelector('#special-loading').hidden = true;
    document.querySelector('#special-window').textContent = `Puedes registrarla hasta el ${formatDate(mission.claim_ends_at)}. El servidor comprobará el plazo al enviarla.`;
    form.hidden = false;
  }

  function renderMission() {
    document.querySelector('#special-title').textContent = mission.title;
    document.querySelector('#special-description').textContent = mission.description;
    const badge = document.querySelector('#special-badge');
    badge.hidden = false;
    badge.querySelector('img').src = mission.badge_image_url;
    badge.querySelector('img').alt = `Insignia ${mission.badge_name}`;
    badge.querySelector('strong').textContent = mission.badge_name;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity() || !mission) return;
    const button = form.querySelector('button');
    button.disabled = true;
    button.textContent = 'Registrando…';
    status.textContent = '';
    const data = new FormData(form);
    const { error } = await client.rpc('claim_special_mission_badge', {
      special_code: mission.code,
      submitted_answers: { version: 1, location: String(data.get('location') || '').trim(), highlight: String(data.get('highlight') || '').trim(), honesty_confirmed: true }
    });
    if (error) {
      status.textContent = humanize(error);
      status.style.color = '#a32620';
      button.disabled = false;
      button.textContent = 'Conseguir insignia';
      return;
    }
    success(false);
  });

  function success(alreadyOwned) {
    document.querySelector('#special-loading').hidden = true;
    form.hidden = true;
    document.querySelector('#special-closed').hidden = true;
    const box = document.querySelector('#badge-success');
    box.hidden = false;
    box.querySelector('img').src = mission.badge_image_url;
    box.querySelector('img').alt = `Insignia ${mission.badge_name}`;
    box.querySelector('p').textContent = alreadyOwned ? 'Ya habías conseguido esta insignia. Sigue guardada en tu colección.' : `${mission.badge_name} ya forma parte de tu colección. Esta misión no ha modificado tus XP.`;
  }

  function close(message) {
    document.querySelector('#special-loading').hidden = true;
    form.hidden = true;
    const box = document.querySelector('#special-closed');
    box.hidden = false;
    box.textContent = message;
  }
  function formatDate(value) { return new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value)); }
  function humanize(error) {
    if (/not open/i.test(error.message || '')) return 'La misión todavía no está abierta.';
    if (/closed/i.test(error.message || '')) return 'El plazo de esta misión ya ha terminado.';
    if (/already claimed/i.test(error.message || '')) return 'Ya tienes esta insignia en tu colección.';
    return 'No hemos podido registrar la misión. Inténtalo de nuevo.';
  }
})();
