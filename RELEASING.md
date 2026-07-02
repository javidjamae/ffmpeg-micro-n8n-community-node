# Releasing

This package publishes to npm from GitHub Actions using npm **trusted publishing** (OIDC). No long-lived npm token is stored anywhere. Every published version carries a provenance statement, which n8n requires for verified community nodes.

## How publishing works

1. You bump the version, commit, and push a git tag matching `*.*.*` (for example `0.1.1`).
2. The tag push triggers `.github/workflows/publish.yml`.
3. In CI, `npm run release` detects it is running in GitHub Actions and runs `npm publish` with provenance enabled. npm authenticates the workflow through the trusted publisher configured on the package, so no token is needed.

Locally, `npm run release` never publishes. It only bumps the version, updates the changelog, commits, tags, pushes, and creates a GitHub release. The actual npm publish always happens in CI.

## Cutting a release

From a clean `main`:

```bash
npm run release
```

Answer the version prompt. release-it handles the commit, tag, and push, and CI publishes within a couple of minutes. Watch it with:

```bash
gh run watch --exit-status
```

If you prefer to avoid the interactive tool (or are scripting), the equivalent manual steps are:

```bash
npm run lint && npm run build
# edit "version" in package.json to the new version
git commit -am "chore: release X.Y.Z"
git tag X.Y.Z          # no "v" prefix — the workflow trigger is *.*.*
git push origin main
git push origin X.Y.Z
```

You cannot republish a version that already exists on npm. Always bump to a new version.

## One-time setup (already done, documented for reference)

These steps were completed when the package was first published. You do not need to repeat them.

### 1. Reserve the package name

Trusted publishing can only be configured on a package that already exists, and CI cannot create the very first version without some credential. To break that cycle, the initial version was published once from a local machine using the tool's internal release flag:

```bash
RELEASE_MODE=true npm publish --access public
```

This first version does not have provenance. That is fine: it only reserves the name. The first CI-published version is the one submitted for verification.

### 2. Configure the trusted publisher

```bash
npm trust github n8n-nodes-ffmpeg-micro \
  --file publish.yml \
  --repo javidjamae/ffmpeg-micro-n8n-community-node \
  --allow-publish
```

Equivalent web UI: npmjs.com, then the package settings, then Trusted publishing, then Add publisher (GitHub Actions, owner `javidjamae`, repo `ffmpeg-micro-n8n-community-node`, workflow `publish.yml`).

Trusted-publisher configs created after 20 May 2026 must name at least one allowed action, which is why `--allow-publish` is required.

### Token fallback (not used here)

If you ever need to publish without trusted publishing, create a granular npm access token, add it as a repository secret named `NPM_TOKEN`, and the workflow will use it automatically. Delete the secret to return to the OIDC path.

## Submitting for n8n verification

After a provenance-signed version is on npm, submit it at [creators.n8n.io/nodes](https://creators.n8n.io/nodes). Verification is what makes the node installable on n8n Cloud. Self-hosted users can install it from npm as soon as it is published, verified or not.
```
