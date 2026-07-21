# ProblemProof trust and identity

## Confirmed product decisions

- Source code, database migrations, product rules, legal pages, and the ProblemProof skill are public in one GitHub repository.
- Production secrets, raw production data, provider tokens, participant identifiers, and moderation material are never committed.
- Browsing remains anonymous.
- Publishing, confirming a problem, and adding an incident require an authenticated account.
- Authentication proves control of a provider account, not a government or real-world identity.
- Public pages show only that an action came from an authenticated account. They do not show the person's name, profile, provider identity, or voter list.
- V1 supports GitHub only. LinkedIn is a later alternative sign-in method, not a stronger identity proof.
- A single internal user can confirm a problem only once.
- The skill can publish only after explicit user confirmation and authenticated authorization.

## Main Screen Wireframe

Screen goal:
- Let visitors inspect public problems and let authenticated users publish or validate them exactly once.

Primary actor:
- A visitor or authenticated problem investigator.

Layout:
- Top area: ProblemProof brand, search, public repository link, sign-in or private account menu.
- Main area: filterable problem feed.
- Problem card: source channel, authenticated-account badge, problem statement, evidence totals, the user's vote state, incident and report actions.
- Footer: repository, skill installation, API, methodology, legal pages.
- Modal / transient zones: GitHub sign-in prompt, publish form, incident form, vote confirmation.

Primary flow:
1. A visitor finds a relevant problem.
2. The visitor selects “Selbst erlebt.”
3. If signed out, ProblemProof requests GitHub authentication and returns to the same problem.
4. The server records one confirmation for the internal user and problem.
5. The card shows “Von dir bestätigt”; the public only sees the aggregate count increase.

Important states:
- Signed out: reading and filtering work; write actions explain that an account is required.
- Signed in: write actions are enabled; no public profile is created.
- Already confirmed: the confirmation button is locked to the user's recorded state.
- Auth error: no vote is written and the user returns to the same card with a retry option.

```text
+--------------------------------------------------------------------------------+
| ProblemProof   Search                         GitHub ↗   Mit GitHub anmelden     |
+--------------------------------------------------------------------------------+
| Needs Proof | Neu | Stark belegt                   Region | Gruppe | Kategorie |
+--------------------------------------------------------------------------------+
| VIA SKILL · ACCOUNT BESTÄTIGT · BERLIN · ENTWICKLER                            |
|                                                                              |
| Wenn … entsteht …, weil …                                                     |
| Konkrete Folge des ungelösten Problems.                                       |
|                                                                              |
| [✓ Selbst erlebt 38]  [+ Vorfall 12]  [Teilen]                 [Inhalt melden]|
|     ^ signed in: “Von dir bestätigt”                                          |
+--------------------------------------------------------------------------------+
| Repo · Skill installieren · API · Methodik · Datenschutz · Impressum           |
+--------------------------------------------------------------------------------+
```

# PAD/PRD: Trusted participation and skill publishing

## Problem

- Anonymous browser identifiers do not credibly prevent repeat votes and do not create a trustworthy validation signal.
- A public website and a local validation skill currently operate as separate surfaces.
- Public source transparency is useful only if private production data and credentials remain protected.

## Context

- ProblemProof is a public problem database and evidence layer, not an identity network.
- The initial audience is developers and product builders, making GitHub the lowest-friction first provider.
- Social authentication verifies control of an account. It cannot guarantee one human, one account.

## Users / Actors

- Visitor: browse, search, filter, share, report, and inspect methodology and source code.
- Authenticated participant: publish a problem, confirm it once, add one incident, and manage personal access tokens.
- Skill user: validate locally, preview a proposed publication, and explicitly publish through the authenticated API.
- Maintainer: moderate content, operate the service, and publish all application and skill changes through the public repository.

## User Value

- Participants can trust that each confirmation represents one authenticated account rather than one browser-storage value.
- Contributors remain publicly private while the validation mechanism is inspectable.
- Skill users can move from local problem shaping to public evidence collection without re-entering the problem.

## Core System Behavior

