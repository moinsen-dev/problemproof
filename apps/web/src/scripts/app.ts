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

const publishDialog = $('#publish-dialog') as HTMLDialogElement;
const evidenceDialog = $('#evidence-dialog') as HTMLDialogElement;
const publishForm = $('#publish-form') as HTMLFormElement;
const evidenceForm = $('#evidence-form') as HTMLFormElement;
const toast = $('.toast') as HTMLElement;

function showToast(message: string) {
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

$$<HTMLElement>('[data-open-publish]').forEach((button) => button.addEventListener('click', () => publishDialog.showModal()));
$$<HTMLElement>('[data-close]').forEach((button) => button.addEventListener('click', () => (button.closest('dialog') as HTMLDialogElement).close()));
$$<HTMLDialogElement>('dialog').forEach((dialog) => dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
}));

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
    setFormMessage(publishForm, (error as { data?: Record<string, unknown> }).data ?? {});
  } finally {
    setPending(publishForm, false);
  }
});

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
    evidenceDialog.close();
    evidenceForm.reset();
    severityOutput.textContent = '3';
    showToast('Dein Vorfall wurde anonym ergänzt.');
  } catch (error) {
    setFormMessage(evidenceForm, (error as { data?: Record<string, unknown> }).data ?? {});
  } finally {
    setPending(evidenceForm, false);
  }
});

$$<HTMLElement>('[data-action="evidence"]').forEach((button) => button.addEventListener('click', () => {
  const card = button.closest<HTMLElement>('.problem');
  const problemInput = $('input[name="problemId"]', evidenceForm) as HTMLInputElement;
  problemInput.value = card?.dataset.problemId ?? '';
  evidenceDialog.showModal();
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
    showToast('Bestätigung konnte nicht gespeichert werden.');
  }
}));

$$<HTMLButtonElement>('[data-action="share"]').forEach((button) => button.addEventListener('click', async () => {
  const card = button.closest<HTMLElement>('.problem');
  const statementText = $<HTMLElement>('h2', card ?? document)?.textContent?.trim() ?? 'Problem auf ProblemProof';
  const shareData = { title: 'ProblemProof', text: statementText, url: window.location.href };
  try {
    if (navigator.share) await navigator.share(shareData);
    else {
      await navigator.clipboard.writeText(`${statementText} ${window.location.href}`);
      showToast('Link kopiert.');
    }
  } catch (error) {
    if ((error as Error).name !== 'AbortError') showToast('Teilen hat nicht funktioniert.');
  }
}));

$$<HTMLSelectElement>('[data-filter-form] select').forEach((select) => select.addEventListener('change', () => {
  (select.form as HTMLFormElement).requestSubmit();
}));
