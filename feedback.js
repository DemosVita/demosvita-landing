(() => {
  'use strict';

  const client = window.demosVitaSupabase;
  const params = new URLSearchParams(location.search);
  const missionCode = sanitize(params.get('mission') || 'M01_HALAGO_HONESTO', 80);
  const source = sanitize(params.get('source') || 'app', 80);
  const form = document.querySelector('#mission-feedback-form');
  const status = document.querySelector('#form-status');
  const button = form.querySelector('.submit-button');
  const fieldsContainer = document.querySelector('#dynamic-feedback-fields');
  const fieldsHelp = document.querySelector('#dynamic-fields-help');
  button.disabled = true;

  let session;
  let mission;
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
        loadMission()
      ]);

      if (profileResult.error) throw profileResult.error;
      if (missionResult.error) throw new Error('No hemos encontrado la misión que quieres reportar.');

      mission = missionResult.data;
      feedbackSchema = normalizeSchema(mission);
      if (!feedbackSchema.length) throw new Error('Esta misión todavía no tiene configuradas sus preguntas de feedback.');

      document.querySelector('#report-profile-name').textContent = `Explorador #${profileResult.data.explorer_number} · ${capitalize(profileResult.data.archetype || 'explorador')}`;
      document.querySelector('#report-profile-email').textContent = profileResult.data.email;
      renderMission(mission);
      renderDynamicFields(feedbackSchema);
      button.disabled = false;
    } catch (error) {
      showError(error.message || 'No hemos podido preparar el formulario. Recarga la página.');
      fieldsHelp.textContent = 'No se pudieron cargar las preguntas de esta misión.';
      button.disabled = true;
      console.error(error);
    }
  }

  async function loadMission() {
    let result = await client
      .from('missions')
      .select('id,code,title,category,xp,feedback_schema,feedback_questions')
      .eq('code', missionCode)
      .eq('is_active', true)
      .single();

    if (result.error && /feedback_schema/i.test(result.error.message || '')) {
      result = await client
        .from('missions')
        .select('id,code,title,category,xp,feedback_questions')
        .eq('code', missionCode)
        .eq('is_active', true)
        .single();
    }
    return result;
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
      const answers = collectAnswers(photoPath);
      const { error } = await client.from('mission_reports').insert({
        user_id: session.user.id,
        mission_id: mission.id,
        source,
        answers,
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

    return {
      version: 1,
      mission_code: mission.code,
      responses
    };
  }

  async function uploadPhoto(userId) {
    const input = form.querySelector('[data-feedback-photo]');
    const file = input && input.files ? input.files[0] : null;
    if (!file) return null;
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
    const summary = document.querySelector('#mission-summary');
    summary.replaceChildren();
    const label = document.createElement('span');
    label.textContent = `MISIÓN SELECCIONADA · ${currentMission.category}`;
    const title = document.createElement('strong');
    title.textContent = `${currentMission.title} · +${Number(currentMission.xp || 0)} XP`;
    summary.append(label, title);
    button.textContent = `Completar misión · +${Number(currentMission.xp || 0)} XP`;
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
    if (error && error.code === '23505') return 'Esta misión ya figura como completada en tu histórico.';
    if (error && /answers|schema cache/i.test(error.message || '')) return 'Falta activar la actualización del formulario en la base de datos.';
    return error && error.message ? error.message : 'No se pudo guardar la misión. Inténtalo de nuevo.';
  }
})();
