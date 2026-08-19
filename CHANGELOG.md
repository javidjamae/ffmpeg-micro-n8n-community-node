# Changelog

All notable changes to `@ffmpeg-micro/n8n-nodes-ffmpeg-micro`.

This project follows [Semantic Versioning](https://semver.org/).

## 0.2.3

**Removes `usableAsTool` from the FFmpeg Micro Trigger node**, required by n8n's community node review (trigger nodes cannot be invoked as AI tools, so the flag only polluted the AI Agent tool picker). Contains all of 0.2.2, which failed review on this one lint error and was never approved.

### Fixed

- **FFmpeg Micro Trigger no longer declares `usableAsTool: true`.** The regular FFmpeg Micro node keeps the flag and remains available as an AI Agent tool. No workflow behavior changes, unless you had attached "FFmpeg Micro Trigger" from the AI Agent tool picker — an entry that appeared in the picker but never worked when invoked. That entry no longer exists, so remove it from the agent and use the regular FFmpeg Micro node as the tool instead.

## 0.2.2

**Failed and canceled jobs now fail the node.** This is a deliberate behavior change, and the reason to upgrade.

### Fixed

- **Wait for Completion (transcode and transcribe) previously returned a `failed` or `canceled` job as ordinary successful output.** The node showed green, the workflow continued, and the job's `error_message` — including quota guidance with an upgrade link — was never surfaced anywhere. A workflow could fail every single job for weeks while every execution looked successful.

  Now: a job that finishes `failed` throws with the API's real error message, and a `canceled` job throws with a message saying so.

### Do I need to change my workflows?

Only if a workflow **relied on** failed jobs flowing through as normal output (for example, branching on `{{ $json.status }}` after a Wait node).

- **Most workflows need no change** — jobs that complete still return exactly as before.
- **To handle failures deliberately** (retry, notify, top up quota), enable the node's **error output** (Settings → On Error → "Continue (using error output)") and wire the error branch. The thrown message carries the API's full `error_message`, so quota blocks arrive with the reason and the upgrade link.
- **To inspect a job's status without asserting success**, use the **Get** operation instead of Wait — Get still returns the job as data regardless of status.

Note: over-quota jobs from fully-capped accounts now fail at **creation time** with HTTP 402 (visible as a node error even without this upgrade). This release makes every *other* failure visible too — validation errors, processing failures, and quota blocks on partially-capped accounts.

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
