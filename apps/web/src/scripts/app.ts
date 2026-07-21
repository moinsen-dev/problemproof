type QueryScope = {
  querySelector(selector: string): unknown;
  querySelectorAll(selector: string): ArrayLike<unknown>;
};

const $ = <T>(selector: string, scope: QueryScope = document as QueryScope) => scope.querySelector(selector) as T | null;
const $$ = <T>(selector: string, scope: QueryScope = document as QueryScope) => Array.from(scope.querySelectorAll(selector)) as T[];

const participantKey = 'problemproof-participant-id';
function getParticipantId() {
  let participantId = localStorage.getItem(participantKey);
  if (!participantId) {
    participantId = crypto.randomUUID();
    localStorage.setItem(participantKey, participantId);
  }
  return participantId;
}

const publishDialog = $('#publish-dialog') as HTMLDialogElement | null;
const evidenceDialog = $('#evidence-dialog') as HTMLDialogElement | null;
const publishForm = $('#publish-form') as HTMLFormElement | null;
const evidenceForm = $('#evidence-form') as HTMLFormElement | null;
const toast = $('.toast') as HTMLElement | null;

function showToast(message: string) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  window.setTimeout(() => toast.classList.remove('visible'), 3200);
}

function formData(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
}

function setPending(form: HTMLFormElement, pending: boolean) {
  const submit = $('button[type="submit"]', form) as HTMLButtonElement;
  submit.disabled = pending;
  submit.dataset.label ??= submit.textContent ?? '';
  submit.textContent = pending ? 'Wird gespeichert …' : submit.dataset.label;
}

function setFormMessage(form: HTMLFormElement, response: Record<string, unknown>) {
  const message = $('.form-message', form) as HTMLElement;
  const errors = Array.isArray(response.errors) ? response.errors.join(' ') : response.error;
  message.textContent = typeof errors === 'string' ? errors : 'Das hat noch nicht funktioniert. Bitte versuche es erneut.';
}

async function post(url: string, payload: Record<string, unknown>) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json() as Record<string, unknown>;
  if (!response.ok) throw Object.assign(new Error('REQUEST_FAILED'), { data });
  return data;
}

