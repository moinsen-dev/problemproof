# ProblemProof

[![CI](https://github.com/moinsen-dev/problemproof/actions/workflows/ci.yml/badge.svg)](https://github.com/moinsen-dev/problemproof/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-1457ff.svg)](LICENSE)

ProblemProof prüft Probleme, bevor jemand Zeit in die nächste Lösung investiert. Das Repository enthält zwei komplementäre Oberflächen:

- `apps/web`: ein öffentlicher, schneller Problem-Feed mit Astro, Cloudflare Workers und D1
- `plugins/problemproof`: ein installierbarer Codex-Skill, der ein Problem lokal strukturiert, auf belastbare Evidenz prüft und Lean-Startup-Experimente als Lernschleife plant

Die Website akzeptiert sowohl selbst erlebte Probleme als auch klar markierte Hypothesen. Accountgestützte Reaktionen verhindern doppelte Validierungssignale; stärkere Evidenz entsteht durch strukturierte, konkrete Vorfälle. Die öffentliche API gibt ausschließlich aggregierte Daten aus.

Produktion: [problemproof.moinsen.dev](https://problemproof.moinsen.dev)

## Skill installieren

Der ProblemProof-Skill funktioniert mit Codex und weiteren Agenten, die den
offenen Agent-Skills-Standard unterstützen:

```bash
npx skills add moinsen-dev/problemproof --skill problemproof
```

Danach kann ein Problem beispielsweise mit `$problemproof capture`,
`$problemproof validate`, `$problemproof hypotheses`, `$problemproof mvp`,
`$problemproof loop`, `$problemproof lean-sparring` oder
`$problemproof experiment` bearbeitet werden.

`$problemproof lean-sparring` nutzt eine Lean-Startup/Validated-Learning-Linse
als methodischen Sparringspartner: problem-first, mit harter Annahmenprüfung,
Anti-Vanity-Metriken und klaren Stop-/Pivot-/Persevere-Schwellen.

## Transparenz und Vertrauen

Dieses Repository enthält die Website, D1-Migrationen, Produkt- und
Designentscheidungen, Rechtstexte, Tests und den installierbaren Skill. Nicht
öffentlich sind Produktionsdaten, Identifikatoren, Zugangsdaten und private
Moderationsvorgänge.

Das bestätigte Zielmodell nutzt private, accountgestützte Teilnahme statt
anonymer Mehrfachsignale. Öffentlich erscheinen nur aggregierte
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
