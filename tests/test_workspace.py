from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = (
    Path(__file__).resolve().parents[1]
    / "plugins"
    / "problemproof"
    / "skills"
    / "problemproof"
    / "scripts"
    / "problemproof_workspace.py"
)


class WorkspaceScriptTests(unittest.TestCase):
    def run_script(self, *arguments: str, expected: int = 0) -> subprocess.CompletedProcess[str]:
        result = subprocess.run(
            [sys.executable, str(SCRIPT), *arguments],
            text=True,
            capture_output=True,
            check=False,
        )
        self.assertEqual(
            result.returncode,
            expected,
            msg=f"stdout:\n{result.stdout}\nstderr:\n{result.stderr}",
        )
        return result

    def initialize(self, root: Path) -> Path:
        self.run_script("init", "--root", str(root), "--title", "Calendar friction")
        return root / "problem-proof"

    def test_init_and_check(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            project = self.initialize(Path(directory))
            self.run_script("check", "--project", str(project))
            state = json.loads((project / "state.json").read_text(encoding="utf-8"))
            self.assertEqual(state["stage"], "captured")
            self.assertEqual(len(state["gate"]), 7)
            scorecard = json.loads(
                (project / "scorecard.json").read_text(encoding="utf-8")
            )
            self.assertEqual(len(scorecard["dimensions"]), 12)
            self.assertNotIn("total", scorecard)

    def test_reinitialization_preserves_existing_files(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            project = self.initialize(root)
            idea = project / "idea.md"
            idea.write_text("user-authored content\n", encoding="utf-8")
            result = self.run_script(
                "init", "--root", str(root), "--title", "A different title"
            )
            self.assertEqual(idea.read_text(encoding="utf-8"), "user-authored content\n")
            self.assertIn("idea.md", result.stdout)
            self.assertIn("Preserved existing", result.stdout)

    def test_add_alias_initializes_workspace(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            self.run_script("add", "--root", directory, "--title", "Repo reflex")
            self.run_script("check", "--project", str(Path(directory) / "problem-proof"))

    def test_publish_requires_explicit_confirmation(self) -> None:
        result = self.run_script(
            "publish",
            "--api-url",
            "http://127.0.0.1:9/api/problems",
            "--statement",
            "Solo-Entwickler starten zu schnell mit Repos, bevor das Problem klar ist.",
            "--origin",
            "firsthand",
            "--target-group",
            "Solo-Entwickler/Indie-Hacker",
            "--region",
            "Deutschland",
            "--category",
            "Softwareentwicklung",
            "--consequence",
            "Viele Projekte werden begonnen, aber nicht veröffentlicht.",
            "--participant-id",
            "participant-123",
            expected=2,
        )
        self.assertIn("publish requires --yes", result.stderr)

    def test_publish_documents_personal_token_flag(self) -> None:
        result = self.run_script("publish", "--help")
        self.assertIn("--token", result.stdout)
        self.assertIn("PROBLEMPROOF_TOKEN", result.stdout)

    def test_repo_gate_creates_unique_pre_repo_record(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            result = self.run_script(
                "repo-gate",
                "--root",
                directory,
                "--title",
                "Repo reflex stop loss",
            )
            project = Path(directory) / "problem-proof-repo-reflex-stop-loss"
            self.assertTrue((project / "state.json").is_file())
            self.assertIn("Repo-start gate active", result.stdout)
            self.assertIn("Do not create a repository", result.stdout)
            history = (project / "history.md").read_text(encoding="utf-8")
            self.assertIn("repo-start-gate", history)
            self.run_script("check", "--project", str(project))

    def test_gate_blocks_premature_shaping(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            project = self.initialize(Path(directory))
            self.run_script(
                "transition",
                "--project",
                str(project),
                "--to",
                "validating",
                "--reason",
                "Start validation",
            )
            failed = self.run_script(
                "transition",
                "--project",
                str(project),
                "--to",
                "opportunity-ready",
                "--reason",
                "Try to advance",
                expected=2,
            )
            self.assertIn("requires every gate item", failed.stderr)

            evidence_items = {
                "external_pattern": "E-001",
                "behavioral_or_transactional_signal": "E-002",
                "alternatives_understood": "E-003",
                "adoption_tested": "E-004",
            }
            for item in (
                "problem_clear",
                "segment_specific",
                "external_pattern",
                "behavioral_or_transactional_signal",
                "alternatives_understood",
                "adoption_tested",
                "no_fatal_unknown",
            ):
                arguments = [
                    "gate",
                    "--project",
                    str(project),
                    "--item",
                    item,
                    "--status",
                    "passed",
                    "--note",
                    f"Rationale for {item}",
                ]
                if item in evidence_items:
                    arguments.extend(["--evidence-id", evidence_items[item]])
                self.run_script(*arguments)

            self.run_script(
                "transition",
                "--project",
                str(project),
                "--to",
                "opportunity-ready",
                "--reason",
                "All gate items passed",
            )
            no_confirmation = self.run_script(
                "transition",
                "--project",
                str(project),
                "--to",
                "shaping",
                "--reason",
                "Attempt shaping",
                expected=2,
            )
            self.assertIn("--user-confirmed", no_confirmation.stderr)
            self.run_script(
                "transition",
                "--project",
                str(project),
                "--to",
                "shaping",
                "--reason",
                "User explicitly requested shaping",
                "--user-confirmed",
            )
            blocked_reopen = self.run_script(
                "gate",
                "--project",
                str(project),
                "--item",
                "adoption_tested",
                "--status",
                "failed",
                "--note",
                "Contradictory evidence arrived",
                expected=2,
            )
            self.assertIn("transition back to validating", blocked_reopen.stderr)
            self.run_script("check", "--project", str(project))

    def test_check_rejects_aggregate_score(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            project = self.initialize(Path(directory))
            scorecard_path = project / "scorecard.json"
            scorecard = json.loads(scorecard_path.read_text(encoding="utf-8"))
            scorecard["total"] = 12
            scorecard_path.write_text(json.dumps(scorecard), encoding="utf-8")
            result = self.run_script(
                "check", "--project", str(project), expected=2
            )
            self.assertIn("forbidden aggregate", result.stderr)


if __name__ == "__main__":
    unittest.main()
