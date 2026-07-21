#!/usr/bin/env python3
"""Create and validate non-destructive ProblemProof artifact workspaces."""

from __future__ import annotations

import argparse
import getpass
import json
import os
import re
import sys
import tempfile
import webbrowser
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlparse
from urllib.request import Request, urlopen


SCHEMA_VERSION = "1.0"
DEFAULT_SITE_URL = "https://problemproof.moinsen.dev"
DEFAULT_API_URL = "https://problemproof.moinsen.dev/api/problems"
CONFIG_VERSION = "1.0"
PROJECT_FILES = (
    "state.json",
    "idea.md",
    "assumptions.md",
    "evidence.md",
    "interviews.md",
    "alternatives.md",
    "experiments.md",
    "scorecard.json",
    "decision.md",
    "opportunity.md",
    "history.md",
)

DIMENSIONS = (
    "problem-clarity",
    "target-group-specificity",
    "frequency",
    "severity",
    "existing-workaround-dissatisfaction",
    "evidence-of-demand",
    "willingness-to-change",
    "willingness-to-pay",
    "reachability-of-users",
    "founder-advantage",
    "technical-feasibility",
    "distribution-feasibility",
)

GATE_ITEMS = (
    "problem_clear",
    "segment_specific",
    "external_pattern",
    "behavioral_or_transactional_signal",
    "alternatives_understood",
    "adoption_tested",
    "no_fatal_unknown",
)

GATE_EVIDENCE_REQUIRED = {
    "external_pattern",
    "behavioral_or_transactional_signal",
    "alternatives_understood",
    "adoption_tested",
}

STAGES = (
    "captured",
    "validating",
    "parked",
    "personal",
    "opportunity-ready",
    "shaping",
    "shaped",
    "stopped",
)

TRANSITIONS = {
    "captured": {"validating", "parked", "personal", "stopped"},
    "validating": {"parked", "personal", "opportunity-ready", "stopped"},
    "parked": {"validating", "personal", "stopped"},
    "personal": {"validating", "parked", "stopped"},
    "opportunity-ready": {"validating", "shaping", "parked", "stopped"},
    "shaping": {"validating", "shaped", "parked", "stopped"},
    "shaped": {"validating", "shaping", "parked", "stopped"},
    "stopped": {"validating", "parked", "personal"},
}

VERDICTS = (
    "idea-only",
    "personal-problem",
    "plausible-shared-problem",
    "validation-required",
    "validated-opportunity",
    "do-not-build-yet",
    "proceed-to-opportunity-shaping",
)

RECOMMENDATIONS = (
    "stop",
    "observe-further",
    "validate-before-building",
    "narrow-target-group",
    "reframe-problem",
    "prototype-critical-assumption",
    "proceed-to-opportunity-shaping",
)

EVIDENCE_ID = re.compile(r"^E-[0-9]{3,}$")


class WorkspaceError(RuntimeError):
    """A user-correctable workspace integrity error."""


def config_dir() -> Path:
    override = os.environ.get("PROBLEMPROOF_CONFIG_DIR")
    if override:
        return Path(override).expanduser().resolve()
    xdg_config = os.environ.get("XDG_CONFIG_HOME")
    if xdg_config:
        return Path(xdg_config).expanduser().resolve() / "problemproof"
    return Path.home().resolve() / ".config" / "problemproof"


def config_path() -> Path:
    return config_dir() / "config.json"


def load_config() -> dict[str, Any]:
    path = config_path()
    if not path.is_file():
        return {"schema_version": CONFIG_VERSION}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise WorkspaceError(f"invalid ProblemProof config: {path}: {error}") from error
    if not isinstance(data, dict):
        raise WorkspaceError(f"ProblemProof config must contain a JSON object: {path}")
    return data


def save_config(data: dict[str, Any]) -> Path:
    path = config_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    data["schema_version"] = CONFIG_VERSION
    atomic_write_json(path, data)
    try:
        path.chmod(0o600)
    except OSError:
        pass
    return path


def configured_token() -> str:
    token = os.environ.get("PROBLEMPROOF_TOKEN", "").strip()
    if token:
        return token
    value = load_config().get("token", "")
    return value.strip() if isinstance(value, str) else ""


def site_api_url(site_url: str, path: str) -> str:
    return f"{site_url.rstrip('/')}{path}"


