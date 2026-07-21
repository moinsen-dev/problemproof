PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO problems
  (id, slug, title, statement, origin, target_group, region, category, consequence, author_id, source, proof_status, created_at)
VALUES
  (1, 'indie-hacker-repo-reflex', 'Repo-Reflex vor Problemklärung', 'Solo-Entwickler starten bei neuen Ideen oft sofort Repos und Implementierung, bevor das Problem geklärt ist.', 'firsthand', 'Solo-Entwickler/Indie-Hacker', 'Deutschland', 'Softwareentwicklung', 'Über Monate oder Jahre entstehen viele angefangene Projekte, aber keine Veröffentlichung und kein Nutzertest.', 'seed-author-0', 'skill', 'needs-proof', '2026-07-21 09:00:00'),
  (2, 'side-project-infrastruktur', 'Infrastruktur frisst Side-Project-Zeit', 'Beim Start eines Side Projects verliere ich mehr Zeit mit Infrastruktur als mit dem Produkt.', 'firsthand', 'Entwickler', 'Berlin', 'Softwareentwicklung', 'Der eigentliche Nutzertest startet später oder das Projekt wird ganz aufgegeben.', 'seed-author-1', 'web', 'needs-proof', '2026-07-20 09:30:00'),
  (3, 'schichtwechsel-patienteninfos', 'Patienteninfos zerfallen beim Schichtwechsel', 'Schichtwechsel verlieren wichtige Patienteninfos, weil Übergaben über mehrere Kanäle verteilt sind.', 'hypothesis', 'Pflegekräfte', 'Europa', 'Gesundheit', 'Informationen müssen rekonstruiert werden und können bei der nächsten Schicht fehlen.', 'seed-author-2', 'web', 'needs-proof', '2026-07-19 16:10:00'),
  (4, 'handwerker-angebotserstellung', 'Angebote entstehen erst nach Feierabend', 'Kleine Handwerksbetriebe schreiben Angebote abends, weil Maße, Fotos und Preise tagsüber getrennt erfasst werden.', 'firsthand', 'Handwerksbetriebe', 'Deutschland', 'Handwerk', 'Angebote kommen verspätet beim Kunden an und private Zeit geht verloren.', 'seed-author-3', 'web', 'strong', '2026-07-18 11:00:00');

WITH RECURSIVE counter(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM counter WHERE n < 38
)
INSERT OR IGNORE INTO confirmations (problem_id, participant_id, region, created_at)
SELECT 2, 'seed-side-' || n, CASE WHEN n % 3 = 0 THEN 'Hamburg' ELSE 'Berlin' END, datetime('2026-07-20 10:00:00', '+' || n || ' minutes')
FROM counter;

WITH RECURSIVE counter(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM counter WHERE n < 4
)
INSERT OR IGNORE INTO confirmations (problem_id, participant_id, region, created_at)
SELECT 3, 'seed-care-' || n, 'Europa', datetime('2026-07-19 17:00:00', '+' || n || ' minutes')
FROM counter;

WITH RECURSIVE counter(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM counter WHERE n < 17
)
INSERT OR IGNORE INTO confirmations (problem_id, participant_id, region, created_at)
SELECT 4, 'seed-craft-' || n, 'Deutschland', datetime('2026-07-18 12:00:00', '+' || n || ' minutes')
FROM counter;

INSERT OR IGNORE INTO evidence
  (problem_id, participant_id, happened, frequency, severity, story, workaround, region, created_at)
VALUES
  (1, 'seed-evidence-indie-1', '90-days', 'weekly', 5, 'In den letzten zwei Jahren wurden mehr als 400 Repos und Projektansätze gestartet, aber keine dieser Ideen wurde veröffentlicht. Der Startimpuls war schneller als die Problemklärung.', 'ProblemProof vor Repo-Erstellung', 'Deutschland', '2026-07-21 09:05:00');

WITH RECURSIVE counter(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM counter WHERE n < 12
)
INSERT OR IGNORE INTO evidence
  (problem_id, participant_id, happened, frequency, severity, story, workaround, region, created_at)
SELECT
  2,
  'seed-evidence-side-' || n,
  CASE WHEN n < 5 THEN '7-days' WHEN n < 9 THEN '30-days' ELSE '90-days' END,
  CASE WHEN n % 3 = 0 THEN 'daily' ELSE 'weekly' END,
  2 + (n % 4),
  'Beim letzten Projekt musste ich vor dem ersten Nutzertest Hosting, Login und Deployments einrichten. Der Produktversuch blieb dadurch mehrere Abende liegen.',
  CASE WHEN n % 3 = 0 THEN 'Templates' WHEN n % 3 = 1 THEN 'SaaS' ELSE 'manuell' END,
  CASE WHEN n % 4 = 0 THEN 'Hamburg' ELSE 'Berlin' END,
  datetime('2026-07-20 11:00:00', '+' || n || ' minutes')
FROM counter;

INSERT OR IGNORE INTO evidence
  (problem_id, participant_id, happened, frequency, severity, story, workaround, region, created_at)
VALUES
  (3, 'seed-evidence-care-1', '7-days', 'daily', 5, 'Bei der letzten Übergabe stand eine Medikationsänderung nur in einer Chatnachricht. Im Übergabedokument fehlte sie und wir mussten später nachtelefonieren.', 'Zusätzliche handschriftliche Liste', 'Europa', '2026-07-19 18:01:00'),
  (3, 'seed-evidence-care-2', '30-days', 'weekly', 4, 'Ein Hinweis zur Mobilität wurde mündlich übergeben, aber nicht in der digitalen Akte ergänzt. Die nächste Schicht erfuhr erst vom Patienten davon.', 'Doppelte Dokumentation', 'Europa', '2026-07-19 18:02:00'),
  (3, 'seed-evidence-care-3', '90-days', 'weekly', 4, 'Fotos, Notizen und Rückfragen lagen in drei verschiedenen Kanälen. Beim Schichtwechsel war unklar, welcher Stand aktuell war.', 'Eigene Übergabe-Checkliste', 'Europa', '2026-07-19 18:03:00'),
  (4, 'seed-evidence-craft-1', '7-days', 'weekly', 4, 'Nach einem Termin lagen Maße im Notizbuch und Fotos auf dem Telefon. Das Angebot konnte ich erst abends am Rechner zusammensetzen.', 'Fotos direkt nach Auftragsnummer sortieren', 'Deutschland', '2026-07-18 13:01:00'),
  (4, 'seed-evidence-craft-2', '30-days', 'weekly', 3, 'Preise musste ich nach Feierabend aus Lieferantenlisten nachschlagen, weil die Informationen unterwegs nicht zusammen verfügbar waren.', 'Eigene Tabellen-Vorlage', 'Deutschland', '2026-07-18 13:02:00'),
  (4, 'seed-evidence-craft-3', '30-days', 'daily', 4, 'Mehrere Baustellenfotos waren nicht eindeutig einem Kunden zugeordnet. Für die Angebotserstellung musste ich den Tagesablauf rekonstruieren.', 'Kundenname vor dem Foto notieren', 'Deutschland', '2026-07-18 13:03:00');
