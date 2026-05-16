'use client'
import { useState } from 'react'
import { PRESETS, ARCHETYPES, getPresetsForCatSlug, getArchetypeById, getPresetById } from '@/lib/pipeline-presets'
import type { PipelinePreset } from '@/lib/pipeline-presets'
import type { SmartSuggestionResult } from './actions-preset'
import { ArchetypeDecisionTree } from './ArchetypeDecisionTree'

interface Props {
  catSlug?: string
  selectedPresetId: string | null
  onSelect: (preset: PipelinePreset) => void
  onNext?: () => void
  smartSuggestions?: SmartSuggestionResult | null
  smartLoading?: boolean
}

const ARCHETYPE_COLORS: Record<string, { bg: string; text: string; border: string; activeBorder: string; badge: string }> = {
  'one-shot':   { bg: 'bg-amber-50',    text: 'text-amber-800',   border: 'border-amber-200',   activeBorder: 'border-amber-500',   badge: 'bg-amber-100 text-amber-700' },
  'accumulate': { bg: 'bg-emerald-50',  text: 'text-emerald-800', border: 'border-emerald-200', activeBorder: 'border-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  'habit':      { bg: 'bg-sky-50',      text: 'text-sky-800',     border: 'border-sky-200',     activeBorder: 'border-sky-500',     badge: 'bg-sky-100 text-sky-700' },
  'project':    { bg: 'bg-violet-50',   text: 'text-violet-800',  border: 'border-violet-200',  activeBorder: 'border-violet-500',  badge: 'bg-violet-100 text-violet-700' },
  'growth':     { bg: 'bg-rose-50',     text: 'text-rose-800',    border: 'border-rose-200',    activeBorder: 'border-rose-500',    badge: 'bg-rose-100 text-rose-700' },
  'life-ops':   { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-200', activeBorder: 'border-neutral-500', badge: 'bg-neutral-200 text-neutral-600' },
}

// global sequential number per preset id
const PRESET_NUMBER: Record<string, number> = Object.fromEntries(PRESETS.map((p, i) => [p.id, i + 1]))

// Source label for smart suggestions
function SmartSourceBadge({ result }: { result: SmartSuggestionResult }) {
  const { source, signals } = result
  if (source === 'static') {
    return (
      <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
        ⚡ default mapping
      </span>
    )
  }
  const parts: string[] = []
  if (signals.templateCount > 0) parts.push(`${signals.templateCount} templates`)
  if (signals.hasSalesData)      parts.push('มียอดขาย')
  if (signals.gapHorizons.length > 0) parts.push(`gap ${signals.gapHorizons.join('/')}`)
  return (
    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
      📊 {source} — {parts.join(' · ')}
    </span>
  )
}

export function PresetSelector({ catSlug, selectedPresetId, onSelect, onNext, smartSuggestions, smartLoading }: Props) {
  const [showWizard, setShowWizard] = useState(false)

  // suggestion: smart result takes priority over static mapping
  const staticSuggested = catSlug ? getPresetsForCatSlug(catSlug) : []
  const suggestedIds = smartSuggestions?.presetIds ?? staticSuggested.map(p => p.id)
  const suggested = suggestedIds.map(id => getPresetById(id)).filter((p): p is PipelinePreset => !!p)

  const selectedPreset = PRESETS.find(p => p.id === selectedPresetId) ?? null

  return (
    <div className="space-y-4">
      <p className="text-xs text-neutral-500">
        เลือก preset → ระบบ pre-fill ค่าเริ่มต้น — แก้ไขได้ทุก stage ภายหลัง
      </p>

      {/* Smart suggestion */}
      {(suggested.length > 0 || smartLoading) && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <p className="text-[11px] font-black uppercase tracking-widest text-amber-700">
              แนะนำสำหรับ &quot;{catSlug}&quot;
            </p>
            {smartLoading && (
              <span className="text-[10px] font-bold text-neutral-400 animate-pulse">⏳ วิเคราะห์...</span>
            )}
            {!smartLoading && smartSuggestions && <SmartSourceBadge result={smartSuggestions} />}
            {!smartLoading && !smartSuggestions && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">⚡ default</span>
            )}
          </div>
          {smartLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-14 rounded-xl bg-amber-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {suggested.map(preset => {
                const colors = ARCHETYPE_COLORS[preset.archetypeId] ?? ARCHETYPE_COLORS['project']
                const archetype = getArchetypeById(preset.archetypeId)
                const num = PRESET_NUMBER[preset.id]
                const isSelected = selectedPresetId === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelect(preset)}
                    className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition
                      ${isSelected ? `${colors.activeBorder} ${colors.bg} shadow-sm` : 'border-amber-200 bg-white hover:border-amber-400'}`}
                  >
                    <span className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-black
                      ${isSelected ? 'bg-amber-600 text-white' : 'bg-amber-200 text-amber-700'}`}>
                      {num}
                    </span>
                    <span className="text-xl shrink-0">{preset.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-sm text-neutral-900">{preset.name}</p>
                        {archetype && (
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${colors.badge}`}>
                            {archetype.emoji} {archetype.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 truncate mt-0.5">{preset.description}</p>
                    </div>
                    {isSelected && <span className="text-amber-600 font-black shrink-0 text-lg">✓</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Guided Wizard toggle */}
      <button
        type="button"
        onClick={() => setShowWizard(s => !s)}
        className="w-full rounded-xl border-2 border-dashed border-violet-300 bg-violet-50 py-3 text-sm font-black text-violet-700 hover:border-violet-500 transition"
      >
        {showWizard ? '✕ ปิด Guided Wizard' : '✨ ให้ระบบช่วยเลือก (Guided Wizard)'}
      </button>

      {showWizard && (
        <ArchetypeDecisionTree
          onSelect={preset => { onSelect(preset); setShowWizard(false) }}
        />
      )}

      {/* All presets grouped by archetype */}
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-3">
          Preset ทั้งหมด — เลือก 1 แบบ
        </p>
        {ARCHETYPES.map(archetype => {
          const archetypePresets = PRESETS.filter(p => p.archetypeId === archetype.id)
          if (archetypePresets.length === 0) return null
          const colors = ARCHETYPE_COLORS[archetype.id] ?? ARCHETYPE_COLORS['project']
          return (
            <div key={archetype.id} className="mb-3">
              {/* archetype header */}
              <div className={`flex items-center gap-2 rounded-t-lg border ${colors.border} ${colors.bg} px-3 py-2`}>
                <span className="text-sm">{archetype.emoji}</span>
                <span className={`text-[11px] font-black uppercase tracking-wider ${colors.text}`}>{archetype.name}</span>
                <span className="text-[10px] text-neutral-400 ml-1 hidden sm:inline truncate">— {archetype.description}</span>
              </div>
              {/* preset rows */}
              <div className={`border-x border-b ${colors.border} rounded-b-lg divide-y divide-neutral-100`}>
                {archetypePresets.map(preset => {
                  const num = PRESET_NUMBER[preset.id]
                  const isSelected = selectedPresetId === preset.id
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onSelect(preset)}
                      className={`w-full flex items-center gap-3 px-3 py-3 text-left transition
                        ${isSelected ? `${colors.bg}` : 'bg-white hover:bg-neutral-50'}`}
                    >
                      {/* number badge */}
                      <span className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-black
                        ${isSelected ? `${colors.activeBorder.replace('border-','bg-').replace('-500','-600')} text-white` : `${colors.badge}`}`}>
                        {num}
                      </span>
                      <span className="text-lg shrink-0">{preset.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${isSelected ? colors.text : 'text-neutral-800'}`}>
                          {preset.name}
                        </p>
                        <p className="text-[11px] text-neutral-400 truncate">{preset.description}</p>
                      </div>
                      {preset.optional_extensions && (
                        <span className="text-[9px] font-black bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded shrink-0">
                          Enterprise
                        </span>
                      )}
                      {isSelected && (
                        <span className={`font-black text-base shrink-0 ${colors.text}`}>✓</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Sticky CTA — ปรากฏเมื่อเลือก preset แล้ว ── */}
      {selectedPreset && (
        <div className="sticky bottom-2 rounded-2xl border-2 border-emerald-500 bg-white shadow-xl px-4 py-3 flex items-center gap-3">
          <div className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-sm font-black bg-emerald-600 text-white`}>
            {PRESET_NUMBER[selectedPreset.id]}
          </div>
          <span className="text-xl shrink-0">{selectedPreset.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-emerald-700 font-black">เลือกแล้ว</p>
            <p className="text-sm font-black text-neutral-900 truncate">{selectedPreset.name}</p>
          </div>
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="shrink-0 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-700 transition shadow"
            >
              ถัดไป →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
