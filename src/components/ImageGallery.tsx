import { useState } from 'react'
import type { ChatImage } from '../../types.ts'

export default function ImageGallery({ images }: { images: ChatImage[] }) {
  const [failed, setFailed] = useState<number[]>([])

  return (
    <div className="mt-4 grid gap-2">
      {images.map((image, index) =>
        failed.includes(index) ? null : (
          <figure
            key={`${image.url}-${index}`}
            className="overflow-hidden rounded-xl border border-electric-purple/25 bg-vice-950/60"
          >
            <img
              src={image.url}
              alt={image.caption}
              title={image.url}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setFailed((current) => [...current, index])}
              className="max-h-72 w-full bg-vice-950 object-contain"
            />
            <figcaption className="flex items-center justify-between gap-2 px-3 py-2 font-mono text-[10px] text-tropical-cyan/80">
              <span className="truncate">{image.caption}</span>
              <a
                href={image.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-sunset-pink hover:underline"
              >
                Abrir imagem ↗
              </a>
            </figcaption>
          </figure>
        ),
      )}
    </div>
  )
}
