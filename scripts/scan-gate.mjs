// Runs n8n's own community-node review lint against this working tree, so a
// version that would be REJECTED never gets published.
//
// Why this exists: v0.2.2 published cleanly, then failed n8n's review on a
// single lint error (`usableAsTool: true` on a trigger node). The rejection
// costs a full release cycle — the previous version stays live on n8n Cloud
// while the fix goes through a new version bump, publish, and re-review. Our
// own `npm run lint` did not catch it, because the bundled rule version lagged
// the one n8n reviews with.
//
// So this imports the reviewer's own scanner (`@n8n/scan-community-package`)
// and runs its ESLint gate against local source. Same rules, same plugin
// versions, same file patterns — just pointed at a directory instead of a
// published tarball.
//
// The scanner CLI only accepts a package that is already on npm (it resolves
// through the registry and 404s on anything else), which is why this calls the
// exported `analyzePackage` directly rather than shelling out to the CLI.
//
// WHAT THIS DOES NOT COVER: the scanner also verifies npm provenance and that
// the published tarball matches the attested GitHub source. Both are
// meaningless before publishing and are skipped here. This gate is the lint
// leg, which is the leg that has actually rejected us.
//
// The dependency is installed unpinned at CI time (see the workflows) rather
// than being a devDependency, deliberately: the point is to match whatever n8n
// reviews with TODAY, not whatever was current when a lockfile was written. A
// new rule landing in their beta shows up here as a failed check on a PR,
// which is the cheap place to find out.

import { analyzePackage, SOURCE_FILE_PATTERNS } from '@n8n/scan-community-package/scanner/scanner.mjs';

const packageDir = process.argv[2] ?? process.cwd();

const result = await analyzePackage(packageDir, SOURCE_FILE_PATTERNS);

if (result.passed) {
	console.log("✅ Passes n8n's community-node review lint.");
	process.exit(0);
}

console.error(`❌ Would be REJECTED by n8n's community-node review: ${result.message}\n`);
if (result.details) {
	console.error(result.details);
}
console.error(
	'\nFix these before releasing. Publishing a version that fails review costs a\n' +
		'full release cycle: the current version stays live on n8n Cloud until a new\n' +
		'version is published and re-reviewed.\n',
);
process.exit(1);
