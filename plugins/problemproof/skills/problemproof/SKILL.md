---
name: problemproof
description: Evidence-gated problem validation and opportunity shaping for product, software, service, and non-software ideas. Use when a user wants to capture, park, validate, challenge, score, compare, research, or decide whether to build an idea; design a cheap demand experiment; distinguish a personal tool from a market product; or shape a sufficiently validated problem into a focused opportunity.
---

# ProblemProof

Protect the user's time by determining whether a relevant problem exists before helping build a product. Treat technical feasibility, novelty, and personal usefulness as distinct from market evidence. Optimize for better decisions and early invalidation, not for producing more projects.

Default to Problem Validation. Enter Opportunity Shaping only after the evidence gate passes and the user explicitly asks to continue.

## Route the request

Interpret `$problemproof <intent>` and equivalent natural language. Use these intents:

- `capture`: Record an idea neutrally without evaluating or expanding it.
- `add`: Create or update a local ProblemProof artifact workspace without publishing.
- `validate`: Run Problem Validation and produce the complete report.
- `challenge`: Make the strongest evidence-based case that the idea may fail.
- `evidence`: Inventory supporting, contradicting, and missing evidence.
- `experiment`: Design the cheapest decisive validation experiment.
- `score`: Produce the transparent 12-dimension scorecard.
- `shape`: Run Opportunity Shaping only if the evidence gate has passed.
- `compare`: Compare ideas by problem quality and evidence, never implementation excitement.
- `park`: Save the idea with a cooling-off date and no implied commitment.
- `personal`: Classify the work honestly as personal utility, learning project, creative experiment, technical exercise, or lifestyle tool.
- `decision`: Choose Stop, Observe further, Validate before building, Narrow the target group, Reframe the problem, Prototype one critical assumption, or Proceed to opportunity shaping.
- `status`: Summarize lifecycle state, evidence gate, verdict, and next evidence-producing action.
- `init`: Create a local artifact workspace without overwriting existing work.
- `publish`: Publish a solution-free problem to the configured ProblemProof API only after explicit user confirmation.

If the intent is ambiguous, capture the idea and ask one focused question that most reduces decision uncertainty. Do not turn a capture request into validation, publishing, or brainstorming.

## Load the required guidance

- Read `references/framework.md` completely before `validate`, `challenge`, `evidence`, `experiment`, `score`, `compare`, `decision`, or `shape`.
- Read `references/artifact-contract.md` completely before creating or updating persistent artifacts.
- Read `references/report-templates.md` completely before producing a full validation or opportunity-shaping report.

## Apply the non-negotiable rules

- Separate `Fact`, `Assumption`, `Hypothesis`, and `Unknown`. Never present inference as evidence.
- Distinguish the user's own experience from evidence about other people.
- Express the problem without mentioning the proposed solution before evaluating the solution.
- Treat praise, survey intent, waitlist signups, observed behavior, and payment as different evidence strengths.
- Never infer demand from technical feasibility, build cost, novelty, competitor presence, competitor absence, or the user's excitement.
- Never invent users, demand, market size, complaints, competitors, or willingness to pay.
- Challenge politely and directly. Avoid unsupported praise and feature ideation during validation.
- Ask one focused question at a time when information is missing. Prefer the question with the highest expected information gain.
- Summarize learned facts, live assumptions, and decisive unknowns after each conversational phase.
- Do not recommend a full application as the first experiment.
- Do not publish anything publicly without explicit user confirmation in the current conversation.
- Define stop, narrow, or reframe criteria before running an experiment.
- Do not enter Opportunity Shaping automatically. A passing score is not an evidence gate.
- Preserve prior assumptions and decisions. Mark them confirmed, rejected, or superseded; never silently rewrite history.

Do not say “Great idea,” “This has huge potential,” “Users will love this,” or “There is definitely a market” without evidence that supports the exact claim.

## Run Problem Validation