def api_get_json(url: str, token: str, timeout_seconds: int) -> dict[str, Any]:
    headers = {
        "accept": "application/json",
        "user-agent": "ProblemProofSkill/0.1 (+https://github.com/moinsen-dev/problemproof)",
    }
    if token:
        headers["authorization"] = f"Bearer {token}"
    request = Request(url, headers=headers, method="GET")
    try:
        with urlopen(request, timeout=timeout_seconds) as response:
            response_body = response.read().decode("utf-8")
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise WorkspaceError(f"request failed with HTTP {error.code}: {detail}") from error
    except URLError as error:
        raise WorkspaceError(f"request failed: {error.reason}") from error
    try:
        data = json.loads(response_body)
    except json.JSONDecodeError as error:
        raise WorkspaceError(f"request returned invalid JSON: {response_body}") from error
    if not isinstance(data, dict):
        raise WorkspaceError("request returned non-object JSON")
    return data


def compact_title(statement: str) -> str:
    normalized = " ".join(statement.split()).rstrip(".!?:;")
    if len(normalized) <= 80:
        return normalized
    return normalized[:77].strip() + "…"


def site_url_from_api_url(api_url: str) -> str:
    parsed = urlparse(api_url)
    if not parsed.scheme or not parsed.netloc:
        return DEFAULT_SITE_URL
    return f"{parsed.scheme}://{parsed.netloc}"


def remote_problem_from_state(state: dict[str, Any]) -> dict[str, Any]:
    remote = state.get("remote_problem")
    return remote if isinstance(remote, dict) else {}


def problem_identifier(args: argparse.Namespace, state: dict[str, Any] | None = None) -> str:
    explicit = getattr(args, "problem", None)
    if explicit:
        return str(explicit)
    if state:
        remote = remote_problem_from_state(state)
        for key in ("slug", "id"):
            value = remote.get(key)
            if value:
                return str(value)
    raise WorkspaceError("no remote problem is linked; pass --problem or publish with --project first")


def fetch_problem(site_url: str, identifier: str, token: str, timeout_seconds: int) -> dict[str, Any]:
    return api_get_json(
        site_api_url(site_url, f"/api/problems/{quote(identifier)}"),
        token,
        timeout_seconds,
    )


def remote_problem_snapshot(problem: dict[str, Any], site_url: str) -> dict[str, Any]:
    return {
        "id": problem.get("id"),
        "slug": problem.get("slug"),
        "title": problem.get("title"),
        "url": problem.get("url") or site_api_url(site_url, f"/problems/{problem.get('slug')}"),
        "validation_status": problem.get("validationStatus"),
        "metrics": {
            "views": problem.get("views", 0),
            "shares": problem.get("shares", 0),
            "confirmations": problem.get("confirmations", 0),
            "incidents": problem.get("incidents", 0),
            "averageSeverity": problem.get("averageSeverity"),
        },
        "last_synced_at": timestamp(),
    }


def save_remote_problem(project: Path, problem: dict[str, Any], site_url: str, event_type: str) -> dict[str, Any]:
    state = load_valid_state(project)
    previous = remote_problem_from_state(state)
    snapshot = remote_problem_snapshot(problem, site_url)
    if previous.get("published_at"):
        snapshot["published_at"] = previous["published_at"]
    elif event_type == "problem-published":
        snapshot["published_at"] = timestamp()
    state["remote_problem"] = snapshot
    state["updated_at"] = timestamp()
    atomic_write_json(project / "state.json", state)
    append_history(
        project,
        event_type,
        f"Remote problem `{snapshot.get('title')}` linked at {snapshot.get('url')}. "
        f"Validation: {snapshot.get('validation_status') or 'unknown'}. "
        f"Metrics: {json.dumps(snapshot.get('metrics'), ensure_ascii=False)}",
    )
    return snapshot


def print_remote_problem(problem: dict[str, Any]) -> None:
    print(f"Problem: {problem.get('title')}")
    print(f"URL: {problem.get('url')}")
    print(f"Status: {problem.get('validationStatus')}")
    print(f"Views: {problem.get('views', 0)}")
    print(f"Shares: {problem.get('shares', 0)}")
    print(f"Confirmations: {problem.get('confirmations', 0)}")
    print(f"Incidents: {problem.get('incidents', 0)}")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def timestamp(value: datetime | None = None) -> str:
    return (value or utc_now()).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def single_line(value: str, label: str, maximum: int = 500) -> str:
    normalized = " ".join(value.split())
    if not normalized:
        raise WorkspaceError(f"{label} must not be empty")
    if len(normalized) > maximum:
        raise WorkspaceError(f"{label} must be at most {maximum} characters")
    return normalized


def project_path(value: str) -> Path:
    path = Path(value).expanduser().resolve()
    if not path.is_dir():
        raise WorkspaceError(f"project directory does not exist: {path}")
    return path


def validate_project_dir_name(value: str) -> str:
    candidate = Path(value)
    if (
        not value
        or value in {".", ".."}
        or candidate.is_absolute()
        or len(candidate.parts) != 1
        or candidate.name != value
    ):
        raise WorkspaceError("--project-dir must be one relative directory name")
    return value


