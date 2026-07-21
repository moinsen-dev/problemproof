# Lean Startup validated-learning layer

## Contents

1. Role inside ProblemProof
2. Hypotheses
3. MVP as learning artifact
4. Build-Measure-Learn loop
5. Metrics and innovative accounting
6. Pivot, persevere, or stop
7. Output contract

## 1. Role inside ProblemProof

Use Lean Startup only after the problem is expressed without the proposed solution. Lean methods help test assumptions; they do not replace evidence that a relevant problem exists.

Before the ProblemProof evidence gate passes, use Lean methods only to resolve the current decisive unknown. After the gate passes, use them to test adoption, channel, payment, or product-boundary hypotheses.

Never treat an MVP as permission to build a full product. In this skill, MVP means **minimum viable learning artifact**: the smallest thing that can produce credible evidence for or against one hypothesis.

## 2. Hypotheses

Separate these hypotheses:

- `value_hypothesis`: A falsifiable claim that the target segment gets meaningful value or changes behavior because the problem is real and painful enough.
- `growth_hypothesis`: A falsifiable claim about how reachable target users discover, trust, adopt, or share the offer.
- `riskiest_assumption`: The single assumption most likely to invalidate demand, adoption, reachability, or payment.

Good hypotheses name segment, situation, expected behavior, time window, and evidence threshold.

Weak:

> People will want a better project idea validator.

Better:

> In 14 days, at least 5 of 20 solo developers who recently started a new repo before validating demand will submit one real idea to a ProblemProof repo-gate and accept a stop/validate-before-building decision.

Growth hypotheses are premature when no narrow segment or channel exists. Mark them as unknown rather than inventing distribution.

## 3. MVP as learning artifact

Choose the smallest artifact that tests the riskiest assumption:

1. Interview script or incident audit — tests whether recent concrete incidents exist.
2. Concierge/manual service — tests whether users value the outcome without software.
3. Fake door — tests whether target users attempt the behavior when shown a concrete offer.
4. Landing page with one action — tests a channel and explicit commitment.
5. Clickable prototype — tests one adoption-critical behavior or trust requirement.
6. Paid pilot, deposit, pre-order, or LOI — tests willingness to commit.

Avoid building infrastructure, accounts, dashboards, automations, and polished apps unless that exact behavior is the critical assumption. If the experiment cannot change a decision, it is not an MVP.

## 4. Build-Measure-Learn loop

Define the loop before building:

- `build`: artifact, scope, non-goals, time/spend cap.
- `measure`: primary metric, guardrails, sample, collection method, and data-quality risks.
- `learn`: exact decision rule and what artifact will be recorded in `evidence.md` or `experiments.md`.

Keep the loop short. A 1–7 day loop is usually preferred for early validation; longer loops need a reason tied to user behavior.

## 5. Metrics and innovative accounting

Use actionable metrics tied to behavior:

- recent incidents discovered;
- repeated use;
- completed workflow;
- reply rate from a narrow channel;
- qualified problem submissions;
- time saved in observed workflow;
- manual service requests;
- deposits, paid pilots, LOIs, or purchases;
- retention or repeated return to solve the same problem.

Treat these as weak or vanity metrics unless connected to a hypothesis:

- page views;
- impressions;
- likes;
- compliments;
- generic waitlist signups;
- "sounds useful" survey answers;
- clicks from untargeted traffic.

Innovative accounting means:

1. establish a baseline for one meaningful behavior;
2. set the target needed to change the decision;
3. record whether the experiment moved the behavior enough to stop, narrow, pivot, or continue.

## 6. Pivot, persevere, or stop

Use these decisions:

- `stop`: evidence contradicts a meaningful problem or adoption is worse than the problem.
- `narrow`: a smaller segment shows stronger signal than the original segment.
- `reframe`: users describe a different problem than the one assumed.
- `pivot`: keep the learning goal but change segment, channel, value proposition, workflow, or payment path.
- `persevere`: the hypothesis meets the precommitted success threshold; define the next riskiest assumption.
- `proceed-to-opportunity-shaping`: only after every ProblemProof evidence-gate item passes.

Do not use `persevere` to justify scaling. It means continue learning with the next highest-risk assumption.

## 7. Output contract

For `hypotheses`, `mvp`, `loop`, or an experiment using this layer, output:

```text
Problem gate status:
Value hypothesis:
Growth hypothesis:
Riskiest assumption:
MVP / learning artifact:
Build scope and non-goals:
Primary metric:
Guardrail metrics:
Success threshold:
Ambiguous band:
Failure threshold:
Pivot / persevere / stop rule:
Evidence artifact to record:
```

If persistence is in scope, add or update `hypotheses.md` and `experiments.md`, then append `history.md`.