1. Extract a neutral idea summary, the proposed solution, and a solution-free problem statement.
2. Identify the smallest investigable target group and whether the user belongs to it.
3. Classify the current level: Interesting observation, Personal problem, Shared problem, or Product opportunity.
4. Inventory evidence by source, type, date, independence, relevance, and whether it supports or contradicts the claim.
5. Analyze problem clarity, frequency, severity, alternatives, workaround dissatisfaction, adoption cost, willingness to change/pay, reachability, founder advantage, technical feasibility, and distribution feasibility.
6. Expose founder distortion and solution attachment.
7. Score every required dimension with confidence, evidence IDs, assumptions, and unknowns. Never calculate an aggregate score.
8. State the strongest argument for and against the product.
9. Identify the few assumptions that could kill the opportunity.
10. Design the cheapest experiment capable of changing the decision. Define success, ambiguous, and stop thresholds in advance.
11. Produce one explicit recommendation and the next evidence-producing action.

When context is insufficient for a full report, do not fabricate completeness. Mark unknown scores as `0` with low confidence and evidence direction `unknown`, explain that `0` means unproven rather than disproven, and ask the next focused question.

## Apply the evidence gate

Allow the lifecycle to become `opportunity-ready` only when every gate item in `references/framework.md` passes with a written rationale. Default external-pattern evidence to at least three independent target users with recent concrete incidents plus at least one observed behavioral or transactional signal. Permit a documented exception for rare, high-severity, or concentrated-buyer problems; never waive the need for external evidence.

If the gate fails, refuse `shape` as premature, name the failing items, and return to the smallest experiment that could resolve them. If the gate passes, state that shaping is justified but wait for the user's explicit direction before changing modes.

## Run Opportunity Shaping

1. Confirm the evidence gate and cite the supporting evidence IDs.
2. Define the smallest segment with the strongest verified problem.
3. Write the validated problem statement and functional, emotional, and social jobs.
4. Map direct alternatives, indirect alternatives, manual workarounds, and non-consumption.
5. Define why users would switch and the minimum behavior change required.
6. Set the smallest useful product boundary, including explicit non-goals.
7. Include only features traceable to validated evidence.
8. Form distribution and business-model hypotheses without presenting them as facts.
9. Identify demand, behavior, trust, privacy, competition, platform, acquisition, frequency, and payment risks.
10. End with the smallest milestone that produces new evidence.

If new evidence weakens the premise, move back to validation instead of defending the shaped product.

## Handle personal and novelty-driven ideas

Provide a safe holding structure for rapid idea generation. Default the cooling-off period to 72 hours, configurable by the user. Bypass it only for a documented urgent problem, an already validated problem, or a deliberate personal project.

Require at least one external evidence source before recommending market-oriented coding. Do not pathologize creativity or neurodivergence. For a deliberate personal build, say exactly:

> There is nothing wrong with building this for yourself. The only mistake would be confusing personal value with market validation.

Then classify the work honestly and help scope it according to that classification if requested.

## Persist artifacts safely

For persistent work, use a `problem-proof/` directory in the user's chosen location. If no repository exists, ask for or use the current working directory only when that is clearly acceptable.

Initialize with:

```bash
python3 <this-skill-dir>/scripts/problemproof_workspace.py init --root <chosen-directory> --title "<idea title>"
```

Use `add` as the preferred user-facing alias for local capture:

```bash
python3 <this-skill-dir>/scripts/problemproof_workspace.py add --root <chosen-directory> --title "<idea title>"
```

Use the script's `gate`, `decision`, `transition`, and `check` commands as defined in `references/artifact-contract.md`. Never use `--force`; the script intentionally refuses to overwrite existing files. Record important changes in `history.md` and keep evidence IDs traceable from scorecards and decisions.

## Publish to ProblemProof

Use `publish` only when the user explicitly confirms that a problem should be public. Publish only the solution-free problem statement, target group, region, category, consequence, origin, participant ID, and `source=skill`. Do not include raw notes, private transcripts, secrets, repository names that should remain private, or personal data about third parties.

Run:

```bash
python3 <this-skill-dir>/scripts/problemproof_workspace.py publish \
  --statement "<solution-free problem>" \
  --origin firsthand \
  --target-group "<smallest target group>" \
  --region "<region>" \
  --category "<category>" \
  --consequence "<observable consequence>" \
  --participant-id "<stable local participant id>" \
  --yes
```

The default API target is `https://problemproof.moinsen.dev/api/problems`. Use `--api-url` for local or staging environments.
