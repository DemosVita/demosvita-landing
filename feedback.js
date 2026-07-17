(() => {
  // Pega aquí la URL /exec del Apps Script de feedback cuando esté desplegado.
  const FEEDBACK_ENDPOINT = 'https://script.google.com/macros/s/AKfycby_uHy8FF71KaX9waQPbDNbf55BR8CH-EY0QwvGvdLteSwS34I3gJIsohfAQg2ZB1QpSg/exec';
  const missions = {
    M01_HALAGO_HONESTO: { name: 'El halago honesto', category: 'Conecta', xp: 150 },
    IDEA: { name: 'Propuesta de nueva misión', category: 'Comunidad', xp: 0 }
  };
  const params = new URLSearchParams(location.search);
  const missionId = params.get('mission') || 'M01_HALAGO_HONESTO';
  const source = params.get('source') || 'direct';
  const explorer = (params.get('explorer') || '').replace(/[^0-9A-Za-z_-]/g, '');
  const mission = missions[missionId] || missions.M01_HALAGO_HONESTO;
  const form = document.querySelector('#mission-feedback-form');
  const status = document.querySelector('#form-status');
  const explorerField = document.querySelector('#explorer-field');
  const invitation = document.querySelector('#signup-invitation');
  const explorerInput = document.querySelector('#explorerId');

  document.querySelector('#missionId').value = missionId;
  document.querySelector('#source').value = source;
  document.querySelector('#explorerFromUrl').value = explorer;
  document.querySelector('#pageUrl').value = location.href;
  document.querySelector('#mission-summary').innerHTML = `<span>MISIÓN SELECCIONADA · ${mission.category}</span><strong>${mission.name}${mission.xp ? ` · +${mission.xp} XP` : ''}</strong>`;
  document.querySelector('.submit-button').textContent = mission.xp ? `Completar misión · +${mission.xp} XP` : 'Enviar propuesta';

  if (explorer) {
    form.querySelector('input[name="hasExplorer"][value="Sí"]').checked = true;
    explorerInput.value = explorer;
    explorerField.hidden = false;
    explorerInput.required = true;
  }

  form.querySelectorAll('input[name="hasExplorer"]').forEach(radio => radio.addEventListener('change', () => {
    const hasId = radio.value === 'Sí';
    explorerField.hidden = !hasId;
    invitation.hidden = hasId;
    explorerInput.required = hasId;
    if (!hasId) explorerInput.value = '';
  }));

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (FEEDBACK_ENDPOINT.startsWith('PON_AQUI')) {
      status.textContent = 'Falta conectar el formulario con la hoja de respuestas.';
      return;
    }
    const button = form.querySelector('.submit-button');
    button.disabled = true;
    button.textContent = 'Enviando…';
    status.textContent = '';
    try {
      await preparePhoto_();
      const data = new URLSearchParams(new FormData(form));
      await fetch(FEEDBACK_ENDPOINT, { method: 'POST', mode: 'no-cors', body: data });
      form.hidden = true;
      document.querySelector('#success-screen').hidden = false;
      window.scrollTo({ top: document.querySelector('.form-shell').offsetTop - 100, behavior: 'smooth' });
    } catch (error) {
      status.textContent = error.message || 'No se pudo enviar. Inténtalo de nuevo.';
      button.disabled = false;
      button.textContent = mission.xp ? `Completar misión · +${mission.xp} XP` : 'Enviar propuesta';
    }
  });

  async function preparePhoto_() {
    const file = document.querySelector('#photo').files[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) throw new Error('La fotografía supera el máximo de 4 MB.');
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file);
    });
    document.querySelector('#photoBase64').value = String(dataUrl).split(',')[1];
    document.querySelector('#photoName').value = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  }
})();
