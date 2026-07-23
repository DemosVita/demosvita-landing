(() => {
  'use strict';

  const client = window.demosVitaSupabase;
  const params = new URLSearchParams(location.search);
  const initialMissionCode = sanitize(params.get('mission') || '', 80);
  const source = sanitize(params.get('source') || 'app', 80);
  const form = document.querySelector('#mission-feedback-form');
  const status = document.querySelector('#form-status');
  const button = form.querySelector('.submit-button');
  const fieldsContainer = document.querySelector('#dynamic-feedback-fields');
  const fieldsHelp = document.querySelector('#dynamic-fields-help');
  const missionSelector = document.querySelector('#mission-selector');
  const missionSummary = document.querySelector('#mission-summary');
  button.disabled = true;

  let session;
  let mission = null;
  let missions = [];
  let feedbackSchema = [];

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
        loadMissions()
      ]);

      if (profileResult.error) throw profileResult.error;
      if (missionResult.error) throw new Error('No hemos podido cargar el catálogo de misiones.');

      missions = missionResult.data || [];
      if (!missions.length) throw new Error('No hay misiones activas disponibles para reportar.');

      document.querySelector('#report-profile-name').textContent = `Explorador #${profileResult.data.explorer_number} · ${capitalize(profileResult.data.archetype || 'explorador')}`;
      document.querySelector('#report-profile-email').textContent = profileResult.data.email;
      renderMissionSelector();

      if (initialMissionCode && missions.some(item => item.code === initialMissionCode)) {
        missionSelector.value = initialMissionCode;
        selectMission(initialMissionCode);
      } else {
        clearMissionSelection();
      }

      missionSelector.disabled = false;
    } catch (error) {
      showError(error.message || 'No hemos podido preparar el formulario. Recarga la página.');
      fieldsHelp.textContent = 'No se pudieron cargar las misiones.';
      missionSelector.disabled = true;
      button.disabled = true;
      console.error(error);
    }
  }

  async function loadMissions() {
    const fields = 'id,code,title,category,difficulty,xp,conditions,feedback_schema,feedback_questions,sort_order';
    let result = await client
      .from('missions')
      .select(fields)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('code', { ascending: true });

    if (result.error && /feedback_schema|sort_order|conditions/i.test(result.error.message || '')) {
      result = await client
        .from('missions')
        .select('id,code,title,category,difficulty,xp,feedback_questions')
        .eq('is_active', true)
        .order('code', { ascending: true });
    }
    return result;
  }

  function renderMissionSelector() {
    missionSelector.replaceChildren();
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = 'Selecciona una misión';
    missionSelector.append(empty);

    missions.forEach(currentMission => {
      const option = document.createElement('option');
      option.value = currentMission.code;
      option.textContent = `Misión ${missionNumber(currentMission)} · ${currentMission.title}`;
      missionSelector.append(option);
    });
  }

  function selectMission(code) {
    const selected = missions.find(item => item.code === code);
    if (!selected) {
      clearMissionSelection();
      return;
    }

    mission = selected;
    feedbackSchema = normalizeSchema(mission);
    if (!feedbackSchema.length) {
      clearMissionSelection('Esta misión todavía no tiene configuradas sus preguntas de feedback.');
      return;
    }

    status.textContent = '';
    renderMission(mission);
    renderDynamicFields(feedbackSchema);
    button.disabled = false;

    const nextParams = new URLSearchParams(location.search);
    nextParams.set('mission', mission.code);
    if (!nextParams.get('source')) nextParams.set('source', source);
    history.replaceState(null, '', `${location.pathname}?${nextParams.toString()}`);
  }

  function clearMissionSelection(message) {
    mission = null;
    feedbackSchema = [];
    missionSummary.hidden = true;
    missionSummary.replaceChildren();
    fieldsContainer.replaceChildren();
    fieldsHelp.textContent = message || 'Selecciona una misión para cargar sus preguntas específicas.';
    button.disabled = true;
    button.textContent = 'Selecciona una misión';
  }

  missionSelector.addEventListener('change', () => {
    selectMission(sanitize(missionSelector.value, 80));
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!mission) {
      showError('Selecciona la misión que has completado.');
      missionSelector.focus();
      return;
    }
    if (!form.reportValidity() || !session) return;

    setBusy(true);
    status.textContent = '';
    let photoPath = null;

    try {
      photoPath = await uploadPhoto(session.user.id);
      const data = new FormData(form);
      const answers = collectAnswers(photoPath);
      const { data: savedReport, error } = await client.from('mission_reports').insert({
        user_id: session.user.id,
        mission_id: mission.id,
        source,
        answers,
        improvements: value(data, 'improvements') || null,
        ideas: value(data, 'ideas') || null,
        photo_path: photoPath,
        anonymous_share_permission: data.get('sharePermission') === 'Sí'
      }).select('id').single();

      if (error) throw error;

      form.hidden = true;
      document.querySelector('.xp-earned').textContent = `+${Number(mission.xp || 0)} XP`;
      const historyLink = document.querySelector('#success-history-link');
      if (historyLink && savedReport) historyLink.href = `/cuenta.html#report-${encodeURIComponent(savedReport.id)}`;
      document.querySelector('#success-screen').hidden = false;
      window.scrollTo({ top: document.querySelector('.form-shell').offsetTop - 100, behavior: 'smooth' });
    } catch (error) {
      if (photoPath) await client.storage.from('mission-photos').remove([photoPath]);
      showError(humanizeError(error));
      setBusy(false);
      console.error(error);
    }
  });

  function normalizeSchema(currentMission) {
    if (Array.isArray(currentMission.feedback_schema) && currentMission.feedback_schema.length) {
      return currentMission.feedback_schema.filter(isValidField);
    }

    const questions = Array.isArray(currentMission.feedback_questions) ? currentMission.feedback_questions : [];
    return questions.map((question, index) => ({
      key: /foto/i.test(question) ? 'photo' : `q${index + 1}`,
      label: String(question),
      type: /foto/i.test(question) ? 'photo' : 'textarea',
      required: !/foto|opcional/i.test(question),
      rows: 3
    }));
  }

  function isValidField(field) {
    return field && typeof field === 'object' && field.key && field.label && ['text', 'textarea', 'select', 'checkbox', 'photo'].includes(field.type);
  }

  function renderDynamicFields(schema) {
    fieldsContainer.replaceChildren();
    fieldsHelp.textContent = 'Estas preguntas se adaptan a la misión que has completado.';

    schema.forEach((definition, index) => {
      const key = sanitizeFieldKey(definition.key, index);
      const inputId = `feedback-${key}`;

      if (definition.type === 'checkbox') {
        fieldsContainer.append(buildCheckboxField(definition, key, inputId));
        return;
      }

      const wrapper = element('div', 'field');
      const label = element('label', '', definition.label);
      label.htmlFor = inputId;
      const input = buildInput(definition, key, inputId);
      wrapper.append(label, input);
      if (definition.type === 'photo') wrapper.append(buildPhotoConsent(input));

      if (definition.help) wrapper.append(element('small', '', definition.help));
      fieldsContainer.append(wrapper);
    });
  }

  function buildInput(definition, key, inputId) {
    let input;

    if (definition.type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = Math.min(Math.max(Number(definition.rows) || 3, 2), 8);
      input.maxLength = 4000;
      input.placeholder = 'Cuéntanoslo con tus propias palabras';
    } else if (definition.type === 'select') {
      input = document.createElement('select');
      const emptyOption = document.createElement('option');
      emptyOption.value = '';
      emptyOption.textContent = 'Selecciona una opción';
      input.append(emptyOption);
      (Array.isArray(definition.options) ? definition.options : []).forEach(optionValue => {
        const option = document.createElement('option');
        option.value = String(optionValue);
        option.textContent = String(optionValue);
        input.append(option);
      });
    } else {
      input = document.createElement('input');
      input.type = definition.type === 'photo' ? 'file' : 'text';
      if (definition.type === 'photo') {
        input.accept = 'image/jpeg,image/png,image/webp';
        input.dataset.feedbackPhoto = 'true';
      } else {
        input.maxLength = 500;
        input.placeholder = 'Escribe tu respuesta';
      }
    }

    input.id = inputId;
    input.name = `feedback_${key}`;
    input.required = Boolean(definition.required);
    applyFeedbackMetadata(input, definition, key);
    return input;
  }

  function buildPhotoConsent(photoInput) {
    const block = element('div', 'photo-consent');
    const note = element('p', 'photo-privacy-note', 'La fotografía será privada y solo se utilizará para registrar esta misión. Podrás verla, descargarla y eliminarla desde tu cuenta.');
    const label = element('label', 'permission photo-rights-confirmation');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'photoRightsConfirmation';
    checkbox.value = 'Sí';
    checkbox.disabled = true;
    const text = element('span', '', 'Confirmo que tengo derecho a utilizar esta fotografía y que cuento con la autorización de las personas reconocibles que aparecen en ella.');
    label.append(checkbox, text);
    block.append(note, label);

    const syncConsent = () => {
      const hasPhoto = Boolean(photoInput.files && photoInput.files[0]);
      checkbox.disabled = !hasPhoto;
      checkbox.required = hasPhoto;
      if (!hasPhoto) checkbox.checked = false;
      label.classList.toggle('is-required', hasPhoto);
    };
    photoInput.addEventListener('change', syncConsent);
    syncConsent();
    return block;
  }

  function buildCheckboxField(definition, key, inputId) {
    const wrapper = element('div', 'field dynamic-confirmation');
    const label = element('label', 'permission');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = inputId;
    input.name = `feedback_${key}`;
    input.required = Boolean(definition.required);
    applyFeedbackMetadata(input, definition, key);
    label.append(input, element('span', '', definition.label));
    wrapper.append(label);
    return wrapper;
  }

  function applyFeedbackMetadata(input, definition, key) {
    input.dataset.feedbackKey = key;
    input.dataset.feedbackLabel = String(definition.label);
    input.dataset.feedbackType = definition.type;
  }

  function collectAnswers(photoPath) {
    const responses = Array.from(form.querySelectorAll('[data-feedback-key]')).map(input => {
      let answer;
      if (input.dataset.feedbackType === 'photo') answer = photoPath;
      else if (input.dataset.feedbackType === 'checkbox') answer = input.checked;
      else answer = String(input.value || '').trim();

      return {
        key: input.dataset.feedbackKey,
        question: input.dataset.feedbackLabel,
        type: input.dataset.feedbackType,
        answer
      };
    });

    const photoRightsConfirmed = Boolean(form.querySelector('[name="photoRightsConfirmation"]')?.checked);
    return {
      version: 1,
      mission_code: mission.code,
      photo_rights_confirmed: photoRightsConfirmed,
      photo_rights_confirmed_at: photoRightsConfirmed ? new Date().toISOString() : null,
      responses
    };
  }

  async function uploadPhoto(userId) {
    const input = form.querySelector('[data-feedback-photo]');
    const file = input && input.files ? input.files[0] : null;
    if (!file) return null;
    const rightsConfirmation = form.querySelector('[name="photoRightsConfirmation"]');
    if (!rightsConfirmation || !rightsConfirmation.checked) {
      throw new Error('Confirma que tienes derecho a utilizar la fotografía antes de enviarla.');
    }
    if (file.size > 4 * 1024 * 1024) throw new Error('La fotografía supera el máximo de 4 MB.');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('La fotografía debe ser JPG, PNG o WebP.');

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniquePart = window.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const path = `${userId}/${uniquePart}-${safeName}`;
    const { error } = await client.storage.from('mission-photos').upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error('No hemos podido guardar la fotografía. Prueba de nuevo sin ella.');
    return path;
  }

  function renderMission(currentMission) {
    const summary = missionSummary;
    summary.hidden = false;
    summary.replaceChildren();
    const label = document.createElement('span');
    label.textContent = `MISIÓN ${missionNumber(currentMission)} · ${currentMission.category} · ${currentMission.difficulty || 'Dificultad sin indicar'}`;
    const title = document.createElement('strong');
    title.textContent = `${currentMission.title} · +${Number(currentMission.xp || 0)} XP`;
    summary.append(label, title);
    const conditions = Array.isArray(currentMission.conditions) ? currentMission.conditions.filter(Boolean) : [];
    if (conditions.length) {
      const list = element('ul', 'selected-conditions');
      conditions.forEach(condition => list.append(element('li', '', String(condition))));
      summary.append(list);
    }
    button.textContent = `Completar misión · +${Number(currentMission.xp || 0)} XP`;
  }

  function missionNumber(currentMission) {
    if (Number.isInteger(currentMission.sort_order) && currentMission.sort_order > 0) {
      return String(currentMission.sort_order).padStart(2, '0');
    }
    const match = String(currentMission.code || '').match(/^M(\d+)/);
    return match ? match[1].padStart(2, '0') : '—';
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function value(data, key) {
    return String(data.get(key) || '').trim();
  }

  function sanitize(input, maxLength) {
    return String(input || '').replace(/[^0-9A-Za-z_-]/g, '').slice(0, maxLength);
  }

  function sanitizeFieldKey(input, index) {
    return String(input || `q${index + 1}`).replace(/[^0-9A-Za-z_-]/g, '').slice(0, 80) || `q${index + 1}`;
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
    if (error && error.code === '23505') return 'Falta activar en la base de datos la actualización que permite repetir misiones.';
    if (error && /answers|schema cache/i.test(error.message || '')) return 'Falta activar la actualización del formulario en la base de datos.';
    return error && error.message ? error.message : 'No se pudo guardar la misión. Inténtalo de nuevo.';
  }
})();
