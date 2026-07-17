/** Proyecto de Apps Script independiente para el feedback de misiones. */
const FEEDBACK_CONFIG = Object.freeze({
  // Copia el identificador situado entre /d/ y /edit en la URL de Google Sheets.
  spreadsheetId: 'PON_AQUI_ID_GOOGLE_SHEET',
  sheetName: 'Feedback misiones',
  proposalSheetName: 'Propuestas misiones',
  photoFolderName: 'DemosVita - Fotos feedback'
});

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const p = (e && e.parameter) || {};
    if (p.action === 'missionProposal') return saveMissionProposal_(p);
    if (p.action !== 'missionFeedback') return jsonFeedback_({ ok: false, error: 'Acción no válida' });
    const sheet = getFeedbackSheet_();
    const photoUrl = p.photoBase64 ? saveFeedbackPhoto_(p.photoBase64, p.photoName, p.missionId, p.explorerId || p.explorerFromUrl) : '';
    sheet.appendRow([
      new Date(), cleanFeedback_(p.missionId), cleanFeedback_(p.source), cleanFeedback_(p.explorerId || p.explorerFromUrl),
      cleanFeedback_(p.hasExplorer), cleanFeedback_(p.place), cleanFeedback_(p.words), cleanFeedback_(p.reaction),
      cleanFeedback_(p.difficulty), cleanFeedback_(p.duration), cleanFeedback_(p.before), cleanFeedback_(p.after),
      photoUrl, cleanFeedback_(p.improvements), cleanFeedback_(p.ideas), cleanFeedback_(p.sharePermission || 'No'),
      cleanFeedback_(p.pageUrl)
    ]);
    return jsonFeedback_({ ok: true });
  } catch (error) {
    return jsonFeedback_({ ok: false, error: String(error.message || error) });
  } finally {
    lock.releaseLock();
  }
}

function saveMissionProposal_(p) {
  const sheet = getProposalSheet_();
  sheet.appendRow([
    new Date(), cleanFeedback_(p.source), cleanFeedback_(p.explorerId || p.explorerFromUrl), cleanFeedback_(p.hasExplorer),
    cleanFeedback_(p.email), cleanFeedback_(p.title), cleanFeedback_(p.category), cleanFeedback_(p.actionDescription),
    cleanFeedback_(p.purpose), cleanFeedback_(p.conditions), cleanFeedback_(p.difficulty), cleanFeedback_(p.duration),
    cleanFeedback_(p.why), cleanFeedback_(p.contactPermission || 'No'), cleanFeedback_(p.pageUrl), 'PENDIENTE'
  ]);
  return jsonFeedback_({ ok: true, type: 'missionProposal' });
}

function getFeedbackSheet_() {
  if (!FEEDBACK_CONFIG.spreadsheetId || FEEDBACK_CONFIG.spreadsheetId === 'PON_AQUI_ID_GOOGLE_SHEET') {
    throw new Error('Falta configurar spreadsheetId con el identificador de Google Sheets.');
  }
  const ss = SpreadsheetApp.openById(FEEDBACK_CONFIG.spreadsheetId);
  let sheet = ss.getSheetByName(FEEDBACK_CONFIG.sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(FEEDBACK_CONFIG.sheetName);
    sheet.appendRow(['Fecha','Misión','Origen','ID explorador','Tiene ID','Lugar','Qué dijo','Reacción','Dificultad percibida','Duración','Antes','Después','Foto','Mejoras','Ideas','Permiso anónimo','URL de entrada']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getProposalSheet_() {
  if (!FEEDBACK_CONFIG.spreadsheetId || FEEDBACK_CONFIG.spreadsheetId === 'PON_AQUI_ID_GOOGLE_SHEET') {
    throw new Error('Falta configurar spreadsheetId con el identificador de Google Sheets.');
  }
  const ss = SpreadsheetApp.openById(FEEDBACK_CONFIG.spreadsheetId);
  let sheet = ss.getSheetByName(FEEDBACK_CONFIG.proposalSheetName);
  if (!sheet) {
    sheet = ss.insertSheet(FEEDBACK_CONFIG.proposalSheetName);
    sheet.appendRow(['Fecha','Origen','ID explorador','Tiene ID','Email','Título','Categoría','Acción propuesta','Objetivo','Condiciones','Dificultad','Duración','Por qué debe existir','Permiso de contacto','URL de entrada','Estado']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function saveFeedbackPhoto_(base64, originalName, missionId, explorerId) {
  const folders = DriveApp.getFoldersByName(FEEDBACK_CONFIG.photoFolderName);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(FEEDBACK_CONFIG.photoFolderName);
  const safeName = [missionId || 'mision', explorerId || 'anonimo', Date.now(), originalName || 'foto.jpg'].join('_').replace(/[^a-zA-Z0-9._-]/g, '_');
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), 'application/octet-stream', safeName);
  return folder.createFile(blob).getUrl();
}

function cleanFeedback_(value) {
  return String(value == null ? '' : value).trim().slice(0, 10000);
}

function jsonFeedback_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

/** Ejecuta esta función manualmente para preparar y comprobar la hoja. */
function probarConexionConSheet() {
  const sheet = getFeedbackSheet_();
  const proposalSheet = getProposalSheet_();
  console.log('Conexión correcta con: ' + sheet.getParent().getName());
  console.log('Pestaña preparada: ' + sheet.getName());
  console.log('Pestaña preparada: ' + proposalSheet.getName());
}
