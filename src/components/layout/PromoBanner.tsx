import { X } from 'lucide-react'
import { useState } from 'react'

export function PromoBanner() {
  const [visible, setVisible] = useState(true)
  if (!visible) return null

  return (
    <div className="bg-brand-black text-brand-white">
      <div className="container-shop flex items-center justify-center gap-4 py-2 text-center text-sm">
        <p>
          Sign up and get <strong>20% off</strong> your first order.{' '}
          <button type="button" className="underline underline-offset-2">
            Sign Up Now
          </button>
        </p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="rounded-full p-1 hover:bg-brand-gray-900"
          aria-label="Dismiss promo"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
