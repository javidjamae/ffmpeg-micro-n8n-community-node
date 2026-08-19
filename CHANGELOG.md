# Changelog

All notable changes to `@ffmpeg-micro/n8n-nodes-ffmpeg-micro`.

This project follows [Semantic Versioning](https://semver.org/).

## 0.2.1

**Fixes two wrong values in the Status Filter dropdowns.** Both are safe to upgrade to. Neither changes any node's inputs, outputs, or credentials, so existing workflows keep working unchanged.

### Fixed

- **Removed the "Queued" status filter from Transcode → List.** The API never returns `queued`. The database restricts `status` to `pending`, `processing`, `completed`, `failed`, and `canceled`, so a job cannot be in that state. Anyone who selected "Queued" got an empty result set every time, with no error to explain why.
- **Added the missing "Canceled" status filter to Transcribe → List.** `canceled` is a real transcribe status that the API does return, but it was not offered in the dropdown, so canceled transcribe jobs could not be filtered for at all.

Both dropdowns now list exactly the five statuses the API can return, and the transcode and transcribe lists finally match each other.

### Do I need to upgrade?

Only if you filter job lists by status.

- **If a workflow selects "Queued"** on Transcode → List, it is silently returning nothing today and has been since the option existed. That is the case worth upgrading for. After upgrading, the option is gone; pick the status you actually meant, most likely "Pending" or "Processing".
- **If you need to find canceled transcribe jobs**, upgrade and select "Canceled".
- **Otherwise no action is needed.** Every other status value is unchanged.

### Migration

No breaking changes to node parameters, and nothing to rewrite by hand.

One thing to know: if a saved workflow currently has "Queued" selected on a Transcode → List node, that value no longer appears in the dropdown after upgrading. n8n keeps the stored value `queued` until you change it, and the node will keep returning nothing — exactly as it does now — until you pick a valid status. Open any affected node and reselect. Nothing else in the workflow is affected.

## 0.2.0

- Added `metadata` on transcode create.
- Added an `until` filter to list operations, complementing `since`.

## 0.1.1

- Scoped the package under the `@ffmpeg-micro` organization.
- Normalized `repository.url` to silence an npm publish warning.
- Added `RELEASING.md` documenting the OIDC trusted-publishing flow.

## 0.1.0

- Initial release: FFmpeg Micro node, trigger node, and credentials.
