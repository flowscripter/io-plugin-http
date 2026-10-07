# io-plugin-http

[![version](https://img.shields.io/github/v/release/flowscripter/io-plugin-http?sort=semver)](https://github.com/flowscripter/io-plugin-http/releases)
[![build](https://img.shields.io/github/actions/workflow/status/flowscripter/io-plugin-http/release-bun-library.yml)](https://github.com/flowscripter/io-plugin-http/actions/workflows/release-bun-library.yml)
[![docs](https://img.shields.io/badge/docs-API-blue)](https://flowscripter.github.io/io-plugin-http/index.html)
[![license: MIT](https://img.shields.io/github/license/flowscripter/io-plugin-http)](https://github.com/flowscripter/io-plugin-http/blob/main/LICENSE)

> HTTP and HTTPS source/sink plugin for
> [pluggable-io-framework](https://github.com/flowscripter/pluggable-io-framework),
> loaded via
> [dynamic-plugin-framework](https://github.com/flowscripter/dynamic-plugin-framework)

## Key Features

- One plugin registering two provider factories, for the `http` and
  `https` protocols, sharing one `fetch`-based implementation with the `js`
  payload kind.
- A location is a full URL plus optional request options: `method` for
  writes (`PUT` by default, or `POST`), basic auth (`username`/`password`),
  a `bearerToken`, and extra `headers`. Credentials are marked secret in the
  location schema.
- Every location is a single entry; HTTP has no containers or patterns.
- Reads are `GET` requests. Readable handles are `RangeReadable`, using a
  `Range` header on a fresh request, so the framework can read in parts and
  `seekable` works.
- Writes stream the request body of one `PUT` or `POST`.
- `getProperties` uses `HEAD` (size, last modified, content type, etag) and
  `delete` uses `DELETE`.
- Failures are classified for the framework's retries: network errors,
  timeouts, throttling and server errors are transient; other client
  errors are permanent.

## Usage

Install the plugin where a
[pluggable-io-framework](https://github.com/flowscripter/pluggable-io-framework)
host discovers plugins, then address entries by URL (`registry` is a
discovered `ProviderRegistry`):

```typescript
const { source, dest, options } = await registry.createProvidersForTransfer(
  "https://example.com/data/report.csv",
  "file:///tmp/report.csv",
);
await copy(source.provider, source.target, dest.provider, dest.target, options);
```

## Further Details

- [Configuration](./README/configuration.md)
- [Development](./README/development.md)
- [API Documentation](https://flowscripter.github.io/io-plugin-http/index.html)

## License

MIT © Flowscripter