def slug_directory(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return (normalized or "idea")[:48].strip("-") or "idea"


def write_new_text(path: Path, content: str) -> bool:
    try:
        with path.open("x", encoding="utf-8", newline="\n") as handle:
            handle.write(content)
    except FileExistsError:
        return False
    return True


def write_new_json(path: Path, data: dict[str, Any]) -> bool:
    return write_new_text(path, json.dumps(data, indent=2, ensure_ascii=False) + "\n")


def atomic_write_json(path: Path, data: dict[str, Any]) -> None:
    descriptor, temporary_name = tempfile.mkstemp(
        prefix=f".{path.name}.", suffix=".tmp", dir=path.parent
    )
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as handle:
            json.dump(data, handle, indent=2, ensure_ascii=False)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary_name, path)
    except Exception:
        try:
            os.unlink(temporary_name)
        except FileNotFoundError:
            pass
        raise


def load_json(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise WorkspaceError(f"missing required file: {path.name}") from error
    except json.JSONDecodeError as error:
        raise WorkspaceError(f"invalid JSON in {path.name}: {error}") from error
    if not isinstance(data, dict):
        raise WorkspaceError(f"{path.name} must contain a JSON object")
    return data


def gate_passed(state: dict[str, Any]) -> bool:
    gate = state.get("gate", {})
    return all(gate.get(item, {}).get("status") == "passed" for item in GATE_ITEMS)


def append_history(project: Path, event_type: str, summary: str) -> None:
    history = project / "history.md"
    if not history.is_file():
        raise WorkspaceError("missing required file: history.md")
    event_time = timestamp()
    with history.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write(f"\n## {event_time} — {event_type}\n\n{summary}\n")


def initial_state(title: str, now: datetime, cooling_off_hours: int) -> dict[str, Any]:
    return {
        "schema_version": SCHEMA_VERSION,
        "title": title,
        "stage": "captured",
        "verdict": "idea-only",
        "recommendation": "observe-further",
        "created_at": timestamp(now),
        "updated_at": timestamp(now),
        "cooling_off_until": timestamp(now + timedelta(hours=cooling_off_hours)),
        "gate": {
            item: {"status": "unknown", "evidence_ids": [], "note": ""}
            for item in GATE_ITEMS
        },
    }


def initial_scorecard(now: datetime) -> dict[str, Any]:
    return {
        "schema_version": SCHEMA_VERSION,
        "updated_at": timestamp(now),
        "dimensions": [
            {
                "name": name,
                "score": 0,
                "confidence": "low",
                "evidence_direction": "unknown",
                "evidence_ids": [],
                "basis": "Unassessed.",
                "assumptions": [],
                "unknowns": [],
            }
            for name in DIMENSIONS
        ],
    }


def markdown_templates(title: str, now: datetime, cooling_off_hours: int) -> dict[str, str]:
    created = timestamp(now)
    reassess = timestamp(now + timedelta(hours=cooling_off_hours))
    return {
        "idea.md": f"""# {title}

## Capture

- Created: {created}
- Trigger:
- Observed problem:
- Proposed solution:
- Personal relevance:
- Assumed target group:
- Current evidence:
- Open questions:
- Earliest reassessment: {reassess}

## Solution-free problem statement

Not yet established.
""",
        "assumptions.md": """# Assumptions

| ID | Assumption | Type | Status | Evidence IDs | Falsifier | Created | Updated |
|---|---|---|---|---|---|---|---|
""",
        "evidence.md": """# Evidence ledger

| ID | Date | Source | Segment and situation | Type | Direction | Observation | Independent? | Limitations | Linked claims |
|---|---|---|---|---|---|---|---|---|---|
""",
        "interviews.md": """# Interviews

Use anonymized IDs by default. Record recent concrete incidents and behavior, not generic opinions.

| ID | Date | Segment fit | Recent incident | Current behavior | Consequence | Direct language | Commitment | Contradiction | Follow-up |
|---|---|---|---|---|---|---|---|---|---|
""",
        "alternatives.md": """# Alternatives

| Alternative | Type | Situation | Switching cost | Observed satisfaction | Evidence IDs | Unknowns |
|---|---|---|---|---|---|---|

Include doing nothing and avoiding the problem.
""",
        "experiments.md": """# Experiments

| ID | Hypothesis | Segment | Method | Time/spend cap | Success | Ambiguous | Failure | Result | Evidence IDs | Decision |
|---|---|---|---|---|---|---|---|---|---|---|

Fix thresholds before running an experiment.
""",
        "decision.md": """# Decision

- Recommendation: Observe further
- Evidence level: Anecdotal or unknown
- Updated: Not yet assessed

## Rationale

No validation decision has been made.

## Stop, narrow, or reframe criteria

Not yet defined.
""",
        "opportunity.md": """# Opportunity shaping

Blocked until every evidence-gate item passes and the user explicitly requests shaping.
""",
        "history.md": f"""# History

Append events; do not rewrite earlier entries.

## {created} — workspace-created

Captured “{title}” with a {cooling_off_hours}-hour cooling-off period.
""",
    }


def command_init(args: argparse.Namespace) -> None:
    title = single_line(args.title, "title", maximum=200)
    if args.cooling_off_hours < 0 or args.cooling_off_hours > 8760:
        raise WorkspaceError("--cooling-off-hours must be between 0 and 8760")
    directory_name = validate_project_dir_name(args.project_dir)
    root = Path(args.root).expanduser().resolve()
    root.mkdir(parents=True, exist_ok=True)
    if not root.is_dir():
        raise WorkspaceError(f"root is not a directory: {root}")
    project = root / directory_name
    project.mkdir(exist_ok=True)
    if not project.is_dir():
        raise WorkspaceError(f"project is not a directory: {project}")

    now = utc_now()
    created: list[str] = []
    skipped: list[str] = []
    if write_new_json(
        project / "state.json",
        initial_state(title, now, args.cooling_off_hours),
    ):
        created.append("state.json")
    else:
        skipped.append("state.json")
    if write_new_json(project / "scorecard.json", initial_scorecard(now)):
        created.append("scorecard.json")
    else:
        skipped.append("scorecard.json")
    for filename, content in markdown_templates(
        title, now, args.cooling_off_hours
    ).items():
        if write_new_text(project / filename, content):
            created.append(filename)
        else:
            skipped.append(filename)

    print(f"Project: {project}")
    print(f"Created: {', '.join(created) if created else 'none'}")
    print(f"Preserved existing: {', '.join(skipped) if skipped else 'none'}")


def validate_state(state: dict[str, Any], errors: list[str]) -> None:
    if state.get("schema_version") != SCHEMA_VERSION:
        errors.append(f"state.json schema_version must be {SCHEMA_VERSION}")
    if state.get("stage") not in STAGES:
        errors.append("state.json has an invalid stage")
    if state.get("verdict") not in VERDICTS:
        errors.append("state.json has an invalid verdict")
    if state.get("recommendation") not in RECOMMENDATIONS:
        errors.append("state.json has an invalid recommendation")
    gate = state.get("gate")
    if not isinstance(gate, dict):
        errors.append("state.json gate must be an object")
        return
    if set(gate) != set(GATE_ITEMS):
        errors.append("state.json gate must contain exactly the seven required items")
    for item in GATE_ITEMS:
        value = gate.get(item)
        if not isinstance(value, dict):
            errors.append(f"gate item {item} must be an object")
            continue
        if value.get("status") not in {"unknown", "passed", "failed"}:
            errors.append(f"gate item {item} has an invalid status")
        evidence_ids = value.get("evidence_ids")
        if not isinstance(evidence_ids, list) or not all(
            isinstance(identifier, str) and EVIDENCE_ID.fullmatch(identifier)
            for identifier in evidence_ids
        ):
            errors.append(f"gate item {item} has invalid evidence IDs")
        if not isinstance(value.get("note"), str):
            errors.append(f"gate item {item} note must be a string")
        elif value.get("status") == "passed" and not value["note"].strip():
            errors.append(f"passed gate item {item} requires a written rationale")
        if (
            value.get("status") == "passed"
            and item in GATE_EVIDENCE_REQUIRED
            and not evidence_ids
        ):
            errors.append(f"passed gate item {item} requires evidence IDs")
    if state.get("stage") in {"opportunity-ready", "shaping", "shaped"} and not gate_passed(state):
        errors.append(f"stage {state.get('stage')} requires every gate item to pass")


def validate_scorecard(scorecard: dict[str, Any], errors: list[str]) -> None:
    if scorecard.get("schema_version") != SCHEMA_VERSION:
        errors.append(f"scorecard.json schema_version must be {SCHEMA_VERSION}")
    forbidden = {"total", "overall_score", "average", "weighted_score"}
    present = forbidden.intersection(scorecard)
    if present:
        errors.append(f"scorecard.json contains forbidden aggregate fields: {sorted(present)}")
    dimensions = scorecard.get("dimensions")
    if not isinstance(dimensions, list):
        errors.append("scorecard.json dimensions must be an array")
        return
    names = [item.get("name") for item in dimensions if isinstance(item, dict)]
    if names != list(DIMENSIONS):
        errors.append("scorecard.json dimensions must contain the 12 required items in order")
    for index, item in enumerate(dimensions):
        if not isinstance(item, dict):
            errors.append(f"scorecard dimension {index} must be an object")
            continue
        score = item.get("score")
        if not isinstance(score, int) or isinstance(score, bool) or not 0 <= score <= 5:
            errors.append(f"scorecard dimension {index} has an invalid score")
        if item.get("confidence") not in {"low", "medium", "high"}:
            errors.append(f"scorecard dimension {index} has invalid confidence")
        if item.get("evidence_direction") not in {
            "unknown",
            "supports",
            "contradicts",
            "mixed",
        }:
            errors.append(f"scorecard dimension {index} has invalid evidence direction")
        evidence_ids = item.get("evidence_ids")
        if not isinstance(evidence_ids, list) or not all(
            isinstance(identifier, str) and EVIDENCE_ID.fullmatch(identifier)
            for identifier in evidence_ids
        ):
            errors.append(f"scorecard dimension {index} has invalid evidence IDs")
        for key in ("basis", "assumptions", "unknowns"):
            if key not in item:
                errors.append(f"scorecard dimension {index} is missing {key}")


def workspace_errors(project: Path) -> list[str]:
    errors = [
        f"missing required file: {filename}"
        for filename in PROJECT_FILES
        if not (project / filename).is_file()
    ]
    if (project / "state.json").is_file():
        try:
            validate_state(load_json(project / "state.json"), errors)
        except WorkspaceError as error:
            errors.append(str(error))
    if (project / "scorecard.json").is_file():
        try:
            validate_scorecard(load_json(project / "scorecard.json"), errors)
        except WorkspaceError as error:
            errors.append(str(error))
    return errors


def command_check(args: argparse.Namespace) -> None:
    project = project_path(args.project)
    errors = workspace_errors(project)
    if errors:
        raise WorkspaceError("workspace check failed:\n- " + "\n- ".join(errors))
    print(f"OK: {project}")


def load_valid_state(project: Path) -> dict[str, Any]:
    state = load_json(project / "state.json")
    errors: list[str] = []
    validate_state(state, errors)
    if errors:
        raise WorkspaceError("invalid state.json:\n- " + "\n- ".join(errors))
    return state


def command_gate(args: argparse.Namespace) -> None:
    project = project_path(args.project)
    state = load_valid_state(project)
    note = single_line(args.note, "note")
    evidence_ids = list(dict.fromkeys(args.evidence_id or []))
    invalid_ids = [identifier for identifier in evidence_ids if not EVIDENCE_ID.fullmatch(identifier)]
    if invalid_ids:
        raise WorkspaceError(f"invalid evidence IDs: {', '.join(invalid_ids)}")
    if args.status == "passed" and args.item in GATE_EVIDENCE_REQUIRED and not evidence_ids:
        raise WorkspaceError(f"passing {args.item} requires at least one --evidence-id")
    if (
        state["stage"] in {"opportunity-ready", "shaping", "shaped"}
        and args.status != "passed"
    ):
        raise WorkspaceError(
            "transition back to validating before reopening a passed gate item"
        )

    previous = state["gate"][args.item]
    state["gate"][args.item] = {
        "status": args.status,
        "evidence_ids": evidence_ids,
        "note": note,
    }
    state["updated_at"] = timestamp()
    atomic_write_json(project / "state.json", state)
    append_history(
        project,
        "gate-updated",
        f"`{args.item}` changed from `{previous['status']}` to `{args.status}`. "
        f"Evidence: {', '.join(evidence_ids) if evidence_ids else 'none'}. Reason: {note}",
    )
    print(f"Updated gate item {args.item}: {args.status}")


def command_decision(args: argparse.Namespace) -> None:
    project = project_path(args.project)
    state = load_valid_state(project)
    reason = single_line(args.reason, "reason")
    requires_gate = (
        args.verdict in {"validated-opportunity", "proceed-to-opportunity-shaping"}
        or args.recommendation == "proceed-to-opportunity-shaping"
    )
    if requires_gate and not gate_passed(state):
        raise WorkspaceError("this verdict or recommendation requires every gate item to pass")
    previous_verdict = state["verdict"]
    previous_recommendation = state["recommendation"]
    state["verdict"] = args.verdict
    state["recommendation"] = args.recommendation
    state["updated_at"] = timestamp()
    atomic_write_json(project / "state.json", state)
    append_history(
        project,
        "decision-updated",
        f"Verdict `{previous_verdict}` → `{args.verdict}`; recommendation "
        f"`{previous_recommendation}` → `{args.recommendation}`. Reason: {reason}",
    )
    print(f"Decision: {args.verdict} / {args.recommendation}")


def command_transition(args: argparse.Namespace) -> None:
    project = project_path(args.project)
    state = load_valid_state(project)
    reason = single_line(args.reason, "reason")
    current = state["stage"]
    target = args.target_stage
    if target not in TRANSITIONS[current]:
        raise WorkspaceError(f"transition {current} -> {target} is not allowed")
    if target == "opportunity-ready" and not gate_passed(state):
        missing = [
            item for item in GATE_ITEMS if state["gate"][item]["status"] != "passed"
        ]
        raise WorkspaceError(
            "opportunity-ready requires every gate item to pass; unresolved: "
            + ", ".join(missing)
        )
    if target == "shaping" and current == "opportunity-ready" and not args.user_confirmed:
        raise WorkspaceError("transition to shaping requires --user-confirmed")

    state["stage"] = target
    if target == "opportunity-ready":
        state["verdict"] = "validated-opportunity"
        state["recommendation"] = "proceed-to-opportunity-shaping"
    elif target == "validating" and current in {"opportunity-ready", "shaping", "shaped"}:
        state["verdict"] = "validation-required"
        state["recommendation"] = "validate-before-building"
    elif target == "personal":
        state["verdict"] = "personal-problem"
    elif target == "stopped":
        state["verdict"] = "do-not-build-yet"
        state["recommendation"] = "stop"
    state["updated_at"] = timestamp()
    atomic_write_json(project / "state.json", state)
    append_history(
        project,
        "stage-transition",
        f"Stage `{current}` → `{target}`. Reason: {reason}",
    )
    print(f"Stage: {current} -> {target}")


def command_login(args: argparse.Namespace) -> None:
    token = (args.token or "").strip()
    if not token:
        token = getpass.getpass("ProblemProof token: ").strip()
    if not token:
        raise WorkspaceError("login requires a ProblemProof personal token")
    account = api_get_json(
        site_api_url(args.site_url, "/api/account/me"),
        token,
        args.timeout_seconds,
    )
    config = load_config()
    config["site_url"] = args.site_url.rstrip("/")
    config["token"] = token
    config["account"] = {
        "id": account.get("id"),
        "displayName": account.get("displayName"),
    }
    path = save_config(config)
    print(f"Logged in as {account.get('displayName')} (account {account.get('id')})")
    print(f"Config: {path}")
    print("Publishing will now use this account token unless PROBLEMPROOF_TOKEN is set.")


def command_status(args: argparse.Namespace) -> None:
    if getattr(args, "project", None) or getattr(args, "problem", None):
        project = project_path(args.project) if getattr(args, "project", None) else None
        state = load_valid_state(project) if project else None
        site_url = args.site_url or str(load_config().get("site_url") or DEFAULT_SITE_URL)
        problem = fetch_problem(
            site_url,
            problem_identifier(args, state),
            configured_token(),
            args.timeout_seconds,
        )
        print_remote_problem(problem)
        return

    token = configured_token()
    if not token:
        raise WorkspaceError(
            "not logged in; create a token under /account/ and run `problemproof_workspace.py login --token <token>`"
        )
    site_url = args.site_url or str(load_config().get("site_url") or DEFAULT_SITE_URL)
    account = api_get_json(
        site_api_url(site_url, "/api/account/me"),
        token,
        args.timeout_seconds,
    )
    source = "PROBLEMPROOF_TOKEN" if os.environ.get("PROBLEMPROOF_TOKEN") else str(config_path())
    print(f"Logged in as {account.get('displayName')} (account {account.get('id')})")
    print(f"Token source: {source}")


def command_sync(args: argparse.Namespace) -> None:
    project = project_path(args.project) if args.project else None
    state = load_valid_state(project) if project else None
    site_url = args.site_url or str(load_config().get("site_url") or DEFAULT_SITE_URL)
    problem = fetch_problem(
        site_url,
        problem_identifier(args, state),
        configured_token(),
        args.timeout_seconds,
    )
    if project:
        save_remote_problem(project, problem, site_url, "remote-problem-synced")
    print_remote_problem(problem)


def command_open(args: argparse.Namespace) -> None:
    url = args.url
    if not url and args.project:
        state = load_valid_state(project_path(args.project))
        remote = remote_problem_from_state(state)
        url = str(remote.get("url") or "")
    if not url and args.problem:
        site_url = args.site_url or str(load_config().get("site_url") or DEFAULT_SITE_URL)
        problem = fetch_problem(site_url, str(args.problem), configured_token(), args.timeout_seconds)
        url = str(problem.get("url") or "")
    if not url:
        raise WorkspaceError("no remote problem URL found; pass --url, --problem, or --project")
    print(url)
    if args.browser:
        webbrowser.open(url)


def command_logout(args: argparse.Namespace) -> None:
    config = load_config()
    had_token = bool(config.pop("token", None))
    config.pop("account", None)
    save_config(config)
    if had_token:
        print("Removed stored ProblemProof token.")
    else:
        print("No stored ProblemProof token found.")


def command_publish(args: argparse.Namespace) -> None:
    if not args.yes:
        raise WorkspaceError("publish requires --yes after explicit user confirmation")
    token = (args.token or "").strip() or configured_token()
    if not token:
        raise WorkspaceError(
            "publish requires a ProblemProof token; create one under /account/ and run `login`, pass --token, or set PROBLEMPROOF_TOKEN"
        )
    participant_id = args.participant_id or "account-token"
    title = args.title or compact_title(args.statement)
    payload = {
        "title": single_line(title, "title", maximum=80),
        "statement": single_line(args.statement, "statement", maximum=280),
        "origin": args.origin,
        "targetGroup": single_line(args.target_group, "target group", maximum=80),
        "region": single_line(args.region, "region", maximum=80),
        "category": single_line(args.category, "category", maximum=80),
        "consequence": single_line(args.consequence, "consequence", maximum=400),
        "participantId": single_line(participant_id, "participant ID", maximum=120),
        "source": "skill",
    }
    headers = {
        "content-type": "application/json",
        "user-agent": "ProblemProofSkill/0.1 (+https://github.com/moinsen-dev/problemproof)",
    }
    if token:
        headers["authorization"] = f"Bearer {token}"
    request = Request(
        args.api_url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    try:
        with urlopen(request, timeout=args.timeout_seconds) as response:
            response_body = response.read().decode("utf-8")
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise WorkspaceError(f"publish failed with HTTP {error.code}: {detail}") from error
    except URLError as error:
        raise WorkspaceError(f"publish failed: {error.reason}") from error
    try:
        result = json.loads(response_body)
    except json.JSONDecodeError as error:
        raise WorkspaceError(f"publish returned invalid JSON: {response_body}") from error
    site_url = site_url_from_api_url(args.api_url)
    if args.project:
        save_remote_problem(project_path(args.project), result, site_url, "problem-published")
    print(f"Published problem {result.get('id')} ({result.get('slug')})")
    if result.get("url"):
        print(f"URL: {result.get('url')}")


def command_repo_gate(args: argparse.Namespace) -> None:
    title = single_line(args.title, "title", maximum=200)
    directory_name = args.project_dir or f"problem-proof-{slug_directory(title)}"
    init_args = argparse.Namespace(
        root=args.root,
        project_dir=directory_name,
        title=title,
        cooling_off_hours=args.cooling_off_hours,
    )
    command_init(init_args)
    project = Path(args.root).expanduser().resolve() / directory_name
    append_history(
        project,
        "repo-start-gate",
        "Repo creation, project scaffolding, PRD generation, and build implementation "
        "are blocked until a ProblemProof decision is recorded.",
    )
    print("")
    print("Repo-start gate active.")
    print(f"Project: {project}")
    print("Do not create a repository, scaffold files, or start implementation yet.")
    print("Next decision: personal build, park, validate before building, or stop.")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Manage a non-destructive ProblemProof artifact workspace."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    init_parser = subparsers.add_parser("init", help="create missing workspace files")
    init_parser.add_argument("--root", required=True, help="parent directory")
    init_parser.add_argument("--project-dir", default="problem-proof")
    init_parser.add_argument("--title", required=True)
    init_parser.add_argument("--cooling-off-hours", type=int, default=72)
    init_parser.set_defaults(handler=command_init)

    add_parser = subparsers.add_parser(
        "add", help="capture an idea locally without publishing it"
    )
    add_parser.add_argument("--root", required=True, help="parent directory")
    add_parser.add_argument("--project-dir", default="problem-proof")
    add_parser.add_argument("--title", required=True)
    add_parser.add_argument("--cooling-off-hours", type=int, default=72)
    add_parser.set_defaults(handler=command_init)

    repo_gate_parser = subparsers.add_parser(
        "repo-gate", help="create a pre-repository ProblemProof gate"
    )
    repo_gate_parser.add_argument("--root", required=True, help="parent directory")
    repo_gate_parser.add_argument("--project-dir")
    repo_gate_parser.add_argument("--title", required=True)
    repo_gate_parser.add_argument("--cooling-off-hours", type=int, default=72)
    repo_gate_parser.set_defaults(handler=command_repo_gate)

    check_parser = subparsers.add_parser("check", help="validate workspace integrity")
    check_parser.add_argument("--project", required=True)
    check_parser.set_defaults(handler=command_check)

    gate_parser = subparsers.add_parser("gate", help="update one evidence-gate item")
    gate_parser.add_argument("--project", required=True)
    gate_parser.add_argument("--item", required=True, choices=GATE_ITEMS)
    gate_parser.add_argument(
        "--status", required=True, choices=("unknown", "passed", "failed")
    )
    gate_parser.add_argument("--evidence-id", action="append")
    gate_parser.add_argument("--note", required=True)
    gate_parser.set_defaults(handler=command_gate)

    decision_parser = subparsers.add_parser(
        "decision", help="record verdict and recommendation"
    )
    decision_parser.add_argument("--project", required=True)
    decision_parser.add_argument("--verdict", required=True, choices=VERDICTS)
    decision_parser.add_argument(
        "--recommendation", required=True, choices=RECOMMENDATIONS
    )
    decision_parser.add_argument("--reason", required=True)
    decision_parser.set_defaults(handler=command_decision)

    transition_parser = subparsers.add_parser(
        "transition", help="change operational stage"
    )
    transition_parser.add_argument("--project", required=True)
    transition_parser.add_argument("--to", dest="target_stage", required=True, choices=STAGES)
    transition_parser.add_argument("--reason", required=True)
    transition_parser.add_argument(
        "--user-confirmed",
        action="store_true",
        help="confirm that the user explicitly requested Opportunity Shaping",
    )
    transition_parser.set_defaults(handler=command_transition)

    login_parser = subparsers.add_parser(
        "login", help="store and verify a personal ProblemProof token for publishing"
    )
    login_parser.add_argument("--site-url", default=DEFAULT_SITE_URL)
    login_parser.add_argument(
        "--token",
        help="ProblemProof personal token from /account/; omitted values are read from a hidden prompt",
    )
    login_parser.add_argument("--timeout-seconds", type=int, default=15)
    login_parser.set_defaults(handler=command_login)

    status_parser = subparsers.add_parser(
        "status", help="verify the active account or inspect a linked remote problem"
    )
    status_parser.add_argument("--project", help="local ProblemProof artifact directory")
    status_parser.add_argument("--problem", help="remote problem id or slug")
    status_parser.add_argument("--site-url")
    status_parser.add_argument("--timeout-seconds", type=int, default=15)
    status_parser.set_defaults(handler=command_status)

    sync_parser = subparsers.add_parser(
        "sync", help="sync remote ProblemProof metrics into a local artifact workspace"
    )
    sync_parser.add_argument("--project", help="local ProblemProof artifact directory")
    sync_parser.add_argument("--problem", help="remote problem id or slug")
    sync_parser.add_argument("--site-url")
    sync_parser.add_argument("--timeout-seconds", type=int, default=15)
    sync_parser.set_defaults(handler=command_sync)

    open_parser = subparsers.add_parser(
        "open", help="print or open the remote ProblemProof problem URL"
    )
    open_parser.add_argument("--project", help="local ProblemProof artifact directory")
    open_parser.add_argument("--problem", help="remote problem id or slug")
    open_parser.add_argument("--url", help="explicit ProblemProof URL")
    open_parser.add_argument("--site-url")
    open_parser.add_argument("--timeout-seconds", type=int, default=15)
    open_parser.add_argument("--browser", action="store_true", help="open the URL in the default browser")
    open_parser.set_defaults(handler=command_open)

    logout_parser = subparsers.add_parser(
        "logout", help="remove the locally stored ProblemProof token"
    )
    logout_parser.set_defaults(handler=command_logout)

    publish_parser = subparsers.add_parser(
        "publish", help="publish a confirmed problem to the ProblemProof API"
    )
    publish_parser.add_argument("--api-url", default=DEFAULT_API_URL)
    publish_parser.add_argument("--project", help="local ProblemProof artifact directory to link after publishing")
    publish_parser.add_argument("--title", help="short public problem title; defaults to a compact statement title")
    publish_parser.add_argument("--statement", required=True)
    publish_parser.add_argument("--origin", required=True, choices=("firsthand", "hypothesis"))
    publish_parser.add_argument("--target-group", required=True)
    publish_parser.add_argument("--region", required=True)
    publish_parser.add_argument("--category", required=True)
    publish_parser.add_argument("--consequence", required=True)
    publish_parser.add_argument(
        "--participant-id",
        help="legacy local participant ID; with a token the server uses the authenticated account",
    )
    publish_parser.add_argument(
        "--token",
        help="ProblemProof personal token; alternatively run login or set PROBLEMPROOF_TOKEN",
    )
    publish_parser.add_argument("--timeout-seconds", type=int, default=15)
    publish_parser.add_argument(
        "--yes",
        action="store_true",
        help="confirm that the user explicitly approved public publishing",
    )
    publish_parser.set_defaults(handler=command_publish)
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        args.handler(args)
    except WorkspaceError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
