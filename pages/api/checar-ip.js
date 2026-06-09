const envios = new Map()

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { deviceId } = req.body
  if (!deviceId) return res.status(400).json({ ok: false })

  const agora = Date.now()
  const janela = 24 * 60 * 60 * 1000

  const historico = (envios.get(deviceId) || []).filter(t => agora - t < janela)

  if (historico.length >= 1) {
    return res.status(200).json({ ok: false })
  }

  historico.push(agora)
  envios.set(deviceId, historico)
  return res.status(200).json({ ok: true })
}