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
      location.replace('/acceso.html?returnTo=/cuenta.html');
      return;
    }

    try {
      const [profileResult, reportsResult, proposalsResult] = await Promise.all([
        client.from('profiles').select('email,explorer_number,archetype,total_xp,level,is_founder').eq('user_id', session.user.id).single(),
        client.from('mission_reports').select('id,created_at,xp_awarded,status,missions(title,category,code)').order('created_at', { ascending: false }),
        client.from('mission_proposals').select('id', { count: 'exact', head: true })
      ]);

      if (profileResult.error) throw profileResult.error;
      if (reportsResult.error) throw reportsResult.error;
      if (proposalsResult.error) throw proposalsResult.error;

      renderProfile(profileResult.data, reportsResult.data || [], proposalsResult.count || 0);
      loading.hidden = true;
      content.hidden = false;
    } catch (error) {
      loading.hidden = true;
      errorBox.hidden = false;
      errorBox.textContent = 'No hemos podido cargar tu cuenta. Recarga la página en unos segundos.';
      console.error(error);
    }
  }

  document.querySelector('#sign-out').addEventListener('click', async () => {
    await client.auth.signOut();
    location.replace('/acceso.html');
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

