import { Shield } from 'lucide-react'

export function Crest({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'crest crest--compact' : 'crest'} aria-label="The Maester's Ledger">
      <span className="crest__mark" aria-hidden="true"><Shield strokeWidth={1.4} /></span>
      {!compact && (
        <span className="crest__copy">
          <strong>The Maester's</strong>
          <small>Ledger</small>
        </span>
      )}
    </div>
  )
}
