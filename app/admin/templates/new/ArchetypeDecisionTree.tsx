'use client'
import { useState } from 'react'
import { DECISION_TREE, getPresetById } from '@/lib/pipeline-presets'
import type { PipelinePreset } from '@/lib/pipeline-presets'

interface Props {
  onSelect: (preset: PipelinePreset) => void
}

export function ArchetypeDecisionTree({ onSelect }: Props) {
  const [history, setHistory] = useState<string[]>(['start'])
  const currentId = history[history.length - 1]
  const node = DECISION_TREE[currentId]

  function goTo(nextId: string) {
    setHistory(prev => [...prev, nextId])
  }

  function goBack() {
    setHistory(prev => (prev.length > 1 ? prev.slice(0, -1) : prev))
  }

  function reset() {
    setHistory(['start'])
  }

  if (!node) return null

  const stepCount = Object.values(DECISION_TREE).filter(n => n.type === 'question').length

  return (
    <div className="rounded-xl border-2 border-violet-300 overflow-hidden">
      <div className="px-4 py-3 bg-violet-600 text-white flex items-center justify-between">
        <p className="text-sm font-black">✨ Guided Wizard</p>
        <div className="flex gap-1">
          {Array.from({ length: stepCount }, (_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full ${i < history.length - 1 ? 'bg-violet-300' : i === history.length - 1 ? 'bg-white' : 'bg-violet-500'}`}
            />
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3 bg-violet-50">
        {node.type === 'question' && (
          <>
            <p className="text-sm font-black text-violet-900">{node.text}</p>
            <div className="space-y-2">
              {node.options.map(opt => (
                <button
                  key={opt.next}
                  type="button"
                  onClick={() => goTo(opt.next)}
                  className="w-full flex items-center gap-3 rounded-xl border-2 border-violet-200 bg-white px-4 py-3 text-left text-sm font-bold text-neutral-800 hover:border-violet-500 hover:bg-violet-50 transition"
                >
                  <span className="text-xl shrink-0">{opt.emoji}</span>
                  <span>{opt.label}</span>
                  <span className="ml-auto text-violet-400 text-xs">→</span>
                </button>
              ))}
            </div>
          </>
        )}

        {node.type === 'result' && (
          <>
            <p className="text-xs font-black uppercase tracking-wider text-violet-700">ผลลัพธ์ที่แนะนำ</p>
            <div className="space-y-2">
              {node.presetIds.map(id => {
                const preset = getPresetById(id)
                if (!preset) return null
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelect(preset)}
                    className="w-full flex items-center gap-3 rounded-xl border-2 border-emerald-300 bg-white px-4 py-3 text-left hover:border-emerald-500 hover:bg-emerald-50 transition"
                  >
                    <span className="text-2xl shrink-0">{preset.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-neutral-900">{preset.name}</p>
                      <p className="text-xs text-neutral-500 truncate">{preset.description}</p>
                    </div>
                    <span className="text-emerald-600 font-black text-xs shrink-0">เลือก →</span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        <div className="flex items-center gap-3 pt-1">
          {history.length > 1 && (
            <button type="button" onClick={goBack} className="text-xs font-bold text-violet-600 hover:text-violet-800">
              ← ย้อนกลับ
            </button>
          )}
          {history.length > 1 && (
            <button type="button" onClick={reset} className="ml-auto text-xs font-bold text-neutral-400 hover:text-neutral-600">
              เริ่มใหม่
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
