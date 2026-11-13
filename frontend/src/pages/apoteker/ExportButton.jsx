import { useState } from 'react'
import { download } from '../../services/api.js'

export default function ExportButton({ jenis, query = '', label = 'Ekspor Excel (CSV)', onError }) {
  const [busy, setBusy] = useState(false)
  const klik = async () => {
    setBusy(true)
    try { await download(`/apoteker/export/${jenis}${query ? `?${query}` : ''}`, `${jenis}-${new Date().toISOString().slice(0, 10)}.csv`) }
    catch (e) { onError?.(e.message) } finally { setBusy(false) }
  }
  return <button className="btn btn-outline" disabled={busy} onClick={klik}>{busy ? 'Menyiapkan…' : label}</button>
}
