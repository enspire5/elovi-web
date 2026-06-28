'use client'

import { useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'

interface VerseRow {
  verse: number
  text_en: string
  reference: string
}

interface Book { name: string; chapters: number }

const OT: Book[] = [
  { name: 'Genesis', chapters: 50 }, { name: 'Exodus', chapters: 40 },
  { name: 'Leviticus', chapters: 27 }, { name: 'Numbers', chapters: 36 },
  { name: 'Deuteronomy', chapters: 34 }, { name: 'Joshua', chapters: 24 },
  { name: 'Judges', chapters: 21 }, { name: 'Ruth', chapters: 4 },
  { name: '1 Samuel', chapters: 31 }, { name: '2 Samuel', chapters: 24 },
  { name: '1 Kings', chapters: 22 }, { name: '2 Kings', chapters: 25 },
  { name: '1 Chronicles', chapters: 29 }, { name: '2 Chronicles', chapters: 36 },
  { name: 'Ezra', chapters: 10 }, { name: 'Nehemiah', chapters: 13 },
  { name: 'Esther', chapters: 10 }, { name: 'Job', chapters: 42 },
  { name: 'Psalms', chapters: 150 }, { name: 'Proverbs', chapters: 31 },
  { name: 'Ecclesiastes', chapters: 12 }, { name: 'Song of Solomon', chapters: 8 },
  { name: 'Isaiah', chapters: 66 }, { name: 'Jeremiah', chapters: 52 },
  { name: 'Lamentations', chapters: 5 }, { name: 'Ezekiel', chapters: 48 },
  { name: 'Daniel', chapters: 12 }, { name: 'Hosea', chapters: 14 },
  { name: 'Joel', chapters: 3 }, { name: 'Amos', chapters: 9 },
  { name: 'Obadiah', chapters: 1 }, { name: 'Jonah', chapters: 4 },
  { name: 'Micah', chapters: 7 }, { name: 'Nahum', chapters: 3 },
  { name: 'Habakkuk', chapters: 3 }, { name: 'Zephaniah', chapters: 3 },
  { name: 'Haggai', chapters: 2 }, { name: 'Zechariah', chapters: 14 },
  { name: 'Malachi', chapters: 4 },
]

const NT: Book[] = [
  { name: 'Matthew', chapters: 28 }, { name: 'Mark', chapters: 16 },
  { name: 'Luke', chapters: 24 }, { name: 'John', chapters: 21 },
  { name: 'Acts', chapters: 28 }, { name: 'Romans', chapters: 16 },
  { name: '1 Corinthians', chapters: 16 }, { name: '2 Corinthians', chapters: 13 },
  { name: 'Galatians', chapters: 6 }, { name: 'Ephesians', chapters: 6 },
  { name: 'Philippians', chapters: 4 }, { name: 'Colossians', chapters: 4 },
  { name: '1 Thessalonians', chapters: 5 }, { name: '2 Thessalonians', chapters: 3 },
  { name: '1 Timothy', chapters: 6 }, { name: '2 Timothy', chapters: 4 },
  { name: 'Titus', chapters: 3 }, { name: 'Philemon', chapters: 1 },
  { name: 'Hebrews', chapters: 13 }, { name: 'James', chapters: 5 },
  { name: '1 Peter', chapters: 5 }, { name: '2 Peter', chapters: 3 },
  { name: '1 John', chapters: 5 }, { name: '2 John', chapters: 1 },
  { name: '3 John', chapters: 1 }, { name: 'Jude', chapters: 1 },
  { name: 'Revelation', chapters: 22 },
]

const ALL_BOOKS = [...OT, ...NT]

type View = 'books' | 'chapters' | 'reader'

const label = {
  fontFamily: 'var(--font-cinzel)',
  fontSize: 9,
  letterSpacing: '0.2em',
  color: 'var(--muted)',
  textTransform: 'uppercase' as const,
  marginBottom: 14,
}

export default function BibleScreen() {
  const [query, setQuery] = useState('')
  const [view, setView] = useState<View>('books')
  const [activeBook, setActiveBook] = useState<Book | null>(null)
  const [activeChapter, setActiveChapter] = useState<number | null>(null)
  const [verses, setVerses] = useState<VerseRow[]>([])
  const [loading, setLoading] = useState(false)

  const filtered = useMemo(() => {
    if (!query.trim()) return null
    const q = query.toLowerCase()
    return ALL_BOOKS.filter(b => b.name.toLowerCase().includes(q))
  }, [query])

  const openBook = (book: Book) => {
    setActiveBook(book)
    setView('chapters')
    setQuery('')
  }

  const openChapter = async (chapter: number) => {
    if (!activeBook) return
    setActiveChapter(chapter)
    setLoading(true)
    setVerses([])
    setView('reader')
    try {
      const { data } = await supabase
        .from('daily_verses')
        .select('verse, text_en, reference')
        .eq('book', activeBook.name)
        .eq('chapter', chapter)
        .order('verse')
      setVerses((data as VerseRow[]) ?? [])
    } catch {}
    setLoading(false)
  }

  const back = () => {
    if (view === 'reader') { setView('chapters'); setVerses([]) }
    else if (view === 'chapters') { setView('books'); setActiveBook(null) }
  }

  const displayBooks = filtered ?? ALL_BOOKS
  const otFiltered = displayBooks.filter(b => OT.some(o => o.name === b.name))
  const ntFiltered = displayBooks.filter(b => NT.some(n => n.name === b.name))

  return (
    <div style={{ padding: '16px 20px 30px' }}>
      {/* Back button */}
      {view !== 'books' && (
        <button
          onClick={back}
          style={{ color: 'var(--gold)', fontFamily: 'var(--font-cinzel)', fontSize: 11, letterSpacing: '0.1em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ‹ {view === 'reader' ? activeBook?.name : 'Books'}
        </button>
      )}

      {/* BOOKS VIEW */}
      {view === 'books' && (
        <>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search books…"
            style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', color: 'var(--text)', fontSize: 14, marginBottom: 20, outline: 'none' }}
          />
          {otFiltered.length > 0 && (
            <>
              <div style={label}>Old Testament</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {otFiltered.map(book => (
                  <button
                    key={book.name}
                    onClick={() => openBook(book)}
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontFamily: 'var(--font-cormorant)', fontSize: 14 }}
                  >
                    {book.name}
                  </button>
                ))}
              </div>
            </>
          )}
          {ntFiltered.length > 0 && (
            <>
              <div style={label}>New Testament</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ntFiltered.map(book => (
                  <button
                    key={book.name}
                    onClick={() => openBook(book)}
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontFamily: 'var(--font-cormorant)', fontSize: 14 }}
                  >
                    {book.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* CHAPTERS VIEW */}
      {view === 'chapters' && activeBook && (
        <>
          <div style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--gold)', fontSize: 16, letterSpacing: '0.1em', marginBottom: 20 }}>
            {activeBook.name}
          </div>
          <div style={label}>Select Chapter</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))', gap: 8 }}>
            {Array.from({ length: activeBook.chapters }, (_, i) => i + 1).map(ch => (
              <button
                key={ch}
                onClick={() => openChapter(ch)}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 4px', color: 'var(--muted)', fontFamily: 'var(--font-cinzel)', fontSize: 12, textAlign: 'center' }}
              >
                {ch}
              </button>
            ))}
          </div>
        </>
      )}

      {/* READER VIEW */}
      {view === 'reader' && activeBook && activeChapter && (
        <>
          <div style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--gold)', fontSize: 14, letterSpacing: '0.1em', marginBottom: 6 }}>
            {activeBook.name}
          </div>
          <div style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--muted)', fontSize: 11, letterSpacing: '0.15em', marginBottom: 20 }}>
            CHAPTER {activeChapter}
          </div>

          {loading && (
            <div style={{ color: 'var(--dim)', fontFamily: 'var(--font-cormorant)', fontSize: 16, textAlign: 'center', padding: '40px 0' }}>
              Loading…
            </div>
          )}

          {!loading && verses.length === 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>✝</div>
              <div style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--gold)', fontSize: 12, letterSpacing: '0.1em', marginBottom: 10 }}>
                Full Bible Available in the App
              </div>
              <div style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
                This chapter's devotional content is available in the Elovi mobile app.
              </div>
            </div>
          )}

          {!loading && verses.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {verses.map(v => (
                <div key={v.verse} style={{ display: 'flex', gap: 12 }}>
                  <span style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--dim)', fontSize: 10, minWidth: 20, paddingTop: 4 }}>{v.verse}</span>
                  <div>
                    <span style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--text)', fontSize: 16, lineHeight: 1.75 }}>
                      {v.text_en}
                    </span>
                    {v.reference && (
                      <div style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--gold)', fontSize: 9, letterSpacing: '0.1em', marginTop: 4 }}>
                        {v.reference}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
