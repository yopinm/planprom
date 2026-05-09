#!/usr/bin/env node
// Lightweight tracked-file secret scan for pre-hosting security checks.

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { extname } from 'node:path'

const binaryExtensions = new Set([
  '.ico',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.lock',
])

const allowedTrackedFiles = new Set(['.env.example'])
const disallowedTrackedPatterns = [/^\.env(?!\.example$)/, /^\.claude\/.*\.local\.json$/]

const knownSecretPatterns = [
  { name: 'AWS access key', regex: /AKIA[0-9A-Z]{16}/g },
  { name: 'GitHub token', regex: /gh[pousr]_[A-Za-z0-9_]{20,}/g },
  { name: 'OpenAI API key', regex: /sk-[A-Za-z0-9_-]{20,}/g },
  { name: 'Google API key', regex: /AIza[0-9A-Za-z_-]{20,}/g },
  { name: 'Slack token', regex: /xox[baprs]-[A-Za-z0-9-]{20,}/g },
  { name: 'Private key', regex: /BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY/g },
]

const assignmentPattern =
  /\b(api[_-]?key|app[_-]?secret|secret|token|password|private[_-]?key|service[_-]?role|auth[_-]?token|access[_-]?token)\b\s*[:=]\s*["']?([^"'\s#,`]+)["']?/gi

function listTrackedFiles() {
  return execFileSync('git', ['ls-files'], { encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((file) => file.replaceAll('\\', '/'))
}

function isBinaryLike(file) {
  return binaryExtensions.has(extname(file).toLowerCase())
}

function isPlaceholderValue(value) {
  const normalized = value.trim().toLowerCase()

  return (
    normalized.length < 16 ||
    normalized.startsWith('process.env.') ||
    normalized.startsWith('req.') ||
    normalized.startsWith('secrets.') ||
    normalized.startsWith('linetokenbyuser.get(') ||
    normalized.startsWith('encodeuricomponent(') ||
    normalized.startsWith('getpagetoken(') ||
    normalized.startsWith('${{') ||
    normalized.startsWith('${') ||
    normalized.startsWith('<') ||
    /^[A-Z0-9_]+$/.test(value.trim()) ||
    normalized.includes('your-') ||
    normalized.includes('cron_secret') ||
    normalized.includes('example') ||
    normalized.includes('placeholder') ||
    normalized.includes('dummy') ||
    normalized.includes('mock') ||
    normalized.includes('test') ||
    normalized === 'dev-admin-key'
  )
}

function lineNumberForIndex(content, index) {
  return content.slice(0, index).split(/\r?\n/).length
}

const findings = []

for (const file of listTrackedFiles()) {
  if (!existsSync(file)) continue

  if (!allowedTrackedFiles.has(file)) {
    for (const pattern of disallowedTrackedPatterns) {
      if (pattern.test(file)) {
        findings.push({
          file,
          line: 1,
          kind: 'Tracked local/sensitive config file',
        })
      }
    }
  }

  if (isBinaryLike(file)) continue

  const content = readFileSync(file, 'utf8')

  for (const secretPattern of knownSecretPatterns) {
    for (const match of content.matchAll(secretPattern.regex)) {
      findings.push({
        file,
        line: lineNumberForIndex(content, match.index ?? 0),
        kind: secretPattern.name,
      })
    }
  }

  for (const match of content.matchAll(assignmentPattern)) {
    const value = match[2] ?? ''
    if (isPlaceholderValue(value)) continue

    findings.push({
      file,
      line: lineNumberForIndex(content, match.index ?? 0),
      kind: `Suspicious ${match[1]} assignment`,
    })
  }
}

if (findings.length > 0) {
  process.stderr.write('\nSecret scan failed. Review these tracked-file findings:\n')
  for (const finding of findings) {
    process.stderr.write(`  - ${finding.file}:${finding.line} ${finding.kind}\n`)
  }
  process.stderr.write('\n')
  process.exit(1)
}

process.stdout.write('Secret scan passed. No high-confidence tracked secrets found.\n')
