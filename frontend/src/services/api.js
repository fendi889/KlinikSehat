const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const KEY = 'ks_token'
export const tokenStore = {
  get: () => localStorage.getItem(KEY) || sessionStorage.getItem(KEY),
  // remember=true: tetap masuk setelah browser ditutup; false: hanya selama tab terbuka
  set: (t, remember = true) => {
    (remember ? localStorage : sessionStorage).setItem(KEY, t)
    ;(remember ? sessionStorage : localStorage).removeItem(KEY)
  },
  clear: () => { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY) },
}

export async function api(path, { method = 'GET', body } = {}) {
  const token = tokenStore.get()
  let res
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw Object.assign(new Error('Tidak dapat terhubung ke server. Pastikan backend berjalan.'), { status: 0, errors: {} })
  }
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && token) { tokenStore.clear(); window.location.assign('/login'); throw Object.assign(new Error('Sesi berakhir. Silakan masuk kembali.'), { status: 401, errors: {} }) }
  if (!res.ok) {
    throw Object.assign(new Error(data.message || 'Terjadi kesalahan.'), { status: res.status, errors: data.errors || {} })
  }
  return data
}

/** Unduh berkas (mis. CSV) dari endpoint yang memerlukan token. */
export async function download(path, filename) {
  const token = tokenStore.get()
  let res
  try { res = await fetch(BASE + path, { headers: { Authorization: `Bearer ${token}`, Accept: '*/*' } }) }
  catch { throw new Error('Tidak dapat terhubung ke server.') }
  if (!res.ok) throw new Error('Gagal mengunduh berkas.')
  const url = URL.createObjectURL(await res.blob())
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}
