'use client'
import { useState } from 'react'
import { PRESETS, ARCHETYPES, getPresetsForCatSlug, getArchetypeById } from '@/lib/pipeline-presets'
import type { PipelinePreset } from '@/lib/pipeline-presets'
import { ArchetypeDecisionTree } from './ArchetypeDecisionTree'

interface Props {
  catSlug?: string
  selectedPresetId: string | null
  onSelect: (preset: PipelinePreset) => void
}

const ARCHETYPE_COLORS: Record<string, { bg: string; text: string; border: string; activeBorder: string }> = {
  'one-shot':   { bg: 'bg-amber-50',   text: 'text-amber-800',   border: 'border-amber-200',   activeBorder: 'border-amber-600' },
  'accumulate': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', activeBorder: 'border-emerald-600' },
  'habit':      { bg: 'bg-sky-50',     text: 'text-sky-800',     border: 'border-sky-200',     activeBorder: 'border-sky-600' },
  'project':    { bg: 'bg-violet-50',  text: 'text-violet-800',  border: 'border-violet-200',  activeBorder: 'border-violet-600' },
  'growth':     { bg: 'bg-rose-50',    text: 'text-rose-800',    border: 'border-rose-200',    activeBorder: 'border-rose-600' },
  'life-ops':   { bg: 'bg-neutral-100',text: 'text-neutral-700', border: 'border-neutral-200', activeBorder: 'border-neutral-600' },
}

export function PresetSelector({ catSlug, selectedPresetId, onSelect }: Props) {
  const [showWizard, setShowWizard] = useState(false)

  const suggested = catSlug ? getPresetsForCatSlug(catSlug) : []

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-neutral-500 mt-0.5">
          Preset จะ pre-fill ค่าเริ่มต้นทุก Stage — แก้ไขได้ทุกอย่างในขั้นตอนถัดไป
        </p>
      </div>

      {/* Smart suggestion from catalog */}
      {suggested.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-[11px] font-black uppercase tracking-widest text-amber-700 mb-3">
            ⚡ แนะนำจาก catalog &quot;{catSlug}&quot;
          </p>
          <div className="space-y-2">
            {suggested.map(preset => {
              const colors = ARCHETYPE_COLORS[preset.archetypeId] ?? ARCHETYPE_COLORS['project']
              const archetype = getArchetypeById(preset.archetypeId)
              const isSelected = selectedPresetId === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelect(preset)}
                  className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition
                    ${isSelected ? `${colors.activeBorder} ${colors.bg} shadow-sm` : 'border-amber-200 bg-white hover:border-amber-400'}`}
                >
                  <span className="text-2xl shrink-0">{preset.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-sm text-neutral-900">{preset.name}</p>
                      {archetype && (
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                          {archetype.emoji} {archetype.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 truncate mt-0.5">{preset.description}</p>
                  </div>
                  {isSelected && <span className={`font-black shrink-0 ${colors.text}`}>✓</span>}
                </button>
              )
            })}
          </div>
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
        <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-3">Preset ทั้งหมด ({PRESETS.length})</p>
        {ARCHETYPES.map(archetype => {
          const archetypePresets = PRESETS.filter(p => p.archetypeId === archetype.id)
          if (archetypePresets.length === 0) return null
          const colors = ARCHETYPE_COLORS[archetype.id] ?? ARCHETYPE_COLORS['project']
          return (
            <div key={archetype.id} className="mb-4">
              <div className={`flex items-center gap-2 rounded-t-lg border ${colors.border} ${colors.bg} px-3 py-2`}>
                <span className="text-base">{archetype.emoji}</span>
                <span className={`text-[11px] font-black uppercase tracking-wider ${colors.text}`}>{archetype.name}</span>
                <span className="text-[10px] text-neutral-400 ml-1 truncate">— {archetype.description}</span>
              </div>
              <div className={`border-x border-b ${colors.border} rounded-b-lg divide-y divide-neutral-100`}>
                {archetypePresets.map(preset => {
                  const isSelected = selectedPresetId === preset.id
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onSelect(preset)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition
                        ${isSelected ? `${colors.bg}` : 'bg-white hover:bg-neutral-50'}`}
                    >
                      <span className="text-xl shrink-0">{preset.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${isSelected ? colors.text : 'text-neutral-800'}`}>
                          {preset.name}
                        </p>
                        <p className="text-xs text-neutral-400 truncate">{preset.description}</p>
                      </div>
                      {preset.optional_extensions && (
                        <span className="text-[9px] font-black bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded shrink-0">
                          Enterprise
                        </span>
                      )}
                      {isSelected && (
                        <span className={`font-black text-sm shrink-0 ${colors.text}`}>✓</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
