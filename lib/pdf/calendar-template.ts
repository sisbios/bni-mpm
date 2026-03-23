import { format, getDaysInMonth, getDay, startOfMonth } from 'date-fns'

export interface CalendarEvent {
  date: Date
  title: string
  subtitle?: string
  tags: string[]
  colors: string[]
  eventType: string
}

const COLORS = {
  bg: '#0A0F1E',
  surface: '#111827',
  header: '#0D1525',
  red: '#CC0000',
  redDark: '#990000',
  gold: '#C9A84C',
  goldLight: '#E8C87A',
  border: '#1F2937',
  muted: '#9CA3AF',
  white: '#FFFFFF',
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  'Weekly Chapter Meeting': '#CC0000',
  'Internal 1-to-1 Conclave': '#C9A84C',
  'Visitors Day Conclave': '#22C55E',
  'Business Training': '#3B82F6',
  'Evening Gathering': '#A855F7',
  'Domestic Trip': '#14B8A6',
  'Inter-Chapter Conclave': '#F97316',
  'Regional 1-to-1 Conclave': '#EC4899',
  'International Trip': '#10B981',
  'Regional Event': '#6B7280',
}

function getTagColor(tag: string): string {
  for (const [key, color] of Object.entries(EVENT_TYPE_COLORS)) {
    if (tag.toUpperCase().includes(key.toUpperCase()) || key.toUpperCase().includes(tag.toUpperCase())) {
      return color
    }
  }
  return '#6B7280'
}

