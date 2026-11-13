import CrudPage from '../../components/CrudPage.jsx'

export default function Kategori() {
  return (
    <CrudPage title="Kategori obat" endpoint="/apoteker/categories" nounHapus="kategori"
      blank={{ nama: '' }} columns={[{ key: 'nama', label: 'Kategori' }, { key: 'medicines_count', label: 'Jumlah obat' }]}
      fields={[{ name: 'nama', label: 'Nama kategori', required: true }]} />
  )
}
