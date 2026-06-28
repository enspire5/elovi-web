'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

interface Props {
  bgmPlaying: boolean
  onBgmToggle: () => void
  pauseBgm: () => void
  resumeBgm: () => void
}

interface DailyVerse {
  id: string
  date: string
  book: string
  chapter: number
  verse: number
  text_en: string
  reference: string
  daily_theme: string
  reflection_en: string | null
  prayer_prompt_en: string
  music_title: string | null
  music_artist: string | null
  music_url: string | null
  journal_prompt_en: string | null
}

const FALLBACK: { text: string; reference: string } = {
  text: 'I can do all things through Christ which strengtheneth me.',
  reference: 'Philippians 4:13',
}

function greeting(): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 17) return 'Good afternoon'
  if (h >= 17 && h < 21) return 'Good evening'
  return 'Peace be with you'
}

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

const S = {
  label: {
    fontFamily: 'var(--font-cinzel)',
    fontSize: 9,
    letterSpacing: '0.2em',
    color: 'var(--muted)',
    textTransform: 'uppercase' as const,
    marginBottom: 12,
  },
  card: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 14,
  },
}

export default function TodayScreen({ bgmPlaying, onBgmToggle, pauseBgm, resumeBgm }: Props) {
  const [content, setContent] = useState<DailyVerse | null>(null)
  const [fontLarge, setFontLarge] = useState(false)
  const [listening, setListening] = useState(false)
  const [bgmWasOn, setBgmWasOn] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const today = new Date().toISOString().split('T')[0]
        const { data } = await supabase
          .from('daily_verses')
          .select('*')
          .eq('date', today)
          .single()
        if (data) setContent(data as DailyVerse)
      } catch {}
    }
    load()
  }, [])

  // Stop speech when unmounting
  useEffect(() => () => { window.speechSynthesis?.cancel() }, [])

  const handleListen = useCallback(() => {
    if (listening) {
      window.speechSynthesis.cancel()
      setListening(false)
      if (bgmWasOn) resumeBgm()
      return
    }
    const text = content
      ? `${content.text_en}. ${content.reference}. ${content.reflection_en ?? ''}`
      : `${FALLBACK.text}. ${FALLBACK.reference}.`
    setBgmWasOn(bgmPlaying)
    pauseBgm()
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = 0.85
    utter.onend = () => { setListening(false); if (bgmWasOn) resumeBgm() }
    utter.onerror = () => setListening(false)
    window.speechSynthesis.speak(utter)
    setListening(true)
  }, [listening, content, bgmPlaying, bgmWasOn, pauseBgm, resumeBgm])

  const fs = fontLarge ? 18 : 15

  return (
    <div style={{ padding: '20px 20px 30px' }}>

      {/* Sub-header: greeting + controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 11, letterSpacing: '0.15em', color: 'var(--muted)', textTransform: 'uppercase' }}>
            {greeting()}
          </div>
          <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 3 }}>{todayLabel()}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setFontLarge(v => !v)}
            style={{ border: `1px solid ${fontLarge ? 'var(--gold-border)' : 'var(--border)'}`, borderRadius: 6, padding: '4px 9px', color: fontLarge ? 'var(--gold)' : 'var(--muted)', fontFamily: 'var(--font-cinzel)', fontSize: 11 }}
          >Aa</button>
          <button
            onClick={onBgmToggle}
            title={bgmPlaying ? 'Pause BGM' : 'Play BGM'}
            style={{ border: `1px solid ${bgmPlaying ? 'var(--gold-border)' : 'var(--border)'}`, borderRadius: 6, padding: '4px 9px', color: bgmPlaying ? 'var(--gold)' : 'var(--muted)', fontSize: 14 }}
          >♪</button>
        </div>
      </div>

      {/* Hebrew letters */}
      <div style={{ textAlign: 'center', fontSize: 30, color: 'var(--dim)', letterSpacing: '0.08em', margin: '18px 0' }}>אל</div>

      {/* Theme pill */}
      {content?.daily_theme && (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span style={{ display: 'inline-block', border: '1px solid var(--gold-border)', borderRadius: 20, padding: '4px 18px', color: 'var(--gold)', fontFamily: 'var(--font-cinzel)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', background: 'var(--gold-dim)' }}>
            {content.daily_theme}
          </span>
        </div>
      )}

      {/* Verse card */}
      <div style={{ ...S.card, borderLeft: '3px solid var(--gold)' }}>
        <div style={S.label}>Today's Verse</div>
        <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: fs + 2, fontStyle: 'italic', color: 'var(--text)', lineHeight: 1.75, marginBottom: 12 }}>
          {content?.text_en ?? FALLBACK.text}
        </div>
        <div style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: 20 }}>
          {content?.reference ?? FALLBACK.reference}
        </div>
        <button
          onClick={handleListen}
          style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${listening ? 'var(--gold)' : 'var(--gold-border)'}`, borderRadius: 20, padding: '8px 18px', color: listening ? 'var(--gold)' : 'var(--muted)', fontFamily: 'var(--font-cinzel)', fontSize: 10, letterSpacing: '0.1em', background: listening ? 'var(--gold-dim)' : 'transparent' }}
        >
          <span>{listening ? '◼' : '◎'}</span>
          <span>{listening ? 'Stop' : "Listen to Today's Message"}</span>
        </button>
      </div>

      {/* Reflection */}
      {content?.reflection_en && (
        <div style={S.card}>
          <div style={S.label}>Reflection</div>
          <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: fs, color: 'var(--text)', lineHeight: 1.75 }}>
            {content.reflection_en}
          </div>
        </div>
      )}

      {/* Prayer */}
      {content?.prayer_prompt_en && (
        <div style={{ paddingLeft: 20, borderLeft: '2px solid var(--gold)', marginBottom: 14 }}>
          <div style={{ ...S.label, marginBottom: 8 }}>Prayer</div>
          <div style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', fontSize: fs, color: 'var(--text)', lineHeight: 1.75 }}>
            {content.prayer_prompt_en}
          </div>
        </div>
      )}

      {/* Music card */}
      {content?.music_title && (
        <div style={{ ...S.card, padding: 20 }}>
          <div style={S.label}>Today's Music</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ color: 'var(--gold)', fontSize: 22 }}>♪</span>
              <div>
                <div style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', color: 'var(--text)', fontSize: 16 }}>
                  {content.music_title}
                </div>
                {content.music_artist && (
                  <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 2 }}>{content.music_artist}</div>
                )}
              </div>
            </div>
            {content.music_url && (
              <a href={content.music_url} target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--gold)', fontSize: 22, lineHeight: 1 }}>›</a>
            )}
          </div>
        </div>
      )}

      {/* Journal prompt */}
      {content?.journal_prompt_en && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ ...S.label, marginBottom: 8 }}>Journal Prompt</div>
          <div style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', color: 'var(--muted)', fontSize: fs - 1, lineHeight: 1.65 }}>
            {content.journal_prompt_en}
          </div>
        </div>
      )}
    </div>
  )
}
