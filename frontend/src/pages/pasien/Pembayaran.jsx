import { useEffect, useState, useCallback } from 'react'
import { api } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { PageHeader, Pager, StatusBadge, Empty, rupiah, tglPanjang } from '../../components/ui.jsx'
import { cetakInvoice } from '../../components/printInvoice.js'
import { Alert } from '../auth/AuthShell.jsx'

const inp = 'min-h-[44px] w-full rounded-lg border border-brand-200 bg-white px-3'

export default function Pembayaran() {
  const { user } = useAuth()
  const [page, setPage] = useState(null)
  const [pg, setPg] = useState(1)
  const [bayar, setBayar] = useState(null)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const load = useCallback(() => api(`/pasien/invoices?page=${pg}`).then(setPage).catch((e) => setErr(e.message)), [pg])
  useEffect(() => { load() }, [load])

  const kirim = async (e) => {
    e.preventDefault(); setErr(''); setOk('')
    try { await api(`/pasien/invoices/${bayar.id}/pay`, { method: 'POST', body: { metode: bayar.metode, jumlah: Number(bayar.jumlah), bukti: bayar.bukti } }); setOk('Pembayaran dikirim. Menunggu verifikasi kasir.'); setBayar(null); load() }
    catch (x) { setErr(x.message + (x.errors && Object.values(x.errors)[0] ? ` (${Object.values(x.errors)[0][0]})` : '')) }
  }
  const dibayar = (inv) => inv.payments.filter((p) => p.status === 'terverifikasi').reduce((a, p) => a + Number(p.jumlah), 0)

  return (
    <div className="max-w-3xl">
      <PageHeader title="Pembayaran dan invoice" desc="Bayar di kasir atau transfer/QRIS lalu laporkan di sini. Kasir memverifikasi pembayaran Anda." />
      <Alert>{err}</Alert><Alert kind="ok">{ok}</Alert>
      {!page ? <p className="text-brand-700">Memuat…</p> : page.data.length === 0 ? <Empty>Belum ada tagihan.</Empty> : (
        <div className="space-y-3">
          {page.data.map((inv) => {
            const sisa = Number(inv.total) - dibayar(inv)
            const menunggu = inv.payments.some((p) => p.status === 'menunggu_verifikasi')
            return (
              <article key={inv.id} className="rounded-xl border border-brand-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-semibold">{inv.nomor}</p><p className="text-sm text-brand-700">{tglPanjang(inv.visit?.tanggal)} · {inv.visit?.poli?.nama}</p></div>
                  <StatusBadge status={inv.status} />
                </div>
                <ul className="mt-3 text-sm">{inv.items.map((i) => <li key={i.id} className="flex justify-between"><span>{i.deskripsi} × {i.qty}</span><span>{rupiah(i.harga * i.qty)}</span></li>)}</ul>
                {Number(inv.diskon) > 0 && <p className="mt-1 flex justify-between text-sm"><span>Diskon</span><span>-{rupiah(inv.diskon)}</span></p>}
                <p className="mt-2 flex justify-between border-t border-brand-100 pt-2 font-semibold"><span>Total</span><span>{rupiah(inv.total)}</span></p>
                {inv.payments.length > 0 && <ul className="mt-2 space-y-1 text-sm text-brand-700">{inv.payments.map((p) => <li key={p.id} className="flex items-center justify-between"><span>{p.metode} · {rupiah(p.jumlah)}</span><StatusBadge status={p.status} /></li>)}</ul>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {inv.status !== 'lunas' && !menunggu && sisa > 0 && <button className="btn btn-primary min-h-[40px]" onClick={() => { setBayar({ id: inv.id, nomor: inv.nomor, metode: 'transfer', jumlah: sisa, bukti: '' }); setErr(''); setOk('') }}>Bayar online</button>}
                  {menunggu && <span className="self-center text-sm font-semibold text-yellow-800">Pembayaran menunggu verifikasi kasir</span>}
                  <button className="btn btn-outline min-h-[40px]" onClick={() => cetakInvoice({ ...inv, pasien: user.name, tanggal: inv.visit?.tanggal, poli: inv.visit?.poli?.nama, pembayaran: inv.payments })}>Cetak / simpan PDF</button>
                </div>
                {bayar?.id === inv.id && (
                  <form onSubmit={kirim} className="mt-3 grid gap-3 rounded-lg bg-brand-50 p-4 md:grid-cols-3">
                    <div><label htmlFor="pm" className="mb-1 block text-xs font-semibold">Metode</label><select id="pm" className={inp} value={bayar.metode} onChange={(e) => setBayar({ ...bayar, metode: e.target.value })}><option value="transfer">Transfer bank</option><option value="qris">QRIS</option></select></div>
                    <div><label htmlFor="pj" className="mb-1 block text-xs font-semibold">Jumlah (Rp)</label><input id="pj" type="number" className={inp} value={bayar.jumlah} onChange={(e) => setBayar({ ...bayar, jumlah: e.target.value })} /></div>
                    <div><label htmlFor="pb" className="mb-1 block text-xs font-semibold">No. referensi / bukti</label><input id="pb" className={inp} maxLength={100} value={bayar.bukti} onChange={(e) => setBayar({ ...bayar, bukti: e.target.value })} /></div>
                    <div className="flex gap-3 md:col-span-3"><button className="btn btn-primary" disabled={!bayar.bukti}>Kirim pembayaran</button><button type="button" className="btn btn-outline" onClick={() => setBayar(null)}>Batal</button></div>
                  </form>
                )}
              </article>
            )
          })}
        </div>
      )}
      <Pager page={page} onPage={setPg} />
    </div>
  )
}
