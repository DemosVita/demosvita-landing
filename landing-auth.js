(() => {
  'use strict';

  const client = window.demosVitaSupabase;
  const registrationStep = document.querySelector('#landing-registration-step');
  const codeStep = document.querySelector('#landing-code-step');
  const activeSessionStep = document.querySelector('#landing-session-step');
  const registrationForm = document.querySelector('#landing-registration-form');
  const codeForm = document.querySelector('#landing-code-form');
  const emailInput = document.querySelector('#landing-registration-email');
  const archetypeInput = document.querySelector('#landing-registration-archetype');
  const codeInput = document.querySelector('#landing-access-code');
  const sentEmail = document.querySelector('#landing-sent-email');
  const status = document.querySelector('#landing-auth-status');
  const changeEmail = document.querySelector('#landing-change-email');
  const resendCode = document.querySelector('#landing-resend-code');

  let activeEmail = sessionStorage.getItem('demosvita-landing-email') || '';
  let activeArchetype = sessionStorage.getItem('demosvita-landing-archetype') || '';

  init();

  async function init() {
    const { data } = await client.auth.getSession();
    if (data.session) {
      registrationStep.hidden = true;
      codeStep.hidden = true;
      activeSessionStep.hidden = false;
      return;
    }
    if (activeEmail) showCodeStep();
  }

  registrationForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!registrationForm.reportValidity()) return;
    activeEmail = emailInput.value.trim().toLowerCase();
    activeArchetype = archetypeInput.value;
    await sendCode(registrationForm.querySelector('button'));
  });

  codeForm.addEventListener('submit', async event => {
    event.preventDefault();
    const token = codeInput.value.replace(/\D/g, '');
    codeInput.value = token;
    if (token.length < 6 || token.length > 10) {
      showStatus('Introduce el código completo que aparece en el correo.', true);
      return;
    }

    const button = codeForm.querySelector('button');
    setBusy(button, true, 'Comprobando…');
    showStatus('');

    const { error } = await client.auth.verifyOtp({ email: activeEmail, token, type: 'email' });
    if (error) {
      setBusy(button, false, 'Confirmar y entrar');
      showStatus('El código no es válido o ha caducado. Pide uno nuevo.', true);
      return;
    }

    const { error: profileError } = await client.rpc('ensure_my_profile', {
      chosen_archetype: activeArchetype || null
    });
    if (profileError) {
      await client.auth.signOut();
      setBusy(button, false, 'Confirmar y entrar');
      showStatus('El correo se ha verificado, pero no hemos podido crear tu perfil. Vuelve a intentarlo.', true);
      console.error(profileError);
      return;
    }

    clearPending();
    showStatus('Cuenta preparada. Entrando en tu aventura…');
    location.href = '/cuenta.html';
  });

  changeEmail.addEventListener('click', () => {
    clearPending();
    activeEmail = '';
    activeArchetype = '';
    codeInput.value = '';
    codeStep.hidden = true;
    registrationStep.hidden = false;
    showStatus('');
    emailInput.focus();
  });

  resendCode.addEventListener('click', () => sendCode(resendCode));

  async function sendCode(button) {
    setBusy(button, true, 'Enviando…');
    showStatus('');

    const campaign = campaignData();
    const { error } = await client.auth.signInWithOtp({
      email: activeEmail,
      options: {
        shouldCreateUser: true,
        data: { archetype: activeArchetype, ...campaign }
      }
    });

    if (error) {
      setBusy(button, false, button === resendCode ? 'Reenviar código' : 'Crear mi cuenta');
      const rateLimited = String(error.message || '').toLowerCase().includes('rate');
      showStatus(rateLimited ? 'Has pedido varios códigos seguidos. Espera un minuto.' : 'No hemos podido enviar el código. Revisa el correo e inténtalo de nuevo.', true);
      return;
    }

    sessionStorage.setItem('demosvita-landing-email', activeEmail);
    sessionStorage.setItem('demosvita-landing-archetype', activeArchetype);
    setBusy(button, false, button === resendCode ? 'Reenviar código' : 'Crear mi cuenta');
    showCodeStep();
    showStatus('Revisa tu correo: te hemos enviado un código de acceso.');
  }

  function showCodeStep() {
    registrationStep.hidden = true;
    activeSessionStep.hidden = true;
    codeStep.hidden = false;
    sentEmail.textContent = activeEmail;
    setTimeout(() => codeInput.focus(), 50);
  }

  function campaignData() {
    const params = new URLSearchParams(location.search);
    return {
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      utm_content: params.get('utm_content') || ''
    };
  }

  function clearPending() {
    sessionStorage.removeItem('demosvita-landing-email');
    sessionStorage.removeItem('demosvita-landing-archetype');
  }

  function setBusy(button, busy, label) {
    button.disabled = busy;
    button.textContent = label;
  }

  function showStatus(message, isError = false) {
    status.textContent = message;
    status.style.color = isError ? '#a32620' : '#234E3B';
  }
})();
