(() => {
  'use strict';

  const client = window.demosVitaSupabase;
  const emailStep = document.querySelector('#email-step');
  const registrationStep = document.querySelector('#registration-step');
  const codeStep = document.querySelector('#code-step');
  const emailForm = document.querySelector('#email-form');
  const registrationForm = document.querySelector('#registration-form');
  const codeForm = document.querySelector('#code-form');
  const emailInput = document.querySelector('#access-email');
  const registrationEmail = document.querySelector('#registration-email');
  const registrationArchetype = document.querySelector('#registration-archetype');
  const codeInput = document.querySelector('#access-code');
  const sentEmail = document.querySelector('#sent-email');
  const status = document.querySelector('#access-status');
  const changeEmail = document.querySelector('#change-email');
  const resendCode = document.querySelector('#resend-code');
  const openRegistration = document.querySelector('#open-registration');
  const backToLogin = document.querySelector('#back-to-login');
  const registerFromCode = document.querySelector('#register-from-code');
  const codeRegistrationInvitation = document.querySelector('#code-registration-invitation');
  const params = new URLSearchParams(location.search);

  let activeEmail = sessionStorage.getItem('demosvita-auth-email') || '';
  let authMode = sessionStorage.getItem('demosvita-auth-mode') || 'login';
  let activeArchetype = sessionStorage.getItem('demosvita-auth-archetype') || '';

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
    activeArchetype = '';
    authMode = 'login';
    const button = emailForm.querySelector('button');
    setBusy(button, true, 'Comprobando…');
    showStatus('');

    try {
      const accountStatus = await getEmailAccountStatus(activeEmail);
      if (accountStatus === 'unregistered' || accountStatus === 'invalid') {
        setBusy(button, false, 'Recibir mi código');
        showStatus('Este correo no está registrado. Regístrate para conseguir tu número de Explorador.', true);
        return;
      }
      // Una cuenta activa inicia sesión. Un fundador pendiente crea por primera
      // vez su usuario Auth y el trigger conserva su número histórico.
      await sendCode(activeEmail, button, accountStatus === 'founder_pending');
    } catch (error) {
      setBusy(button, false, 'Recibir mi código');
      showStatus('No hemos podido comprobar el correo. Inténtalo de nuevo.', true);
      console.error(error);
    }
  });

  registrationForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!registrationForm.reportValidity()) return;
    activeEmail = registrationEmail.value.trim().toLowerCase();
    activeArchetype = registrationArchetype.value;
    authMode = 'register';
    await sendCode(activeEmail, registrationForm.querySelector('button'), true, activeArchetype);
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

    clearPendingAuth();
    showStatus('Acceso correcto. Preparando tu cuenta…');
    location.replace(getReturnUrl());
  });

  changeEmail.addEventListener('click', () => {
    clearPendingAuth();
    activeEmail = '';
    activeArchetype = '';
    authMode = 'login';
    codeInput.value = '';
    codeStep.hidden = true;
    registrationStep.hidden = true;
    emailStep.hidden = false;
    showStatus('');
    emailInput.focus();
  });

  resendCode.addEventListener('click', async () => {
    await sendCode(activeEmail, resendCode, authMode === 'register', activeArchetype);
  });

  openRegistration.addEventListener('click', () => showRegistrationStep(emailInput.value));
  registerFromCode.addEventListener('click', () => showRegistrationStep(activeEmail));
  backToLogin.addEventListener('click', () => {
    registrationStep.hidden = true;
    codeStep.hidden = true;
    emailStep.hidden = false;
    emailInput.value = registrationEmail.value;
    showStatus('');
    emailInput.focus();
  });

  async function sendCode(email, button, shouldCreateUser, archetype = '') {
    if (!email) return;
    setBusy(button, true, 'Enviando…');
    showStatus('');

    const options = { shouldCreateUser };
    if (shouldCreateUser) options.data = { archetype };

    const { error } = await client.auth.signInWithOtp({ email, options });

    if (error) {
      setBusy(button, false, buttonLabel(button, shouldCreateUser));
      showStatus(humanizeError(error, shouldCreateUser), true);
      return;
    }

    authMode = shouldCreateUser ? 'register' : 'login';
    sessionStorage.setItem('demosvita-auth-email', email);
    sessionStorage.setItem('demosvita-auth-mode', authMode);
    if (archetype) sessionStorage.setItem('demosvita-auth-archetype', archetype);
    setBusy(button, false, buttonLabel(button, shouldCreateUser));
    showCodeStep(email);
    showStatus(
      shouldCreateUser
        ? 'Cuenta preparada. Revisa tu correo para confirmar el registro.'
        : 'Si el correo tiene una cuenta activa, recibirás un código en unos segundos.'
    );
  }

  async function getEmailAccountStatus(email) {
    const { data, error } = await client.rpc('get_email_account_status', {
      candidate_email: email
    });
    if (error) throw error;
    return data;
  }

  function showCodeStep(email) {
    emailStep.hidden = true;
    registrationStep.hidden = true;
    codeStep.hidden = false;
    codeRegistrationInvitation.hidden = authMode === 'register';
    sentEmail.textContent = email;
    setTimeout(() => codeInput.focus(), 50);
  }

  function showRegistrationStep(email = '') {
    authMode = 'register';
    emailStep.hidden = true;
    codeStep.hidden = true;
    registrationStep.hidden = false;
    registrationEmail.value = String(email || activeEmail || '').trim().toLowerCase();
    showStatus('');
    (registrationEmail.value ? registrationArchetype : registrationEmail).focus();
  }

  function clearPendingAuth() {
    sessionStorage.removeItem('demosvita-auth-email');
    sessionStorage.removeItem('demosvita-auth-mode');
    sessionStorage.removeItem('demosvita-auth-archetype');
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

  function buttonLabel(button, shouldCreateUser) {
    if (button === resendCode) return 'Reenviar código';
    return shouldCreateUser ? 'Crear mi cuenta' : 'Recibir mi código';
  }

  function setBusy(button, busy, label) {
    button.disabled = busy;
    button.textContent = label;
  }

  function showStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle('is-error', isError);
  }

  function humanizeError(error, isRegistration) {
    const message = String(error.message || '').toLowerCase();
    if (message.includes('rate')) {
      return 'Has pedido varios códigos seguidos. Espera un minuto y vuelve a intentarlo.';
    }
    if (isRegistration && (message.includes('already') || message.includes('registered'))) {
      return 'Ese correo ya tiene una cuenta. Vuelve atrás y entra con tu código.';
    }
    return isRegistration
      ? 'No hemos podido crear la cuenta. Revisa los datos e inténtalo de nuevo.'
      : 'No existe una cuenta activa con ese correo. Regístrate para conseguir tu número.';
  }
})();
