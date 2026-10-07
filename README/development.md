# Development

Install dependencies:

`bun install`

Test:

`bun test`

Bundle for usage as a
[dynamic-plugin-framework](https://github.com/flowscripter/dynamic-plugin-framework)
plugin:

`bun run build`

Format:

`bunx oxfmt`

Lint:

`bunx oxlint index.ts src/ tests/`

Generate HTML API documentation:

`bunx typedoc index.ts`

The tests run against a local `Bun.serve` server, so they make no external
network calls.
