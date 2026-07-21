import {
  FREQUENCIES,
  HAPPENED_OPTIONS,
  ORIGINS,
  type EvidenceInput,
  type ProblemInput,
} from './types';

const text = (value: unknown) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '');
const participant = (value: unknown) => text(value).slice(0, 120);

export function parseProblemInput(value: unknown): { data?: ProblemInput; errors: string[] } {
  const body = (value ?? {}) as Record<string, unknown>;
  const data: ProblemInput = {
    statement: text(body.statement),
    origin: text(body.origin) as ProblemInput['origin'],
    targetGroup: text(body.targetGroup),
    region: text(body.region),
    category: text(body.category),
    consequence: text(body.consequence),
    participantId: participant(body.participantId),
  };
  const errors: string[] = [];
  if (data.statement.length < 20 || data.statement.length > 280) errors.push('Das Problem muss 20 bis 280 Zeichen lang sein.');
  if (!ORIGINS.includes(data.origin)) errors.push('Bitte wähle den Ursprung des Problems.');
  if (data.targetGroup.length < 2 || data.targetGroup.length > 80) errors.push('Bitte nenne eine klare Zielgruppe.');
  if (data.region.length < 2 || data.region.length > 80) errors.push('Bitte nenne eine Region.');
  if (data.category.length < 2 || data.category.length > 80) errors.push('Bitte nenne eine Kategorie.');
  if (data.consequence.length < 10 || data.consequence.length > 400) errors.push('Beschreibe kurz die Folge des ungelösten Problems.');
  if (data.participantId.length < 8) errors.push('Die anonyme Teilnehmer-ID fehlt.');
  return errors.length ? { errors } : { data, errors };
}

export function parseEvidenceInput(value: unknown): { data?: EvidenceInput; errors: string[] } {
  const body = (value ?? {}) as Record<string, unknown>;
  const data: EvidenceInput = {
    happened: text(body.happened) as EvidenceInput['happened'],
    frequency: text(body.frequency) as EvidenceInput['frequency'],
    severity: Number(body.severity),
    story: text(body.story),
    workaround: text(body.workaround),
    region: text(body.region),
    participantId: participant(body.participantId),
    ownExperience: body.ownExperience === true,
  };
  const errors: string[] = [];
  if (!HAPPENED_OPTIONS.includes(data.happened)) errors.push('Bitte wähle, wann der Vorfall passiert ist.');
  if (!FREQUENCIES.includes(data.frequency)) errors.push('Bitte wähle die Häufigkeit.');
  if (!Number.isInteger(data.severity) || data.severity < 1 || data.severity > 5) errors.push('Die Auswirkung muss zwischen 1 und 5 liegen.');
  if (data.story.length < 20 || data.story.length > 1200) errors.push('Der konkrete Vorfall muss 20 bis 1.200 Zeichen lang sein.');
  if (data.workaround.length > 240) errors.push('Der Workaround darf höchstens 240 Zeichen lang sein.');
  if (data.region.length < 2 || data.region.length > 80) errors.push('Bitte nenne eine Region.');
  if (data.participantId.length < 8) errors.push('Die anonyme Teilnehmer-ID fehlt.');
  if (!data.ownExperience) errors.push('Bitte bestätige, dass du den Vorfall selbst erlebt hast.');
  return errors.length ? { errors } : { data, errors };
}

export function slugify(statement: string): string {
  return statement
    .toLocaleLowerCase('de')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 54);
}
