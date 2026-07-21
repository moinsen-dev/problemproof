# ProblemProof Web

Astro-SSR auf Cloudflare Workers, mit D1 als strukturierter Evidenzdatenbank. Die Oberfläche ist bewusst feedartig und schnell erfassbar; Problemtexte sind auf 280 Zeichen begrenzt und trennen Ursprung, Zielgruppe, Region, Kategorie und Konsequenz.

Produktion: [problemproof.moinsen.dev](https://problemproof.moinsen.dev)

## Architektur

```text
Astro-Seite
  ├─ GET /                         Feed, Suche und Filter
  ├─ GET /problems/:slug           teilbare Detailseite mit OpenGraph
  ├─ POST /api/problems           Problem veröffentlichen
  ├─ GET /api/problems/:id-or-slug einzelnes Problem mit privaten User-States
  ├─ POST /api/problems/:id/events privacy-freundliche View/Share Events
  ├─ POST /api/problems/:id/signal
  ├─ POST /api/problems/:id/evidence
  ├─ POST/DELETE /api/problems/:id/favorite
  ├─ GET /auth/github             GitHub OAuth start
  ├─ GET /auth/github/callback    GitHub OAuth callback
  ├─ POST /auth/logout
  ├─ GET /account/                private account and skill tokens
  ├─ GET /api/account/me          verify session or personal skill token
  ├─ POST /api/account/tokens     create personal skill token
  └─ GET /api/v1/problems         nur aggregierte öffentliche Daten
                    │
                    └─ Cloudflare D1
                       ├─ problems
                       ├─ confirmations
                       ├─ evidence
                       ├─ users / identities / sessions
                       ├─ favorites
                       ├─ personal_tokens
                       └─ problem_events
```

Jedes Problem hat einen kurzen `title`, eine lösungsfreie `statement`-Beschreibung und eine eigene Detailseite unter `/problems/:slug`. `confirmations` und `evidence` speichern pro Problem und internem Account höchstens einen Datensatz. Legacy-Daten mit anonymer Teilnehmer-ID bleiben lesbar. `problem_events` speichert nur aggregierbare View/Share-Signale ohne IP-Adressen, User-Agent-Fingerprinting oder rohe Viewerprofile.

## GitHub Auth und Skill Tokens

GitHub Login ist aktiv, sobald diese Cloudflare Worker-Secrets gesetzt sind:

```bash
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put IDENTITY_HMAC_SECRET
npx wrangler secret put SESSION_SECRET
```

GitHub OAuth App:

- Homepage URL: `https://problemproof.moinsen.dev`
- Callback URL: `https://problemproof.moinsen.dev/auth/github/callback`
- Scopes: keine optionalen Scopes anfordern

Skill-Publishing kann mit einem persönlichen ProblemProof-Token erfolgen, der unter `/account/` erzeugt wird. Der Token wird nur einmal angezeigt; gespeichert wird nur ein Hash. Der Skill kann den Token per `login` lokal speichern, per `status` über `GET /api/account/me` prüfen und veröffentlicht danach accountgebunden per Bearer-Token. `publish --project ...` speichert die Remote-Problem-ID und URL lokal; `sync`, `status --project` und `open --project` schließen den Loop zurück in den Skill.

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
      "title": "Repo-Reflex vor Problemklärung",
      "statement": "…",
      "confirmations": 38,
      "incidents": 12,
      "average_severity": 3.5,
      "views": 120,
      "shares": 9
    }
  ],
  "privacy": "Nur aggregierte Interaktionen; keine Teilnehmer-IDs und keine Vorfalltexte."
}
```

Für ein kommerzielles API-Angebot sollten als nächster Schritt API-Keys, Rate Limits, Nutzungspläne und Mindestgruppengrößen für regionale Auswertungen ergänzt werden.
