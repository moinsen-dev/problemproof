# ProblemProof Web

Astro-SSR auf Cloudflare Workers, mit D1 als strukturierter Evidenzdatenbank. Die Oberfläche ist bewusst feedartig und schnell erfassbar; Problemtexte sind auf 280 Zeichen begrenzt und trennen Ursprung, Zielgruppe, Region, Kategorie und Konsequenz.

Produktion: [problemproof.moinsen.dev](https://problemproof.moinsen.dev)

## Architektur

```text
Astro-Seite
  ├─ GET /                         Feed, Suche und Filter
  ├─ POST /api/problems           Problem veröffentlichen
  ├─ POST /api/problems/:id/signal
  ├─ POST /api/problems/:id/evidence
  └─ GET /api/v1/problems         nur aggregierte öffentliche Daten
                    │
                    └─ Cloudflare D1
                       ├─ problems
                       ├─ confirmations
                       └─ evidence
```

`confirmations` speichert pro Problem und anonymer Teilnehmer-ID höchstens einen Datensatz. `evidence` verlangt einen konkreten eigenen Vorfall mit Zeitpunkt, Häufigkeit, Schweregrad, Geschichte, Region und optionalem Workaround.

## Lokal entwickeln

Voraussetzungen: Node.js 22+ und npm.

```bash
npm install
npm run db:migrate:local
npm run db:seed:local
npm run dev
```

Nützliche Befehle:

```bash
npm test                 # Validierungslogik
npm run build            # Typecheck + Worker-Build
npm run cf:typegen       # Cloudflare-Bindings neu typisieren
npm run db:migrate:local # lokale Migrationen
npm run db:seed:local    # idempotente Demo-Daten
```

## Auf Cloudflare deployen

Das Repository ist mit der produktiven D1-Datenbank `problemproof` verknüpft. Neue Migrationen werden vor dem Deployment remote angewendet:

```bash
npx wrangler d1 migrations apply problemproof --remote
npm run deploy
```

Wrangler deployt den Worker `problemproof` auf die Custom Domain `problemproof.moinsen.dev`; Cloudflare verwaltet DNS und TLS. Der Astro-Adapter hat das `SESSION`-KV-Binding automatisch provisioniert. Cloudflare Images ist bewusst deaktiviert, weil der MVP keine Bildtransformation braucht.

`seed.sql` ist ausschließlich für die lokale Demo gedacht und wird nicht in die Produktionsdatenbank geschrieben.

## Öffentliche API

`GET /api/v1/problems` akzeptiert optional `region` und `category` als Query-Parameter. Die Antwort enthält Problem-Metadaten und aggregierte Kennzahlen:

```json
{
  "data": [
    {
      "id": 1,
      "statement": "…",
      "confirmations": 38,
      "incidents": 12,
      "average_severity": 3.5
    }
  ],
  "privacy": "Nur aggregierte Interaktionen; keine Teilnehmer-IDs und keine Vorfalltexte."
}
```

Für ein kommerzielles API-Angebot sollten als nächster Schritt API-Keys, Rate Limits, Nutzungspläne und Mindestgruppengrößen für regionale Auswertungen ergänzt werden.
