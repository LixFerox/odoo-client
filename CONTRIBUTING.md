# Contributing

Thanks for your interest in contributing to `odoo-client`.

## Requirements

- Bun `>= 1.0.0`

## Setup

```bash
bun install
```

## Local checks

```bash
bun run typecheck
bun run check
bun run build
```

Please run all checks before opening a pull request.

## Where to Contribute

- Bug reports
- Documentation improvements
- Type safety improvements
- XML-RPC behavior fixes
- New model helper methods (while keeping API stable)

## Branch and PR workflow

1. Create a branch from `main`.
2. Make focused changes (one concern per PR when possible).
3. Update docs/examples when behavior changes.
4. Open a PR with:
   - clear summary
   - why the change is needed
   - test/validation notes

## Coding guidelines

- Keep public API names stable and explicit.
- Prefer strict typing over `any`.
- Keep XML-RPC behavior aligned with Odoo docs.
- Preserve Bun-based tooling in this repository.
- Avoid breaking changes without discussion.

## Commit message suggestion

Use clear, imperative messages, for example:

- `feat: add execute_kw helper`
- `fix: include company context in search`
- `docs: update examples for searchCount`

## Pull Request Checklist

- Code compiles (`bun run typecheck`)
- Lint/format passes (`bun run check`)
- Build passes (`bun run build`)
- Docs updated when API/behavior changes

## Questions

If something is unclear, open an issue first to discuss direction before a large PR.
