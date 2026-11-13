import { esc, tglPanjang, rupiah } from './ui.jsx'

/** Cetak invoice/struk. Di dialog cetak pilih "Simpan sebagai PDF" untuk mengekspor PDF. */
export function cetakInvoice(inv, { struk = false } = {}) {
  const w = window.open('', '_blank', struk ? 'width=380,height=640' : 'width=820,height=900')
  if (!w) { alert('Izinkan pop-up untuk mencetak.'); return }
  const klinik = inv.klinik || { nama: 'KlinikSehat' }
  const baris = (inv.items || []).map((i) => `<tr><td>${esc(i.deskripsi)}</td><td class="r">${esc(i.qty)}</td><td class="r">${esc(rupiah(i.harga))}</td><td class="r">${esc(rupiah(i.qty * i.harga))}</td></tr>`).join('')
  const bayar = (inv.pembayaran || inv.payments || []).filter((p) => p.status === 'terverifikasi').map((p) => `<tr><td colspan="3">Pembayaran ${esc(p.metode)}</td><td class="r">${esc(rupiah(p.jumlah))}</td></tr>`).join('')
  const lebar = struk ? '300px' : '720px'
  w.document.write(`<html><head><title>${esc(inv.nomor)}</title><style>
  body{font-family:system-ui,sans-serif;max-width:${lebar};margin:${struk ? '12px' : '40px'} auto;font-size:${struk ? '12px' : '14px'};color:#0a2a5e}
  h1{font-size:${struk ? '16px' : '22px'};margin:0}table{width:100%;border-collapse:collapse;margin-top:12px}td,th{padding:6px 4px;border-bottom:1px solid #c4dcff;text-align:left}.r{text-align:right}
  .tot td{font-weight:700;border-top:2px solid #0a2a5e}.stamp{display:inline-block;border:2px solid #10b5a0;color:#10b5a0;padding:2px 10px;border-radius:6px;font-weight:700;margin-top:10px}</style></head><body>
  <h1>${esc(klinik.nama)}</h1><p>${esc(klinik.alamat || '')}${klinik.telp ? ' · ' + esc(klinik.telp) : ''}</p>
  <p><b>${struk ? 'STRUK PEMBAYARAN' : 'INVOICE'} ${esc(inv.nomor)}</b><br>Pasien: ${esc(inv.pasien)}${inv.no_rm ? ' (' + esc(inv.no_rm) + ')' : ''}<br>Tanggal kunjungan: ${esc(inv.tanggal ? tglPanjang(inv.tanggal) : '-')}${inv.poli ? '<br>Poli: ' + esc(inv.poli) : ''}${inv.dokter ? '<br>Dokter: ' + esc(inv.dokter) : ''}</p>
  <table><thead><tr><th>Rincian</th><th class="r">Qty</th><th class="r">Harga</th><th class="r">Jumlah</th></tr></thead><tbody>${baris}
  <tr><td colspan="3">Subtotal</td><td class="r">${esc(rupiah(inv.subtotal))}</td></tr>
  ${Number(inv.diskon) > 0 ? `<tr><td colspan="3">Diskon</td><td class="r">-${esc(rupiah(inv.diskon))}</td></tr>` : ''}
  <tr class="tot"><td colspan="3">TOTAL</td><td class="r">${esc(rupiah(inv.total))}</td></tr>${bayar}</tbody></table>
  ${inv.status === 'lunas' ? '<span class="stamp">LUNAS</span>' : '<p><b>Status: belum lunas</b></p>'}
  <p style="margin-top:24px;font-size:11px">Dicetak ${esc(new Date().toLocaleString('id-ID'))}</p></body></html>`)
  w.document.close(); w.focus(); w.print()
}
