// Refuses to run `npm run release` anywhere except GitHub Actions.
//
// There is exactly one way to publish this package: bump "version" in
// package.json in a PR, and merge it. The push to main triggers publish.yml,
// which publishes if that version is not on npm yet.
//
// Run locally, `n8n-node release` bumps the version ITSELF via release-it and
// then commits, tags and pushes. That is a second, conflicting way to release:
// used on a package.json already bumped in a PR it silently skips a version
// number, and it publishes from a laptop without the provenance attestation
// that n8n Cloud requires. Neither failure is loud.
//
// So the local path is closed rather than documented-around. publish.yml sets
// GITHUB_ACTIONS, so CI passes straight through.

if (!process.env.GITHUB_ACTIONS) {
	console.error(`
✋ npm run release is CI-only, and does not need to be run by hand.

To release:
  1. bump "version" in package.json  (in your PR)
  2. add a CHANGELOG.md entry
  3. merge the PR

That is it. The push to main publishes the new version automatically.
Merging without a version bump publishes nothing, so this is safe on
every merge.

If a release run failed, re-run the Publish workflow from the Actions
tab rather than publishing from here — a local publish carries no
provenance attestation, which n8n Cloud requires.

See RELEASING.md.
`);
	process.exit(1);
}
