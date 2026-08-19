# Releasing

This package publishes to npm from GitHub Actions using npm **trusted publishing** (OIDC). No long-lived npm token is stored anywhere. Every published version carries a provenance statement, which n8n requires for verified community nodes.

## Cutting a release

**Bump `version` in `package.json` in your PR, add a `CHANGELOG.md` entry, and merge.** That is the whole process. There is no tag to push and no local command to run.

On the push to `main`, `.github/workflows/publish.yml` asks npm whether the version in `package.json` is already published. If it is not, it publishes. If it is, it skips and the run ends green.

That guard is what makes it safe to run on every merge:

- Merging a PR that **did** bump the version publishes it.
- Merging a PR that **did not** bump the version does nothing.
- Re-running the workflow, or merging again, cannot double-publish.

Forgetting to bump is therefore harmless — nothing publishes, and you bump in a follow-up PR.

Watch a release with:

```bash
gh run watch --exit-status
```

## How publishing works

1. A version bump lands on `main` (or a tag matching `*.*.*` is pushed — see the escape hatch below).
2. That triggers `.github/workflows/publish.yml`.
3. The workflow compares `package.json`'s version against npm and stops there if it already exists.
4. Otherwise `npm run release` detects GitHub Actions and runs lint, build, then `npm publish` with provenance. npm authenticates through the trusted publisher configured on the package, so no token is involved.

In CI, `npm run release` performs **no git operations** — it does not commit, tag, or push. That is why publishing on a branch push works exactly like publishing on a tag push, and why the workflow only needs `contents: read`.

npm is the source of truth for what has shipped, deliberately, rather than git tags. A tag can be missing, mistyped, or point at a version that never published; "is this version on the registry" is the exact question that matters and cannot be wrong.

## If a release run fails

Re-run the **Publish** workflow from the Actions tab. The guard makes that idempotent — it publishes only if the version still isn't on npm.

Do not publish from your machine to work around a failed run.

## There is no second way to release, on purpose

`npm run release` **refuses to run outside CI** (`scripts/ci-only.mjs`). There is also no tag trigger and no manual workflow dispatch.

That is deliberate. Each of those would be another way to release, and two release paths is how a version gets skipped or published twice. Specifically, run from a laptop `n8n-node release` would:

- bump the version *itself* via release-it — so used on a `package.json` already bumped in a PR, it silently skips a version number, and
- publish **without the provenance attestation** that n8n Cloud requires.

Neither failure is loud, which is why the path is closed rather than documented-around.

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
npm trust github @ffmpeg-micro/n8n-nodes-ffmpeg-micro \
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
