'use client'

import { useState } from 'react'
import { PromoEngineCards, type PrefillData } from './PromoEngineCards'
import { PromoCreateForm } from './PromoCreateForm'

export function PromoCodeSection({ suggested }: { suggested: string }) {
  const [prefill, setPrefill] = useState<PrefillData | null>(null)

  function handleGenerate(p: PrefillData) {
    setPrefill(p)
    setTimeout(() => {
      document.getElementById('promo-create-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  return (
    <>
      <PromoEngineCards onGenerate={handleGenerate} />
      <div id="promo-create-form">
        <PromoCreateForm suggested={suggested} prefill={prefill} />
      </div>
    </>
  )
}
