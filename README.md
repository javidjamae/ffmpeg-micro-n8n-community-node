# n8n-nodes-ffmpeg-micro

This is an n8n community node for the [FFmpeg Micro](https://www.ffmpeg-micro.com) API. It lets you transcode video and audio, generate SRT subtitles with Whisper transcription, upload media files, and react to completed jobs, all from your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

For self-hosted n8n, install from Settings, then Community Nodes, using the package name `@ffmpeg-micro/n8n-nodes-ffmpeg-micro`.

## Credentials

You need an FFmpeg Micro API key. Generate one in the [FFmpeg Micro dashboard](https://www.ffmpeg-micro.com/dashboard/api-keys). There is a free tier, so you can try the node without a paid plan.

Create an "FFmpeg Micro API" credential in n8n and paste your key. The credential test makes a read-only call to verify it.

## Nodes

### FFmpeg Micro

The main node. Operations by resource:

| Resource | Operation | What it does |
|---|---|---|
| Transcode | Create | Queue a video or audio transcode job. Supports multiple inputs, per-input FFmpeg flags, custom FFmpeg options, virtual options like `@text-overlay` and `@quote-card`, and composition filter graphs for concat and crossfade. |
| Transcode | Get | Fetch a job's status and details. |
| Transcode | Get Download URL | Get a signed download URL for a completed job. |
| Transcode | List | List jobs with status and date filters. |
| Transcode | Cancel | Cancel a pending or running job. |
| Transcode | Wait for Completion | Poll a job until it completes, fails, or is canceled. |
| Transcription | Create | Generate SRT subtitles from a video or audio URL. Supports about 99 languages plus translate-to-English. |
| Transcription | Get / Get Download URL / List / Wait for Completion | Same patterns as transcode. |
| File | Upload | Upload a binary file to FFmpeg Micro storage. Returns a `gs://` URL you can use as transcode or transcription input. |
| Custom API Call | Make an API Call | Call any FFmpeg Micro endpoint with authentication handled for you. |

### FFmpeg Micro Trigger

A polling trigger that starts your workflow when transcode or transcription jobs reach completed or failed status. Failed jobs include the `error_message` field so you can route failures.

## Typical patterns

**Short jobs, single workflow.** Upload a File, Create a transcode, Wait for Completion, Get Download URL. The wait operation polls every few seconds and works well for jobs that finish within a few minutes.

**Long jobs, two workflows.** Workflow A creates the job and ends. Workflow B starts from the FFmpeg Micro Trigger and picks up when the job completes. This is the reliable pattern for large files and slow transcodes.

**Subtitles.** Create a transcription with a video URL, wait for completion, then Get Download URL for the SRT file.

## Compatibility

Requires n8n 1.x. Tested against the live FFmpeg Micro API.

## Resources

* [FFmpeg Micro documentation](https://www.ffmpeg-micro.com/docs)
* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)

## Development

```bash
npm install
npm run dev     # loads the node in a local n8n at localhost:5678
npm run lint
npm run build
```

Releases are published to npm through GitHub Actions with a provenance statement. Run `npm run release` to version, tag, and push.

## License

[MIT](LICENSE.md)
