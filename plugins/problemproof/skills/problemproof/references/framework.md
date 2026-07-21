# ProblemProof evidence and decision framework

## Contents

1. Evidence levels
2. Evidence discipline
3. Analysis dimensions
4. Scorecard rules
5. Evidence gate
6. Bias and solution checks
7. Experiment design
8. Comparison and recommendation rules

## 1. Evidence levels

Classify the idea at its highest supported level, not its most attractive plausible level.

### Level 1 — Interesting observation

Something appears inefficient, surprising, annoying, or technically improvable. No evidence yet establishes a meaningful user problem.

### Level 2 — Personal problem

The user has experienced a concrete problem and would value relief. This proves one person's experience only.

### Level 3 — Shared problem

A specific group shows a repeated pattern of concrete incidents with meaningful frequency, severity, or consequence. Evidence must be independent of the user's assumption.

### Level 4 — Product opportunity

The group recognizes the problem, uses or seeks alternatives, bears measurable cost or risk, is willing to change relevant behavior, and has a plausible adoption or payment reason. All evidence-gate items must pass.

Use these optional verdict labels without implying a numeric aggregate:

- `IDEA ONLY`
- `PERSONAL PROBLEM`
- `PLAUSIBLE SHARED PROBLEM`
- `VALIDATION REQUIRED`
- `VALIDATED OPPORTUNITY`
- `DO NOT BUILD YET`
- `PROCEED TO OPPORTUNITY SHAPING`

## 2. Evidence discipline

### Separate claims

- **Fact:** Directly supported by a traceable source or observation.
- **Assumption:** Currently accepted for planning but not established.
- **Hypothesis:** A falsifiable prediction connecting a cause, behavior, or outcome.
- **Unknown:** Missing information without a justified directional belief.

### Classify evidence

Use one or more brief types from the specification: `anecdotal`, `inferred`, `observed`, `qualitative`, `quantitative`, `behavioral`, or `transactional`.

Record for each item:

- stable evidence ID;
- date and source;
- target segment and situation;
- concrete behavior or claim;
- support, contradiction, or mixed direction;
- independence from other evidence;
- limitations and possible selection bias.

Evidence strength is contextual. Use this rough ordering only as a challenge heuristic:

1. founder intuition or personal preference;
2. secondhand claims and generic online reactions;
3. direct accounts of recent concrete incidents;
4. observed workarounds, time spent, search, switching, or repeated use;
5. quantitative recurrence in the relevant segment;
6. deposits, pre-orders, paid pilots, purchases, or costly commitments.

Do not count compliments, hypothetical intent, or a waitlist as equivalent to use or payment. Do not count multiple retellings of the same source as independent evidence. Existing competitors demonstrate that solutions exist, not that this segment is dissatisfied or reachable.

Research sources may show language, alternatives, or prevalence. They cannot by themselves establish that the proposed users will switch or pay. Include source links and access dates when research is performed.

## 3. Analysis dimensions

### Problem clarity

- Express the problem without the proposed solution.
- Identify the trigger, desired outcome, root cause, and observable consequence.
- Classify it as outcome, workflow, emotional, financial, risk, or convenience related.

### Target group specificity

- Name the narrowest reachable group with shared context.
- State whether the user belongs to it.
- Test whether similarity to the user is assumed rather than observed.

### Frequency and severity

- Record recurrence as daily, weekly, monthly, annual, or exceptional.
- Measure what happens when nothing changes: time, money, risk, uncertainty, embarrassment, or failure.
- Treat rare high-severity problems separately from frequent inconveniences.

### Existing behavior and dissatisfaction

- Include direct tools, indirect tools, spreadsheets, messages, memory, professionals, routines, manual work, avoidance, and doing nothing.
- Observe switching, patching, repeated search, internal builds, or money spent.
- Ask whether the workaround is genuinely disliked or merely inelegant.

### Adoption cost and willingness to change

List every required behavior: discover, install, create an account, grant access, enter or migrate data, learn a workflow, invite others, persuade a buyer, change habits, maintain data, trust automation, and pay. Compare this burden with the original problem.

### Demand, payment, reachability, and distribution

- Separate problem recognition from desire for this solution.
- Identify who benefits, who chooses, who uses, and who pays.
- Look for costly commitments, not only stated interest.
- Identify a concrete channel where the initial segment already gathers and why they would listen.

### Founder advantage and feasibility

- Record access, credibility, lived expertise, data, distribution, or workflow advantage.
- Assess technical feasibility, but never use it as demand evidence.
- Assess whether distribution is feasible at the likely value and usage frequency.

