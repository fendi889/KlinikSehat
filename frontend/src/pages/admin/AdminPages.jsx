import CrudPage from '../../components/CrudPage.jsx'

const aktif = (r) => <span className={(r.aktif ?? r.is_active) ? 'font-semibold text-sehat' : 'font-semibold text-red-600'}>{(r.aktif ?? r.is_active) ? 'Aktif' : 'Nonaktif'}</span>
const rupiah = (n) => 'Rp' + Number(n).toLocaleString('id-ID')
const polis = { poli_id: { endpoint: '/admin/poli', label: 'nama' } }

export const Pasien = () => (
  <CrudPage title="Manajemen pasien" desc="Data pasien baru, termasuk yang datang langsung. Nomor rekam medis dibuat otomatis."
    endpoint="/admin/patients" searchable nounHapus="pasien"
    blank={{ nama: '', nik: '', tgl_lahir: '', jenis_kelamin: '', golongan_darah: '', alamat: '', alergi: '', kontak_darurat: '' }}
    columns={[{ key: 'no_rm', label: 'No. RM' }, { key: 'nama', label: 'Nama' }, { key: 'jenis_kelamin', label: 'JK' }, { key: 'tgl_lahir', label: 'Tgl lahir' }, { key: 'kontak_darurat', label: 'Kontak darurat' }]}
    fields={[
      { name: 'nama', label: 'Nama lengkap', required: true }, { name: 'nik', label: 'NIK (16 digit)' },
      { name: 'tgl_lahir', label: 'Tanggal lahir', type: 'date' },
      { name: 'jenis_kelamin', label: 'Jenis kelamin', type: 'select', options: [{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }] },
      { name: 'golongan_darah', label: 'Golongan darah', type: 'select', options: ['A', 'B', 'AB', 'O'].map((x) => ({ value: x, label: x })) },
      { name: 'kontak_darurat', label: 'Kontak darurat' }, { name: 'alamat', label: 'Alamat', type: 'textarea' }, { name: 'alergi', label: 'Alergi', type: 'textarea' },
    ]} />
)

