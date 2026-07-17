(() => {
  const ENDPOINT = 'https://script.google.com/macros/s/AKfycby_uHy8FF71KaX9waQPbDNbf55BR8CH-EY0QwvGvdLteSwS34I3gJIsohfAQg2ZB1QpSg/exec';
  const params = new URLSearchParams(location.search);
  const explorer = (params.get('explorer') || '').replace(/[^0-9A-Za-z_-]/g, '');
  const form = document.querySelector('#mission-proposal-form');
  const explorerField = document.querySelector('#proposal-explorer-field');
  const explorerInput = document.querySelector('#proposalExplorerId');
  const signup = document.querySelector('#proposal-signup');
  const status = document.querySelector('#proposal-status');
  document.querySelector('#proposalSource').value = params.get('source') || 'direct';
  document.querySelector('#proposalExplorerFromUrl').value = explorer;
  document.querySelector('#proposalPageUrl').value = location.href;

  if (explorer) {
    form.querySelector('input[name="hasExplorer"][value="Sí"]').checked = true;
    explorerInput.value = explorer; explorerField.hidden = false; explorerInput.required = true;
  }
  form.querySelectorAll('input[name="hasExplorer"]').forEach(radio => radio.addEventListener('change', () => {
    const hasId = radio.value === 'Sí'; explorerField.hidden = !hasId; signup.hidden = hasId; explorerInput.required = hasId;
    if (!hasId) explorerInput.value = '';
  }));
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (!form.reportValidity()) return;
    const button = form.querySelector('.submit-button'); button.disabled = true; button.textContent = 'Enviando…'; status.textContent = '';
    try {
      await fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(new FormData(form)) });
      form.hidden = true; document.querySelector('#proposal-success').hidden = false;
      window.scrollTo({ top: document.querySelector('.form-shell').offsetTop - 100, behavior: 'smooth' });
    } catch (error) {
      status.textContent = 'No se pudo enviar la propuesta. Inténtalo de nuevo.'; button.disabled = false; button.textContent = 'Enviar propuesta';
    }
  });
})();