## 4. Scorecard rules

Score every dimension from 0 to 5. Never average, sum, weight, or rank by a composite score.

Use the scale consistently:

- `0`: unproven or directly contradicted; use `evidence_direction` to disambiguate.
- `1`: very weak support or material negative evidence.
- `2`: limited support with major unresolved assumptions.
- `3`: credible support with meaningful gaps.
- `4`: strong, relevant, repeated support.
- `5`: unusually strong behavioral or transactional evidence with few material gaps.

Assign `confidence` as `low`, `medium`, or `high`. Confidence describes trust in the score, not opportunity quality. A high-confidence low score is strong negative evidence; a low-confidence zero usually means unknown.

For each dimension include score, confidence, evidence direction, evidence IDs, basis, assumptions, and the most important unknowns.

Required dimensions:

1. Problem clarity
2. Target group specificity
3. Frequency
4. Severity
5. Existing workaround dissatisfaction
6. Evidence of demand
7. Willingness to change
8. Willingness to pay
9. Reachability of users
10. Founder advantage
11. Technical feasibility
12. Distribution feasibility

## 5. Evidence gate

A scorecard never opens the gate by itself. Pass every item with a written rationale and traceable evidence where applicable:

1. `problem_clear`: A concrete solution-free problem, trigger, desired outcome, and consequence are established.
2. `segment_specific`: The initial segment is narrow, investigable, and reachable.
3. `external_pattern`: Independent target users show recent concrete incidents. Default to at least three; document why fewer are sufficient for rare, high-severity, or concentrated-buyer cases.
4. `behavioral_or_transactional_signal`: At least one relevant workaround, costly commitment, switch, repeated search, time or money spend, pilot, pre-order, or purchase is observed.
5. `alternatives_understood`: Current alternatives, non-consumption, and the segment's dissatisfaction are observed rather than guessed.
6. `adoption_tested`: The most demanding behavior change or trust requirement has been tested with target users.
7. `no_fatal_unknown`: No unsupported assumption remains that could independently invalidate demand, adoption, reachability, or payment.

External evidence is never optional. If a documented exception changes the default quantity, record the exception and why its evidence quality compensates.

Passing the gate permits the state `opportunity-ready`. Move into `shaping` only after an explicit user request.

## 6. Bias and solution checks

Challenge these distortions explicitly when present:

- “I have this problem, therefore many others do.”
- “The solution is elegant, therefore people will want it.”
- “No competitor exists, therefore this is an opportunity.”
- “Competitors exist, therefore this segment is validated.”
- “People said it sounds useful, therefore they will use it.”
- “People will use it because it is free.”
- “AI can build it cheaply, therefore it is worth building.”
- “A technically superior solution will automatically win.”
- “The user only needs to change a small habit.”
- “This feature should become a standalone product.”

Temporarily remove the solution and ask whether the problem could be solved by doing nothing, avoiding the trigger, changing a workflow, using an existing tool, paying a professional, or accepting the inconvenience. Test whether the proposed product automates a rare inconvenience or creates more friction than it removes.

## 7. Experiment design

Choose the cheapest test that can change the decision. Prefer this ladder when appropriate:

1. targeted community and search research;
2. incident-focused interviews;
3. direct observation of current work;
4. manual concierge service;
5. fake-door or landing-page behavior test;
6. prototype of one adoption-critical behavior;
7. deposit, pre-order, letter of intent, or paid pilot.

Do not prescribe the ladder mechanically. Match the test to the critical assumption. Before starting, define:

- hypothesis and segment;
- recruitment method and sample limitations;
- exact behavior or measurement;
- maximum time and spend;
- success threshold;
- ambiguous band and follow-up;
- failure threshold and stop, narrow, or reframe action;
- evidence artifact to record.

Avoid leading questions such as “Would you use this?” Prefer recent incidents, current behavior, demonstrated cost, and real commitments.

## 8. Comparison and recommendation rules

Compare multiple ideas dimension by dimension. Prioritize evidence quality, consequence, workaround dissatisfaction, behavior change, reachability, and decisive unknowns. Do not use total scores. Technical excitement is not a tiebreaker unless the user explicitly chooses a learning or creative project.

End validation with exactly one recommendation:

- Stop
- Observe further
- Validate before building
- Narrow the target group
- Reframe the problem
- Prototype one critical assumption
- Proceed to opportunity shaping

Justify it in plain language, name what evidence would change it, and provide the next smallest evidence-producing action.
