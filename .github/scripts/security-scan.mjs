#!/usr/bin/env node

/**
 * PR Security Scanner for waap-help-center
 *
 * Adapted from the waap-docs scanner. Scans changed files for security
 * violations organized into two tiers:
 *   - BLOCK: Auto-fail the PR (critical findings)
 *   - FLAG:  Report but don't block (high-severity issues)
 *
 * Most changes to this repo are content (MDX) which is nearly always safe.
 * The scanner focuses on catching code injection, dependency tampering,
 * and changes to security-critical infrastructure files.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, extname, basename } from 'path';
import { getExecutableLines } from './mdx-parser.mjs';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const KNOWN_SAFE = JSON.parse(
  readFileSync(new URL('./known-safe-patterns.json', import.meta.url), 'utf8')
);

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const MDX_EXTENSIONS = new Set(['.mdx']);
const ALL_SCANNABLE = new Set([...SOURCE_EXTENSIONS, ...MDX_EXTENSIONS]);

// ---------------------------------------------------------------------------
// Block Rules — auto-fail the PR (critical)
// ---------------------------------------------------------------------------

const BLOCK_RULES = [
  {
    id: 'no-direct-http',
    name: 'No direct HTTP requests in source files',
    pattern: /\b(fetch\s*\(|axios[.(]|XMLHttpRequest|new\s+Request\s*\()/,
    scope: 'source',
    dirs: ['app/', 'components/', 'lib/'],
  },
  {
    id: 'no-dynamic-exec',
    name: 'No dynamic code execution',
    pattern: /\b(eval\s*\(|new\s+Function\s*\(|\bFunction\s*\(|\(0\s*,\s*eval\)\s*\()/,
    scope: 'source',
  },
  {
    id: 'no-script-tags',
    name: 'No script injection vectors',
    pattern: /<script[\s>]/i,
    scope: 'all-mdx-aware',
  },
  {
    id: 'no-dangerous-html',
    name: 'No dangerouslySetInnerHTML',
    pattern: /dangerouslySetInnerHTML/,
    scope: 'all-mdx-aware',
  },
  {
    id: 'no-document-write',
    name: 'No document.write',
    pattern: /document\.write\s*\(/,
    scope: 'source',
  },
  {
    id: 'no-meta-refresh',
    name: 'No meta http-equiv refresh',
    pattern: /<meta\s[^>]*http-equiv\s*=\s*["']?refresh/i,
    scope: 'all-mdx-aware',
  },
  {
    id: 'no-service-worker',
    name: 'No Service Worker registration',
    pattern: /\b(navigator\.serviceWorker|serviceWorker\.register|CacheStorage)\b/,
    scope: 'source',
  },
  {
    id: 'no-child-process',
    name: 'No server-side execution primitives',
    pattern: /\b(child_process|execSync|exec\s*\(|spawn\s*\(|spawnSync)\b/,
    scope: 'source',
    dirs: ['app/', 'components/', 'lib/'],
  },
  {
    id: 'no-fs-write',
    name: 'No filesystem write operations',
    pattern: /\bfs\.(write|unlink|rm|mkdir)/,
    scope: 'source',
    dirs: ['app/', 'components/', 'lib/'],
  },
  {
    id: 'no-unsafe-eval-in-csp',
    name: "No 'unsafe-eval' in CSP",
    pattern: /['"]unsafe-eval['"]/,
    scope: 'source',
    files: ['next.config.mjs'],
  },
];

// ---------------------------------------------------------------------------
// Flag Rules — report but don't block (high severity)
// ---------------------------------------------------------------------------

const FLAG_RULES = [
  {
    id: 'cross-origin-comms',
    name: 'Cross-origin communication',
    pattern: /\b(postMessage|addEventListener\s*\(\s*['"]message|window\.parent|window\.opener)\b/,
    scope: 'source',
  },
  {
    id: 'new-iframe-embed',
    name: 'New iframe or embed',
    pattern: /<(iframe|object|embed)[\s>]/i,
    scope: 'all-mdx-aware',
  },
  {
    id: 'suppression-comment',
    name: 'New security suppression comment',
    pattern: /\/\/\s*(nosemgrep|lgtm|nosec)|@SuppressWarnings/,
    scope: 'all',
  },
  {
    id: 'window-usage',
    name: 'Window/document/storage access',
    pattern: /\b(window\.|localStorage|sessionStorage|document\.cookie|IndexedDB)\b/,
    scope: 'source',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getChangedFiles() {
  const baseBranch = process.env.GITHUB_BASE_REF || 'main';
  try {
    const mergeBase = execSync(`git merge-base HEAD origin/${baseBranch}`, {
      encoding: 'utf8',
    }).trim();
    const output = execSync(
      `git diff --name-status --diff-filter=ACMR ${mergeBase}`,
      { encoding: 'utf8' }
    );
    return output
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [status, ...pathParts] = line.split('\t');
        return { status: status.trim(), path: pathParts.join('\t').trim() };
      });
  } catch {
    const output = execSync('git diff --name-status --diff-filter=ACMR HEAD~1', {
      encoding: 'utf8',
    });
    return output
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [status, ...pathParts] = line.split('\t');
        return { status: status.trim(), path: pathParts.join('\t').trim() };
      });
  }
}

function isSourceFile(filePath) {
  return SOURCE_EXTENSIONS.has(extname(filePath));
}

function isMdxFile(filePath) {
  return MDX_EXTENSIONS.has(extname(filePath));
}

function isInDirs(filePath, dirs) {
  if (!dirs) return true;
  return dirs.some((dir) => filePath.startsWith(dir));
}

function isAllowedJsLocation(filePath) {
  if (basename(filePath) === '_meta.ts' && filePath.startsWith('content/')) {
    return true;
  }
  return KNOWN_SAFE.allowedJsDirectories.some((dir) =>
    filePath.startsWith(dir)
  );
}

function isInfrastructureFile(filePath) {
  return KNOWN_SAFE.infrastructureFiles.some(
    (f) => filePath === f || filePath.startsWith(f)
  );
}

function isAllowFreely(filePath) {
  return KNOWN_SAFE.allowFreelyPatterns.some((pattern) => {
    if (pattern.includes('**')) {
      const parts = pattern.split('**');
      const prefix = parts[0];
      const suffix = parts[1]?.replace(/^\//, '') || '';
      if (suffix.startsWith('*.')) {
        const ext = suffix.slice(1);
        return filePath.startsWith(prefix) && filePath.endsWith(ext);
      }
      if (suffix === '_meta.ts') {
        return filePath.startsWith(prefix) && filePath.endsWith('/_meta.ts');
      }
      return filePath.startsWith(prefix);
    }
    return filePath === pattern;
  });
}

function isKnownSafePattern(filePath, matchedText) {
  for (const fp of KNOWN_SAFE.falsePositivePatterns) {
    if (filePath.endsWith(fp.file) && matchedText.includes(fp.pattern)) {
      return true;
    }
  }

  for (const [glob, patterns] of Object.entries(
    KNOWN_SAFE.allowedUsagePatterns
  )) {
    if (matchesGlob(filePath, glob)) {
      if (patterns.some((p) => matchedText.includes(p))) return true;
    }
  }

  return false;
}

function matchesGlob(filePath, glob) {
  if (glob.includes('*')) {
    const parts = glob.split('*');
    if (parts.length === 2) {
      return filePath.startsWith(parts[0]) && filePath.endsWith(parts[1]);
    }
  }
  return filePath === glob || filePath.endsWith(glob);
}

function isSuspiciousMdxImport(line) {
  const importMatch = line.match(
    /^\s*import\s+.*\s+from\s+['"]([^'"]+)['"]/
  );
  if (!importMatch) return false;
  const source = importMatch[1];
  return !KNOWN_SAFE.knownMdxImportSources.some((safe) =>
    source.startsWith(safe)
  );
}

function checkPackageJsonChanges(filePath) {
  const findings = [];
  try {
    const baseBranch = process.env.GITHUB_BASE_REF || 'main';
    let diff;
    try {
      const mergeBase = execSync(`git merge-base HEAD origin/${baseBranch}`, {
        encoding: 'utf8',
      }).trim();
      diff = execSync(`git diff ${mergeBase} -- ${filePath}`, {
        encoding: 'utf8',
      });
    } catch {
      diff = execSync(`git diff HEAD~1 -- ${filePath}`, {
        encoding: 'utf8',
      });
    }

    if (
      diff.includes('"dependencies"') ||
      diff.includes('"devDependencies"')
    ) {
      const addedLines = diff
        .split('\n')
        .filter((l) => l.startsWith('+') && !l.startsWith('+++'));
      const depChanges = addedLines.filter(
        (l) =>
          l.match(/^\+\s+"[^"]+"\s*:/) &&
          !l.includes('"scripts"') &&
          !l.includes('"name"') &&
          !l.includes('"version"')
      );
      if (depChanges.length > 0) {
        findings.push({
          tier: 'BLOCK',
          rule: 'no-new-deps',
          name: 'No new npm dependencies without approval',
          file: filePath,
          line: 0,
          text: `Dependency changes detected: ${depChanges.map((l) => l.trim()).join(', ')}`,
        });
      }
    }

    if (diff.includes('"scripts"')) {
      findings.push({
        tier: 'FLAG',
        rule: 'scripts-changed',
        name: 'package.json scripts section modified',
        file: filePath,
        line: 0,
        text: 'Changes to package.json scripts section',
      });
    }
  } catch {
    findings.push({
      tier: 'FLAG',
      rule: 'package-json-changed',
      name: 'package.json modified',
      file: filePath,
      line: 0,
      text: 'package.json was modified — review for dependency or script changes',
    });
  }
  return findings;
}

function checkWorkflowFile(filePath, content) {
  const findings = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    const usesMatch = line.match(/uses:\s*([^@]+)@(.+)/);
    if (usesMatch) {
      const ref = usesMatch[2].trim();
      if (!/^[0-9a-f]{40}$/.test(ref)) {
        findings.push({
          tier: 'BLOCK',
          rule: 'unpinned-action',
          name: 'Unpinned GitHub Action (must use commit SHA)',
          file: filePath,
          line: lineNum,
          text: line.trim(),
        });
      }
    }

    if (line.match(/pull_request_target/)) {
      findings.push({
        tier: 'BLOCK',
        rule: 'pull-request-target',
        name: 'Dangerous pull_request_target trigger',
        file: filePath,
        line: lineNum,
        text: line.trim(),
      });
    }

    if (line.match(/permissions:\s*write-all/)) {
      findings.push({
        tier: 'BLOCK',
        rule: 'write-all-permissions',
        name: 'Overly permissive workflow permissions',
        file: filePath,
        line: lineNum,
        text: line.trim(),
      });
    }

    if (
      line.match(/\$\{\{\s*github\.event\./) &&
      !line.match(/^\s*#/)
    ) {
      let inRun = false;
      for (let j = i; j >= Math.max(0, i - 10); j--) {
        if (lines[j].match(/^\s*run:\s*[|>]?\s*$/) || lines[j].match(/^\s*run:\s*.+/)) {
          inRun = true;
          break;
        }
        if (lines[j].match(/^\s*\w+:/) && !lines[j].match(/^\s*run:/)) {
          break;
        }
      }
      if (inRun) {
        findings.push({
          tier: 'BLOCK',
          rule: 'untrusted-input-interpolation',
          name: 'Direct interpolation of untrusted input in run block',
          file: filePath,
          line: lineNum,
          text: line.trim(),
        });
      }
    }
  }

  return findings;
}

function checkLockfileIntegrity(changedFiles) {
  const findings = [];
  const hasLockfileChange = changedFiles.some(
    (f) => f.path === 'pnpm-lock.yaml'
  );
  const hasPackageJsonChange = changedFiles.some(
    (f) => f.path === 'package.json'
  );

  if (hasLockfileChange && !hasPackageJsonChange) {
    findings.push({
      tier: 'FLAG',
      rule: 'lockfile-without-packagejson',
      name: 'Lockfile changed without package.json change',
      file: 'pnpm-lock.yaml',
      line: 0,
      text: 'pnpm-lock.yaml was modified without a corresponding package.json change — verify this is intentional',
    });
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Main scanning logic
// ---------------------------------------------------------------------------

function scanFile(filePath, content) {
  const findings = [];
  const ext = extname(filePath);
  const isSource = SOURCE_EXTENSIONS.has(ext);
  const isMdx = MDX_EXTENSIONS.has(ext);

  let linesToScan;
  if (isMdx) {
    linesToScan = getExecutableLines(content);
  } else {
    linesToScan = content.split('\n').map((text, i) => ({
      lineNumber: i + 1,
      text,
    }));
  }

  for (const rule of BLOCK_RULES) {
    if (rule.scope === 'source' && !isSource) continue;
    if (rule.scope === 'all-mdx-aware' && !isSource && !isMdx) continue;
    if (rule.dirs && !isInDirs(filePath, rule.dirs)) continue;
    if (rule.files && !rule.files.includes(filePath)) continue;

    for (const { lineNumber, text } of linesToScan) {
      if (rule.pattern.test(text)) {
        if (isKnownSafePattern(filePath, text)) continue;

        findings.push({
          tier: 'BLOCK',
          rule: rule.id,
          name: rule.name,
          file: filePath,
          line: lineNumber,
          text: text.trim(),
        });
      }
    }
  }

  for (const rule of FLAG_RULES) {
    if (rule.scope === 'source' && !isSource) continue;
    if (rule.scope === 'all-mdx-aware' && !isSource && !isMdx) continue;
    if (rule.files && !rule.files.includes(filePath)) continue;

    for (const { lineNumber, text } of linesToScan) {
      if (rule.pattern.test(text)) {
        if (isKnownSafePattern(filePath, text)) continue;

        findings.push({
          tier: 'FLAG',
          rule: rule.id,
          name: rule.name,
          file: filePath,
          line: lineNumber,
          text: text.trim(),
        });
      }
    }
  }

  if (isMdx) {
    for (const { lineNumber, text } of linesToScan) {
      if (isSuspiciousMdxImport(text)) {
        findings.push({
          tier: 'FLAG',
          rule: 'suspicious-mdx-import',
          name: 'Suspicious MDX import',
          file: filePath,
          line: lineNumber,
          text: text.trim(),
        });
      }
    }
  }

  return findings;
}

function scan() {
  const changedFiles = getChangedFiles();
  const allFindings = [];

  allFindings.push(...checkLockfileIntegrity(changedFiles));

  for (const { status, path: filePath } of changedFiles) {
    if (status === 'D') continue;

    const ext = extname(filePath);

    if (status === 'A' && SOURCE_EXTENSIONS.has(ext)) {
      if (!isAllowedJsLocation(filePath)) {
        allFindings.push({
          tier: 'BLOCK',
          rule: 'js-outside-allowed-dir',
          name: 'New JS/TS file outside allowed directories',
          file: filePath,
          line: 0,
          text: `New file ${filePath} is outside components/, lib/, or app/`,
        });
      }
    }

    if (isInfrastructureFile(filePath)) {
      allFindings.push({
        tier: 'FLAG',
        rule: 'infrastructure-change',
        name: 'Infrastructure file modified',
        file: filePath,
        line: 0,
        text: `Security-sensitive file modified: ${filePath}`,
      });
    }

    if (filePath === 'package.json') {
      const fullPath = resolve(filePath);
      if (existsSync(fullPath)) {
        allFindings.push(...checkPackageJsonChanges(filePath));
      }
      continue;
    }

    if (filePath.startsWith('.github/workflows/') && filePath.endsWith('.yml')) {
      const fullPath = resolve(filePath);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf8');
        allFindings.push(...checkWorkflowFile(filePath, content));
      }
      continue;
    }

    if (!ALL_SCANNABLE.has(ext)) continue;

    if (isAllowFreely(filePath) && !isSourceFile(filePath)) continue;

    const fullPath = resolve(filePath);
    if (!existsSync(fullPath)) continue;
    const content = readFileSync(fullPath, 'utf8');
    allFindings.push(...scanFile(filePath, content));
  }

  return allFindings;
}

// ---------------------------------------------------------------------------
// Output formatting
// ---------------------------------------------------------------------------

function formatFindings(findings) {
  const blocks = findings.filter((f) => f.tier === 'BLOCK');
  const flags = findings.filter((f) => f.tier === 'FLAG');

  for (const f of findings) {
    const level = f.tier === 'BLOCK' ? 'error' : 'warning';
    const lineArg = f.line > 0 ? `,line=${f.line}` : '';
    console.log(`::${level} file=${f.file}${lineArg}::${f.name}: ${f.text}`);
  }

  const lines = [];
  lines.push('## Security Scan Results');
  lines.push('');

  if (blocks.length === 0 && flags.length === 0) {
    lines.push('No security findings. All checks passed.');
    lines.push('<!-- security-scan-comment -->');
    return { comment: lines.join('\n'), hasBlocks: false, hasFlags: false };
  }

  if (blocks.length > 0) {
    lines.push(`### Blocked (${blocks.length} finding${blocks.length > 1 ? 's' : ''})`);
    lines.push('');
    lines.push(
      'These issues **must be resolved** before this PR can be merged.'
    );
    lines.push('');
    for (const f of blocks) {
      const loc = f.line > 0 ? `:${f.line}` : '';
      lines.push(`- **${f.name}** in \`${f.file}${loc}\``);
      lines.push(`  \`${f.text}\``);
    }
    lines.push('');
  }

  if (flags.length > 0) {
    lines.push(`### Flagged for Review (${flags.length} finding${flags.length > 1 ? 's' : ''})`);
    lines.push('');
    lines.push(
      'These items need a closer look but do not block the merge.'
    );
    lines.push('');
    for (const f of flags) {
      const loc = f.line > 0 ? `:${f.line}` : '';
      lines.push(`- **${f.name}** in \`${f.file}${loc}\``);
      lines.push(`  \`${f.text}\``);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push(
    `*${blocks.length} blocked, ${flags.length} flagged*`
  );
  lines.push('<!-- security-scan-comment -->');

  return {
    comment: lines.join('\n'),
    hasBlocks: blocks.length > 0,
    hasFlags: flags.length > 0,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

try {
  const findings = scan();
  const { comment, hasBlocks, hasFlags } = formatFindings(findings);

  const commentPath = process.env.COMMENT_OUTPUT || '/tmp/security-scan-comment.md';
  writeFileSync(commentPath, comment);

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    writeFileSync(summaryPath, comment, { flag: 'a' });
  }

  const outputPath = process.env.GITHUB_OUTPUT;
  if (outputPath) {
    writeFileSync(outputPath, `has_blocks=${hasBlocks}\n`, { flag: 'a' });
    writeFileSync(outputPath, `has_flags=${hasFlags}\n`, { flag: 'a' });
    writeFileSync(outputPath, `comment_path=${commentPath}\n`, { flag: 'a' });
  }

  console.log(`\nScan complete: ${findings.length} finding(s)`);
  console.log(`  BLOCK: ${findings.filter((f) => f.tier === 'BLOCK').length}`);
  console.log(`  FLAG:  ${findings.filter((f) => f.tier === 'FLAG').length}`);

  if (hasBlocks) {
    process.exit(1);
  }
} catch (error) {
  console.error('Security scan failed:', error.message);
  process.exit(2);
}
