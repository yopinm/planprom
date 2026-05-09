// src/lib/markdown.ts — minimal markdown → HTML (no external deps)
// Handles: h2/h3, bold, italic, inline-code, links, ul lists, tables, paragraphs

function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="rounded bg-neutral-100 px-1 font-mono text-[0.85em]">$1</code>')
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-amber-600 underline hover:no-underline transition">$1</a>',
    )
}

function parseTableRows(lines: string[]): string {
  const rows = lines.map(l =>
    l.split('|').filter(Boolean).map(c => c.trim()),
  )
  const [header, ...rest] = rows
  const body = rest.filter(r => !r.every(c => /^-+$/.test(c)))

  const ths = (header ?? [])
    .map(c => `<th class="border border-neutral-200 bg-neutral-50 px-3 py-2 text-left font-black text-sm">${inline(c)}</th>`)
    .join('')
  const trs = body
    .map(
      row =>
        '<tr>' +
        row.map(c => `<td class="border border-neutral-200 px-3 py-2 text-sm text-neutral-700">${inline(c)}</td>`).join('') +
        '</tr>',
    )
    .join('')

  return `<div class="my-5 overflow-x-auto"><table class="w-full border-collapse">\
<thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`
}

export function renderMarkdown(md: string): string {
  const lines = md.split('\n')
  const out: string[] = []
  let inUl = false
  let tableLines: string[] = []

  function flushUl() {
    if (inUl) { out.push('</ul>'); inUl = false }
  }
  function flushTable() {
    if (tableLines.length) {
      out.push(parseTableRows(tableLines))
      tableLines = []
    }
  }

  for (const line of lines) {
    if (line.startsWith('|')) {
      flushUl()
      tableLines.push(line)
      continue
    }
    if (tableLines.length) flushTable()

    if (line.startsWith('## ')) {
      flushUl()
      out.push(`<h2 class="mb-3 mt-8 text-xl font-black text-black">${inline(line.slice(3))}</h2>`)
    } else if (line.startsWith('### ')) {
      flushUl()
      out.push(`<h3 class="mb-2 mt-5 text-base font-black text-black">${inline(line.slice(4))}</h3>`)
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inUl) { out.push('<ul class="my-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-neutral-700">'); inUl = true }
      out.push(`<li>${inline(line.slice(2))}</li>`)
    } else if (line.trim() === '') {
      flushUl()
    } else {
      flushUl()
      out.push(`<p class="my-3 text-sm leading-relaxed text-neutral-700">${inline(line)}</p>`)
    }
  }

  flushUl()
  if (tableLines.length) flushTable()
  return out.join('\n')
}
