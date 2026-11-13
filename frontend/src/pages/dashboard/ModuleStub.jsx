import { useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { ROLES } from '../../config/roles.js'

export default function ModuleStub() {
  const { modul } = useParams()
  const { user } = useAuth()
  const item = ROLES[user.role].menu.find((x) => x.slug === modul)
  if (!item) return <h1 className="text-xl font-bold">Halaman tidak ditemukan</h1>
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">{item.label}</h1>
      <p className="mt-3 rounded-lg border border-brand-200 bg-white p-5 text-brand-700">Modul ini belum dibangun. Dijadwalkan pada {item.bab}.</p>
    </div>
  )
}
