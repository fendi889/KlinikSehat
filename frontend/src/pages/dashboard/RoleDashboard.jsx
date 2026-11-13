import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { ROLES } from '../../config/roles.js'
import { api } from '../../services/api.js'
import { PageHeader, StatTile, TONE_LIST } from '../../components/ui.jsx'

const IKON = ['users', 'activity', 'clipboard', 'wallet']

export default function RoleDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => { api('/dashboard/summary').then(setData).catch((e) => setErr(e.message)) }, [])

  return (
    <div>
      <PageHeader title={`Dashboard ${ROLES[user.role].label}`} desc="Ringkasan kondisi terkini. Pilih menu di samping untuk bekerja." />
      {err && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{err}</p>}
      {!data && !err && <p className="text-brand-700">Memuat data…</p>}
      {data && (
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.cards.map((c, i) => <StatTile key={c.label} icon={IKON[i % IKON.length]} tone={TONE_LIST[i % TONE_LIST.length]} label={c.label} value={Number(c.value).toLocaleString('id-ID')} />)}
        </dl>
      )}
    </div>
  )
}
