# Contributing to ProblemProof

ProblemProof is an evidence layer for problems, not an idea marketplace. Code,
documentation, design, and methodology contributions are welcome when they
preserve that distinction.

## Before opening a change

1. Search existing issues and pull requests.
2. For a feature, describe the user problem and available evidence before the
   proposed implementation.
3. Keep personal data, credentials, production exports, and private moderation
   material out of issues, commits, and test fixtures.
4. For security-sensitive findings, follow [SECURITY.md](SECURITY.md) instead
   of opening a public issue.

## Local checks

Web application:

```bash
cd apps/web
npm ci
npm test
npm run build
```

ProblemProof workspace skill:

```bash
python3 -m unittest tests/test_workspace.py
```

## Pull requests

- Keep changes focused and explain the problem they solve.
- Add or update tests when behavior changes.
- Document new data collection, external services, or public API fields.
- Never weaken the evidence gate silently.
- Confirm that no secret or personal production data is included.

By contributing, you agree that your contribution is licensed under the MIT
License included in this repository.
