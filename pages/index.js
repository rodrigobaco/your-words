import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [mensagemDoDia, setMensagemDoDia] = useState(null)
  const [texto, setTexto] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    buscarMensagemDoDia()
  }, [])

  async function buscarMensagemDoDia() {
    const { data, error } = await supabase
      .from('mensagens')
      .select('*')
      .order('criado_em', { ascending: true })
      .limit(1)

    if (data && data.length > 0) {
      setMensagemDoDia(data[0])
    }
    setLoading(false)
  }

  async function enviarMensagem() {
    if (texto.trim().length < 3) return

    const { error } = await supabase
      .from('mensagens')
      .insert([{ texto: texto.trim() }])

    if (!error) {
      setEnviado(true)
      setTexto('')
    }
  }

  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl">

        <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">
          {hoje}
        </p>
        <h1 className="text-2xl font-normal text-stone-700 mb-10">
          mensagem do dia
        </h1>

        <div className="border border-stone-200 rounded-xl p-8 mb-12 bg-white">
          {loading ? (
            <p className="text-stone-400 text-sm">carregando...</p>
          ) : mensagemDoDia ? (
            <>
              <p className="text-xl leading-relaxed text-stone-700 mb-4">
                "{mensagemDoDia.texto}"
              </p>
              <p className="text-xs text-stone-400">
                enviado em {new Date(mensagemDoDia.criado_em).toLocaleDateString('pt-BR')}
              </p>
            </>
          ) : (
            <p className="text-stone-400 text-sm italic">
              nenhuma mensagem ainda. seja o primeiro.
            </p>
          )}
        </div>

        <div>
          <p className="text-sm text-stone-500 mb-1 font-medium">
            deixe sua mensagem
          </p>
          <p className="text-xs text-stone-400 mb-4">
            qualquer coisa. um pensamento, uma frase. talvez amanhã seja a sua.
          </p>

          {enviado ? (
            <p className="text-sm text-stone-500 italic">
              recebido. boa sorte no sorteio de amanhã ✦
            </p>
          ) : (
            <>
              <textarea
                className="w-full border border-stone-200 rounded-lg p-4 text-sm text-stone-700 bg-white resize-none outline-none focus:border-stone-400 transition"
                rows={4}
                maxLength={240}
                placeholder="escreva algo..."
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-stone-300">{texto.length}/240</span>
                <button
                  onClick={enviarMensagem}
                  disabled={texto.trim().length < 3}
                  className="text-sm px-5 py-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100 transition disabled:opacity-30"
                >
                  enviar
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </main>
  )
}