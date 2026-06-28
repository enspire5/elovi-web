'use client'

import { useState, useEffect, useCallback } from 'react'

interface JournalEntry {
  id: string
  text: string
  date: string
}

const STORAGE_KEY = 'elovi_journal'
const MAX_CHARS = 2000

function loadEntries(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as JournalEntry[]) : []
  } catch { return [] }
}

function saveEntries(entries: JournalEntry[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) } catch {}
}

function formatEntryDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  })
}

const label = {
  fontFamily: 'var(--font-cinzel)',
  fontSize: 9,
  letterSpacing: '0.2em',
  color: 'var(--muted)',
  textTransform: 'uppercase' as const,
}

export default function JournalScreen() {
  const [tab, setTab] = useState<'write' | 'entries'>('write')
  const [text, setText] = useState('')
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [saved, setSaved] = useState(false)

  useEffect(() => { setEntries(loadEntries()) }, [])

  const handleSave = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed) return
    const entry: JournalEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: trimmed,
      date: new Date().toISOString(),
    }
    const updated = [entry, ...entries]
    setEntries(updated)
    saveEntries(updated)
    setText('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setTab('entries')
  }, [text, entries])

  const handleDelete = useCallback((id: string) => {
    const updated = entries.filter(e => e.id !== id)
    setEntries(updated)
    saveEntries(updated)
  }, [entries])

  const tabBtn = (t: 'write' | 'entries') => ({
    fontFamily: 'var(--font-cinzel)',
    fontSize: 10,
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    padding: '8px 20px',
    borderRadius: 20,
    border: `1px solid ${tab === t ? 'var(--gold-border)' : 'var(--border)'}`,
    background: tab === t ? 'var(--gold-dim)' : 'transparent',
    color: tab === t ? 'var(--gold)' : 'var(--muted)',
  })

  return (
    <div style={{ padding: '20px 20px 30px' }}>
      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <button onClick={() => setTab('write')} style={tabBtn('write')}>Write</button>
        <button onClick={() => setTab('entries')} style={tabBtn('entries')}>
          Entries {entries.length > 0 && `(${entries.length})`}
        </button>
      </div>

      {/* WRITE TAB */}
      {tab === 'write' && (
        <div>
          {saved && (
            <div style={{ background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', borderRadius: 10, padding: '10px 16px', color: 'var(--gold)', fontFamily: 'var(--font-cinzel)', fontSize: 10, letterSpacing: '0.1em', textAlign: 'center', marginBottom: 16 }}>
              Entry saved ✓
            </div>
          )}
          <textarea
            value={text}
            onChange={e => setText(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Write your reflection…"
            rows={10}
            style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', color: 'var(--text)', fontSize: 16, fontFamily: 'var(--font-cormorant)', lineHeight: 1.7, resize: 'vertical', outline: 'none', marginBottom: 10 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <span style={{ ...label, fontSize: 10 }}>{text.length} / {MAX_CHARS}</span>
            <button
              onClick={handleSave}
              disabled={!text.trim()}
              style={{ background: text.trim() ? 'var(--gold-dim)' : 'transparent', border: `1px solid ${text.trim() ? 'var(--gold-border)' : 'var(--border)'}`, borderRadius: 20, padding: '9px 24px', color: text.trim() ? 'var(--gold)' : 'var(--dim)', fontFamily: 'var(--font-cinzel)', fontSize: 10, letterSpacing: '0.15em', cursor: text.trim() ? 'pointer' : 'default' }}
            >
              Save Entry
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--gold)', fontSize: 11 }}>🔒</span>
            <span style={{ ...label, fontSize: 9, color: 'var(--dim)' }}>Stays on your device — never uploaded</span>
          </div>
        </div>
      )}

      {/* ENTRIES TAB */}
      {tab === 'entries' && (
        <div>
          {entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--muted)', fontSize: 16 }}>
                No entries yet. Start writing.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {entries.map(entry => (
                <div
                  key={entry.id}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{ ...label, fontSize: 9, color: 'var(--dim)' }}>
                      {formatEntryDate(entry.date)}
                    </span>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      style={{ color: 'var(--dim)', fontSize: 14, lineHeight: 1, padding: '2px 6px' }}
                      title="Delete entry"
                    >×</button>
                  </div>
                  <div style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--text)', fontSize: 15, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {entry.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
