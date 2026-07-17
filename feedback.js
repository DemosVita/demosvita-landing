(() => {
  'use strict';

  const client = window.demosVitaSupabase;
  const params = new URLSearchParams(location.search);
  const missionCode = sanitize(params.get('mission') || 'M01_HALAGO_HONESTO', 80);
  const source = sanitize(params.get('source') || 'app', 80);
  const form = document.querySelector('#mission-feedback-form');
  const status = document.querySelector('#form-status');
  const button = form.querySelector('.submit-button');
  button.disabled = true;

  let session;
  let mission;

  init();

  async function init() {
    try {
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (sessionError || !sessionData.session) {
        location.replace(`/acceso.html?returnTo=${encodeURIComponent(location.pathname + location.search)}`);
        return;
      }
      session = sessionData.session;

      const [profileResult, missionResult] = await Promise.all([
        client.from('profiles').select('email,explorer_number,archetype').eq('user_id', session.user.id).single(),
        client.from('missions').select('id,code,title,category,xp').eq('code', missionCode).eq('is_active', true).single()
      ]);

      if (profileResult.error) throw profileResult.error;
      if (missionResult.error) throw new Error('No hemos encontrado la misión que quieres reportar.');

      mission = missionResult.data;
      document.querySelector('#report-profile-name').textContent = `Explorador #${profileResult.data.explorer_number} · ${capitalize(profileResult.data.archetype || 'explorador')}`;
      document.querySelector('#report-profile-email').textContent = profileResult.data.email;
      renderMission(mission);
      button.disabled = false;
    } catch (error) {
      showError(error.message || 'No hemos podido preparar el formulario. Recarga la página.');
      button.disabled = true;
      console.error(error);
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity() || !session || !mission) return;

    setBusy(true);
    status.textContent = '';
    let photoPath = null;

    try {
      photoPath = await uploadPhoto(session.user.id);
      const data = new FormData(form);
      const { error } = await client.from('mission_reports').insert({
        user_id: session.user.id,
        mission_id: mission.id,
        source,
        place: value(data, 'place'),
        words: value(data, 'words'),
        reaction: value(data, 'reaction'),
        perceived_difficulty: value(data, 'difficulty'),
        conversation_duration: value(data, 'duration'),
        feeling_before: value(data, 'before'),
        feeling_after: value(data, 'after'),
        improvements: value(data, 'improvements') || null,
        ideas: value(data, 'ideas') || null,
        photo_path: photoPath,
        anonymous_share_permission: data.get('sharePermission') === 'Sí'
      });

      if (error) throw error;

      form.hidden = true;
      document.querySelector('.xp-earned').textContent = `+${Number(mission.xp || 0)} XP`;
      document.querySelector('#success-screen').hidden = false;
      window.scrollTo({ top: document.querySelector('.form-shell').offsetTop - 100, behavior: 'smooth' });
    } catch (error) {
      if (photoPath) await client.storage.from('mission-photos').remove([photoPath]);
      showError(humanizeError(error));
      setBusy(false);
      console.error(error);
    }
  });

  async function uploadPhoto(userId) {
    const file = document.querySelector('#photo').files[0];
    if (!file) return null;
    if (file.size > 4 * 1024 * 1024) throw new Error('La fotografía supera el máximo de 4 MB.');

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniquePart = window.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const path = `${userId}/${uniquePart}-${safeName}`;
    const { error } = await client.storage.from('mission-photos').upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error('No hemos podido guardar la fotografía. Prueba de nuevo sin ella.');
    return path;
  }

  function renderMission(currentMission) {
    const summary = document.querySelector('#mission-summary');
    summary.replaceChildren();
    const label = document.createElement('span');
    label.textContent = `MISIÓN SELECCIONADA · ${currentMission.category}`;
    const title = document.createElement('strong');
    title.textContent = `${currentMission.title} · +${Number(currentMission.xp || 0)} XP`;
    summary.append(label, title);
    button.textContent = `Completar misión · +${Number(currentMission.xp || 0)} XP`;
  }

  function value(data, key) {
    return String(data.get(key) || '').trim();
  }

  function sanitize(input, maxLength) {
    return String(input || '').replace(/[^0-9A-Za-z_-]/g, '').slice(0, maxLength);
  }

  function capitalize(input) {
    const text = String(input || '');
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function setBusy(busy) {
    button.disabled = busy;
    button.textContent = busy ? 'Guardando misión…' : `Completar misión · +${Number(mission.xp || 0)} XP`;
  }

  function showError(message) {
    status.textContent = message;
    status.style.color = '#a32620';
  }

  function humanizeError(error) {
    if (error && error.code === '23505') return 'Esta misión ya figura como completada en tu histórico.';
    return error && error.message ? error.message : 'No se pudo guardar la misión. Inténtalo de nuevo.';
  }
})();
