# Configuration

## Location Fields

| Field         | Type                       | Description                                                   |
| ------------- | -------------------------- | ------------------------------------------------------------- |
| `url`         | string                     | the full `http://` or `https://` URL of the entry             |
| `method`      | `PUT` or `POST`            | the method used for writes; defaults to `PUT`                 |
| `username`    | string                     | user for basic auth                                           |
| `password`    | string (secret)            | password for basic auth                                       |
| `bearerToken` | string (secret)            | sent as `Authorization: Bearer <token>`; wins over basic auth |
| `headers`     | array of `{ name, value }` | extra headers sent with every request                         |

A location string is the URL itself; the other fields come from the
structured location form.

## Unsupported Operations

HTTP has no generic protocol for these, so the provider omits them:

- `list` and `createContainer` - every location is a single entry;
- `setProperties` - there are no settable properties;
- multipart writes and resumable writes - arbitrary servers don't support
  them, so transfers to HTTP stream the whole body in one request.

## Ranged Reads

`readRange(start, end)` sends `Range: bytes=<start>-<end - 1>`.

- A `416` response is an empty range.
- A server that ignores `Range` and answers `200` has its response trimmed
  to the requested bytes.
