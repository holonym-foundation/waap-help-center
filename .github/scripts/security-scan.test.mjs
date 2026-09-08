import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const cases = [
  ['next.config.mjs', `const csp = "script-src 'unsafe-eval'";`, 1, 'unsafe-eval'],
  ['app/test.cjs', 'eval("bad")', 1, 'dynamic code'],
  ['.github/workflows/test.yaml', 'steps:\n  - uses: actions/checkout@v4', 1, 'Unpinned'],
  ['.github/workflows/test.yml', 'permissions: write-all', 1, 'permissive'],
  ['.github/scripts/fixture.mjs', 'eval("fixture")', 0, 'Infrastructure'],
  ['app/test.mjs', 'export const safe = true;', 0, 'No security findings'],
];
for (const [name, content, status, expected] of cases) {
  test(name, () => {
    const root = mkdtempSync(join(tmpdir(), 'security-scan-'));
    try {
      cpSync(dirname(fileURLToPath(import.meta.url)), join(root, '.github/scripts'), { recursive: true });
      const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
      git('init');
      git('add', '.');
      git('-c', 'user.name=Test', '-c', 'user.email=test@example.com', '-c', 'commit.gpgsign=false', 'commit', '-m', 'baseline');
      git('update-ref', 'refs/remotes/origin/main', 'HEAD');
      const path = join(root, name);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content);
      git('add', '.');
      const env = { ...process.env, GITHUB_BASE_REF: 'main', COMMENT_OUTPUT: join(root, 'report.md') };
      delete env.GITHUB_OUTPUT;
      delete env.GITHUB_STEP_SUMMARY;
      const result = spawnSync(process.execPath, ['.github/scripts/security-scan.mjs'], { cwd: root, env, encoding: 'utf8' });
      assert.equal(result.status, status, result.stdout + result.stderr);
      assert.ok(readFileSync(env.COMMENT_OUTPUT, 'utf8').toLowerCase().includes(expected.toLowerCase()));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
}
