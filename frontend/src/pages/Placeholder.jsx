import { Link } from 'react-router-dom'
import Icon from '../components/Icon.jsx'

export default function Placeholder({ title, bab }) {
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-b from-brand-50 to-brand-100 px-6">
      <div className="card max-w-md animate-fade-up p-8 text-center">
        <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-brand-500"><Icon name="info" className="h-7 w-7" /></span>
        <h1 className="text-2xl font-extrabold">{title}</h1>
        {bab && <p className="mt-3 text-brand-700">Halaman ini dibangun pada {bab}.</p>}
        <Link to="/" className="btn btn-primary mt-6"><Icon name="home" className="h-4 w-4" />Kembali ke beranda</Link>
      </div>
    </main>
  )
}
