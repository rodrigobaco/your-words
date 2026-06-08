import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function useContagem() {
  const [tempo, setTempo] = useState('')
  useEffect(() => {
    function calcular() {
      const agora = new Date()
      const amanha = new Date()
      amanha.setDate(amanha.getDate() + 1)
      amanha.setHours(3, 0, 0, 0)
      const diff = amanha - agora
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTempo(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }
    calcular()
    const id = setInterval(calcular, 1000)
    return () => clearInterval(id)
  }, [])
  return tempo
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return mobile
}

export default function Home() {
  const [mensagemDoDia, setMensagemDoDia] = useState(null)
  const [total, setTotal] = useState(null)
  const [texto, setTexto] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(true)
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro] = useState('')
  const tempoRestante = useContagem()
  const isMobile = useIsMobile()

  useEffect(() => { buscarDados() }, [])

  async function buscarDados() {
    const [{ data }, { count }] = await Promise.all([
      supabase
        .from('mensagem_do_dia')
        .select('mensagem_id, mensagens(texto, criado_em)')
        .eq('id', 1)
        .single(),
      supabase
        .from('mensagens')
        .select('*', { count: 'exact', head: true })
    ])
    if (data?.mensagens) setMensagemDoDia(data.mensagens)
    if (count !== null) setTotal(count)
    setLoading(false)
  }

  async function enviarMensagem() {
    if (texto.trim().length < 3) return
    setErro('')

    const ipRes = await fetch('/api/checar-ip', { method: 'POST' })
    const { ok: ipOk } = await ipRes.json()
    if (!ipOk) {
      setErro('você já enviou o máximo de mensagens hoje. volte amanhã.')
      return
    }

    const modRes = await fetch('/api/moderar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: texto.trim() }),
    })
    const { ok: aprovado } = await modRes.json()
    if (!aprovado) {
      setErro('essa mensagem não pôde ser enviada. tente algo diferente.')
      return
    }

    const { error } = await supabase
      .from('mensagens')
      .insert([{ texto: texto.trim() }])

    if (!error) {
      setEnviado(true)
      setTexto('')
      setTotal(t => t + 1)
    }
  }

  function compartilhar() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: 'your words', text: mensagemDoDia?.texto, url })
    } else {
      navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  const label = {
    fontSize: '11px',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#9a9a9e',
    fontWeight: 400,
  }

  const secaoEsquerda = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: isMobile ? '48px 0 40px' : '56px 48px 56px 0',
    borderRight: isMobile ? 'none' : '1px solid #35353a',
    borderBottom: isMobile ? '1px solid #35353a' : 'none',
  }

  const secaoDireita = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: isMobile ? '40px 0 64px' : '56px 0 56px 48px',
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: isMobile ? '0 24px' : '0 48px',
      maxWidth: '1000px',
      margin: '0 auto',
      width: '100%',
    }}>

      {/* HEADER */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '28px 0',
        borderBottom: '1px solid #35353a',
      }}>
        <span style={{ ...label, color: '#c8c4bc' }}>your words</span>
        {total !== null && (
          <span style={{ fontSize: '12px', color: '#8a8a8e' }}>
            {total.toLocaleString('pt-BR')} mensagens
          </span>
        )}
      </header>

      {/* GRID */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        minHeight: isMobile ? 'auto' : 'calc(100vh - 80px)',
      }}>

        {/* ESQUERDA — mensagem do dia */}
        <div style={secaoEsquerda}>
          <p style={{ ...label, color: '#9a9a9e', marginBottom: '32px' }} className="fade-up">
            {hoje}
          </p>

          {loading ? (
            <p style={{ color: '#444', fontSize: '14px' }}>—</p>
          ) : mensagemDoDia ? (
            <>
              <p className="fade-up-delay" style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: isMobile ? '2rem' : 'clamp(1.8rem, 3.5vw, 2.8rem)',
                lineHeight: 1.2,
                color: '#f5f1ea',
                marginBottom: '32px',
                fontStyle: 'italic',
              }}>
                "{mensagemDoDia.texto}"
              </p>
              <p className="fade-up-delay-2" style={{ fontSize: '11px', color: '#8a8a8e', marginBottom: '40px' }}>
                recebida em {new Date(mensagemDoDia.criado_em).toLocaleDateString('pt-BR')}
              </p>
            </>
          ) : (
            <p style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '2rem',
              fontStyle: 'italic',
              color: '#444',
              marginBottom: '40px',
            }}>
              "nenhuma mensagem ainda."
            </p>
          )}

          <div className="fade-up-delay-2" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <p style={{ ...label, fontSize: '10px', color: '#666', marginBottom: '6px' }}>próxima em</p>
              <p style={{
                fontFamily: 'monospace',
                fontSize: '1.4rem',
                color: '#8a8a8e',
                letterSpacing: '0.1em',
              }}>
                {tempoRestante}
              </p>
            </div>
            {mensagemDoDia && (
              <button onClick={compartilhar} style={{
                alignSelf: 'flex-start',
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                ...label,
                color: copiado ? '#9a9a9e' : '#777',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.target.style.color = '#c8c4bc'}
              onMouseLeave={e => e.target.style.color = '#777'}
              >
                {copiado ? 'copiado ✓' : 'compartilhar ↗'}
              </button>
            )}
          </div>
        </div>

        {/* DIREITA — formulário */}
        <div style={secaoDireita}>
          <p style={{ ...label, marginBottom: '12px' }}>sua vez</p>

          <p style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '1.2rem',
            fontStyle: 'italic',
            color: '#8a8a92',
            marginBottom: '40px',
            lineHeight: 1.6,
          }}>
            qualquer coisa. um pensamento, uma frase.
          </p>

          {enviado ? (
            <div>
              <p style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '1.3rem',
                fontStyle: 'italic',
                color: '#9a9a9e',
                marginBottom: '16px',
              }}>
                recebido ✦
              </p>
              <p style={{ fontSize: '12px', color: '#666', lineHeight: 1.9 }}>
                sua mensagem entrou no sorteio.<br />
                volte amanhã às 3h — pode ser a sua.
              </p>
            </div>
          ) : (
            <>
              <div style={{ borderBottom: '1px solid #35353a', paddingBottom: '12px', marginBottom: '20px' }}>
                <textarea
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  maxLength={240}
                  placeholder="escreva algo..."
                  rows={4}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#f0ece4',
                    fontSize: '0.95rem',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 300,
                    resize: 'none',
                    lineHeight: 1.8,
                    caretColor: '#f0ece4',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#555' }}>{texto.length}/240</span>
                <button
                  onClick={enviarMensagem}
                  disabled={texto.trim().length < 3}
                  style={{
                    background: 'transparent',
                    border: '1px solid #555',
                    color: texto.trim().length >= 3 ? '#c8c4bc' : '#444',
                    fontSize: '11px',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    padding: '10px 24px',
                    cursor: texto.trim().length >= 3 ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onMouseEnter={e => {
                    if (texto.trim().length >= 3) {
                      e.target.style.background = '#f5f1ea'
                      e.target.style.color = '#242428'
                      e.target.style.borderColor = '#f5f1ea'
                    }
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = 'transparent'
                    e.target.style.color = texto.trim().length >= 3 ? '#c8c4bc' : '#444'
                    e.target.style.borderColor = '#555'
                  }}
                >
                  enviar
                </button>
              </div>

              {erro && (
                <p style={{ fontSize: '12px', color: '#c0705a', marginTop: '12px', lineHeight: 1.7 }}>
                  {erro}
                </p>
              )}
            </>
          )}

          <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #2e2e32' }}>
            <p style={{ fontSize: '11px', color: '#555', lineHeight: 1.9 }}>
              todo dia uma mensagem de alguém do mundo<br />
              fica aqui. hoje é essa.
            </p>
          </div>
        </div>

      </div>
    </main>
  )
}