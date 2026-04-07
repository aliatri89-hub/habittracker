import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabase'

const HABITS = [
  { id: 1,  name: '45 min outdoor',  sub: 'Get outside — run, walk, anything' },
  { id: 2,  name: 'Phone Break',     sub: 'No phone during outdoor workout' },
  { id: 3,  name: '45 min strength', sub: 'Lift something heavy' },
  { id: 4,  name: 'Read',            sub: '10 pages minimum' },
  { id: 5,  name: 'Meditate',        sub: '5 minutes' },
  { id: 6,  name: 'IF 16:8',         sub: 'Eating window closed' },
  { id: 7,  name: 'No Phone PM',     sub: '60 min before bed' },
  { id: 8,  name: 'Wake Checks',     sub: 'Am I dreaming?' },
  { id: 9,  name: 'Dream Journal',   sub: 'Write up on waking' },
  { id: 10, name: 'MILD',            sub: 'Intention while falling asleep' },
]

const TOTAL = HABITS.length
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const WEEKDAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT']
const WEEKDAYS_LONG = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
  input[type=number] { -moz-appearance: textfield; }

  html, body, #root {
    height: 100%; width: 100%;
    background: #060504;
    -webkit-tap-highlight-color: transparent;
  }

  .app {
    min-height: 100vh;
    min-height: -webkit-fill-available;
    background: #060504;
    color: #F0EDE6;
    font-family: 'IBM Plex Mono', monospace;
    max-width: 430px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  /* AUTH */
  .auth-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 40px 32px;
  }
  .auth-wordmark {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 72px;
    font-weight: 900;
    text-transform: uppercase;
    line-height: 0.9;
    margin-bottom: 8px;
  }
  .auth-wordmark span { color: #D4A843; }
  .auth-tagline {
    font-size: 11px;
    color: #aaa;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    margin-bottom: 48px;
  }
  .auth-label {
    font-size: 10px;
    color: #aaa;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .auth-input {
    width: 100%;
    background: #111;
    border: 1px solid #222;
    border-radius: 8px;
    color: #F0EDE6;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 15px;
    padding: 12px 14px;
    outline: none;
    margin-bottom: 14px;
    transition: border-color 0.15s;
  }
  .auth-input:focus { border-color: #D4A843; }
  .auth-btn {
    width: 100%;
    background: #D4A843;
    border: none;
    border-radius: 8px;
    color: #0c0b09;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 20px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 13px;
    cursor: pointer;
    margin-top: 4px;
    transition: opacity 0.15s;
  }
  .auth-btn:active { opacity: 0.8; }
  .auth-btn:disabled { opacity: 0.4; cursor: default; }
  .auth-error {
    font-size: 11px;
    color: #c0392b;
    margin-top: 10px;
    letter-spacing: 0.05em;
  }

  /* HEADER */
  .hdr {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 20px 20px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
  }
  .wordmark {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 28px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: -0.01em;
  }
  .wordmark span { color: #D4A843; }
  .hdr-date {
    font-size: 10px;
    color: #999;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-top: 3px;
  }
  .streak-block { text-align: right; }
  .streak-num {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 30px;
    font-weight: 900;
    color: #D4A843;
    line-height: 1;
  }
  .streak-lbl {
    font-size: 9px;
    color: #999;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  /* TABS */
  .tab-content {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 16px 20px 80px;
  }

  /* TODAY */
  .today-date {
    font-size: 10px;
    color: #aaa;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-bottom: 16px;
  }
  .habit-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 13px 0;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    cursor: pointer;
    user-select: none;
  }
  .habit-row:last-child { border-bottom: none; }
  .chk {
    width: 26px; height: 26px;
    border: 1.5px solid #444;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }
  .chk.on { background: #D4A843; border-color: #D4A843; }
  .chk-mark {
    width: 9px; height: 6px;
    border-left: 2px solid #0c0b09;
    border-bottom: 2px solid #0c0b09;
    transform: rotate(-45deg) translateY(-1px);
    opacity: 0;
    transition: opacity 0.1s;
  }
  .chk.on .chk-mark { opacity: 1; }
  .habit-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 19px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    transition: color 0.15s;
  }
  .habit-sub {
    font-size: 10px;
    color: #aaa;
    letter-spacing: 0.07em;
    margin-top: 1px;
    transition: color 0.15s;
  }
  .habit-row.done .habit-name { color: #3a3a3a; }
  .habit-row.done .habit-sub  { color: #333; }

  .prog-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 18px;
  }
  .prog-track {
    flex: 1;
    height: 3px;
    background: #1a1a1a;
    border-radius: 2px;
    overflow: hidden;
  }
  .prog-fill {
    height: 100%;
    background: #D4A843;
    border-radius: 2px;
    transition: width 0.3s ease;
  }
  .prog-lbl {
    font-size: 10px;
    color: #aaa;
    letter-spacing: 0.08em;
    white-space: nowrap;
  }
  .complete-bar {
    margin-top: 16px;
    padding: 12px 16px;
    background: rgba(212,168,67,0.07);
    border: 1px solid rgba(212,168,67,0.16);
    border-radius: 10px;
  }
  .complete-text {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 18px;
    font-weight: 700;
    text-transform: uppercase;
    color: #D4A843;
    letter-spacing: 0.04em;
  }
  .complete-sub {
    font-size: 10px;
    color: #9a7828;
    letter-spacing: 0.08em;
    margin-top: 2px;
  }

  /* CALENDAR */
  .cal-hdr {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  .cal-month {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 24px;
    font-weight: 900;
    text-transform: uppercase;
  }
  .cal-nav-btn {
    background: none;
    border: none;
    color: #aaa;
    font-size: 18px;
    cursor: pointer;
    padding: 4px 10px;
    font-family: 'IBM Plex Mono', monospace;
    transition: color 0.15s;
  }
  .cal-nav-btn:hover { color: #F0EDE6; }
  .cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }
  .cal-day-label {
    text-align: center;
    font-size: 9px;
    color: #999;
    letter-spacing: 0.1em;
    padding-bottom: 8px;
  }
  .cal-day {
    aspect-ratio: 1;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #333;
    font-family: 'IBM Plex Mono', monospace;
  }
  .cal-day.past { color: #888; }
  .cal-day.partial { background: #1a1710; color: #a08830; }
  .cal-day.full { background: #D4A843; color: #0c0b09; font-weight: 500; }
  .cal-day.today-ring { box-shadow: 0 0 0 1.5px #D4A843; }
  .cal-day.today-ring:not(.full) { color: #D4A843; }

  .cal-stats {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    margin-top: 20px;
  }
  .cal-stat {
    background: #0f0e0c;
    border-radius: 8px;
    padding: 12px;
    text-align: center;
  }
  .cal-stat-num {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 28px;
    font-weight: 900;
    color: #D4A843;
  }
  .cal-stat-lbl {
    font-size: 9px;
    color: #999;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-top: 2px;
  }

  /* WEIGHT */
  .wt-section-lbl {
    font-size: 10px;
    color: #aaa;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  .wt-input-row {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 28px;
  }
  .wt-input {
    background: #111;
    border: 1px solid #222;
    border-radius: 8px;
    color: #F0EDE6;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 32px;
    font-weight: 700;
    padding: 10px 14px;
    width: 130px;
    outline: none;
    transition: border-color 0.15s;
  }
  .wt-input:focus { border-color: #D4A843; }
  .wt-unit {
    font-size: 14px;
    color: #aaa;
    letter-spacing: 0.1em;
  }
  .wt-log-btn {
    flex: 1;
    background: #D4A843;
    border: none;
    border-radius: 8px;
    color: #0c0b09;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 20px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 12px 16px;
    cursor: pointer;
    letter-spacing: 0.05em;
    transition: opacity 0.15s;
  }
  .wt-log-btn:active { opacity: 0.8; }
  .wt-log-btn:disabled { opacity: 0.4; }

  .spark-wrap { height: 70px; margin-bottom: 24px; }
  canvas { width: 100%; height: 70px; display: block; }

  .wt-entry {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .wt-entry:last-child { border-bottom: none; }
  .wt-entry-date { font-size: 11px; color: #aaa; letter-spacing: 0.07em; }
  .wt-entry-val {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 22px;
    font-weight: 700;
    display: flex;
    align-items: baseline;
    gap: 4px;
  }
  .wt-entry-unit { font-size: 11px; color: #aaa; font-family: 'IBM Plex Mono', monospace; font-weight: 400; }
  .wt-entry.today-wt .wt-entry-val { color: #D4A843; }
  .wt-entry.today-wt .wt-entry-date { color: #9a7828; }
  .wt-delta { font-size: 11px; margin-left: 6px; }
  .wt-delta.down { color: #6a9a5a; }
  .wt-delta.up   { color: #c04030; }

  .empty { padding: 40px 0; text-align: center; color: #555; font-size: 12px; letter-spacing: 0.1em; }

  /* NAV */
  .nav {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 430px;
    display: flex;
    background: #060504;
    border-top: 1px solid rgba(255,255,255,0.07);
    padding-bottom: env(safe-area-inset-bottom);
    z-index: 10;
  }
  .nav-btn {
    flex: 1;
    background: none;
    border: none;
    color: #888;
    padding: 10px 0 12px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    transition: color 0.15s;
  }
  .nav-btn.active { color: #D4A843; }
  .nav-icon { font-size: 16px; line-height: 1; }

  .sign-out-btn {
    margin-top: 32px;
    background: none;
    border: 1px solid #333;
    border-radius: 8px;
    color: #888;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.1em;
    padding: 10px;
    cursor: pointer;
    width: 100%;
    text-transform: uppercase;
    transition: color 0.15s, border-color 0.15s;
  }
  .sign-out-btn:hover { color: #bbb; border-color: #555; }
`

// ─── SPARKLINE ────────────────────────────────────────────────────────────────
function Sparkline({ data }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length < 2) return
    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth
    const H = 70
    canvas.width = W * dpr
    canvas.height = H * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    const min = Math.min(...data) - 1
    const max = Math.max(...data) + 1
    const pad = 12
    const pts = data.map((v, i) => ({
      x: pad + (i / (data.length - 1)) * (W - pad * 2),
      y: H - pad - ((v - min) / (max - min)) * (H - pad * 2)
    }))

    ctx.strokeStyle = '#D4A843'
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.beginPath()
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
    ctx.stroke()

    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, 'rgba(212,168,67,0.15)')
    grad.addColorStop(1, 'rgba(212,168,67,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
    ctx.lineTo(pts[pts.length - 1].x, H)
    ctx.lineTo(pts[0].x, H)
    ctx.closePath()
    ctx.fill()

    const last = pts[pts.length - 1]
    ctx.fillStyle = '#D4A843'
    ctx.beginPath()
    ctx.arc(last.x, last.y, 3, 0, Math.PI * 2)
    ctx.fill()
  }, [data])

  return (
    <div className="spark-wrap">
      <canvas ref={canvasRef} style={{ width: '100%', height: '70px' }} />
    </div>
  )
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const signIn = async () => {
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) setError(err.message)
    setLoading(false)
  }

  return (
    <div className="app">
      <div className="auth-wrap">
        <div className="auth-wordmark">five<span>seven</span></div>
        <div className="auth-tagline">5 out of 7 days. That's 100%.</div>
        <div className="auth-label">Email</div>
        <input
          className="auth-input"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && signIn()}
          autoComplete="email"
        />
        <div className="auth-label">Password</div>
        <input
          className="auth-input"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && signIn()}
          autoComplete="current-password"
        />
        <button className="auth-btn" onClick={signIn} disabled={loading || !email || !password}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        {error && <div className="auth-error">{error}</div>}
      </div>
    </div>
  )
}

// ─── TODAY TAB ────────────────────────────────────────────────────────────────
function TodayTab({ habitLog, onToggle, streak }) {
  const checked = habitLog?.checked_habits || []
  const count = checked.length
  const now = new Date()

  return (
    <div>
      <div className="today-date">
        {WEEKDAYS_LONG[now.getDay()]}, {MONTHS_SHORT[now.getMonth()]} {now.getDate()}
      </div>

      {HABITS.map(h => {
        const done = checked.includes(h.id)
        return (
          <div
            key={h.id}
            className={`habit-row${done ? ' done' : ''}`}
            onClick={() => onToggle(h.id)}
          >
            <div className={`chk${done ? ' on' : ''}`}>
              <div className="chk-mark" />
            </div>
            <div>
              <div className="habit-name">{h.name}</div>
              <div className="habit-sub">{h.sub}</div>
            </div>
          </div>
        )
      })}

      <div className="prog-row">
        <div className="prog-track">
          <div className="prog-fill" style={{ width: `${(count / TOTAL) * 100}%` }} />
        </div>
        <div className="prog-lbl">{count} / {TOTAL}</div>
      </div>

      {count === TOTAL && (
        <div className="complete-bar">
          <div className="complete-text">Full day locked in</div>
          <div className="complete-sub">Streak counts. Keep going.</div>
        </div>
      )}
    </div>
  )
}

// ─── CALENDAR TAB ─────────────────────────────────────────────────────────────
function CalendarTab({ allLogs, streak }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const navigate = (dir) => {
    let m = month + dir, y = year
    if (m > 11) { m = 0; y++ }
    if (m < 0)  { m = 11; y-- }
    setMonth(m); setYear(y)
  }

  const today = todayStr()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  let fullDays = 0, partialDays = 0

  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const log = allLogs[key]
    const count = log?.checked_habits?.length || 0
    const isPast = key <= today
    let state = 'empty'
    if (isPast && count > 0) {
      if (count === TOTAL) { state = 'full'; fullDays++ }
      else { state = 'partial'; partialDays++ }
    }
    days.push({ d, key, state, isToday: key === today })
  }

  const completion = (fullDays + partialDays) > 0
    ? Math.round(fullDays / (fullDays + partialDays) * 100)
    : 0

  return (
    <div>
      <div className="cal-hdr">
        <button className="cal-nav-btn" onClick={() => navigate(-1)}>&#8592;</button>
        <div className="cal-month">{MONTHS[month]} {year}</div>
        <button className="cal-nav-btn" onClick={() => navigate(1)}>&#8594;</button>
      </div>

      <div className="cal-grid">
        {WEEKDAYS.map(d => <div key={d} className="cal-day-label">{d}</div>)}
        {days.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="cal-day" />
          let cls = 'cal-day'
          if (day.state === 'full')    cls += ' full'
          if (day.state === 'partial') cls += ' partial'
          if (day.state === 'empty' && day.key <= today) cls += ' past'
          if (day.isToday) cls += ' today-ring'
          return <div key={day.key} className={cls}>{day.d}</div>
        })}
      </div>

      <div className="cal-stats">
        <div className="cal-stat">
          <div className="cal-stat-num">{streak}</div>
          <div className="cal-stat-lbl">Streak</div>
        </div>
        <div className="cal-stat">
          <div className="cal-stat-num">{fullDays}</div>
          <div className="cal-stat-lbl">Full days</div>
        </div>
        <div className="cal-stat">
          <div className="cal-stat-num">{completion}%</div>
          <div className="cal-stat-lbl">Completion</div>
        </div>
      </div>
    </div>
  )
}

// ─── WEIGHT TAB ───────────────────────────────────────────────────────────────
function WeightTab({ weights, onLog }) {
  const [val, setVal] = useState('')
  const [saving, setSaving] = useState(false)
  const today = todayStr()

  const handleLog = async () => {
    const kg = parseFloat(val)
    if (isNaN(kg) || kg < 30 || kg > 300) return
    setSaving(true)
    await onLog(kg)
    setVal('')
    setSaving(false)
  }

  const sorted = [...weights].sort((a, b) => b.date > a.date ? 1 : -1)
  const sparkData = [...sorted].reverse().slice(-14).map(w => w.kg)

  return (
    <div>
      <div className="wt-section-lbl">Log weight</div>
      <div className="wt-input-row">
        <input
          className="wt-input"
          type="number"
          step="0.1"
          min="30"
          max="300"
          placeholder="78"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLog()}
        />
        <div className="wt-unit">kg</div>
        <button className="wt-log-btn" onClick={handleLog} disabled={saving || !val}>
          {saving ? '...' : 'Log'}
        </button>
      </div>

      {sparkData.length >= 2 && (
        <>
          <div className="wt-section-lbl">Last {sparkData.length} entries</div>
          <Sparkline data={sparkData} />
        </>
      )}

      <div className="wt-section-lbl">History</div>
      {sorted.length === 0 && <div className="empty">No entries yet</div>}
      {sorted.map((w, i) => {
        const isToday = w.date === today
        const parts = w.date.split('-')
        const dt = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]))
        const label = `${MONTHS_SHORT[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`
        const prev = sorted[i + 1]
        const delta = prev ? w.kg - prev.kg : null

        return (
          <div key={w.date} className={`wt-entry${isToday ? ' today-wt' : ''}`}>
            <div className="wt-entry-date">{isToday ? 'Today — ' : ''}{label}</div>
            <div className="wt-entry-val">
              {w.kg.toFixed(1)}
              <span className="wt-entry-unit">kg</span>
              {delta !== null && Math.abs(delta) >= 0.1 && (
                <span className={`wt-delta ${delta < 0 ? 'down' : 'up'}`}>
                  {delta < 0 ? '▼' : '▲'} {Math.abs(delta).toFixed(1)}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('today')
  const [habitLogs, setHabitLogs] = useState({})  // keyed by date string
  const [weights, setWeights] = useState([])
  const [streak, setStreak] = useState(0)

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load data when authed
  useEffect(() => {
    if (!session) return
    loadHabitLogs()
    loadWeights()
  }, [session])

  // Streak from logs
  useEffect(() => {
    const today = new Date()
    let s = 0
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      const log = habitLogs[key]
      const count = log?.checked_habits?.length || 0
      if (count === TOTAL) {
        s++
      } else {
        if (i === 0) continue // today being incomplete doesn't break streak
        break
      }
    }
    setStreak(s)
  }, [habitLogs])

  const loadHabitLogs = async () => {
    const { data, error } = await supabase
      .from('habit_logs')
      .select('date, checked_habits')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false })
      .limit(365)
    if (error) return
    const map = {}
    data.forEach(row => { map[row.date] = row })
    setHabitLogs(map)
  }

  const loadWeights = async () => {
    const { data, error } = await supabase
      .from('weight_logs')
      .select('date, kg')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false })
      .limit(100)
    if (!error) setWeights(data || [])
  }

  const toggleHabit = async (habitId) => {
    const key = todayStr()
    const existing = habitLogs[key]
    const checked = existing?.checked_habits ? [...existing.checked_habits] : []
    const idx = checked.indexOf(habitId)
    if (idx >= 0) checked.splice(idx, 1)
    else checked.push(habitId)

    // Optimistic update
    setHabitLogs(prev => ({ ...prev, [key]: { ...existing, checked_habits: checked } }))

    await supabase.from('habit_logs').upsert({
      user_id: session.user.id,
      date: key,
      checked_habits: checked,
    }, { onConflict: 'user_id,date' })
  }

  const logWeight = async (kg) => {
    const key = todayStr()
    const { error } = await supabase.from('weight_logs').upsert({
      user_id: session.user.id,
      date: key,
      kg,
    }, { onConflict: 'user_id,date' })
    if (!error) await loadWeights()
  }

  const signOut = () => supabase.auth.signOut()

  const now = new Date()

  if (loading) return null
  if (!session) return (
    <>
      <style>{CSS}</style>
      <AuthScreen />
    </>
  )

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="hdr">
          <div>
            <div className="wordmark">five<span>seven</span></div>
            <div className="hdr-date">{now.getFullYear()}</div>
          </div>
          <div className="streak-block">
            <div className="streak-num">{streak}</div>
            <div className="streak-lbl">day streak</div>
          </div>
        </div>

        {tab === 'today' && (
          <div className="tab-content">
            <TodayTab
              habitLog={habitLogs[todayStr()]}
              onToggle={toggleHabit}
              streak={streak}
            />
          </div>
        )}

        {tab === 'cal' && (
          <div className="tab-content">
            <CalendarTab allLogs={habitLogs} streak={streak} />
          </div>
        )}

        {tab === 'wt' && (
          <div className="tab-content">
            <WeightTab weights={weights} onLog={logWeight} />
            <button className="sign-out-btn" onClick={signOut}>Sign out</button>
          </div>
        )}

        <div className="nav">
          <button className={`nav-btn${tab === 'today' ? ' active' : ''}`} onClick={() => setTab('today')}>
            <div className="nav-icon">✓</div>
            <div>Today</div>
          </button>
          <button className={`nav-btn${tab === 'cal' ? ' active' : ''}`} onClick={() => setTab('cal')}>
            <div className="nav-icon">◻</div>
            <div>Calendar</div>
          </button>
          <button className={`nav-btn${tab === 'wt' ? ' active' : ''}`} onClick={() => setTab('wt')}>
            <div className="nav-icon">△</div>
            <div>Weight</div>
          </button>
        </div>
      </div>
    </>
  )
}
