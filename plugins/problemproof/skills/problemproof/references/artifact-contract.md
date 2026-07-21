# ProblemProof artifact contract

## Contents

1. Directory layout
2. Non-destructive workspace commands
3. State and transitions
4. Evidence and history rules
5. File contracts
6. Privacy and integrity

## 1. Directory layout

Keep one directory per idea. Use this default layout:

```text
problem-proof/
├── state.json
├── idea.md
├── assumptions.md
├── evidence.md
├── interviews.md
├── alternatives.md
├── experiments.md
├── scorecard.json
├── decision.md
├── opportunity.md
└── history.md
```

`state.json` is the machine-readable lifecycle record. Markdown files remain human-readable. `history.md` is append-only. Do not add credentials, raw access tokens, or unnecessary personal data.

## 2. Non-destructive workspace commands

Run the bundled script with Python 3. Resolve `<skill-dir>` as the directory containing this skill's `SKILL.md`.

Initialize missing files without overwriting existing ones:

```bash
python3 <skill-dir>/scripts/problemproof_workspace.py init \
  --root <chosen-parent-directory> \
  --title "<idea title>" \
  --cooling-off-hours 72
```

`add` is the user-facing alias for local capture and accepts the same arguments as `init`:

```bash
python3 <skill-dir>/scripts/problemproof_workspace.py add \
  --root <chosen-parent-directory> \
  --title "<idea title>" \
  --cooling-off-hours 72
```

Use `repo-gate` before creating a repository, PRD, project scaffold, or implementation for a new idea:

```bash
python3 <skill-dir>/scripts/problemproof_workspace.py repo-gate \
  --root <chosen-parent-directory> \
  --title "<idea title>"
```

If `--project-dir` is omitted, `repo-gate` creates `problem-proof-<title-slug>/` so multiple pre-repo records can live under one parent. The command does not publish anything and prints a build-stop reminder.

The command creates `<chosen-parent-directory>/problem-proof/` by default. Use `--project-dir <single-directory-name>` to keep multiple ideas under one parent. Do not use paths containing `/`, `..`, or an absolute path as `--project-dir`.

Check structure and state integrity:

```bash
python3 <skill-dir>/scripts/problemproof_workspace.py check --project <problem-proof-directory>
```

Update one gate item while preserving a history event:

```bash
python3 <skill-dir>/scripts/problemproof_workspace.py gate \
  --project <problem-proof-directory> \
  --item external_pattern \
  --status passed \
  --evidence-id E-001 \
  --evidence-id E-002 \
  --note "Three independent recent incidents in the target segment."
```

Record a current verdict and recommendation:

```bash
python3 <skill-dir>/scripts/problemproof_workspace.py decision \
  --project <problem-proof-directory> \
  --verdict validation-required \
  --recommendation prototype-critical-assumption \
  --reason "Adoption-critical data entry has not been tested."
```

Change operational stage:

```bash
python3 <skill-dir>/scripts/problemproof_workspace.py transition \
  --project <problem-proof-directory> \
  --to validating \
  --reason "Beginning incident interviews."
```

Transitioning from `opportunity-ready` to `shaping` additionally requires `--user-confirmed`. Never infer that confirmation from a passing gate.

Publish a confirmed, solution-free problem to the ProblemProof API only after explicit user confirmation:

```bash
python3 <skill-dir>/scripts/problemproof_workspace.py login \
  --token "<personal ProblemProof token from /account/>"
```

Verify the active publishing account:

```bash
python3 <skill-dir>/scripts/problemproof_workspace.py status
```

Then publish:

```bash
python3 <skill-dir>/scripts/problemproof_workspace.py publish \
  --statement "<solution-free problem>" \
  --origin firsthand \
  --target-group "<smallest target group>" \
  --region "<region>" \
  --category "<category>" \
  --consequence "<observable consequence>" \
  --yes
```

`publish` sends `source=skill`. With an authenticated token, the server associates the problem with the private ProblemProof account and ignores any legacy local participant ID for ownership. Prefer `login` or `PROBLEMPROOF_TOKEN` over passing `--token` when shell history is persistent. Use `logout` to remove the locally stored token. Publishing must not include raw notes, secrets, private transcripts, or personal data about third parties.

## 3. State and transitions

Use these operational stages:

- `captured`
- `validating`
- `parked`
- `personal`
- `opportunity-ready`
- `shaping`
- `shaped`
- `stopped`

Allowed transitions:

```text
captured          -> validating | parked | personal | stopped
validating        -> parked | personal | opportunity-ready | stopped
parked            -> validating | personal | stopped
personal          -> validating | parked | stopped
opportunity-ready -> validating | shaping | parked | stopped
shaping           -> validating | shaped | parked | stopped
shaped            -> validating | shaping | parked | stopped
stopped           -> validating | parked | personal
```

Moving into `opportunity-ready` requires every evidence-gate item to be `passed`. Moving into `shaping` requires the current stage `opportunity-ready` and explicit user confirmation. Contradictory evidence can return any market-oriented stage to `validating`.

Use these verdict values:

- `idea-only`
- `personal-problem`
- `plausible-shared-problem`
- `validation-required`
- `validated-opportunity`
- `do-not-build-yet`
- `proceed-to-opportunity-shaping`

Use these recommendation values:

- `stop`
- `observe-further`
- `validate-before-building`
- `narrow-target-group`
- `reframe-problem`
- `prototype-critical-assumption`
- `proceed-to-opportunity-shaping`

`validated-opportunity` and `proceed-to-opportunity-shaping` are invalid while any gate item is not passed.

## 4. Evidence and history rules

Use stable IDs:

- assumptions: `A-001`, `A-002`, …
- evidence: `E-001`, `E-002`, …
- interviews: `I-001`, `I-002`, …
- experiments: `X-001`, `X-002`, …

Never reuse an ID. When a claim changes, keep the original row and set its status to `confirmed`, `rejected`, or `superseded`. Add the replacement with a new ID when its meaning materially differs.

Before updating artifacts:

1. Read `state.json`, `history.md`, and every file being changed.
2. Allocate the next stable ID from the existing ledger.
3. Cite evidence IDs in scorecard entries, gate notes, and decisions.
4. Append a dated summary to `history.md`.
5. Run `check` after material state or scorecard changes.

The script records gate, decision, and transition events automatically. Append substantive evidence and report changes manually without rewriting earlier history.

## 5. File contracts

- `idea.md`: trigger, observation, proposed solution, solution-free problem, personal relevance, assumed segment, evidence summary, open questions, and earliest reassessment date.
- `assumptions.md`: assumption ID, falsifiable statement, type, status, evidence IDs, falsifier, and dates.
- `evidence.md`: evidence ID, date, source, segment/situation, type, direction, observation, independence, limitations, and linked claims.
- `interviews.md`: anonymized interview ID, segment fit, recent incident, current behavior, consequence, direct language, commitments, contradictions, and follow-up.
- `alternatives.md`: direct, indirect, manual, professional, avoidance, and non-consumption alternatives; include switching cost and observed satisfaction.
- `experiments.md`: hypothesis, segment, method, time/spend cap, thresholds fixed in advance, result, evidence IDs, and decision.
- `scorecard.json`: all 12 dimensions with no total, average, weight, or composite rank.
- `decision.md`: current recommendation, evidence level, rationale, strongest arguments, fatal assumptions, stop criteria, gate failures, and reversal evidence.
- `opportunity.md`: remain explicitly blocked until the gate passes; then store the complete shaping report.
- `history.md`: append-only timestamped events with the reason and affected IDs.

Each `scorecard.json` dimension must contain:

```json
{
  "name": "problem-clarity",
  "score": 0,
  "confidence": "low",
  "evidence_direction": "unknown",
  "evidence_ids": [],
  "basis": "Unassessed.",
  "assumptions": [],
  "unknowns": []
}
```

Allowed directions are `unknown`, `supports`, `contradicts`, and `mixed`. A low-confidence zero with `unknown` direction means unproven, not disproven.

## 6. Privacy and integrity

- Anonymize interview participants by default and store contact details elsewhere only when necessary and authorized.
- Do not store secrets, authentication material, private messages, or full sensitive transcripts in these artifacts.
- Quote participants sparingly and distinguish direct language from paraphrase.
- Record source URLs and access dates for public research.
- Preserve negative and contradictory evidence with the same care as supporting evidence.
- Never modify a score solely to force a desired lifecycle transition.
- Stop and report an integrity error if JSON is malformed, required files are missing, or current state contradicts the gate.
