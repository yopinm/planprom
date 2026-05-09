'use client'

/**
 * src/components/product/SafeImage.tsx
 * TASK 4.3 — Image Optimization
 * 
 * A wrapper around next/image that handles:
 * - Fallback to a placeholder when the source fails to load.
 * - Shimmer/skeleton loading state.
 * - Centralized remote domain handling via remotePatterns in next.config.ts.
 */

import type { ReactElement } from 'react'
import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'

interface SafeImageProps extends Omit<ImageProps, 'onError' | 'src'> {
  src?: ImageProps['src'] | null
  /** Optional custom fallback image path. Defaults to a generic placeholder. */
  fallbackSrc?: string
}

// Shimmer effect for placeholder (SVG base64)
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f3f4f6" offset="20%" />
      <stop stop-color="#e5e7eb" offset="50%" />
      <stop stop-color="#f3f4f6" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f3f4f6" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str)

export function SafeImage({
  src,
  alt,
  fallbackSrc = '/product-placeholder.svg',
  width,
  height,
  className,
  ...props 
}: SafeImageProps): ReactElement {
  const [error, setError] = useState(false)
  const [prevSrc, setPrevSrc] = useState(src)

  // Reset error state if src changes (Derived state pattern)
  if (src !== prevSrc) {
    setPrevSrc(src)
    setError(false)
  }

  const w = typeof width === 'number' ? width : 400
  const h = typeof height === 'number' ? height : 400
  const normalizedSrc = normalizeImageSrc(src)
  const normalizedFallbackSrc = normalizeImageSrc(fallbackSrc) ?? '/product-placeholder.svg'

  return (
    <Image
      {...props}
      src={error ? normalizedFallbackSrc : (normalizedSrc ?? normalizedFallbackSrc)}
      alt={alt}
      width={width}
      height={height}
      className={className}
      placeholder={`data:image/svg+xml;base64,${toBase64(shimmer(w, h))}`}
      onError={() => {
        setError(true)
      }}
    />
  )
}

function normalizeImageSrc(src: ImageProps['src'] | null | undefined): ImageProps['src'] | null {
  if (!src) return null
  if (typeof src !== 'string') return src

  const trimmed = src.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('/')) return trimmed

  try {
    const url = new URL(trimmed)
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.toString()
  } catch {
    return null
  }

  return null
}