function coverPage(): string {
  return `
  <div class="page cover-page">
    <div class="left-bars">
      <div class="red-bar"></div>
      <div class="gold-bar"></div>
    </div>
    <div class="deco-circle top-right"></div>

    <div class="cover-content">
      <div class="cover-top">
        <div class="bni-badge-row">
          <div class="bni-badge"><span>BNI</span></div>
          <div>
            <div class="region-text">MALAPPURAM REGION</div>
            <div class="chapter-text">OSCAR CHAPTER</div>
          </div>
        </div>
        <div class="gold-rule"></div>
      </div>

      <div class="cover-title">
        <div class="title-line white">CHAPTER</div>
        <div class="title-line red">EVENT</div>
        <div class="title-line white">CALENDAR</div>
      </div>

      <div class="date-pill">APRIL 2026 — SEPTEMBER 2026</div>

      <div class="tagline">Givers Gain · Build · Connect · Grow</div>

      <div class="dark-rule"></div>

      <div class="legend-section">
        <div class="legend-title">EVENT COLOUR GUIDE</div>
        <div class="legend-grid">
          ${Object.entries(EVENT_TYPE_COLORS).map(([label, color]) => `
            <div class="legend-item">
              <div class="legend-dot" style="background:${color}"></div>
              <span class="legend-label">${label}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="stats-bar">
        <div class="stat-item"><span class="stat-num">24</span><span class="stat-label">Weekly Meetings</span></div>
        <div class="stat-item"><span class="stat-num">6</span><span class="stat-label">Visitors Conclaves</span></div>
        <div class="stat-item"><span class="stat-num">6</span><span class="stat-label">Domestic Trips</span></div>
        <div class="stat-item"><span class="stat-num">1</span><span class="stat-label">International Trip</span></div>
        <div class="stat-item"><span class="stat-num">6</span><span class="stat-label">1-to-1 Conclaves</span></div>
      </div>

      <div class="cover-footer">Prepared by Lead Lumer Innovation Lab · BNI Oscar Chapter, Malappuram</div>
    </div>
  </div>`
}

function monthPage(year: number, month: number, events: CalendarEvent[]): string {
  const monthDate = new Date(year, month - 1, 1)
  const monthName = format(monthDate, 'MMMM').toUpperCase()
  const daysInMonth = getDaysInMonth(monthDate)
  const firstDayOfWeek = getDay(startOfMonth(monthDate)) // 0=Sun

  // Build calendar cells
  const cells: Array<{ day: number | null; events: CalendarEvent[] }> = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push({ day: null, events: [] })
  for (let d = 1; d <= daysInMonth; d++) {
    const dayEvents = events.filter(e => {
      const ed = new Date(e.date)
      return ed.getMonth() + 1 === month && ed.getDate() === d
    })
    cells.push({ day: d, events: dayEvents })
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, events: [] })

  const weeks: typeof cells[] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  const monthEvents = events.filter(e => {
    const ed = new Date(e.date)
    return ed.getMonth() + 1 === month
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return `
  <div class="page month-page">
    <div class="left-bars">
      <div class="red-bar"></div>
      <div class="gold-bar"></div>
    </div>

    <div class="month-header">
      <div class="month-header-left">
        <div class="bni-badge-sm"><span>BNI</span></div>
        <div>
          <div class="chapter-label">OSCAR CHAPTER · MALAPPURAM</div>
          <div class="region-label">Regional Event Calendar 2026</div>
        </div>
      </div>
      <div class="month-header-right">
        <div class="month-name">${monthName}</div>
        <div class="year-badge">2026</div>
      </div>
    </div>
    <div class="red-rule"></div>

    <div class="calendar-grid">
      <div class="day-headers">
        ${dayNames.map((d, i) => `<div class="day-header${i === 0 ? ' sunday' : ''}">${d}</div>`).join('')}
      </div>
      ${weeks.map(week => `
        <div class="week-row">
          ${week.map((cell, i) => {
            const isSunday = i === 0
            const isTuesday = i === 2
            const hasEvents = cell.events.length > 0
            let cellBg = 'transparent'
            if (!cell.day) cellBg = '#090D18'
            else if (isSunday) cellBg = '#150A0A'
            else if (isTuesday) cellBg = '#0A1A0A'

            const allColors = cell.events.flatMap(e => e.colors).slice(0, 4)

            return `
              <div class="calendar-cell${!cell.day ? ' empty' : ''}" style="background:${cellBg}">
                ${cell.day ? `
                  <div class="cell-day${hasEvents ? ' has-events' : ''}">
                    ${hasEvents ? `<div class="day-circle">${cell.day}</div>` : cell.day}
                  </div>
                  ${allColors.length > 0 ? `
                    <div class="event-dots">
                      ${allColors.map(c => `<div class="event-dot" style="background:${c}"></div>`).join('')}
                    </div>` : ''}
                ` : ''}
              </div>`
          }).join('')}
        </div>`).join('')}
    </div>

    <div class="events-section-label">
      <div class="section-label-left">
        <div class="red-block"></div>
        <span class="events-title">EVENTS THIS MONTH</span>
      </div>
      <div class="events-count">${monthEvents.length} scheduled events</div>
    </div>
    <div class="dark-rule-thin"></div>

    <div class="events-list">
      ${monthEvents.map(event => {
        const d = new Date(event.date)
        const dayNum = d.getDate()
        const dayAbbr = ['SUN','MON','TUE','WED','THU','FRI','SAT'][d.getDay()]
        const primaryColor = event.colors[0] || '#CC0000'
        return `
          <div class="event-row">
            <div class="event-color-bar" style="background:${primaryColor}"></div>
            <div class="event-date-block">
              <div class="event-day-num">${dayNum}</div>
              <div class="event-day-abbr">${dayAbbr}</div>
            </div>
            <div class="event-divider"></div>
            <div class="event-content">
              <div class="event-tags">
                ${event.tags.map((tag, idx) => {
                  const color = event.colors[idx] || '#6B7280'
                  return `<span class="event-tag" style="background:${color}22;color:${color};border:1px solid ${color}44">${tag}</span>`
                }).join('')}
              </div>
              <div class="event-title">${event.title}</div>
              ${event.subtitle ? `<div class="event-subtitle">${event.subtitle}</div>` : ''}
            </div>
          </div>`
      }).join('')}
    </div>

    <div class="page-footer">
      <div class="bni-badge-sm"><span>BNI</span></div>
      <span class="footer-text">BNI Oscar Chapter · Malappuram · Regional Event Calendar 2026</span>
    </div>
  </div>`
}

function quotePage(): string {
  return `
  <div class="page quote-page">
    <div class="left-bars">
      <div class="red-bar"></div>
      <div class="gold-bar"></div>
    </div>
    <div class="deco-circle top-right"></div>
    <div class="deco-circle bottom-left" style="background:radial-gradient(circle, #0D1525 0%, transparent 70%)"></div>

    <div class="quote-content">
      <div class="big-quote">"</div>

      <div class="bni-badge-row" style="justify-content:center; margin-bottom:8px">
        <div class="bni-badge"><span>BNI</span></div>
        <div class="chapter-text" style="margin-left:12px">OSCAR CHAPTER</div>
      </div>
      <div class="gold-rule"></div>

      <div class="primary-quote">
        "The richest people in the world<br>
        look for and build networks.<br>
        Everyone else looks for work."
      </div>
      <div class="quote-attr">— Robert Kiyosaki</div>

      <div class="dark-rule"></div>

      <div class="secondary-quote">
        "It is not about what you know.<br>
        It is about who you know —<br>
        and who knows you."
      </div>
      <div class="secondary-attr">— Ivan Misner, Founder, BNI</div>

      <div class="closing-block">
        <div class="closing-line1">2026 IS YOUR YEAR TO GROW.</div>
        <div class="closing-line2">Show up. Connect. Give. Gain.</div>
        <div class="closing-line3">BNI Oscar Chapter · Malappuram · April – September 2026</div>
      </div>

      <div class="quote-footer">
        <div class="footer-brand">Prepared by Lead Lumer Innovation Lab</div>
        <div class="footer-sub">leadlumer.com · Tirur, Kerala</div>
      </div>
    </div>
  </div>`
}

function getStyles(): string {
  return `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@400;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body { background: #0A0F1E; color: #fff; font-family: 'Montserrat', sans-serif; }

    @page { size: A4; margin: 0; }

    .page {
      width: 210mm;
      height: 297mm;
      background: #0A0F1E;
      position: relative;
      overflow: hidden;
      page-break-after: always;
      display: flex;
      flex-direction: column;
    }

    .left-bars {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      display: flex;
      z-index: 10;
    }
    .red-bar { width: 8px; background: #CC0000; height: 100%; }
    .gold-bar { width: 3px; background: #C9A84C; height: 100%; }

    .deco-circle.top-right {
      position: absolute;
      top: -80px;
      right: -80px;
      width: 250px;
      height: 250px;
      border-radius: 50%;
      background: radial-gradient(circle, #1C0000 0%, transparent 70%);
      opacity: 0.6;
    }

    /* ── Cover Page ──────────────────────────────── */
    .cover-content {
      margin-left: 22px;
      padding: 30px 18px 20px 18px;
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .bni-badge-row { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
    .bni-badge {
      background: #CC0000;
      padding: 4px 10px;
      border-radius: 3px;
    }
    .bni-badge span { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 14px; color: #fff; }
    .region-text { color: #C9A84C; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
    .chapter-text { color: #fff; font-size: 13px; font-weight: 700; letter-spacing: 1px; }

    .gold-rule { height: 1px; background: #C9A84C; margin: 12px 0; opacity: 0.6; }
    .dark-rule { height: 1px; background: #1F2937; margin: 14px 0; }
    .dark-rule-thin { height: 0.5px; background: #1F2937; margin: 6px 0; }

    .cover-title { text-align: center; line-height: 1; margin: 16px 0; }
    .title-line { font-family: 'Bebas Neue', sans-serif; font-size: 72px; letter-spacing: 4px; }
    .title-line.white { color: #fff; }
    .title-line.red { color: #CC0000; }

    .date-pill {
      display: inline-block;
      background: #1C2640;
      color: #C9A84C;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      padding: 6px 18px;
      border-radius: 20px;
      text-align: center;
      align-self: center;
      margin: 8px 0;
    }

    .tagline { text-align: center; color: #9CA3AF; font-size: 10px; margin: 8px 0; letter-spacing: 1px; }

    .legend-section { margin: 4px 0 10px; }
    .legend-title { color: #C9A84C; font-size: 8px; font-weight: 700; letter-spacing: 2px; margin-bottom: 8px; text-transform: uppercase; }
    .legend-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; }
    .legend-item { display: flex; align-items: center; gap: 6px; }
    .legend-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
    .legend-label { color: #9CA3AF; font-size: 7.5px; }

    .stats-bar {
      background: #111827;
      border-radius: 8px;
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 10px 0 8px;
    }
    .stat-item { text-align: center; }
    .stat-num { display: block; font-family: 'Bebas Neue', sans-serif; font-size: 22px; color: #FF3333; }
    .stat-label { display: block; font-size: 6.5px; color: #9CA3AF; letter-spacing: 0.5px; margin-top: 2px; }

    .cover-footer { color: #6B7280; font-size: 7px; text-align: center; margin-top: auto; }

    /* ── Month Page ──────────────────────────────── */
    .month-header {
      margin-left: 11px;
      background: #0D1525;
      padding: 10px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .month-header-left { display: flex; align-items: center; gap: 10px; }
    .bni-badge-sm {
      background: #CC0000;
      padding: 2px 7px;
      border-radius: 3px;
      flex-shrink: 0;
    }
    .bni-badge-sm span { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 10px; color: #fff; }
    .chapter-label { color: #C9A84C; font-size: 8px; font-weight: 700; letter-spacing: 1.5px; }
    .region-label { color: #9CA3AF; font-size: 7px; }
    .month-header-right { text-align: right; }
    .month-name { font-family: 'Bebas Neue', sans-serif; font-size: 38px; color: #fff; line-height: 1; letter-spacing: 2px; }
    .year-badge {
      display: inline-block;
      background: #CC0000;
      color: #fff;
      font-size: 7px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 10px;
    }
    .red-rule { height: 1px; background: #CC0000; margin-left: 11px; }

    /* Calendar Grid */
    .calendar-grid { margin-left: 11px; flex: none; }
    .day-headers { display: grid; grid-template-columns: repeat(7, 1fr); background: #CC0000; }
    .day-header {
      text-align: center;
      font-size: 7px;
      font-weight: 700;
      color: #fff;
      padding: 5px 2px;
      letter-spacing: 0.5px;
    }
    .day-header.sunday { color: #E8C87A; }
    .week-row { display: grid; grid-template-columns: repeat(7, 1fr); border-bottom: 0.4px solid #1F2937; }
    .calendar-cell {
      border-right: 0.4px solid #1F2937;
      min-height: 36px;
      padding: 3px 4px;
      position: relative;
    }
    .calendar-cell.empty { background: #090D18; }
    .cell-day { font-size: 7px; color: #fff; font-family: 'Montserrat', sans-serif; }
    .cell-day.has-events { display: inline-block; }
    .day-circle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      background: #CC0000;
      border-radius: 50%;
      font-size: 7px;
      font-weight: 700;
      color: #fff;
    }
    .event-dots { display: flex; flex-wrap: wrap; gap: 2px; margin-top: 2px; }
    .event-dot { width: 5px; height: 5px; border-radius: 50%; }

    /* Events list */
    .events-section-label {
      margin-left: 11px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 18px 4px;
    }
    .section-label-left { display: flex; align-items: center; gap: 6px; }
    .red-block { width: 3px; height: 14px; background: #CC0000; border-radius: 1px; }
    .events-title { color: #C9A84C; font-size: 7.5px; font-weight: 700; letter-spacing: 1.5px; }
    .events-count { color: #6B7280; font-size: 7px; }

    .events-list { margin-left: 11px; padding: 0 6px; flex: 1; overflow: hidden; }
    .event-row {
      display: flex;
      align-items: stretch;
      background: #131B2E;
      border-radius: 4px;
      margin-bottom: 2px;
      overflow: hidden;
      min-height: 28px;
    }
    .event-color-bar { width: 3px; flex-shrink: 0; }
    .event-date-block {
      width: 28px;
      text-align: center;
      padding: 4px 2px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .event-day-num { font-size: 12px; font-weight: 700; color: #fff; line-height: 1; }
    .event-day-abbr { font-size: 6px; color: #9CA3AF; }
    .event-divider { width: 0.3px; background: #1F2937; align-self: stretch; flex-shrink: 0; }
    .event-content { padding: 4px 8px; flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 2px; }
    .event-tags { display: flex; flex-wrap: wrap; gap: 2px; }
    .event-tag {
      font-size: 5px;
      font-weight: 700;
      padding: 1px 4px;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .event-title { font-size: 7.5px; font-weight: 700; color: #fff; }
    .event-subtitle { font-size: 6.5px; color: #9CA3AF; }

    /* Page footer */
    .page-footer {
      margin-left: 11px;
      background: #0D1525;
      padding: 5px 18px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-top: 0.5px solid #1F2937;
    }
    .footer-text { color: #6B7280; font-size: 6.5px; }

    /* ── Quote Page ──────────────────────────────── */
    .quote-page { justify-content: center; }
    .quote-content { margin-left: 22px; padding: 40px 30px; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .big-quote {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 180px;
      color: #1A0808;
      line-height: 0.8;
      align-self: flex-start;
      margin-bottom: -20px;
      position: relative;
      z-index: 1;
    }
    .primary-quote {
      font-family: 'Montserrat', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: #fff;
      text-align: center;
      line-height: 1.5;
      margin: 16px 0 8px;
    }
    .quote-attr {
      font-family: 'Playfair Display', serif;
      font-style: italic;
      font-size: 13px;
      color: #C9A84C;
      margin-bottom: 16px;
    }
    .secondary-quote {
      font-family: 'Montserrat', sans-serif;
      font-size: 12px;
      color: #9CA3AF;
      text-align: center;
      line-height: 1.7;
      margin: 8px 0 6px;
    }
    .secondary-attr { font-size: 10px; font-weight: 700; color: #C9A84C; margin-bottom: 20px; }
    .closing-block {
      background: #111827;
      border-radius: 10px;
      padding: 16px 28px;
      text-align: center;
      margin: 16px 0 20px;
      width: 100%;
    }
    .closing-line1 { color: #CC0000; font-weight: 700; font-size: 11px; margin-bottom: 6px; letter-spacing: 1px; }
    .closing-line2 { color: #fff; font-weight: 700; font-size: 16px; margin-bottom: 6px; }
    .closing-line3 { color: #9CA3AF; font-size: 8px; }
    .footer-brand { color: #C9A84C; font-size: 8px; font-weight: 700; text-align: center; }
    .footer-sub { color: #9CA3AF; font-size: 7px; text-align: center; }
    .deco-circle.bottom-left {
      position: absolute;
      bottom: -80px;
      left: -40px;
      width: 200px;
      height: 200px;
      border-radius: 50%;
      background: radial-gradient(circle, #0D1525 0%, transparent 70%);
      opacity: 0.5;
    }
  </style>`
}

export function buildCalendarHTML(eventsByMonth: Map<number, CalendarEvent[]>): string {
  const pages: string[] = [coverPage()]

  for (let m = 4; m <= 9; m++) {
    const monthEvents = eventsByMonth.get(m) || []
    pages.push(monthPage(2026, m, monthEvents))
  }

  pages.push(quotePage())

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BNI Oscar Chapter Calendar 2026</title>
${getStyles()}
</head>
<body>
${pages.join('\n')}
</body>
</html>`
}
