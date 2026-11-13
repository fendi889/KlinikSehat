import Navbar from '../components/Navbar.jsx'
import Hero from '../components/Hero.jsx'
import {
  Statistik, AntrianLangsung, Tentang, Layanan, Dokter, Jadwal, Alur, Fasilitas,
  Testimoni, Artikel, Faq, Kontak, Footer,
} from '../components/Sections.jsx'

export default function Landing() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Statistik />
        <AntrianLangsung />
        <Tentang />
        <Layanan />
        <Dokter />
        <Jadwal />
        <Alur />
        <Fasilitas />
        <Testimoni />
        <Artikel />
        <Faq />
        <Kontak />
      </main>
      <Footer />
    </>
  )
}
