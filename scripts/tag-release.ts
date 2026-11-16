/**
 * Tag a release: an annotated git tag `v<version>` whose message is the
 * release's player notes from src/core/releases.ts. See docs/RELEASING.md.
 *
 *   npm run release:tag                      # tag HEAD with package.json's version
 *   npm run release:tag -- 1.2.0 39d338a     # tag an older commit (backfilling)
 *
 * The tag is dated like its commit, so backfilled tags sort by when the
 * release really happened. It never pushes; it prints the push command.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { en } from '../src/i18n/en.ts';
import { findRelease, isVersion } from '../src/core/releases.ts';

const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8' }).trim();

function fail(message: string): never {
  console.error(`tag-release: ${message}`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
const [versionArg, commitArg] = process.argv.slice(2);
const version = versionArg ?? pkg.version;
const commit = commitArg ?? 'HEAD';

if (!isVersion(version)) fail(`"${version}" isn't a version like 1.2.3`);
const release = findRelease(version);
if (!release) fail(`no entry for ${version} in src/core/releases.ts`);

if (commit === 'HEAD') {
  if (version !== pkg.version) fail(`package.json says ${pkg.version}, not ${version}`);
  if (git('status', '--porcelain') !== '') fail('commit or stash your changes first');
  if (git('rev-parse', '--abbrev-ref', 'HEAD') !== 'main') fail('release from main');
}

const tag = `v${version}`;
try {
  git('rev-parse', '--verify', '--quiet', `refs/tags/${tag}`);
  fail(`${tag} already exists`);
} catch {
  // Not tagged yet: good.
}

const sha = git('rev-parse', '--verify', `${commit}^{commit}`);
const lines = release.notes.map((key) => `- ${en[key]}`);
if (release.fixes) lines.push(`- ${en['whatsNew.fixes']}`);
const message = `Inky Keys ${version}\n\n${lines.join('\n')}\n`;

execFileSync('git', ['tag', '--annotate', tag, sha, '--file', '-'], {
  input: message,
  env: { ...process.env, GIT_COMMITTER_DATE: git('show', '-s', '--format=%cI', sha) },
  stdio: ['pipe', 'inherit', 'inherit'],
});
console.log(`Tagged ${tag} at ${sha.slice(0, 7)}. Publish it with:\n  git push origin ${tag}`);
