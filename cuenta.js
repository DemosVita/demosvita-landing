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
        client.from('mission_reports')
          .select('id,created_at,xp_awarded,status,answers,improvements,ideas,photo_path,missions(title,category,code,feedback_schema)')
          .order('created_at', { ascending: false }),
        client.from('mission_proposals')
          .select('id,created_at,status,title,category,action_description,purpose,conditions,difficulty,estimated_duration,why,contact_permission')
          .order('created_at', { ascending: false })
      ]);

      if (reportsResult.error) console.warn('No se pudo cargar el histórico', reportsResult.error);
      if (proposalsResult.error) console.warn('No se pudieron cargar las propuestas', proposalsResult.error);

      renderAccount(
        profileResult.data,
        reportsResult.error ? [] : (reportsResult.data || []),
        proposalsResult.error ? [] : (proposalsResult.data || [])
      );
      bindTabs();
      loading.hidden = true;
      content.hidden = false;
      openLinkedEntry();
    } catch (error) {
      showAccountError(error);
    }
  }

  async function loadProfile(userId) {
    let result;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      result = await client.from('profiles').select('email,explorer_number,archetype,total_xp,level,is_founder').eq('user_id', userId).maybeSingle();
      if (result.error || result.data) return result;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    return result;
  }

  function renderAccount(profile, reports, proposals) {
    const xp = Number(profile.total_xp || 0);
    const level = Number(profile.level || 1);
    document.querySelector('#explorer-number').textContent = `#${profile.explorer_number}`;
    document.querySelector('#profile-email').textContent = profile.email;
    document.querySelector('#profile-archetype').textContent = capitalize(profile.archetype || 'Por descubrir');
    document.querySelector('#profile-level').textContent = level;
    document.querySelector('#profile-xp').textContent = xp;
    document.querySelector('#level-progress').textContent = `${xp % 500} / 500 XP para el siguiente nivel`;
    document.querySelector('#report-count').textContent = reports.length;
    document.querySelector('#reports-tab-count').textContent = reports.length;
    document.querySelector('#proposals-tab-count').textContent = proposals.length;
    renderReports(reports);
    renderProposals(proposals);
  }

  function renderReports(reports) {
    const list = document.querySelector('#history-list');
    const empty = document.querySelector('#empty-history');
    empty.hidden = reports.length > 0;
    list.replaceChildren(...reports.map(report => {
      const mission = report.missions || {};
      const details = document.createElement('details');
      details.className = 'history-entry';
      details.id = `report-${report.id}`;

      const summary = document.createElement('summary');
      summary.innerHTML = `<span class="history-marker">✓</span><span class="history-title"><small>${escapeHtml(mission.category || 'Misión')} · ${formatDate(report.created_at)}</small><strong>${escapeHtml(mission.title || 'Misión completada')}</strong></span><span class="history-points">+${Number(report.xp_awarded || 0)} puntos</span><span class="history-chevron" aria-hidden="true">⌄</span>`;

      const body = document.createElement('div');
      body.className = 'history-detail';
      const responses = normalizeResponses(report.answers);
      body.append(buildReadOnlyFields(responses));
      const extras = [];
      if (report.improvements) extras.push({ question: '¿Qué mejorarías?', answer: report.improvements });
      if (report.ideas) extras.push({ question: 'Otras ideas', answer: report.ideas });
      if (extras.length) body.append(buildReadOnlyFields(extras));

      const actions = document.createElement('div');
      actions.className = 'history-actions';
      const repeat = document.createElement('a');
      repeat.className = 'primary';
      repeat.href = `feedback.html?mission=${encodeURIComponent(mission.code || '')}&source=history`;
      repeat.textContent = 'Volver a hacer esta misión';
      actions.append(repeat);
      body.append(actions);
      details.append(summary, body);
      return details;
    }));
  }

  function renderProposals(proposals) {
    const list = document.querySelector('#proposal-history-list');
    const empty = document.querySelector('#empty-proposals');
    empty.hidden = proposals.length > 0;
    list.replaceChildren(...proposals.map(proposal => {
      const details = document.createElement('details');
      details.className = 'history-entry proposal-entry';
      details.id = `proposal-${proposal.id}`;
      const summary = document.createElement('summary');
      summary.innerHTML = `<span class="history-marker proposal-marker">◇</span><span class="history-title"><small>${escapeHtml(proposal.category || 'Propuesta')} · ${formatDate(proposal.created_at)}</small><strong>${escapeHtml(proposal.title || 'Misión propuesta')}</strong></span><span class="proposal-status status-${escapeHtml(proposal.status || 'pending')}">${statusLabel(proposal.status)}</span><span class="history-chevron" aria-hidden="true">⌄</span>`;
      const fields = [
        ['Acción propuesta', proposal.action_description], ['Objetivo', proposal.purpose],
        ['Condiciones', proposal.conditions], ['Dificultad', proposal.difficulty],
        ['Duración estimada', proposal.estimated_duration], ['¿Por qué debería existir?', proposal.why],
        ['Permiso para contactar', proposal.contact_permission ? 'Sí' : 'No']
      ].filter(([, answer]) => answer !== null && answer !== undefined && answer !== '');
      const body = document.createElement('div');
      body.className = 'history-detail';
      body.append(buildReadOnlyFields(fields.map(([question, answer]) => ({ question, answer }))));
      details.append(summary, body);
      return details;
    }));
  }

  function normalizeResponses(answers) {
    const values = answers && Array.isArray(answers.responses) ? answers.responses : [];
    return values.filter(item => item && item.answer !== '' && item.answer !== null && item.answer !== undefined).map(item => ({
      question: item.question || item.key || 'Respuesta',
      answer: item.type === 'photo' ? 'Fotografía adjunta' : (typeof item.answer === 'boolean' ? (item.answer ? 'Sí' : 'No') : item.answer)
    }));
  }

  function buildReadOnlyFields(fields) {
    const group = document.createElement('div');
    group.className = 'read-only-grid';
    if (!fields.length) {
      group.append(element('p', 'history-no-data', 'Este reporte pertenece a una versión anterior y no contiene respuestas detalladas.'));
      return group;
    }
    fields.forEach(field => {
      const item = element('div', 'read-only-field');
      item.append(element('span', '', field.question), element('p', '', String(field.answer)));
      group.append(item);
    });
    return group;
  }

  function bindTabs() {
    document.querySelectorAll('[data-account-tab]').forEach(button => button.addEventListener('click', () => selectTab(button.dataset.accountTab)));
  }

  function selectTab(name) {
    const proposals = name === 'proposals';
    document.querySelector('#reports-panel').hidden = proposals;
    document.querySelector('#proposals-panel').hidden = !proposals;
    document.querySelectorAll('[data-account-tab]').forEach(button => {
      const active = button.dataset.accountTab === name;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
  }

  function openLinkedEntry() {
    const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    if (!target) return;
    if (target.id.startsWith('proposal-')) selectTab('proposals');
    target.open = true;
    requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }

  document.querySelector('#sign-out').addEventListener('click', async () => {
    await client.auth.signOut();
    location.replace('acceso.html');
  });

  function showAccountError(error) {
    loading.hidden = true;
    errorBox.hidden = false;
    const reference = error && error.code ? ` (${error.code})` : '';
    errorBox.textContent = `Tu acceso es correcto, pero no hemos podido cargar tu cuenta${reference}. `;
    const restart = element('button', 'primary account-restart', 'Volver al registro');
    restart.type = 'button';
    restart.addEventListener('click', async () => { await client.auth.signOut(); location.replace('acceso.html'); });
    errorBox.append(restart);
    console.error(error);
  }

  function statusLabel(status) {
    return ({ pending: 'Pendiente', reviewing: 'En revisión', accepted: 'Aceptada', rejected: 'No seleccionada' })[status] || 'Enviada';
  }
  function formatDate(value) { return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
  function capitalize(value) { return String(value).charAt(0).toUpperCase() + String(value).slice(1); }
  function element(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
  function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]); }
})();
