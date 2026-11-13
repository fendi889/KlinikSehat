import { StatusBadge } from './ui.jsx'

// Tampilan baca-saja satu kunjungan: tanda vital, diagnosa, tindakan, resep, catatan.
export default function RecordView({ tanda_vital: tv, rekam_medis: mr }) {
  return (
    <div className="space-y-3 text-sm">
      {tv && <p><b>Tanda vital:</b> TD {tv.td_sistol ?? '-'}/{tv.td_diastol ?? '-'} mmHg · Nadi {tv.nadi ?? '-'}/mnt · Suhu {tv.suhu ?? '-'}°C · Napas {tv.napas ?? '-'}/mnt · SpO₂ {tv.spo2 ?? '-'}% · BB {tv.bb ?? '-'} kg · TB {tv.tb ?? '-'} cm</p>}
      {!mr ? <p className="text-brand-700">Rekam medis belum dibuat.</p> : <>
        {mr.keluhan_utama && <p><b>Keluhan utama:</b> {mr.keluhan_utama}</p>}
        {mr.riwayat_penyakit && <p><b>Riwayat penyakit:</b> {mr.riwayat_penyakit}</p>}
        {mr.pemeriksaan_fisik && <p><b>Pemeriksaan fisik:</b> {mr.pemeriksaan_fisik}</p>}
        <div><b>Diagnosa:</b> {mr.diagnoses?.length ? <ul className="ml-5 list-disc">{mr.diagnoses.map((x) => <li key={x.id}>{x.kode_icd && `${x.kode_icd} · `}{x.nama}</li>)}</ul> : '-'}</div>
        {mr.procedures?.length > 0 && <div><b>Tindakan:</b> <ul className="ml-5 list-disc">{mr.procedures.map((x) => <li key={x.id}>{x.nama}</li>)}</ul></div>}
        {mr.prescriptions?.map((rx) => (
          <div key={rx.id}><b>Resep:</b> <StatusBadge status={rx.status} />
            <ul className="ml-5 list-disc">{rx.items.map((i) => <li key={i.id}>{i.medicine.nama} · {i.jumlah} {i.medicine.satuan} · {i.aturan_pakai}</li>)}</ul></div>
        ))}
        {mr.catatan_dokter && <p><b>Catatan dokter:</b> {mr.catatan_dokter}</p>}
      </>}
    </div>
  )
}