async function trackProblemEvent(problemId: string, eventType: 'view' | 'share', source = '') {
  try {
    await fetch(`/api/problems/${problemId}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ eventType, source }),
      keepalive: true,
    });
  } catch {
    // Tracking must never block the validation flow.
  }
}

function authMessage(error: unknown) {
  const data = (error as { data?: Record<string, unknown> }).data ?? {};
  if (data.error === 'Bitte melde dich mit GitHub an.') return 'Bitte melde dich mit GitHub an.';
  return '';
}

$$<HTMLElement>('[data-open-publish]').forEach((button) => button.addEventListener('click', () => publishDialog?.showModal()));
$$<HTMLElement>('[data-close]').forEach((button) => button.addEventListener('click', () => (button.closest('dialog') as HTMLDialogElement).close()));
$$<HTMLDialogElement>('dialog').forEach((dialog) => dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
}));

if (publishForm && publishDialog) {
  const statement = $('textarea[name="statement"]', publishForm) as HTMLTextAreaElement;
  const count = $('#statement-count') as HTMLOutputElement;
  const solutionWarning = $('.solution-warning', publishForm) as HTMLElement;
  statement.addEventListener('input', () => {
    count.textContent = String(statement.value.length);
    const solutionTerms = /\b(app|software|plattform|dashboard|tool|ki|künstliche intelligenz|automatisierung)\b/i;
    solutionWarning.hidden = !solutionTerms.test(statement.value);
  });

  publishForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setPending(publishForm, true);
    ($('.form-message', publishForm) as HTMLElement).textContent = '';
    try {
      const values = formData(publishForm);
      await post('/api/problems', { ...values, participantId: getParticipantId() });
      publishDialog.close();
      showToast('Problem veröffentlicht. Jetzt braucht es echte Vorfälle.');
      window.setTimeout(() => window.location.reload(), 650);
    } catch (error) {
      const message = authMessage(error);
      if (message) showToast(message);
      setFormMessage(publishForm, (error as { data?: Record<string, unknown> }).data ?? {});
    } finally {
      setPending(publishForm, false);
    }
  });
}

if (evidenceForm && evidenceDialog) {
  const severity = $('input[name="severity"]', evidenceForm) as HTMLInputElement;
  const severityOutput = $('.severity-labels output', evidenceForm) as HTMLOutputElement;
  severity.addEventListener('input', () => { severityOutput.textContent = severity.value; });

  evidenceForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setPending(evidenceForm, true);
    ($('.form-message', evidenceForm) as HTMLElement).textContent = '';
    try {
      const values = formData(evidenceForm);
      const problemId = values.problemId;
      const result = await post(`/api/problems/${problemId}/evidence`, {
        ...values,
        severity: Number(values.severity),
        ownExperience: new FormData(evidenceForm).has('ownExperience'),
        participantId: getParticipantId(),
      });
      const card = $<HTMLElement>(`.problem[data-problem-id="${problemId}"]`);
      const incidents = card && $<HTMLElement>('[data-count="incidents"]', card);
      const confirmations = card && $<HTMLElement>('[data-count="confirmations"]', card);
      if (incidents && typeof result.incidents === 'number') incidents.textContent = String(result.incidents);
      if (confirmations && typeof result.confirmations === 'number') confirmations.textContent = String(result.confirmations);
      const notMyProblem = card && $<HTMLElement>('[data-count="not-my-problem"]', card);
      if (notMyProblem && typeof result.notMyProblem === 'number') notMyProblem.textContent = String(result.notMyProblem);
      evidenceDialog.close();
      evidenceForm.reset();
      severityOutput.textContent = '3';
      showToast('Dein Vorfall wurde gespeichert.');
      window.setTimeout(() => window.location.reload(), 650);
    } catch (error) {
      const message = authMessage(error);
      if (message) showToast(message);
      setFormMessage(evidenceForm, (error as { data?: Record<string, unknown> }).data ?? {});
    } finally {
      setPending(evidenceForm, false);
    }
  });
}

$$<HTMLElement>('[data-action="evidence"]').forEach((button) => button.addEventListener('click', () => {
  if (!evidenceForm || !evidenceDialog) return;
  const card = button.closest<HTMLElement>('.problem');
  const problemInput = $('input[name="problemId"]', evidenceForm) as HTMLInputElement;
  problemInput.value = card?.dataset.problemId ?? '';
  evidenceDialog?.showModal();
}));

$$<HTMLButtonElement>('[data-action="signal"]').forEach((button) => button.addEventListener('click', async () => {
  const card = button.closest<HTMLElement>('.problem');
  const problemId = card?.dataset.problemId;
  if (!problemId || button.disabled) return;
  button.disabled = true;
  try {
    const result = await post(`/api/problems/${problemId}/signal`, { participantId: getParticipantId(), region: '' });
    const target = $<HTMLElement>('[data-count="confirmations"]', button);
    if (target && typeof result.confirmations === 'number') target.textContent = String(result.confirmations);
    button.classList.add('confirmed');
    showToast('Bestätigt – du kennst dieses Problem selbst.');
  } catch {
    button.disabled = false;
    showToast('Bitte melde dich mit GitHub an.');
  }
}));

$$<HTMLButtonElement>('[data-action="favorite"]').forEach((button) => button.addEventListener('click', async () => {
  const card = button.closest<HTMLElement>('.problem');
  const problemId = card?.dataset.problemId;
  if (!problemId || button.disabled) return;
  button.disabled = true;
  const enabled = !button.classList.contains('favorited');
  try {
    await fetch(`/api/problems/${problemId}/favorite`, { method: enabled ? 'POST' : 'DELETE' }).then(async (response) => {
      const data = await response.json() as Record<string, unknown>;
      if (!response.ok) throw Object.assign(new Error('REQUEST_FAILED'), { data });
      return data;
    });
    button.classList.toggle('favorited', enabled);
    const label = $('span', button) as HTMLElement;
    label.textContent = enabled ? 'Gemerkt' : 'Merken';
    showToast(enabled ? 'Problem gemerkt.' : 'Problem aus Favoriten entfernt.');
  } catch {
    showToast('Bitte melde dich mit GitHub an.');
  } finally {
    button.disabled = false;
  }
}));

const proofCards = $$<HTMLElement>('[data-proof-card]');
const proofProgress = $('[data-proof-progress]') as HTMLElement | null;
let proofIndex = proofCards.findIndex((card) => card.classList.contains('active'));
if (proofIndex < 0) proofIndex = 0;

function updateProofProgress() {
  if (!proofProgress || !proofCards.length) return;
  proofProgress.textContent = proofIndex >= proofCards.length ? `Fertig/${proofCards.length}` : `${proofIndex + 1}/${proofCards.length}`;
}

function advanceProof(card: HTMLElement, className: string) {
  card.classList.remove('active');
  card.classList.add(className);
  proofIndex += 1;
  const next = proofCards[proofIndex];
  if (next) {
    next.classList.add('active');
  } else {
    $<HTMLElement>('[data-proof-shell]')?.classList.add('finished');
    showToast('Proof Feed durch. Öffne die Datenbank für weitere Probleme.');
  }
  updateProofProgress();
}

$$<HTMLButtonElement>('[data-action="proof-no"]').forEach((button) => button.addEventListener('click', async () => {
  const card = button.closest<HTMLElement>('[data-proof-card]');
  const problemId = card?.dataset.problemId;
  if (!card || !problemId || button.disabled) return;
  if (button.dataset.localSkip === 'true') {
    advanceProof(card, 'skipped');
    return;
  }
  button.disabled = true;
  try {
    const result = await post(`/api/problems/${problemId}/reaction`, { reaction: 'not_my_problem', source: 'proof-feed' });
    const target = $<HTMLElement>('[data-count="not-my-problem"]', card);
    if (target && typeof result.notMyProblem === 'number') target.textContent = String(result.notMyProblem);
    button.textContent = 'Gezählt';
    showToast('Gezählt – nächstes Problem.');
    window.setTimeout(() => advanceProof(card, 'skipped'), 220);
  } catch (error) {
    button.disabled = false;
    const message = authMessage(error);
    showToast(message || 'Reaktion konnte nicht gespeichert werden.');
  }
}));

$$<HTMLButtonElement>('[data-action="proof-yes"]').forEach((button) => button.addEventListener('click', async () => {
  const card = button.closest<HTMLElement>('[data-proof-card]');
  const problemId = card?.dataset.problemId;
  if (!card || !problemId || button.disabled) return;
  button.disabled = true;
  try {
    const result = await post(`/api/problems/${problemId}/signal`, { participantId: getParticipantId(), region: '' });
    const target = $<HTMLElement>('[data-count="confirmations"]', card);
    const notMyProblem = $<HTMLElement>('[data-count="not-my-problem"]', card);
    if (target && typeof result.confirmations === 'number') target.textContent = String(result.confirmations);
    if (notMyProblem && typeof result.notMyProblem === 'number') notMyProblem.textContent = String(result.notMyProblem);
    button.textContent = 'Bestätigt';
    showToast('Bestätigt – nächstes Problem.');
    window.setTimeout(() => advanceProof(card, 'confirmed-card'), 220);
  } catch (error) {
    button.disabled = false;
    const message = authMessage(error);
    showToast(message || 'Bestätigung konnte nicht gespeichert werden.');
  }
}));

updateProofProgress();

$$<HTMLButtonElement>('[data-action="share"]').forEach((button) => button.addEventListener('click', async () => {
  const card = button.closest<HTMLElement>('.problem');
  const problemId = card?.dataset.problemId;
  const problemPath = card?.dataset.problemUrl ?? window.location.pathname;
  const problemUrl = new URL(problemPath, window.location.origin).toString();
  const titleText = $<HTMLElement>('h2', card ?? document)?.textContent?.trim() ?? 'Problem auf ProblemProof';
  const statementText = $<HTMLElement>('.problem-statement', card ?? document)?.textContent?.trim() ?? titleText;
  const shareData = { title: titleText, text: statementText, url: problemUrl };
  try {
    if (problemId) void trackProblemEvent(problemId, 'share', 'web-share');
    if (navigator.share) await navigator.share(shareData);
    else {
      await navigator.clipboard.writeText(`${titleText}: ${statementText} ${problemUrl}`);
      showToast('Link kopiert.');
    }
  } catch (error) {
    if ((error as Error).name !== 'AbortError') showToast('Teilen hat nicht funktioniert.');
  }
}));

$$<HTMLAnchorElement>('[data-action="share-linkedin"]').forEach((link) => link.addEventListener('click', () => {
  const problemId = link.dataset.problemId;
  if (problemId) void trackProblemEvent(problemId, 'share', 'linkedin');
}));

const trackedProblemId = document.body.dataset.trackProblemId;
if (trackedProblemId) {
  window.setTimeout(() => void trackProblemEvent(trackedProblemId, 'view'), 350);
}

$$<HTMLSelectElement>('[data-filter-form] select').forEach((select) => select.addEventListener('change', () => {
  (select.form as HTMLFormElement).requestSubmit();
}));

const tokenForm = $('[data-token-form]') as HTMLFormElement | null;
if (tokenForm) {
  tokenForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setPending(tokenForm, true);
    try {
      const result = await post('/api/account/tokens', formData(tokenForm));
      const target = $('[data-token-result]') as HTMLElement;
      target.hidden = false;
      target.textContent = `Token: ${result.token as string}`;
      showToast('Skill-Token erzeugt. Er wird nur einmal angezeigt.');
    } catch {
      showToast('Token konnte nicht erzeugt werden.');
    } finally {
      setPending(tokenForm, false);
    }
  });
}
