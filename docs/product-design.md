# ProblemProof product design

## Critical review of the brief

The brief correctly treats cheap implementation as a reason to strengthen validation, not weaken it. Its strongest constraints are the separation of personal experience from external demand, the refusal to auto-advance into product shaping, and the requirement that conclusions remain traceable to evidence.

The original text ends mid-sentence at “Define the…”. This implementation treats all complete requirements above that point as authoritative and resolves the missing decisions below.

## Missing decisions and chosen defaults

1. **Codex command convention:** expose one skill, `$problemproof`, with verb-style intents. Natural-language equivalents work; literal slash-command parsing is not required.
2. **Evidence sufficiency:** do not use a numeric cutoff. Require all evidence-gate conditions, normally including three independent target users with recent concrete incidents and one behavioral or transactional signal. Permit documented exceptions for rare or concentrated-buyer problems, but never for the absence of external evidence.
3. **Score meaning:** score all 12 dimensions from 0–5, but never average them. A zero with unknown direction means unproven, not necessarily disproven. Confidence and evidence direction are mandatory.
4. **Cooling-off period:** default to 72 hours. Make it configurable and bypassable for documented urgency, already validated demand, or an explicitly personal project.
5. **Persistence:** store local Markdown plus JSON under `problem-proof/`. Do not require a repository, database, account, or network service.
6. **History semantics:** treat evidence and history as append-only. Mark assumptions and decisions confirmed, rejected, or superseded instead of deleting their earlier form.
7. **External research:** record URLs, access dates, quoted or paraphrased claims, and limitations. Research is context, not proof of willingness to switch or pay.
8. **Privacy:** default to anonymized interview IDs and avoid credentials, unnecessary personal data, or sensitive transcripts.
9. **Multiple ideas:** keep one artifact directory per idea. `compare` consumes two or more scorecards and compares evidence quality, not a synthetic rank.
10. **Opportunity shaping:** reaching `opportunity-ready` authorizes a recommendation to shape; it does not automatically change modes. The user must explicitly request `shape`.

## Workflow

```text
capture ──> validating ──> opportunity-ready ──(explicit shape)──> shaping ──> shaped
   │             │                    │                 │
   ├─> parked <──┴────────────────────┴─────────────────┤
   ├─> personal ──> validating                         │
   └─> stopped <────────────────────────────────────────┘
```

Contradictory evidence may move `opportunity-ready`, `shaping`, or `shaped` back to `validating`. No state transition erases prior evidence or decisions.

## State model

`state.json` stores the operational stage, current verdict, recommendation, cooling-off date, and seven evidence-gate items. `decision.md` contains the human-readable rationale. `history.md` records timestamped state, gate, and decision changes. The deterministic workspace script validates transitions and blocks entry into `opportunity-ready` until every gate item passes.

The evidence gate covers:

- solution-free problem clarity;
- a specific investigable segment;
- an external pattern of concrete incidents;
- at least one behavioral or transactional signal;
- understood alternatives and dissatisfaction;
- tested adoption-critical behavior;
- no unsupported assumption that can independently invalidate the opportunity.

## Command surface

| Intent | Outcome |
|---|---|
| `capture` | Store the trigger, observation, proposed solution, personal relevance, target assumption, evidence, questions, and reassessment date. |
| `validate` | Run the complete Problem Validation report. |
| `challenge` | Present the strongest credible failure case and falsifiers. |
| `evidence` | Inventory supporting, contradicting, and missing evidence. |
| `experiment` | Design the cheapest decision-changing test with thresholds and stop criteria. |
| `score` | Produce the 12-dimension scorecard with confidence and traceability. |
| `shape` | Produce Opportunity Shaping only after the gate passes and the user opts in. |
| `compare` | Compare problem strength and evidence quality across ideas. |
| `park` | Preserve the idea and set a reassessment date without creating a commitment. |
| `personal` | Classify the idea as a non-market personal project. |
| `decision` | Produce one explicit stop/observe/validate/narrow/reframe/prototype/proceed recommendation. |
| `status` | Show lifecycle stage, gate failures, verdict, and next evidence action. |
| `init` | Create the non-destructive local artifact workspace. |

## Package boundary

Version 0.1.0 is intentionally local and implementation-agnostic. It contains one Codex skill, three progressive-disclosure references, and one standard-library-only workspace script. It does not include an MCP server, hosted storage, automated outreach, scraping, analytics, or a marketplace entry.
