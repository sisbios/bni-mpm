// Traffic light score calculation (rolling 6-month / 26-week window)
// Scoring based on BNI India criteria:
//   Referrals   20pts  (1→5, 6→10, 10→15, 14→20)
//   Visitors    20pts  (1→5, 5→10, 11→15, 17→20)
//   TYFCB       15pts  (₹4,97,540→5, ₹9,97,540→10, ₹19,97,540→15)
//   Training    15pts  (1→5, 2→10, 3→15)
//   Testimonials 10pts (1→5, 2→10)
//   Absence     15pts  (starts 15, -5 per absent meeting, min 0)
//   Late         5pts  (5 if zero late arrivals, else 0)
// Total max: 100 pts

export type TrafficColor = 'green' | 'yellow' | 'red' | 'black'

export type ScoreBreakdown = {
  referrals: number     // 0–20
  visitors: number      // 0–20
  tyfcb: number         // 0–15
  training: number      // 0–15
  testimonials: number  // 0–10
  absence: number       // 0–15
  late: number          // 0–5
  total: number         // 0–100
  color: TrafficColor
  label: string
  // raw totals
  rawReferrals: number
  rawVisitors: number
  rawTyfcb: number
  rawTraining: number
  rawTestimonials: number
  rawAbsent: number
  rawLate: number
  totalWeeksTracked: number
  // what's needed to improve
  tips: string[]
}

export type PalmsRow = {
  attended: boolean
  substitute: boolean
  late: boolean
  medical: boolean    // medical absence — exempt from absence penalty
  referrals: number
  visitors: number
  testimonials: number
  oneToOnes: number   // kept for display; not scored in v2
  ceus: number        // training sessions
  tyfcbAmount: number
}

const WEEKS = 26 // 6-month rolling window

/** Step-tier lookup: [[threshold, points], ...] sorted descending */
function tiered(value: number, tiers: [number, number][]): number {
  for (const [threshold, points] of tiers) {
    if (value >= threshold) return points
  }
  return 0
}

export function computeTrafficScore(entries: PalmsRow[]): ScoreBreakdown {
  const rows = entries.slice(0, WEEKS)
  const tracked = rows.length

  // Totals over the window
  const rawReferrals    = rows.reduce((s, r) => s + r.referrals, 0)
  const rawVisitors     = rows.reduce((s, r) => s + r.visitors, 0)
  const rawTestimonials = rows.reduce((s, r) => s + (r.testimonials ?? 0), 0)
  const rawTraining     = rows.reduce((s, r) => s + r.ceus, 0)
  const rawTyfcb        = rows.reduce((s, r) => s + r.tyfcbAmount, 0)
  // Absent = did not attend AND not substitute AND not medical
  const rawAbsent       = rows.filter((r) => !r.attended && !r.substitute && !r.medical).length
  // Late = attended but marked late
  const rawLate         = rows.filter((r) => r.attended && r.late).length

  // ── Score components ──────────────────────────────────────────────

  // Referrals (max 20)
  const referrals = tiered(rawReferrals, [[14, 20], [10, 15], [6, 10], [1, 5]])

  // Visitors (max 20)
  const visitors = tiered(rawVisitors, [[17, 20], [11, 15], [5, 10], [1, 5]])

  // TYFCB (max 15)
  const tyfcb = tiered(rawTyfcb, [[1997540, 15], [997540, 10], [497540, 5]])

  // Training / CEUs (max 15)
  const training = tiered(rawTraining, [[3, 15], [2, 10], [1, 5]])

  // Testimonials (max 10)
  const testimonials = tiered(rawTestimonials, [[2, 10], [1, 5]])

  // Absence (max 15, -5 per absent meeting)
  const absence = Math.max(0, 15 - rawAbsent * 5)

  // Late (5 if zero lates, else 0)
  const late = rawLate === 0 ? 5 : 0

  const total = Math.round(referrals + visitors + tyfcb + training + testimonials + absence + late)

  const color: TrafficColor =
    total >= 70 ? 'green' : total >= 50 ? 'yellow' : total >= 30 ? 'red' : 'black'

  const labels: Record<TrafficColor, string> = {
    green:  'Green — High Performer',
    yellow: 'Yellow — Needs Improvement',
    red:    'Red — At Risk',
    black:  'Black — Critical',
  }

  // ── Tips ─────────────────────────────────────────────────────────
  const tips: string[] = []
  if (referrals < 20)     tips.push(`Referrals: ${rawReferrals} total. Need 14 for full 20 pts (6→10, 10→15, 14→20).`)
  if (visitors < 20)      tips.push(`Visitors: ${rawVisitors} total. Need 17 for full 20 pts (5→10, 11→15, 17→20).`)
  if (tyfcb < 15)         tips.push(`TYFCB: ₹${rawTyfcb.toLocaleString('en-IN')}. Need ₹19,97,540 for full 15 pts.`)
  if (training < 15)      tips.push(`Training: ${rawTraining} session(s). Need 3 for full 15 pts.`)
  if (testimonials < 10)  tips.push(`Testimonials: ${rawTestimonials} given. Need 2 for full 10 pts.`)
  if (rawAbsent > 0)      tips.push(`Absence: ${rawAbsent} missed meeting(s) → -${rawAbsent * 5} pts (15 pts max if perfect attendance).`)
  if (rawLate > 0)        tips.push(`Late arrivals: ${rawLate} — zero late arrivals needed for the full 5 pts.`)
  if (tracked < 6)        tips.push(`Only ${tracked} weeks of data recorded. Log PALMS weekly for accurate score.`)

  return {
    referrals,
    visitors,
    tyfcb,
    training,
    testimonials,
    absence,
    late,
    total,
    color,
    label: labels[color],
    rawReferrals,
    rawVisitors,
    rawTyfcb,
    rawTestimonials,
    rawTraining,
    rawAbsent,
    rawLate,
    totalWeeksTracked: tracked,
    tips,
  }
}

export const TRAFFIC_COLORS: Record<TrafficColor, string> = {
  green:  '#10B981',
  yellow: '#F59E0B',
  red:    '#CC0000',
  black:  '#6B7280',
}
