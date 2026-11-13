// Ilustrasi vektor (tanpa berkas gambar eksternal): gedung klinik untuk beranda, ilustrasi kesehatan untuk halaman masuk.

export function ClinicBuilding({ className = '' }) {
  return (
    <svg viewBox="0 0 560 380" className={className} role="img" aria-label="Ilustrasi gedung KlinikSehat">
      <defs>
        <linearGradient id="cb-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#cfe2ff" /><stop offset="1" stopColor="#f2f7ff" /></linearGradient>
        <linearGradient id="cb-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8fd3ff" /><stop offset="1" stopColor="#2f6fe8" /></linearGradient>
        <linearGradient id="cb-wall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#dce9ff" /></linearGradient>
        <clipPath id="cb-clip"><rect width="560" height="380" rx="28" /></clipPath>
      </defs>
      <g clipPath="url(#cb-clip)">
        <rect width="560" height="380" fill="url(#cb-sky)" />
        <g fill="#fff" opacity=".95"><ellipse cx="110" cy="64" rx="50" ry="16" /><ellipse cx="146" cy="54" rx="34" ry="14" /><ellipse cx="470" cy="46" rx="44" ry="13" /><ellipse cx="500" cy="56" rx="28" ry="10" /></g>
        <rect y="318" width="560" height="62" fill="#c9defc" />
        {/* sayap kiri */}
        <rect x="52" y="176" width="108" height="144" fill="url(#cb-wall)" stroke="#b6cdf3" />
        {[0, 1].map((r) => [0, 1].map((c) => <rect key={`l${r}${c}`} x={68 + c * 44} y={196 + r * 52} width="32" height="36" rx="3" fill="url(#cb-glass)" />))}
        {/* gedung utama */}
        <rect x="158" y="96" width="340" height="224" fill="url(#cb-wall)" stroke="#b6cdf3" />
        <rect x="158" y="96" width="340" height="14" fill="#1a62e8" />
        {[0, 1, 2].map((r) => [0, 1, 2, 3, 4, 5].map((c) => <rect key={`m${r}${c}`} x={180 + c * 50} y={128 + r * 52} width="34" height="36" rx="3" fill="url(#cb-glass)" opacity={r === 2 && (c === 2 || c === 3) ? 0 : 1} />))}
        {/* pintu masuk */}
        <rect x="282" y="240" width="92" height="80" fill="#eaf2ff" stroke="#b6cdf3" />
        <rect x="292" y="252" width="34" height="68" fill="url(#cb-glass)" /><rect x="330" y="252" width="34" height="68" fill="url(#cb-glass)" />
        <path d="M270 240h116l-8-14H278z" fill="#1a62e8" />
        {/* papan nama */}
        <g transform="rotate(-5 380 74)">
          <rect x="296" y="46" width="196" height="46" rx="8" fill="#1a62e8" />
          <path d="M318 56h8v8h8v8h-8v8h-8v-8h-8v-8h8z" fill="#fff" />
          <text x="344" y="76" fill="#fff" fontFamily="system-ui,sans-serif" fontSize="20" fontWeight="800">Klinik Sehat</text>
        </g>
        {/* pohon */}
        <g><rect x="34" y="276" width="8" height="46" fill="#7a5c3e" /><circle cx="38" cy="262" r="26" fill="#34c38f" /><circle cx="22" cy="276" r="16" fill="#2fb583" /></g>
        <g><rect x="514" y="282" width="8" height="40" fill="#7a5c3e" /><circle cx="518" cy="266" r="24" fill="#34c38f" /><circle cx="534" cy="280" r="14" fill="#2fb583" /></g>
        <path d="M0 330c120-10 300-10 560 0v50H0z" fill="#b6d0f7" opacity=".55" />
      </g>
    </svg>
  )
}

export function HealthIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 380 320" className={className} role="img" aria-label="Ilustrasi kesehatan: stetoskop dan detak jantung">
      <defs>
        <linearGradient id="hi-heart" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#bfe0ff" /><stop offset="1" stopColor="#6c8cff" /></linearGradient>
      </defs>
      <path d="M0 250c60-30 110 20 190-6s120-30 190-4v80H0z" fill="#ffffff" opacity=".12" />
      <path d="M0 278c70-24 120 12 200-8s110-18 180 0v50H0z" fill="#ffffff" opacity=".16" />
      <g stroke="#fff" opacity=".55" strokeWidth="3" strokeLinecap="round"><path d="M70 60v16M62 68h16" /><path d="M318 96v14M311 103h14" /><path d="M300 30v10M295 35h10" /></g>
      {/* stetoskop */}
      <g fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M70 70c-8 0-14 6-14 14v52c0 30 20 52 50 52s50-22 50-52V84c0-8-6-14-14-14" />
        <path d="M106 188v14c0 28 22 46 48 46 30 0 46-20 46-44" />
      </g>
      <circle cx="70" cy="70" r="7" fill="#fff" /><circle cx="134" cy="70" r="7" fill="#fff" />
      <circle cx="200" cy="204" r="18" fill="#dcebff" stroke="#fff" strokeWidth="6" /><circle cx="200" cy="204" r="7" fill="#7aa2ff" />
      {/* jantung + EKG */}
      <path d="M270 252c-46-34-76-60-76-96 0-24 18-40 40-40 16 0 28 8 36 22 8-14 20-22 36-22 22 0 40 16 40 40 0 36-30 62-76 96z" transform="translate(-8 -22) scale(.98)" fill="url(#hi-heart)" />
      <path d="M196 170h34l12-26 20 52 14-34 14 8h30" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" transform="translate(-6 -12)" />
    </svg>
  )
}
