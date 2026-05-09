// src/lib/security/sanitizer.ts — TASK S2
//
// Server-side input sanitization helpers.
// No DOM dependency — pure string operations, safe to import in Server Components / Actions.

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
}

const DANGEROUS_TEXT_CONTAINERS = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'svg',
  'math',
  'template',
])

function decodeHtmlEntitiesOnce(input: string): string {
  return input.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (_match, entity: string) => {
    const normalized = entity.toLowerCase()

    if (normalized.startsWith('#x')) {
      return decodeCodePoint(Number.parseInt(normalized.slice(2), 16))
    }

    if (normalized.startsWith('#')) {
      return decodeCodePoint(Number.parseInt(normalized.slice(1), 10))
    }

    return NAMED_ENTITIES[normalized] ?? `&${entity};`
  })
}

function decodeCodePoint(value: number): string {
  if (!Number.isInteger(value) || value <= 0 || value > 0x10FFFF) return ''
  try {
    return String.fromCodePoint(value)
  } catch {
    return ''
  }
}

function decodeHtmlEntities(input: string): string {
  let decoded = input
  for (let i = 0; i < 3; i += 1) {
    const next = decodeHtmlEntitiesOnce(decoded)
    if (next === decoded) return decoded
    decoded = next
  }
  return decoded
}

function isTagStart(input: string, index: number): boolean {
  const next = input[index + 1]
  if (!next) return false
  return next === '/' || next === '!' || next === '?' || /[A-Za-z]/.test(next)
}

function findTagEnd(input: string, start: number): number {
  let quote: string | null = null
  for (let i = start + 1; i < input.length; i += 1) {
    const char = input[i]
    if (quote) {
      if (char === quote) quote = null
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      continue
    }
    if (char === '>') return i
  }
  return -1
}

function getTagName(rawTag: string): string {
  let index = 1
  while (rawTag[index] === '/' || rawTag[index] === '!' || rawTag[index] === '?') index += 1

  let name = ''
  while (index < rawTag.length && /[A-Za-z0-9:-]/.test(rawTag[index])) {
    name += rawTag[index].toLowerCase()
    index += 1
  }
  return name
}

function findClosingTagEnd(input: string, tagName: string, start: number): number {
  const needle = `</${tagName}`
  const lowerInput = input.toLowerCase()
  const searchFrom = start

  while (searchFrom < input.length) {
    const closeStart = lowerInput.indexOf(needle, searchFrom)
    if (closeStart === -1) return input.length

    const closeEnd = findTagEnd(input, closeStart)
    if (closeEnd === -1) return input.length

    return closeEnd + 1
  }

  return input.length
}

// Strip HTML/XML markup for plain-text fields without relying on regex tag removal.
export function stripHtml(input: string): string {
  const decoded = decodeHtmlEntities(input)
  let output = ''
  let index = 0

  while (index < decoded.length) {
    const char = decoded[index]

    if (char !== '<' || !isTagStart(decoded, index)) {
      output += char
      index += 1
      continue
    }

    const tagEnd = findTagEnd(decoded, index)
    if (tagEnd === -1) {
      index += 1
      continue
    }

    const rawTag = decoded.slice(index, tagEnd + 1)
    const tagName = getTagName(rawTag)
    const isClosingTag = rawTag.startsWith('</')

    if (!isClosingTag && DANGEROUS_TEXT_CONTAINERS.has(tagName)) {
      index = findClosingTagEnd(decoded, tagName, tagEnd + 1)
      continue
    }

    index = tagEnd + 1
  }

  return output.trim()
}

// Sanitize a plain-text field: strip HTML + collapse whitespace + enforce max length
export function sanitizeText(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') return ''
  return stripHtml(input).replace(/\s+/g, ' ').slice(0, maxLength).trim()
}

// Sanitize a coupon code: uppercase, alphanumeric + dash/underscore only, max 64 chars
export function sanitizeCode(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 64)
}

// Sanitize a numeric form field — returns NaN if not a valid finite number
export function sanitizeNumber(input: unknown): number {
  const n = parseFloat(String(input))
  return Number.isFinite(n) ? n : NaN
}

// Sanitize a URL — must be https and in a trusted domain, returns '' if invalid
const TRUSTED_DOMAINS = new Set([
  'shopee.co.th', 'shopee.com', 's.shopee.co.th',
  'lazada.co.th', 'lazada.com', 'go.lazada.co.th',
  'tiktok.com', 'shop.tiktok.com', 's.tiktok.com', 'vm.tiktok.com',
])

export function sanitizeAffiliateUrl(input: unknown): string {
  if (typeof input !== 'string' || !input) return ''
  try {
    const parsed = new URL(input.trim())
    if (parsed.protocol !== 'https:') return ''
    const host = parsed.hostname.toLowerCase()
    const trusted = [...TRUSTED_DOMAINS].some(d => host === d || host.endsWith(`.${d}`))
    return trusted ? parsed.href : ''
  } catch {
    return ''
  }
}
