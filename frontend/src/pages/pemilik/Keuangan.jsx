import { useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { PageHeader, StatCard, DateRange, TableWrap, Th, Td, rupiah, isoDay } from '../../components/ui.jsx'
import { GroupedBars } from '../../components/charts.jsx'
import CrudPage from '../../components/CrudPage.jsx'
import { Alert } from '../auth/AuthShell.jsx'

export default function Keuangan() {
  const [from, setFrom] = useState(isoDay(-29))
  const [to, setTo] = useState(isoDay())
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    setErr('')
    api(`/pemilik/finance?from=${from}&to=${to}`).then(setD).catch((e) => setErr(e.message))
  }, [from, to, tick])

  return (
    <div>
      <PageHeader title="Pendapatan dan pengeluaran" desc="Pendapatan dihitung dari pembayaran yang sudah diverifikasi." />
      <DateRange from={from} to={to} onChange={(a, b) => { setFrom(a); setTo(b) }} />
      <Alert>{err}</Alert>
      {d && <>
        <dl className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Pendapatan" value={rupiah(d.pendapatan)} />
          <StatCard label="Pengeluaran" value={rupiah(d.pengeluaran)} />
          <StatCard label="Keuntungan" value={rupiah(d.keuntungan)} tone={d.keuntungan < 0 ? 'bad' : 'good'} />
        </dl>
        <div className="mt-8 rounded-xl border border-brand-200 bg-white p-5">
          <h2 className="mb-3 font-semibold">6 bulan terakhir</h2>
          <GroupedBars label="Pendapatan dan pengeluaran per bulan" aName="Pendapatan" bName="Pengeluaran"
            data={d.bulanan.map((b) => ({ label: b.label, a: b.pendapatan, b: b.pengeluaran }))} />
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div><h2 className="mb-3 font-semibold">Pengeluaran per kategori</h2>
            <TableWrap><thead><tr><Th>Kategori</Th><Th>Jumlah</Th></tr></thead>
              <tbody>{d.per_kategori.length ? d.per_kategori.map((k) => <tr key={k.kategori}><Td>{k.kategori}</Td><Td>{rupiah(k.jumlah)}</Td></tr>) : <tr><Td>Tidak ada pengeluaran pada periode ini.</Td><Td /></tr>}</tbody></TableWrap></div>
          <div><h2 className="mb-3 font-semibold">Pendapatan per metode bayar</h2>
            <TableWrap><thead><tr><Th>Metode</Th><Th>Jumlah</Th></tr></thead>
              <tbody>{d.per_metode.length ? d.per_metode.map((k) => <tr key={k.metode}><Td className="capitalize">{k.metode}</Td><Td>{rupiah(k.jumlah)}</Td></tr>) : <tr><Td>Belum ada pembayaran.</Td><Td /></tr>}</tbody></TableWrap></div>
        </div>
      </>}
      <div className="mt-10" onClickCapture={() => setTimeout(() => setTick((t) => t + 1), 800)}>
        <CrudPage title="Catatan pengeluaran" desc="Catat pengeluaran operasional klinik." endpoint="/pemilik/expenses" searchable nounHapus="pengeluaran"
          blank={{ tanggal: isoDay(), kategori: '', keterangan: '', jumlah: '' }}
          columns={[{ key: 'tanggal', label: 'Tanggal' }, { key: 'kategori', label: 'Kategori' }, { key: 'keterangan', label: 'Keterangan' }, { label: 'Jumlah', render: (r) => rupiah(r.jumlah) }]}
          fields={[
            { name: 'tanggal', label: 'Tanggal', type: 'date', required: true }, { name: 'kategori', label: 'Kategori (mis. Gaji pegawai)', required: true },
            { name: 'jumlah', label: 'Jumlah (Rp)', type: 'number', required: true }, { name: 'keterangan', label: 'Keterangan' },
          ]} />
      </div>
    </div>
  )
}
