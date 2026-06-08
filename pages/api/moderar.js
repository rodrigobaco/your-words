export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { texto } = req.body
  if (!texto) return res.status(400).json({ ok: false })

  const t = texto.toLowerCase()

  const temLink = /(https?:\/\/|www\.|\.com|\.net|\.org|\.io|\.br|bit\.ly|t\.me)/i.test(t)

  const palavrasBloqueadas = [
    'nazi', 'nazista', 'hitler', 'heil', 'ku klux', 'kkk',
    'n-word', 'nigger', 'faggot',
    'matar', 'explodir', 'bomba', 'terroris',
    'pedofil', 'criança nua', 'menor nua',
    'compre agora', 'clique aqui', 'promoção', 'desconto',
    'whatsapp', 'telegram', 'instagram', 'discord',
  ]

  const temPalavraBloqueada = palavrasBloqueadas.some(p => t.includes(p))

  const ok = !temLink && !temPalavraBloqueada

  return res.status(200).json({ ok })
}