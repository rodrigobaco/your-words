const envios = new Map()

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress
  const agora = Date.now()
  const limite = 1
  const janela = 24 * 60 * 60 * 1000

  const historico = (envios.get(ip) || []).filter(t => agora - t < janela)

  if (historico.length >= limite) {
    return res.status(200).json({ ok: false })
  }

  historico.push(agora)
  envios.set(ip, historico)
  return res.status(200).json({ ok: true })
}