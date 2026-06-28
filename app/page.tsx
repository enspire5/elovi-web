'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'

const TodayScreen    = dynamic(() => import('./screens/TodayScreen'),    { ssr: false })
const BibleScreen    = dynamic(() => import('./screens/BibleScreen'),    { ssr: false })
const FeelingsScreen = dynamic(() => import('./screens/FeelingsScreen'), { ssr: false })
const ReflectScreen  = dynamic(() => import('./screens/ReflectScreen'),  { ssr: false })
const JournalScreen  = dynamic(() => import('./screens/JournalScreen'),  { ssr: false })

type Tab = 'today' | 'bible' | 'feelings' | 'reflect' | 'journal'

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'today',    icon: '✦', label: 'Today' },
  { id: 'bible',    icon: '✝', label: 'Bible' },
  { id: 'feelings', icon: '♥', label: 'Feelings' },
  { id: 'reflect',  icon: '✿', label: 'Reflect' },
  { id: 'journal',  icon: '✎', label: 'Journal' },
]

const BGM_SRC =
  'https://upload.wikimedia.org/wikipedia/commons/e/e6/Gymnop%C3%A9die_No._1_%28piano%29.ogg'

export default function App() {
  const [tab, setTab]               = useState<Tab>('today')
  const [bgmPlaying, setBgmPlaying] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null)
  const [showInstall, setShowInstall]     = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Capture PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const pauseBgm = useCallback(() => {
    audioRef.current?.pause()
    setBgmPlaying(false)
  }, [])

  const resumeBgm = useCallback(() => {
    if (!bgmPlaying) return
    audioRef.current?.play().catch(() => {})
  }, [bgmPlaying])

  const toggleBgm = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (bgmPlaying) {
      audio.pause()
      setBgmPlaying(false)
    } else {
      audio.play().catch(() => {})
      setBgmPlaying(true)
    }
  }, [bgmPlaying])

  const switchTab = useCallback((next: Tab) => {
    if (next !== 'today') pauseBgm()
    setTab(next)
  }, [pauseBgm])

  const handleInstall = async () => {
    if (!installPrompt) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prompt = installPrompt as any
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') { setShowInstall(false); setInstallPrompt(null) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* PWA install banner */}
      {showInstall && (
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--gold-border)', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--text)' }}>
            Install Elovi as an app
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleInstall}
              style={{ border: '1px solid var(--gold-border)', borderRadius: 14, padding: '5px 14px', color: 'var(--gold)', fontFamily: 'var(--font-cinzel)', fontSize: 9, letterSpacing: '0.1em', background: 'var(--gold-dim)' }}
            >Install</button>
            <button
              onClick={() => setShowInstall(false)}
              style={{ color: 'var(--dim)', fontSize: 18, lineHeight: 1, padding: '2px 6px' }}
            >×</button>
          </div>
        </div>
      )}

      {/* Fixed global header */}
      <header style={{ flexShrink: 0, borderBottom: '1px solid var(--border)', padding: '14px 20px 12px', textAlign: 'center', background: 'var(--bg)' }}>
        <div style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--gold)', fontSize: 20, letterSpacing: '0.3em', fontWeight: 600 }}>
          ELOVI
        </div>
        <div style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--dim)', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 3 }}>
          God&rsquo;s Door · John 10:9
        </div>
      </header>

      {/* Scrollable screen area */}
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {tab === 'today' && (
          <TodayScreen
            bgmPlaying={bgmPlaying}
            onBgmToggle={toggleBgm}
            pauseBgm={pauseBgm}
            resumeBgm={resumeBgm}
          />
        )}
        {tab === 'bible'    && <BibleScreen />}
        {tab === 'feelings' && <FeelingsScreen pauseBgm={pauseBgm} resumeBgm={resumeBgm} />}
        {tab === 'reflect'  && <ReflectScreen  pauseBgm={pauseBgm} resumeBgm={resumeBgm} />}
        {tab === 'journal'  && <JournalScreen />}
      </main>

      {/* Bottom tab bar */}
      <nav style={{ flexShrink: 0, borderTop: '1px solid var(--border)', display: 'flex', background: 'var(--surface)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {TABS.map(t => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 4px 8px', background: 'none', border: 'none' }}
            >
              <span style={{ fontSize: 16, color: active ? 'var(--gold)' : 'var(--dim)', lineHeight: 1 }}>
                {t.icon}
              </span>
              <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: active ? 'var(--gold)' : 'var(--dim)' }}>
                {t.label}
              </span>
              {active && (
                <span style={{ width: 18, height: 1.5, background: 'var(--gold)', borderRadius: 1 }} />
              )}
            </button>
          )
        })}
      </nav>

      {/* BGM audio */}
      <audio ref={audioRef} src={BGM_SRC} loop preload="none" />
    </div>
  )
}
