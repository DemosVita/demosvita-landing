(() => {
  'use strict';

  const client = window.demosVitaSupabase;
  const loading = document.querySelector('#account-loading');
  const content = document.querySelector('#account-content');
  const errorBox = document.querySelector('#account-error');

  init();

  async function init() {
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    const session = sessionData.session;

    if (sessionError || !session) {
      location.replace('acceso.html?returnTo=cuenta.html');
      return;
    }

    try {
      const profileResult = await loadProfile(session.user.id);
      if (profileResult.error) throw profileResult.error;
      if (!profileResult.data) throw { code: 'PROFILE_NOT_FOUND', message: 'No existe el perfil vinculado' };

      const [reportsResult, proposalsResult] = await Promise.all([
        client.from('mission_reports').select('id,created_at,xp_awarded,status,missions(title,category,code)').order('created_at', { ascending: false }),
        client.from('mission_proposals').select('id', { count: 'exact', head: true })
      ]);

      // El perfil es esencial. El histórico y las propuestas son secundarios:
      // si una de esas consultas falla, la cuenta sigue siendo utilizable.
      if (reportsResult.error) console.warn('No se pudo cargar el histórico', reportsResult.error);
      if (proposalsResult.error) console.warn('No se pudieron cargar las propuestas', proposalsResult.error);

      renderProfile(
        profileResult.data,
        reportsResult.error ? [] : (reportsResult.data || []),
        proposalsResult.error ? 0 : (proposalsResult.count || 0)
      );
      loading.hidden = true;
      content.hidden = false;
    } catch (error) {
      loading.hidden = true;
      errorBox.hidden = false;
      const reference = error && error.code ? ` (${error.code})` : '';
      errorBox.textContent = `Tu acceso es correcto, pero no hemos podido encontrar el perfil asociado${reference}. `;
      const restartButton = document.createElement('button');
      restartButton.type = 'button';
      restartButton.className = 'primary account-restart';
      restartButton.textContent = 'Volver al registro';
      restartButton.addEventListener('click', async () => {
        await client.auth.signOut();
        location.replace('acceso.html');
      });
      errorBox.appendChild(restartButton);
      console.error(error);
    }
  }

  async function loadProfile(userId) {
    let result;
    // Tras el primer registro, el trigger puede necesitar un instante para
    // dejar disponible el perfil al cliente.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      result = await client
        .from('profiles')
        .select('email,explorer_number,archetype,total_xp,level,is_founder')
        .eq('user_id', userId)
        .maybeSingle();
      if (result.error || result.data) return result;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    return result;
  }

  document.querySelector('#sign-out').addEventListener('click', async () => {
    await client.auth.signOut();
    location.replace('acceso.html');
  });

  function renderProfile(profile, reports, proposalCount) {
    const xp = Number(profile.total_xp || 0);
    const level = Number(profile.level || 1);
    const progress = xp % 500;

    document.querySelector('#explorer-number').textContent = `#${profile.explorer_number}`;
    document.querySelector('#profile-email').textContent = profile.email;
    document.querySelector('#profile-archetype').textContent = capitalize(profile.archetype || 'Por descubrir');
    document.querySelector('#profile-level').textContent = level;
    document.querySelector('#profile-xp').textContent = xp;
    document.querySelector('#level-progress').textContent = `${progress} / 500 XP para el siguiente nivel`;
    document.querySelector('#report-count').textContent = reports.length;
    document.querySelector('#proposal-count').textContent = proposalCount;

    const history = document.querySelector('#history-list');
    const empty = document.querySelector('#empty-history');
    if (!reports.length) {
      empty.hidden = false;
      return;
    }

    history.innerHTML = reports.map(report => {
      const mission = report.missions || {};
      const date = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(report.created_at));
      return `<article class="history-item">
        <div class="history-marker">✓</div>
        <div><span>${escapeHtml(mission.category || 'Misión')} · ${date}</span><h3>${escapeHtml(mission.title || 'Misión completada')}</h3></div>
        <strong>+${Number(report.xp_awarded || 0)} XP</strong>
      </article>`;
    }).join('');
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  }
})();
