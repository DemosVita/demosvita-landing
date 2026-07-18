(() => {
  'use strict';

  const client = window.demosVitaSupabase;
  const grid = document.getElementById('mission-grid');
  const counter = document.getElementById('mission-counter');
  const filters = document.getElementById('mission-filters');
  const loading = document.getElementById('catalog-loading');
  const errorBox = document.getElementById('catalog-error');
  const retryButton = document.getElementById('retry-catalog');

  const categoryIcons = {
    Explora: '🧭',
    Conecta: '🤝',
    Contempla: '🌿',
    Descubre: '🎨',
    Supera: '↗'
  };

  let missions = [];
  let activeCategory = 'Todas';

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function missionNumber(mission) {
    if (Number.isInteger(mission.sort_order) && mission.sort_order > 0) {
      return String(mission.sort_order).padStart(2, '0');
    }
    const match = String(mission.code || '').match(/^M(\d+)/);
    return match ? match[1].padStart(2, '0') : '—';
  }

  function buildMedia(mission) {
    const media = element('div', 'mission-image');
    const placeholder = element('div', 'mission-image-placeholder');
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.append(
      element('span', 'placeholder-icon', categoryIcons[mission.category] || '✦'),
      element('span', 'placeholder-label', 'Imagen de misión'),
      element('small', '', 'Próximamente')
    );
    media.append(placeholder);

    if (mission.image_url) {
      const image = document.createElement('img');
      image.src = mission.image_url;
      image.alt = `Imagen de la misión ${mission.title}`;
      image.loading = 'lazy';
      image.addEventListener('error', () => image.remove(), { once: true });
      media.append(image);
    }

    media.append(
      element('span', 'difficulty', mission.difficulty),
      element('span', 'mission-number', `MISIÓN ${missionNumber(mission)}`)
    );
    return media;
  }

  function buildConditions(mission) {
    const values = Array.isArray(mission.conditions) ? mission.conditions.filter(Boolean) : [];
    if (!values.length && !mission.feedback_prompt) return null;

    const box = element('div', 'conditions');
    if (values.length) {
      box.append(element('strong', '', 'Condiciones'));
      const list = document.createElement('ul');
      values.forEach(value => list.append(element('li', '', String(value))));
      box.append(list);
    }

    if (mission.feedback_prompt) {
      const proof = element('p', 'feedback-expected');
      proof.append(element('span', '', 'Para reportarla: '), document.createTextNode(mission.feedback_prompt));
      box.append(proof);
    }
    return box;
  }

  function buildCard(mission) {
    const card = element('article', 'mission-card');
    card.id = mission.slug;
    card.dataset.category = mission.category;
    card.append(buildMedia(mission));

    const content = element('div', 'mission-content');
    const meta = element('div', 'mission-meta');
    meta.append(
      element('span', '', `${categoryIcons[mission.category] || '✦'} ${mission.category}`),
      element('span', 'xp', `+${mission.xp} XP`)
    );
    content.append(meta, element('h3', '', mission.title));

    if (mission.tagline) {
      content.append(element('blockquote', '', `“${mission.tagline}”`));
    }
    content.append(element('p', 'mission-description', mission.description));

    const conditions = buildConditions(mission);
    if (conditions) content.append(conditions);

    const actions = element('div', 'card-actions');
    const reportLink = element('a', 'primary', 'Ya la he hecho');
    reportLink.href = `/feedback.html?mission=${encodeURIComponent(mission.code)}&source=web`;

    const shareButton = element('button', 'text-button', 'Compartir misión');
    shareButton.type = 'button';
    shareButton.dataset.shareMission = mission.slug;
    shareButton.dataset.shareTitle = mission.title;
    actions.append(reportLink, shareButton);
    content.append(actions);
    card.append(content);
    return card;
  }

  function updateCounter(visible, total) {
    if (activeCategory === 'Todas') {
      counter.textContent = `${total} ${total === 1 ? 'misión disponible' : 'misiones disponibles'}`;
      return;
    }
    counter.textContent = `${visible} de ${total} misiones`;
  }

  function renderMissions() {
    const visible = activeCategory === 'Todas'
      ? missions
      : missions.filter(mission => mission.category === activeCategory);

    grid.replaceChildren(...visible.map(buildCard));
    updateCounter(visible.length, missions.length);

    if (window.location.hash) {
      const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }

  function renderFilters() {
    const preferredOrder = ['Explora', 'Conecta', 'Contempla', 'Descubre', 'Supera'];
    const available = new Set(missions.map(mission => mission.category));
    const categories = ['Todas', ...preferredOrder.filter(category => available.has(category))];

    filters.replaceChildren(...categories.map(category => {
      const button = element('button', category === activeCategory ? 'active' : '', category);
      button.type = 'button';
      button.dataset.category = category;
      button.setAttribute('aria-pressed', String(category === activeCategory));
      return button;
    }));
    filters.hidden = categories.length <= 2;
  }

  async function fetchMissions() {
    const fields = 'code,slug,title,tagline,description,category,difficulty,xp,conditions,feedback_prompt,image_url,sort_order,published_at';
    let response = await client
      .from('missions')
      .select(fields)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('code', { ascending: true });

    // Compatibilidad durante el despliegue: la web sigue mostrando la misión
    // existente aunque la migración de las nuevas columnas aún no se haya ejecutado.
    if (response.error && /feedback_prompt|sort_order/i.test(response.error.message || '')) {
      response = await client
        .from('missions')
        .select('code,slug,title,tagline,description,category,difficulty,xp,conditions,image_url,published_at')
        .eq('is_active', true)
        .order('code', { ascending: true });
    }

    if (response.error) throw response.error;
    return response.data || [];
  }

  async function loadCatalog() {
    loading.hidden = false;
    errorBox.hidden = true;
    grid.replaceChildren();
    filters.hidden = true;

    try {
      missions = await fetchMissions();
      activeCategory = 'Todas';
      renderFilters();
      renderMissions();
      loading.hidden = true;
    } catch (error) {
      console.error('No se pudo cargar el catálogo de misiones:', error);
      loading.hidden = true;
      errorBox.hidden = false;
      counter.textContent = 'Catálogo no disponible';
    }
  }

  filters.addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    activeCategory = button.dataset.category;
    renderFilters();
    renderMissions();
  });

  grid.addEventListener('click', async event => {
    const button = event.target.closest('[data-share-mission]');
    if (!button) return;

    const url = `${window.location.origin}${window.location.pathname}#${button.dataset.shareMission}`;
    const payload = { title: button.dataset.shareTitle, text: 'Mira esta misión de DemosVita', url };

    try {
      if (navigator.share) {
        await navigator.share(payload);
      } else {
        await navigator.clipboard.writeText(url);
        button.textContent = 'Enlace copiado ✓';
        window.setTimeout(() => { button.textContent = 'Compartir misión'; }, 2400);
      }
    } catch (error) {
      if (error && error.name !== 'AbortError') {
        button.textContent = 'No se pudo compartir';
        window.setTimeout(() => { button.textContent = 'Compartir misión'; }, 2400);
      }
    }
  });

  retryButton.addEventListener('click', loadCatalog);
  loadCatalog();
})();
