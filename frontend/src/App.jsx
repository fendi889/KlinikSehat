import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import { ROLES } from './config/roles.js'
import Landing from './pages/Landing.jsx'
import Placeholder from './pages/Placeholder.jsx'
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import ForgotPassword from './pages/auth/ForgotPassword.jsx'
import ResetPassword from './pages/auth/ResetPassword.jsx'
import { Profile, ChangePassword } from './pages/auth/Profile.jsx'
import RoleDashboard from './pages/dashboard/RoleDashboard.jsx'
import PemilikDashboard from './pages/dashboard/PemilikDashboard.jsx'
import ModuleStub from './pages/dashboard/ModuleStub.jsx'
import { Pasien, Dokter, Staf, Poli, Jadwal, Layanan, Ruang as RuangAdmin } from './pages/admin/AdminPages.jsx'
import Keuangan from './pages/pemilik/Keuangan.jsx'
import Kinerja from './pages/pemilik/Kinerja.jsx'
import Grafik from './pages/pemilik/Grafik.jsx'
import Monitoring from './pages/pemilik/Monitoring.jsx'
import Daftar from './pages/pasien/Daftar.jsx'
import Antrian from './pages/pasien/Antrian.jsx'
import Riwayat from './pages/pasien/Riwayat.jsx'
import Resep from './pages/pasien/Resep.jsx'
import Pembayaran from './pages/pasien/Pembayaran.jsx'
import Notifikasi from './pages/pasien/Notifikasi.jsx'
import Ulasan from './pages/pasien/Ulasan.jsx'
import DataDiri from './pages/pasien/DataDiri.jsx'
import DJadwal from './pages/dokter/Jadwal.jsx'
import DAntrian from './pages/dokter/Antrian.jsx'
import PemeriksaanList from './pages/dokter/PemeriksaanList.jsx'
import Exam from './pages/dokter/Exam.jsx'
import DRekam from './pages/dokter/RekamMedis.jsx'
import DResep from './pages/dokter/Resep.jsx'
import Surat from './pages/dokter/Surat.jsx'
import DRiwayat from './pages/dokter/Riwayat.jsx'
import Pendaftaran from './pages/perawat/Pendaftaran.jsx'
import PAntrian from './pages/perawat/Antrian.jsx'
import Verifikasi from './pages/perawat/Verifikasi.jsx'
import TandaVital from './pages/perawat/TandaVital.jsx'
import Ruang from './pages/perawat/Ruang.jsx'
import AResep from './pages/apoteker/Resep.jsx'
import AObat from './pages/apoteker/Obat.jsx'
import AKategori from './pages/apoteker/Kategori.jsx'
import AStok from './pages/apoteker/Stok.jsx'
import AKedaluwarsa from './pages/apoteker/Kedaluwarsa.jsx'
import ARiwayat from './pages/apoteker/Riwayat.jsx'
import AdminPembayaran from './pages/admin/Pembayaran.jsx'
import AntrianPublik from './pages/AntrianPublik.jsx'
import Laporan from './pages/Laporan.jsx'
import Akun from './pages/superadmin/Akun.jsx'
import Role from './pages/superadmin/Role.jsx'
import Permission from './pages/superadmin/Permission.jsx'
import Klinik from './pages/superadmin/Klinik.jsx'
import Aktivitas from './pages/superadmin/Aktivitas.jsx'
import Audit from './pages/superadmin/Audit.jsx'
import Pengaturan from './pages/superadmin/Pengaturan.jsx'

const superRoutes = [
  ['akun', Akun], ['role', Role], ['permission', Permission], ['klinik', Klinik],
  ['aktivitas', Aktivitas], ['audit', Audit], ['pengaturan', Pengaturan],
].map(([path, C]) => <Route key={path} path={path} element={<C />} />)

const adminRoutes = [
  ['pasien', Pasien], ['dokter', Dokter], ['staf', Staf], ['poli', Poli], ['jadwal', Jadwal], ['layanan', Layanan], ['ruang', RuangAdmin],
].map(([path, C]) => <Route key={path} path={path} element={<C />} />)
const pemilikRoutes = [
  ['keuangan', Keuangan], ['kinerja', Kinerja], ['grafik', Grafik], ['monitoring', Monitoring], ['laporan', Laporan],
].map(([path, C]) => <Route key={path} path={path} element={<C />} />)
const pasienRoutes = [
  ['daftar', Daftar], ['antrian', Antrian], ['riwayat', Riwayat], ['resep', Resep],
  ['pembayaran', Pembayaran], ['notifikasi', Notifikasi], ['ulasan', Ulasan], ['data-diri', DataDiri],
].map(([path, C]) => <Route key={path} path={path} element={<C />} />)
const dokterRoutes = [
  ['jadwal', DJadwal], ['antrian', DAntrian], ['pemeriksaan', PemeriksaanList], ['pemeriksaan/:visitId', Exam],
  ['rekam-medis', DRekam], ['resep', DResep], ['surat', Surat], ['riwayat', DRiwayat],
].map(([path, C]) => <Route key={path} path={path} element={<C />} />)
const perawatRoutes = [
  ['pendaftaran', Pendaftaran], ['antrian', PAntrian], ['verifikasi', Verifikasi], ['tanda-vital', TandaVital], ['ruang', Ruang],
].map(([path, C]) => <Route key={path} path={path} element={<C />} />)
const apotekerRoutes = [
  ['resep', AResep], ['obat', AObat], ['kategori', AKategori], ['stok', AStok], ['kedaluwarsa', AKedaluwarsa], ['riwayat', ARiwayat],
].map(([path, C]) => <Route key={path} path={path} element={<C />} />)
adminRoutes.push(<Route key="laporan" path="laporan" element={<Laporan />} />)
adminRoutes.push(<Route key="pembayaran" path="pembayaran" element={<AdminPembayaran />} />)
adminRoutes.push(<Route key="antrian" path="antrian" element={<PAntrian role="admin" />} />)
adminRoutes.push(<Route key="pengaturan" path="pengaturan" element={<Klinik base="/admin" />} />)

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/antrian" element={<AntrianPublik />} />
        <Route path="/login" element={<Login />} />
        <Route path="/daftar" element={<Register />} />
        <Route path="/lupa-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/artikel/:slug" element={<Placeholder title="Artikel Kesehatan" bab="BAB 17 (konten dari database)" />} />

        {/* Halaman bersama semua role yang sudah login */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/profil" element={<Profile />} />
          <Route path="/notifikasi" element={<Notifikasi base="/notifications" />} />
          <Route path="/ubah-password" element={<ChangePassword />} />
        </Route>

        {/* Dashboard tiap role: hanya role yang sesuai yang bisa masuk */}
        {Object.values(ROLES).map((r) => (
          <Route key={r.slug} path={r.path} element={<ProtectedRoute roles={[r.slug]}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={r.slug === 'pemilik' ? <PemilikDashboard /> : <RoleDashboard />} />
            {r.slug === 'super_admin' && superRoutes}
            {r.slug === 'admin_klinik' && adminRoutes}
            {r.slug === 'pemilik' && pemilikRoutes}
            {r.slug === 'pasien' && pasienRoutes}
            {r.slug === 'dokter' && dokterRoutes}
            {r.slug === 'perawat' && perawatRoutes}
            {r.slug === 'apoteker' && apotekerRoutes}
            <Route path=":modul" element={<ModuleStub />} />
          </Route>
        ))}
        <Route path="*" element={<Placeholder title="Halaman tidak ditemukan" />} />
      </Routes>
    </AuthProvider>
  )
}