- Anonymous users can read, filter, and inspect public aggregate data but cannot create, favorite, or validate content.
- GitHub sign-in creates or resumes a private internal user from a stable provider subject.
- A unique user/problem constraint permits one confirmation and one incident per internal user.
- A signed-in user can favorite problems and view personal feed tabs for favorites, confirmed problems, and posted problems.
- Public responses expose aggregate evidence and a generic authenticated-account badge, never provider subjects or access tokens.
- A signed-in user can create a scoped ProblemProof token; only its cryptographic hash is stored.
- The skill validates locally, presents the exact public payload, asks for confirmation, then publishes with that scoped token.
- Every problem records its source channel (`web`, `skill`, or future documented API) for public display.

## Main Screen

- Purpose: discover and validate problems with transparent aggregate trust signals.
- Key zones: public repository and auth controls, filtered feed, per-problem evidence actions, methodology and skill links.
- Primary flow: discover problem → authenticate if necessary → submit one confirmation or incident → see personal state and updated aggregate.

## Major Features / Epics

- Public repository readiness: license, security policy, contribution guide, CI, deployment documentation, and visible deployed commit SHA.
- Private authentication: GitHub authorization-code flow with state and PKCE, minimal provider access, private session, and logout.
- Account-backed evidence: user-linked problems, confirmations, and incidents with database uniqueness guarantees.
- Personal feed state: favorites, confirmed problems, posted problems, and per-card personal interaction state.
- Skill publishing: scoped personal token, payload preview, explicit publish confirmation, and source-channel attribution.
- Trust UX: generic authenticated badge, personal vote state, clear limitations, and no public voter list.
- Future identity linking: attach LinkedIn OIDC to an existing internal user without creating a second voting identity.

## Constraints

- Never describe GitHub or LinkedIn sign-in as real-world identity verification.
- Never promise “one human, one vote”; promise “one linked internal account, one vote per problem.”
- Request no repository or private-email permissions for GitHub sign-in.
- Exchange the temporary provider token, retrieve the stable provider subject, then discard the provider token.
- Store a keyed digest of provider and subject rather than the raw provider identifier where practical.
- Use secure, HTTP-only, same-site cookies; protect callbacks with state and PKCE.
- Store only hashes of ProblemProof personal access tokens; show the plaintext token once.
- Public source transparency must not expose production data, secrets, abuse controls, or private moderation correspondence.
- Publishing from the skill always requires an explicit final confirmation.

## Expected Outputs

- Public, reproducible application and skill source.
- One private internal user per linked provider identity.
- Deduplicated, account-backed validation counts.
- Authenticated problem publication from both web and skill.
- Public source-channel and generic authentication provenance.

## Out of Scope

- Government-ID verification, phone verification, payments, or proof of legal identity.
- Public user profiles, public voter lists, follower graphs, or direct messaging.
- Automatic publication by an agent without explicit user confirmation.
- LinkedIn support in v1.
- Publishing production database contents to GitHub.

## Open Questions

- Repository license: MIT, Apache-2.0, or public source without an open-source grant.
- Minimum GitHub account age or other anti-Sybil friction before a confirmation contributes to the public count.
- Whether maintainers need a private moderation dashboard in v1 or can begin with audited command-line operations.

## Recommended authentication contract

1. Use a GitHub OAuth App owned by `moinsen-dev` with callback `https://problemproof.moinsen.dev/auth/github/callback`.
2. Request no optional GitHub scopes. Read the authenticated user's stable numeric ID and account creation date, then discard the GitHub token.
3. Map `HMAC(identity_secret, "github:" + github_id)` to one internal user.
4. Store a revocable server session in the existing Cloudflare session binding and issue only a secure session cookie.
5. Enforce `UNIQUE(problem_id, user_id)` in D1 for confirmations and incidents.
6. Create separate GitHub OAuth applications for production and local development because a GitHub OAuth App supports one callback URL.
7. Let users create a scoped ProblemProof token for the skill. The skill sends the token only to ProblemProof and never receives the GitHub token.
8. Add LinkedIn later as an identity attached from inside an existing signed-in account. Do not let a second provider silently create a second voting identity for the same user.
