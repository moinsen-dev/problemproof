import { describe, expect, it } from 'vitest';
import { parseEvidenceInput, parseProblemInput, slugify } from '../src/lib/validation';

describe('problem validation', () => {
  it('accepts a concise problem without a proposed solution', () => {
    const result = parseProblemInput({
      statement: 'Beim Start eines Side Projects verliere ich mehr Zeit mit Infrastruktur als mit dem Produkt.',
      origin: 'firsthand',
      targetGroup: 'Entwickler',
      region: 'Berlin',
      category: 'Softwareentwicklung',
      consequence: 'Der erste Nutzertest startet mehrere Tage später.',
      participantId: 'participant-123',
    });
    expect(result.errors).toEqual([]);
    expect(result.data?.statement).toContain('Side Projects');
  });

  it('rejects statements longer than 280 characters', () => {
    const result = parseProblemInput({
      statement: 'x'.repeat(281),
      origin: 'hypothesis',
      targetGroup: 'Teams',
      region: 'Europa',
      category: 'Arbeit',
      consequence: 'Dadurch geht Arbeitszeit verloren.',
      participantId: 'participant-123',
    });
    expect(result.data).toBeUndefined();
    expect(result.errors[0]).toContain('280');
  });

  it('creates stable URL fragments with German characters', () => {
    expect(slugify('Ärger mit größeren Übergaben')).toBe('arger-mit-grosseren-ubergaben');
  });
});

describe('evidence validation', () => {
  it('requires a concrete firsthand incident', () => {
    const result = parseEvidenceInput({
      happened: '7-days',
      frequency: 'weekly',
      severity: 4,
      story: 'Beim letzten Übergabetermin fehlte eine wichtige Änderung im gemeinsamen Dokument.',
      workaround: 'Zusätzliche Liste',
      region: 'Berlin',
      participantId: 'participant-123',
      ownExperience: false,
    });
    expect(result.data).toBeUndefined();
    expect(result.errors).toContain('Bitte bestätige, dass du den Vorfall selbst erlebt hast.');
  });

  it('accepts valid structured evidence', () => {
    const result = parseEvidenceInput({
      happened: '30-days',
      frequency: 'daily',
      severity: 5,
      story: 'Fotos und Maße waren getrennt gespeichert, sodass das Angebot erst am Abend fertig wurde.',
      workaround: 'Eigene Tabelle',
      region: 'Deutschland',
      participantId: 'participant-456',
      ownExperience: true,
    });
    expect(result.errors).toEqual([]);
    expect(result.data?.severity).toBe(5);
  });
});
