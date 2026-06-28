'use client'

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Props {
  pauseBgm: () => void
  resumeBgm: () => void
}

interface MoodVerse {
  id: string
  text_en: string
  reference: string
  weight: number
}

const MOODS = [
  { name: 'Anxious', emoji: '😟' },
  { name: 'Grateful', emoji: '🙏' },
  { name: 'Lost', emoji: '🌫️' },
  { name: 'Hopeful', emoji: '🌅' },
  { name: 'Grieving', emoji: '💔' },
  { name: 'Peaceful', emoji: '🕊️' },
  { name: 'Joyful', emoji: '✨' },
  { name: 'Weary', emoji: '😔' },
  { name: 'Doubting', emoji: '🤔' },
  { name: 'Angry', emoji: '⚡' },
]

const FALLBACK_VERSES: Record<string, { text: string; reference: string }> = {
  Peaceful: {
    text: 'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.',
    reference: 'John 14:27',
  },
  Doubting: {
    text: 'Lord, I believe; help thou mine unbelief.',
    reference: 'Mark 9:24',
  },
  Angry: {
    text: 'A soft answer turneth away wrath: but grievous words stir up anger.',
    reference: 'Proverbs 15:1',
  },
}

const label = {
  fontFamily: 'var(--font-cinzel)',
  fontSize: 9,
  letterSpacing: '0.2em',
  color: 'var(--muted)',
  textTransform: 'uppercase' as const,
  marginBottom: 12,
}

export default function FeelingsScreen({ pauseBgm, resumeBgm }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [verses, setVerses] = useState<MoodVerse[]>([])
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [bgmWasOn, setBgmWasOn] = useState(false)

  useEffect(() => () => { window.speechSynthesis?.cancel() }, [])

  const selectMood = useCallback(async (mood: string) => {
    if (selected === mood) { setSelected(null); setVerses([]); return }
    setSelected(mood)
    setLoading(true)
    setVerses([])
    try {
      const { data } = await supabase
        .from('mood_verses')
        .select('id, text_en, reference, weight')
        .eq('mood', mood)
        .order('weight', { ascending: false })
        .limit(5)
      const rows: MoodVerse[] = (data as MoodVerse[]) ?? []
      if (rows.length === 0 && FALLBACK_VERSES[mood]) {
        const fb = FALLBACK_VERSES[mood]
        rows.push({ id: 'fallback', text_en: fb.text, reference: fb.reference, weight: 1 })
      }
      setVerses(rows)
    } catch {}
    setLoading(false)
  }, [selected])

  const handleListen = useCallback((text: string) => {
    if (listening) {
      window.speechSynthesis.cancel()
      setListening(false)
      if (bgmWasOn) resumeBgm()
      return
    }
    setBgmWasOn(true)
    pauseBgm()
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = 0.85
    utter.onend = () => { setListening(false); resumeBgm() }
    utter.onerror = () => setListening(false)
    window.speechSynthesis.speak(utter)
    setListening(true)
  }, [listening, bgmWasOn, pauseBgm, resumeBgm])

  return (
    <div style={{ padding: '20px 20px 30px' }}>
      <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 13, letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: 20 }}>
        How are you feeling?
      </div>

      {/* Mood chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
        {MOODS.map(m => {
          const active = selected === m.name
          return (
            <button
              key={m.name}
              onClick={() => selectMood(m.name)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: 20, padding: '8px 14px',
                background: active ? 'var(--gold-dim)' : 'var(--surface)',
                color: active ? 'var(--gold)' : 'var(--text)',
                fontFamily: 'var(--font-cinzel)', fontSize: 10, letterSpacing: '0.1em',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 14 }}>{m.emoji}</span>
              <span>{m.name}</span>
            </button>
          )
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ color: 'var(--dim)', fontFamily: 'var(--font-cormorant)', fontSize: 16, textAlign: 'center', padding: '30px 0' }}>
          Loading…
        </div>
      )}

      {/* No results */}
      {!loading && selected && verses.length === 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--muted)', fontSize: 15 }}>
            More verses for this feeling are in the mobile app.
          </div>
        </div>
      )}

      {/* Verses */}
      {!loading && verses.map(v => {
        const listenText = `${v.text_en}. ${v.reference}.`
        return (
          <div
            key={v.id}
            style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, borderLeft: '3px solid var(--gold)', marginBottom: 14 }}
          >
            <div style={label}>Scripture</div>
            <div style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', fontSize: 17, color: 'var(--text)', lineHeight: 1.75, marginBottom: 12 }}>
              {v.text_en}
            </div>
            <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: 18 }}>
              {v.reference}
            </div>
            <button
              onClick={() => handleListen(listenText)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${listening ? 'var(--gold)' : 'var(--gold-border)'}`, borderRadius: 20, padding: '7px 16px', color: listening ? 'var(--gold)' : 'var(--muted)', fontFamily: 'var(--font-cinzel)', fontSize: 10, letterSpacing: '0.1em', background: listening ? 'var(--gold-dim)' : 'transparent' }}
            >
              <span>{listening ? '◼' : '◎'}</span>
              <span>{listening ? 'Stop' : 'Listen'}</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
