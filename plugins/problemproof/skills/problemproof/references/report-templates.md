# ProblemProof report templates

## Contents

1. Interaction summaries
2. Problem Validation report
3. Opportunity Shaping report
4. Validated Learning report
5. Focused intent outputs

## 1. Interaction summaries

During discovery, remain concise. After each phase summarize:

- **Facts learned:** traceable statements and evidence IDs.
- **Assumptions still live:** beliefs not yet established.
- **Decisive unknown:** the one unknown most likely to change the decision.
- **Next question:** one focused question only.

Do not force a full report after every answer. Generate the detailed report when requested, when making a decision, or when a validation phase closes.

## 2. Problem Validation report

Use all sections. Mark unavailable information `Unknown`; never fill gaps with plausible fiction.

### A. Idea summary

Describe the proposed idea neutrally without praise.

### B. Underlying problem

Express the problem without referring to the proposed product. Include trigger, affected user, desired outcome, root cause if supported, and consequence.

### C. Current evidence level

Classify available evidence as anecdotal, inferred, observed, qualitative, quantitative, behavioral, or transactional. Cite evidence IDs and limitations.

### D. User and target-group distinction

Separate what the user personally experiences, what is known about other people, and what is assumed.

### E. Current alternatives

Include direct products, indirect tools, manual workarounds, professionals, avoidance, and doing nothing. State observed satisfaction or dissatisfaction.

### F. Adoption-cost analysis

List every behavior users and buyers must perform. Compare the total burden with the original problem.

### G. Problem scorecard

Use this table shape for all 12 dimensions:

| Dimension | Score 0–5 | Confidence | Direction | Evidence | Basis | Critical unknown |
|---|---:|---|---|---|---|---|

State: “Scores are not averaged. A low-confidence zero means unproven, not disproven.”

### H. Strongest argument for the idea

Steelman the opportunity using only the strongest available evidence.

### I. Strongest argument against the idea

Present the most credible reason the product may not be needed, adopted, reachable, or paid for.

### J. Critical assumptions

List only assumptions capable of invalidating the opportunity. Give each a stable assumption ID, falsifier, and current status.

### K. Validation experiments

Order experiments by cost and decision value. For each include hypothesis, segment, method, MVP/learning artifact, primary metric, time/spend cap, success threshold, ambiguous band, failure threshold, and evidence captured. Never default to building a full application.

### L. Stop criteria

Define evidence that causes Stop, Narrow, or Reframe. Make criteria observable and set them before the experiment.

### M. Recommendation

Choose exactly one allowed recommendation. Add an optional justified verdict label, gate failures, the next evidence-producing action, and what result would change the recommendation.

## 3. Opportunity Shaping report

Before writing this report, confirm every evidence-gate item and the user's explicit request to shape.

### A. Validated problem statement

Use exactly this form:

> When [specific user] is in [specific situation], they struggle to [desired outcome] because [root cause], resulting in [measurable consequence].

Cite the evidence IDs supporting each substantive clause.

### B. Initial target segment

Define the smallest group with the strongest verified problem, including relevant exclusions.

### C. Job to be done

Describe functional, emotional, and social jobs separately.

### D. Existing alternatives

Include direct competitors, indirect competitors, manual workarounds, professionals, avoidance, and non-consumption.

### E. Differentiation hypothesis

Explain why this segment might switch, the minimum behavior change, and what evidence is still missing. Label this as a hypothesis.

### F. Core product boundary

Define the smallest useful outcome, core capability boundary, explicit non-goals, and dependencies.

### G. Evidence-backed features

For each proposed feature include:

| Feature | Problem addressed | Expected outcome | Evidence IDs | Risk | Validation method |
|---|---|---|---|---|---|

Exclude features without traceable problem evidence.

### H. Distribution hypothesis

State where first users can be reached, why they would listen, who has access, and the cheapest channel test.

### I. Business-model hypothesis

Identify beneficiary, user, buyer, payment trigger, plausible pricing logic, and evidence still required.

### J. Product risks

Cover weak demand, behavior change, trust, privacy, competition, platform dependency, acquisition cost, low frequency, and willingness to pay. Add domain-specific risks when material.

### K. Next milestone

Define the smallest evidence-producing step, its threshold, time/spend cap, and the decision it unlocks. Do not equate implementation output with progress unless the implementation directly tests a critical assumption.

## 4. Validated Learning report

Use this report for `hypotheses`, `mvp`, `loop`, or a Lean-informed `experiment`. Keep it tied to the ProblemProof gate.

### A. Problem gate status

State the current evidence level, unresolved gate items, and whether Lean is being used before or after the gate.

### B. Value hypothesis

Write one falsifiable value hypothesis with target segment, behavior, time window, and threshold.

### C. Growth hypothesis

Write one falsifiable growth hypothesis. If distribution is not yet testable, write `Unknown — segment/channel not narrow enough yet` and explain the missing information.

### D. Riskiest assumption

Name the one assumption most likely to kill demand, adoption, reachability, or payment. Cite assumption/evidence IDs where available.

### E. MVP / learning artifact

Define the smallest artifact to build, explicit non-goals, and why it is cheaper than a full app.

### F. Measure plan

Define primary actionable metric, guardrail metrics, sample/recruitment, data-quality risks, and baseline if known.

### G. Thresholds and accounting

Set success, ambiguous, and failure thresholds in advance. State how the result will be recorded in `evidence.md`, `experiments.md`, and `hypotheses.md`.

### H. Learn decision

Precommit to stop, narrow, reframe, pivot, persevere with the next assumption, or proceed to opportunity shaping only if the evidence gate passes.

## 5. Focused intent outputs

- `capture`: idea trigger, observed problem, proposed solution, personal relevance, assumed segment, current evidence, open questions, and reassessment date.
- `challenge`: strongest failure thesis, supporting negative evidence, hidden behavior changes, fatal assumptions, and falsifiers.
- `evidence`: evidence ledger grouped by supports, contradicts, mixed, and missing; include independence and quality caveats.
- `experiment`: one recommended experiment first, including hypothesis, MVP/learning artifact, metric, thresholds, and decision rule; add a cheaper fallback only if useful.
- `hypotheses`: value hypothesis, growth hypothesis, riskiest assumption, current gate state, and evidence needed next.
- `mvp`: minimum viable learning artifact, build scope, explicit non-goals, metric contract, and stop/pivot/persevere thresholds.
- `loop`: Build-Measure-Learn plan, innovative-accounting baseline, thresholds, learning decision, and artifact updates.
- `score`: the complete scorecard plus decisive unknowns; no total.
- `compare`: side-by-side dimensions, evidence quality, fatal unknowns, and recommended next test for each idea; no winner by total score.
- `park`: capture summary, reason parked, cooling-off date, reassessment trigger, and no implied build commitment.
- `personal`: honest classification, personal success criterion, time/spend boundary, and an explicit statement that market validation has not occurred.
- `decision`: one allowed recommendation, rationale, stop criteria, gate state, and what evidence would reverse it.
- `status`: operational stage, evidence level, gate table, current verdict, next action, and cooling-off date.