export const Dokter = () => (
  <CrudPage title="Manajemen dokter" desc="Menambah dokter otomatis membuat akun login role Dokter." endpoint="/admin/doctors" nounHapus="dokter"
    optionSources={polis}
    blank={{ name: '', email: '', phone: '', poli_id: '', no_str: '', spesialis: '', pengalaman_tahun: 0, bio: '', password: '' }}
    columns={[{ key: 'name', label: 'Nama' }, { key: 'poli_nama', label: 'Poli' }, { key: 'spesialis', label: 'Spesialis' }, { key: 'pengalaman_tahun', label: 'Pengalaman (th)' }, { key: 'email', label: 'Email' }]}
    fields={[
      { name: 'name', label: 'Nama (beserta gelar)', required: true }, { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Nomor HP' }, { name: 'poli_id', label: 'Poli', type: 'select', required: true },
      { name: 'no_str', label: 'No. STR' }, { name: 'spesialis', label: 'Spesialis' },
      { name: 'pengalaman_tahun', label: 'Pengalaman (tahun)', type: 'number', required: true },
      { name: 'password', label: 'Password (min. 8; kosongkan saat ubah jika tidak diganti)', type: 'password' },
      { name: 'bio', label: 'Profil singkat', type: 'textarea' },
    ]} />
)

export const Staf = () => (
  <CrudPage title="Perawat dan apoteker" desc="Akun perawat dan apoteker klinik." endpoint="/admin/staff" nounHapus="akun"
    blank={{ name: '', email: '', phone: '', role: 'perawat', nip: '', password: '', is_active: true }}
    columns={[{ key: 'name', label: 'Nama' }, { key: 'role_nama', label: 'Peran' }, { key: 'email', label: 'Email' }, { key: 'nip', label: 'NIP' }, { label: 'Status', render: aktif }]}
    fields={[
      { name: 'name', label: 'Nama', required: true }, { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Nomor HP' }, { name: 'nip', label: 'NIP' },
      { name: 'role', label: 'Peran', type: 'select', required: true, createOnly: true, options: [{ value: 'perawat', label: 'Perawat' }, { value: 'apoteker', label: 'Apoteker' }] },
      { name: 'password', label: 'Password (min. 8; kosongkan saat ubah jika tidak diganti)', type: 'password' },
      { name: 'is_active', label: 'Akun aktif', type: 'checkbox' },
    ]} />
)

export const Poli = () => (
  <CrudPage title="Manajemen poli" desc="Kode poli (maks. 3 huruf) dipakai sebagai awalan nomor antrian, mis. U-001." endpoint="/admin/poli" nounHapus="poli"
    blank={{ nama: '', kode: '', deskripsi: '', aktif: true }}
    columns={[{ key: 'kode', label: 'Kode' }, { key: 'nama', label: 'Nama poli' }, { key: 'doctors_count', label: 'Dokter' }, { label: 'Status', render: aktif }]}
    fields={[
      { name: 'nama', label: 'Nama poli', required: true }, { name: 'kode', label: 'Kode (huruf)', required: true },
      { name: 'deskripsi', label: 'Deskripsi', type: 'textarea' }, { name: 'aktif', label: 'Poli aktif', type: 'checkbox' },
    ]} />
)

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((l, i) => ({ value: i + 1, label: l }))
export const Jadwal = () => (
  <CrudPage title="Manajemen jadwal" desc="Jadwal praktik dokter per hari. Jadwal yang bentrok akan ditolak." endpoint="/admin/schedules" nounHapus="jadwal"
    optionSources={{ doctor_id: { endpoint: '/admin/doctors', label: (d) => `${d.name} (${d.poli_nama})` } }}
    blank={{ doctor_id: '', hari: '', jam_mulai: '08:00', jam_selesai: '12:00', kuota: 20, aktif: true }}
    columns={[{ key: 'doctor_nama', label: 'Dokter' }, { key: 'poli_nama', label: 'Poli' }, { key: 'hari_nama', label: 'Hari' }, { label: 'Jam', render: (r) => `${r.jam_mulai}–${r.jam_selesai}` }, { key: 'kuota', label: 'Kuota' }, { label: 'Status', render: aktif }]}
    fields={[
      { name: 'doctor_id', label: 'Dokter', type: 'select', required: true }, { name: 'hari', label: 'Hari', type: 'select', required: true, options: HARI },
      { name: 'jam_mulai', label: 'Jam mulai', type: 'time', required: true }, { name: 'jam_selesai', label: 'Jam selesai', type: 'time', required: true },
      { name: 'kuota', label: 'Kuota pasien', type: 'number', required: true }, { name: 'aktif', label: 'Jadwal aktif', type: 'checkbox' },
    ]} />
)

export const Layanan = () => (
  <CrudPage title="Layanan dan tarif" desc="Daftar layanan beserta tarifnya. Perubahan tarif tercatat di audit log." endpoint="/admin/services" nounHapus="layanan"
    optionSources={polis}
    blank={{ nama: '', poli_id: '', deskripsi: '', tarif: 0, aktif: true }}
    columns={[{ key: 'nama', label: 'Layanan' }, { key: 'poli_nama', label: 'Poli' }, { label: 'Tarif', render: (r) => rupiah(r.tarif) }, { label: 'Status', render: aktif }]}
    fields={[
      { name: 'nama', label: 'Nama layanan', required: true }, { name: 'poli_id', label: 'Poli (opsional)', type: 'select' },
      { name: 'tarif', label: 'Tarif (Rp)', type: 'number', required: true }, { name: 'aktif', label: 'Layanan aktif', type: 'checkbox' },
      { name: 'deskripsi', label: 'Deskripsi', type: 'textarea' },
    ]} />
)

export const Ruang = () => (
  <CrudPage title="Ruang periksa" desc="Ruang yang dipakai perawat untuk menempatkan pasien." endpoint="/admin/rooms" nounHapus="ruang"
    optionSources={polis}
    blank={{ nama: '', poli_id: '', aktif: true }}
    columns={[{ key: 'nama', label: 'Nama ruang' }, { key: 'poli_nama', label: 'Poli' }, { label: 'Status', render: aktif }]}
    fields={[
      { name: 'nama', label: 'Nama ruang', required: true }, { name: 'poli_id', label: 'Poli (opsional)', type: 'select' },
      { name: 'aktif', label: 'Ruang aktif', type: 'checkbox' },
    ]} />
)
