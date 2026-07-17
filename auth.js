(() => {
  'use strict';

  const client = window.demosVitaSupabase;
  const emailStep = document.querySelector('#email-step');
  const codeStep = document.querySelector('#code-step');
  const emailForm = document.querySelector('#email-form');
  const codeForm = document.querySelector('#code-form');
  const emailInput = document.querySelector('#access-email');
  const codeInput = document.querySelector('#access-code');
  const sentEmail = document.querySelector('#sent-email');
  const status = document.querySelector('#access-status');
  const changeEmail = document.querySelector('#change-email');
  const resendCode = document.querySelector('#resend-code');
  const params = new URLSearchParams(location.search);
  let activeEmail = sessionStorage.getItem('demosvita-auth-email') || '';

  init();

  async function init() {
    const { data } = await client.auth.getSession();
    if (data.session) {
      location.replace(getReturnUrl());
      return;
    }
    if (activeEmail) showCodeStep(activeEmail);
  }

  emailForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!emailForm.reportValidity()) return;
    activeEmail = emailInput.value.trim().toLowerCase();
    await sendCode(activeEmail, emailForm.querySelector('button'));
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
    const { error } = await client.auth.verifyOtp({
      email: activeEmail,
      token,
      type: 'email'
    });

    if (error) {
      setBusy(button, false, 'Entrar en mi cuenta');
      showStatus('El código no es válido o ha caducado. Pide uno nuevo.', true);
      return;
    }

    sessionStorage.removeItem('demosvita-auth-email');
    showStatus('Acceso correcto. Preparando tu cuenta…');
    location.replace(getReturnUrl());
  });

  changeEmail.addEventListener('click', () => {
    activeEmail = '';
    sessionStorage.removeItem('demosvita-auth-email');
    codeInput.value = '';
    codeStep.hidden = true;
    emailStep.hidden = false;
    showStatus('');
    emailInput.focus();
  });

  resendCode.addEventListener('click', async () => {
    await sendCode(activeEmail, resendCode);
  });

  async function sendCode(email, button) {
    if (!email) return;
    setBusy(button, true, 'Enviando…');
    showStatus('');

    const { error } = await client.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true }
    });

    if (error) {
      setBusy(button, false, button === resendCode ? 'Reenviar código' : 'Recibir mi código');
      showStatus(humanizeError(error), true);
      return;
    }

    sessionStorage.setItem('demosvita-auth-email', email);
    setBusy(button, false, button === resendCode ? 'Reenviar código' : 'Recibir mi código');
    showCodeStep(email);
    showStatus(button === resendCode ? 'Te hemos enviado un código nuevo.' : 'Código enviado. Puede tardar unos segundos.');
  }

  function showCodeStep(email) {
    emailStep.hidden = true;
    codeStep.hidden = false;
    sentEmail.textContent = email;
    setTimeout(() => codeInput.focus(), 50);
  }

  function getReturnUrl() {
    const requested = params.get('returnTo') || 'cuenta.html';
    try {
      const target = new URL(requested, location.href);
      return target.origin === location.origin ? target.href : new URL('cuenta.html', location.href).href;
    } catch (_) {
      return new URL('cuenta.html', location.href).href;
    }
  }

  function setBusy(button, busy, label) {
    button.disabled = busy;
    button.textContent = label;
  }

  function showStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle('is-error', isError);
  }

  function humanizeError(error) {
    if (String(error.message).toLowerCase().includes('rate')) {
      return 'Has pedido varios códigos seguidos. Espera un minuto y vuelve a intentarlo.';
    }
    return 'No hemos podido enviar el código. Revisa el correo e inténtalo de nuevo.';
  }
})();
