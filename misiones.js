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

  const catalogImages = {
    M02_COMERCIANTE_LOCAL: 'assets/misiones/1_Elcomerciantelocal.jpg',
    M03_ADOPTA_UN_LUGAR: 'assets/misiones/2_Adoptaunlugar.jpg',
    M04_EVENTO_QUE_NUNCA_HARIAS: 'assets/misiones/3_Eleventoquenuncaharias.jpg',
    M05_RECOMENDACION_DESCONOCIDO: 'assets/misiones/4_Larecomendaciondeundesconocido.jpg',
    M06_DIEZ_MINUTOS_SIN_SALIDA: 'assets/misiones/5_Diezminutossinsalida.jpg',
    M01_HALAGO_HONESTO: 'assets/misiones/6_Elhalagohonesto.jpg',
    M07_CAFE_SIN_PANTALLA: 'assets/misiones/7_Elcafesinpantalla.jpg',
    M08_MODO_AVION_COMPARTIDO: 'assets/misiones/8_Modoavioncompartido.jpg',
    M09_DIA_ENTERO_SIN_REDES: 'assets/misiones/9_Eldiaentero.jpg',
    M10_LIBRERIA_AL_AZAR: 'assets/misiones/10_Libreriaalazar.jpg',
    M11_MANOS_OCUPADAS: 'assets/misiones/11_Manosocupadas.jpg',
    M12_APRENDE_DE_UN_EXTRANO: 'assets/misiones/12_Aprendedeunextra%C3%B1o.jpg',
    M13_PIDE_SIN_MIEDO: 'assets/misiones/13_Pidesinmiedo.jpg',
    M14_NO_QUE_SE_CONVIERTE_EN_SI: 'assets/misiones/14_Elnoqueseconvierteensi.jpg',
    M15_MOMENTO_INCOMODO: 'assets/misiones/15_Elmomentoincomodo.jpg'
  };

  let missions = [];
  let activeCategory = 'Todas';
  let completedByMission = new Map();

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

    const imageSources = [catalogImages[mission.code], mission.image_url]
      .filter((source, index, values) => source && values.indexOf(source) === index);

    if (imageSources.length) {
      const image = document.createElement('img');
      let sourceIndex = 0;
      image.src = imageSources[sourceIndex];
      image.alt = `Imagen de la misión ${mission.title}`;
      image.loading = 'lazy';
      image.addEventListener('load', () => media.classList.add('has-image'));
      image.addEventListener('error', () => {
        sourceIndex += 1;
        if (sourceIndex < imageSources.length) {
          image.src = imageSources[sourceIndex];
          return;
        }
        image.remove();
      });
      media.append(image);
    }
    return media;
  }

  function buildHeader(mission) {
    const header = element('header', 'mission-card-header');
    const kicker = element('div', 'mission-card-kicker');
    const completion = completedByMission.get(mission.id);
    const labels = element('div', 'mission-card-labels');
    labels.append(element('span', 'mission-number-label', `MISIÓN ${missionNumber(mission)}`));
    if (completion) labels.append(element('span', 'completion-seal', 'Completada ✓'));
    kicker.append(labels, element('span', 'difficulty-label', mission.difficulty));

    const meta = element('div', 'mission-card-meta');
    meta.append(
      element('span', '', `${categoryIcons[mission.category] || '✦'} ${mission.category}`),
      element('span', completion ? 'points-earned' : 'xp', completion ? `${mission.xp} puntos obtenidos` : `+${mission.xp} XP`)
    );
    header.append(kicker, element('h3', '', mission.title), meta);
    return header;
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
    const completion = completedByMission.get(mission.id);
    if (completion) card.classList.add('is-completed');
    const visual = element('div', 'mission-visual');
    visual.append(buildHeader(mission), buildMedia(mission));
    if (mission.tagline) {
      visual.append(element('p', 'mission-motto', mission.tagline));
    }
    const content = element('div', 'mission-content');
    content.append(element('p', 'mission-description', mission.description));

    const conditions = buildConditions(mission);
    if (conditions) content.append(conditions);

    const actions = element('div', 'card-actions');
    const reportLink = element('a', 'primary', completion ? 'Ver mi reporte' : 'Ya la he hecho');
    reportLink.href = completion
      ? `/cuenta.html#report-${encodeURIComponent(completion.latest.id)}`
      : `/feedback.html?mission=${encodeURIComponent(mission.code)}&source=web`;

    const shareButton = element('button', 'text-button', 'Compartir misión');
    shareButton.type = 'button';
    shareButton.dataset.shareMission = mission.slug;
    shareButton.dataset.shareTitle = mission.title;
    actions.append(reportLink);
    if (completion) {
      const repeatLink = element('a', 'repeat-link', completion.count > 1 ? `Repetir misión · ${completion.count} intentos` : 'Volver a hacerla');
      repeatLink.href = `/feedback.html?mission=${encodeURIComponent(mission.code)}&source=repeat`;
      actions.append(repeatLink);
    }
    actions.append(shareButton);
    content.append(actions);
    visual.append(content);
    card.append(visual);
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
    const fields = 'id,code,catalog_id,slug,title,tagline,description,category,difficulty,xp,conditions,feedback_prompt,feedback_questions,image_url,sort_order,published_at';
    let response = await client
      .from('missions')
      .select(fields)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('code', { ascending: true });

    // Compatibilidad durante el despliegue: la web sigue mostrando la misión
    // existente aunque la migración de las nuevas columnas aún no se haya ejecutado.
    if (response.error && /catalog_id|feedback_prompt|feedback_questions|sort_order/i.test(response.error.message || '')) {
      response = await client
        .from('missions')
        .select('id,code,slug,title,tagline,description,category,difficulty,xp,conditions,image_url,published_at')
        .eq('is_active', true)
        .order('code', { ascending: true });
    }

    if (response.error) throw response.error;
    return response.data || [];
  }

  async function loadCompletionState() {
    completedByMission = new Map();
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) return;

    const { data, error } = await client
      .from('mission_reports')
      .select('id,mission_id,created_at,xp_awarded')
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('No se pudo cargar el progreso del catálogo', error);
      return;
    }

    (data || []).forEach(report => {
      const existing = completedByMission.get(report.mission_id);
      if (existing) existing.count += 1;
      else completedByMission.set(report.mission_id, { latest: report, count: 1 });
    });
  }

  async function loadCatalog() {
    loading.hidden = false;
    errorBox.hidden = true;
    grid.replaceChildren();
    filters.hidden = true;

    try {
      missions = await fetchMissions();
      await loadCompletionState();
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
