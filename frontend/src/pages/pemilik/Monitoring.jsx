import { useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { PageHeader, StatCard, TableWrap, Th, Td, rupiah } from '../../components/ui.jsx'
import { Alert } from '../auth/AuthShell.jsx'

const label = { terdaftar: 'Terdaftar', menunggu_dokter: 'Menunggu dokter', diperiksa: 'Diperiksa', selesai: 'Selesai', batal: 'Batal', menunggu: 'Menunggu', dipanggil: 'Dipanggil', dilayani: 'Dilayani', terlewat: 'Terlewat' }

export default function Monitoring() {
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    const load = () => api('/pemilik/monitoring').then(setD).catch((e) => setErr(e.message))
    load(); const t = setInterval(load, 15000); return () => clearInterval(t)
  }, [])
  const kartu = (obj) => Object.keys(obj).length ? Object.entries(obj).map(([k, v]) => <StatCard key={k} label={label[k] || k} value={v} />) : <p className="text-brand-700">Belum ada data hari ini.</p>
  return (
    <div>
      <PageHeader title="Monitoring operasional" desc="Kondisi klinik hari ini. Diperbarui otomatis tiap 15 detik." />
      <Alert>{err}</Alert>
      {d && <>
        <h2 className="mb-3 font-semibold">Kunjungan hari ini</h2>
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">{kartu(d.kunjungan_hari_ini)}</dl>
        <h2 className="mb-3 mt-8 font-semibold">Antrian hari ini</h2>
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">{kartu(d.antrian_hari_ini)}</dl>
        <h2 className="mb-3 mt-8 font-semibold">Tagihan</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Invoice belum dibayar" value={d.invoice_belum_bayar.jumlah} />
          <StatCard label="Nilai belum dibayar" value={rupiah(d.invoice_belum_bayar.total)} />
        </dl>
        <h2 className="mb-3 mt-8 font-semibold">Stok obat di bawah minimum</h2>
        <TableWrap><thead><tr><Th>Obat</Th><Th>Stok</Th><Th>Minimum</Th></tr></thead>
          <tbody>{d.stok_rendah.length ? d.stok_rendah.map((o) => <tr key={o.nama}><Td>{o.nama}</Td><Td className="font-semibold text-red-600">{o.stok}</Td><Td>{o.stok_minimum}</Td></tr>) : <tr><Td>Semua stok aman.</Td><Td /><Td /></tr>}</tbody></TableWrap>
        <h2 className="mb-3 mt-8 font-semibold">Obat segera kedaluwarsa (30 hari)</h2>
        <TableWrap><thead><tr><Th>Obat</Th><Th>Batch</Th><Th>Kedaluwarsa</Th><Th>Stok</Th></tr></thead>
          <tbody>{d.segera_kedaluwarsa.length ? d.segera_kedaluwarsa.map((o) => <tr key={o.no_batch}><Td>{o.nama}</Td><Td>{o.no_batch}</Td><Td>{o.tgl_kedaluwarsa}</Td><Td>{o.stok}</Td></tr>) : <tr><Td>Tidak ada.</Td><Td /><Td /><Td /></tr>}</tbody></TableWrap>
      </>}
    </div>
  )
}
