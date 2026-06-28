'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

interface Props {
  pauseBgm: () => void
  resumeBgm: () => void
}

interface WeeklyDevotional {
  id: string
  week_number: number
  theme: string
  world_context: string
  scripture_reference: string
  scripture_text_en: string
  reflection_en: string
  prayer_prompt_en: string
  music_suggestion_title: string
  music_suggestion_artist: string
  music_url: string | null
}

const LAUNCH = new Date('2026-05-16')

function currentWeekNumber(): number {
  const diff = Date.now() - LAUNCH.getTime()
  return Math.max(1, Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1)
}

const label = {
  fontFamily: 'var(--font-cinzel)',
  fontSize: 9,
  letterSpacing: '0.2em',
  color: 'var(--muted)',
  textTransform: 'uppercase' as const,
  marginBottom: 12,
}

export default function ReflectScreen({ pauseBgm, resumeBgm }: Props) {
  const [devotional, setDevotional] = useState<WeeklyDevotional | null>(null)
  const [loading, setLoading] = useState(true)
  const [listening, setListening] = useState(false)

  useEffect(() => {
    async function load() {
      const week = currentWeekNumber()
      try {
        let { data } = await supabase
          .from('weekly_devotionals')
          .select('*')
          .eq('week_number', week)
          .single()
        if (!data) {
          const fallback = await supabase
            .from('weekly_devotionals')
            .select('*')
            .eq('week_number', 1)
            .single()
          data = fallback.data
        }
        if (data) setDevotional(data as WeeklyDevotional)
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => () => { window.speechSynthesis?.cancel() }, [])

  const handleListen = useCallback(() => {
    if (!devotional) return
    if (listening) {
      window.speechSynthesis.cancel()
      setListening(false)
      resumeBgm()
      return
    }
    pauseBgm()
    const text = [
      devotional.theme,
      `${devotional.scripture_reference}. ${devotional.scripture_text_en}`,
      devotional.reflection_en,
    ].join('. ')
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = 0.85
    utter.onend = () => { setListening(false); resumeBgm() }
    utter.onerror = () => setListening(false)
    window.speechSynthesis.speak(utter)
    setListening(true)
  }, [listening, devotional, pauseBgm, resumeBgm])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0' }}>
        <span style={{ color: 'var(--dim)', fontFamily: 'var(--font-cormorant)', fontSize: 16 }}>Loading…</span>
      </div>
    )
  }

  if (!devotional) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--muted)', fontSize: 16 }}>
          Weekly devotional not yet available.
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 20px 30px' }}>
      {/* Week label */}
      <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 9, letterSpacing: '0.2em', color: 'var(--dim)', textTransform: 'uppercase', marginBottom: 4 }}>
        Week {devotional.week_number}
      </div>
      <div style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--gold)', fontSize: 17, letterSpacing: '0.08em', marginBottom: 10 }}>
        {devotional.theme}
      </div>

      {/* World context */}
      {devotional.world_context && (
        <div style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', color: '#8A9BB5', fontSize: 14, lineHeight: 1.65, marginBottom: 20 }}>
          {devotional.world_context}
        </div>
      )}

      {/* Scripture card */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--gold-border)', borderRadius: 16, padding: 24, marginBottom: 14 }}>
        <div style={label}>This Week's Scripture</div>
        <div style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', fontSize: 17, color: 'var(--text)', lineHeight: 1.75, marginBottom: 12 }}>
          {devotional.scripture_text_en}
        </div>
        <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: 20 }}>
          {devotional.scripture_reference}
        </div>
        <button
          onClick={handleListen}
          style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${listening ? 'var(--gold)' : 'var(--gold-border)'}`, borderRadius: 20, padding: '8px 18px', color: listening ? 'var(--gold)' : 'var(--muted)', fontFamily: 'var(--font-cinzel)', fontSize: 10, letterSpacing: '0.1em', background: listening ? 'var(--gold-dim)' : 'transparent' }}
        >
          <span>{listening ? '◼' : '◎'}</span>
          <span>{listening ? 'Stop' : 'Listen to the Message'}</span>
        </button>
      </div>

      {/* Reflection */}
      {devotional.reflection_en && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 14 }}>
          <div style={label}>Reflection</div>
          <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: 15, color: '#C8D8EF', lineHeight: 1.75 }}>
            {devotional.reflection_en}
          </div>
        </div>
      )}

      {/* Prayer */}
      {devotional.prayer_prompt_en && (
        <div style={{ paddingLeft: 20, borderLeft: '2px solid var(--gold)', marginBottom: 14 }}>
          <div style={{ ...label, marginBottom: 8 }}>Prayer</div>
          <div style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', fontSize: 15, color: '#C8D8EF', lineHeight: 1.75 }}>
            {devotional.prayer_prompt_en}
          </div>
        </div>
      )}

      {/* Music card */}
      {devotional.music_suggestion_title && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
          <div style={label}>This Week's Music</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ color: 'var(--gold)', fontSize: 22 }}>♪</span>
              <div>
                <div style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', color: 'var(--text)', fontSize: 16 }}>
                  {devotional.music_suggestion_title}
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 2 }}>
                  {devotional.music_suggestion_artist}
                </div>
              </div>
            </div>
            {devotional.music_url && (
              <a href={devotional.music_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', fontSize: 22 }}>›</a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
