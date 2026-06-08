import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'método não permitido' })
  }

  const secret = req.headers['x-secret']
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'não autorizado' })
  }

  const { data: mensagens, error: erroLista } = await supabase
    .from('mensagens')
    .select('id')

  if (erroLista || !mensagens.length) {
    return res.status(400).json({ error: 'sem mensagens' })
  }

  const aleatoria = mensagens[Math.floor(Math.random() * mensagens.length)]

  const { error: erroUpsert } = await supabase
    .from('mensagem_do_dia')
    .upsert({ id: 1, mensagem_id: aleatoria.id, atualizado_em: new Date() })

  if (erroUpsert) {
    return res.status(500).json({ error: erroUpsert.message })
  }

  return res.status(200).json({ ok: true, mensagem_id: aleatoria.id })
}