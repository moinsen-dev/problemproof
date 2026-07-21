# ProblemProof

[![CI](https://github.com/moinsen-dev/problemproof/actions/workflows/ci.yml/badge.svg)](https://github.com/moinsen-dev/problemproof/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-1457ff.svg)](LICENSE)

ProblemProof prüft Probleme, bevor jemand Zeit in die nächste Lösung investiert. Das Repository enthält zwei komplementäre Oberflächen:

- `apps/web`: ein öffentlicher, schneller Problem-Feed mit Astro, Cloudflare Workers und D1
- `plugins/problemproof`: ein installierbarer Codex-Skill, der ein Problem lokal strukturiert und auf belastbare Evidenz prüft

Die Website akzeptiert sowohl selbst erlebte Probleme als auch klar markierte Hypothesen. Ein Klick auf „Selbst erlebt“ erzeugt ein anonymes Bestätigungssignal; stärkere Evidenz entsteht nur durch einen strukturierten, konkreten Vorfall. Die öffentliche API gibt ausschließlich aggregierte Daten aus.

Die nächste Ausbaustufe ersetzt anonyme Browser-Signale durch private, accountgestützte Teilnahme und verbindet den Skill mit der Veröffentlichungs-API. Das bestätigte Vertrauensmodell und der Authentifizierungsvertrag stehen in [docs/trust-identity-prd.md](docs/trust-identity-prd.md).

Produktion: [problemproof.moinsen.dev](https://problemproof.moinsen.dev)

## Skill installieren

Der ProblemProof-Skill funktioniert mit Codex und weiteren Agenten, die den
offenen Agent-Skills-Standard unterstützen:

```bash
npx skills add moinsen-dev/problemproof --skill problemproof
```

Danach kann ein Problem beispielsweise mit `$problemproof capture`,
`$problemproof validate` oder `$problemproof experiment` bearbeitet werden.

## Transparenz und Vertrauen

Dieses Repository enthält die Website, D1-Migrationen, Produkt- und
Designentscheidungen, Rechtstexte, Tests und den installierbaren Skill. Nicht
öffentlich sind Produktionsdaten, Identifikatoren, Zugangsdaten und private
Moderationsvorgänge.

Das bestätigte Zielmodell ersetzt anonyme Browser-Signale durch private,
accountgestützte Teilnahme. Öffentlich erscheinen nur aggregierte
Validierungssignale, niemals eine Liste der abstimmenden Personen. Details:
[docs/trust-identity-prd.md](docs/trust-identity-prd.md).

## Lokal starten

```bash
cd apps/web
npm install
npm run db:migrate:local
npm run db:seed:local
npm run dev
```

Danach läuft ProblemProof unter `http://127.0.0.1:4321`.

Weitere Hinweise zu Architektur, API und Cloudflare-Deployment stehen in [apps/web/README.md](apps/web/README.md).

## Qualitätschecks

```bash
cd apps/web
npm test
npm run build
```

Der Python-Test für den lokalen Skill läuft vom Repository-Root:

```bash
python3 -m unittest tests/test_workspace.py
```

## Datenschutzlinie

ProblemProof verkauft keine personenbezogenen Rohdaten. Teilnehmer-IDs dienen nur dazu, doppelte Bestätigungen lokal zu verhindern. Die öffentliche API enthält weder Teilnehmer-IDs noch Vorfalltexte, sondern nur aggregierte Bestätigungen, Vorfallzahlen und mittlere Schweregrade.

Sicherheitslücken bitte nicht öffentlich melden, sondern gemäß
[SECURITY.md](SECURITY.md) vertraulich an `developer@moinsen.dev` senden.

## Mitwirken und Lizenz

Beiträge sind willkommen; die Regeln stehen in [CONTRIBUTING.md](CONTRIBUTING.md).
ProblemProof ist unter der [MIT-Lizenz](LICENSE) veröffentlicht.
