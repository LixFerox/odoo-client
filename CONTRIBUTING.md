# Contributing

Thanks for contributing to `odoo-client`.

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

Please run these commands before opening a Pull Request.

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

## Commit message suggestion

Use clear, imperative messages, for example:

- `feat: add execute_kw helper`
- `fix: include company context in search`
- `docs: update examples for searchCount`

## Questions

If something is unclear, open an issue first to discuss direction before a large PR.
