// Grafik SVG sederhana tanpa pustaka tambahan. Responsif lewat viewBox.
const W = 600, H = 220, PAD = { l: 8, r: 8, t: 12, b: 28 }

function Frame({ children, label }) {
  return <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={label}>{children}</svg>
}

const short = (v) => (v >= 1e6 ? (v / 1e6).toFixed(v % 1e6 ? 1 : 0) + ' jt' : v >= 1e3 ? Math.round(v / 1e3) + ' rb' : String(v))

export function BarChart({ data, label, color = '#1e6fe0', fmt = (v) => v }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b
  const step = iw / data.length, bw = Math.max(2, step * 0.7)
  const every = Math.ceil(data.length / 10)
  return (
    <Frame label={label}>
      <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} stroke="#c4dcff" />
      {data.map((d, i) => {
        const h = (d.value / max) * ih, x = PAD.l + i * step + (step - bw) / 2
        return (
          <g key={d.label + i}>
            <rect x={x} y={H - PAD.b - h} width={bw} height={h} rx="2" fill={color}><title>{`${d.label}: ${fmt(d.value)}`}</title></rect>
            {i % every === 0 && <text x={x + bw / 2} y={H - 10} textAnchor="middle" fontSize="10" fill="#0f4399">{d.label}</text>}
          </g>
        )
      })}
      <text x={W - PAD.r} y={10} textAnchor="end" fontSize="10" fill="#0f4399">maks {fmt(max)}</text>
    </Frame>
  )
}

export function GroupedBars({ data, label, aName, bName, aColor = '#1e6fe0', bColor = '#c4dcff', fmt = short }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.a, d.b]))
  const iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b
  const step = iw / data.length, bw = step * 0.32
  return (
    <div>
      <Frame label={label}>
        <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} stroke="#c4dcff" />
        {data.map((d, i) => {
          const x0 = PAD.l + i * step + step * 0.12, ha = (d.a / max) * ih, hb = (d.b / max) * ih
          return (
            <g key={d.label}>
              <rect x={x0} y={H - PAD.b - ha} width={bw} height={ha} rx="2" fill={aColor}><title>{`${aName} ${d.label}: ${fmt(d.a)}`}</title></rect>
              <rect x={x0 + bw + 3} y={H - PAD.b - hb} width={bw} height={hb} rx="2" fill={bColor}><title>{`${bName} ${d.label}: ${fmt(d.b)}`}</title></rect>
              <text x={x0 + bw} y={H - 10} textAnchor="middle" fontSize="11" fill="#0f4399">{d.label}</text>
            </g>
          )
        })}
        <text x={W - PAD.r} y={10} textAnchor="end" fontSize="10" fill="#0f4399">maks {fmt(max)}</text>
      </Frame>
      <p className="mt-1 flex gap-4 text-sm">
        <span className="flex items-center gap-2"><i className="inline-block h-3 w-3 rounded-sm" style={{ background: aColor }} />{aName}</span>
        <span className="flex items-center gap-2"><i className="inline-block h-3 w-3 rounded-sm" style={{ background: bColor }} />{bName}</span>
      </p>
    </div>
  )
}


function niceMax(v) { const p = 10 ** Math.floor(Math.log10(v)); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p }
function smooth(pts) {
  if (pts.length < 2) return `M${pts[0][0]} ${pts[0][1]}`
  let d = `M${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6}, ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6}, ${p2[0]} ${p2[1]}`
  }
  return d
}

/** Grafik garis berarea (halus) dengan garis bantu dan titik berisi tooltip. */
export function LineChart({ data, label, color = '#1a62e8', fmt = (v) => v }) {
  const Wd = 640, Ht = 260, L = 40, R = 14, T = 14, B = 30
  if (!data.length) return null
  const max = niceMax(Math.max(1, ...data.map((d) => d.value)))
  const iw = Wd - L - R, ih = Ht - T - B
  const x = (i) => L + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw)
  const y = (v) => T + ih - (v / max) * ih
  const pts = data.map((d, i) => [x(i), y(d.value)])
  const line = smooth(pts)
  const every = Math.ceil(data.length / 12)
  return (
    <svg viewBox={`0 0 ${Wd} ${Ht}`} className="w-full" role="img" aria-label={label}>
      <defs><linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".28" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {[0, 1, 2, 3, 4].map((k) => (
        <g key={k}>
          <line x1={L} x2={Wd - R} y1={y((max * k) / 4)} y2={y((max * k) / 4)} stroke="#dbe7fb" strokeDasharray={k ? '4 4' : ''} />
          <text x={L - 6} y={y((max * k) / 4) + 4} textAnchor="end" fontSize="11" fill="#12409c">{fmt(Math.round((max * k) / 4))}</text>
        </g>
      ))}
      <path d={`${line} L ${x(data.length - 1)} ${T + ih} L ${x(0)} ${T + ih} Z`} fill="url(#lc-fill)" />
      <path d={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={d.label + i}>
          <circle cx={x(i)} cy={y(d.value)} r="4" fill="#fff" stroke={color} strokeWidth="2.5"><title>{`${d.label}: ${fmt(d.value)}`}</title></circle>
          {i % every === 0 && <text x={x(i)} y={Ht - 9} textAnchor="middle" fontSize="11" fill="#12409c">{d.label}</text>}
        </g>
      ))}
    </svg>
  )
}
