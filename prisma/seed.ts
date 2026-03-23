import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

const EVENTS = [
  // ── APRIL 2026 ────────────────────────────────────────────────────────────────
  {
    date: new Date('2026-04-07'),
    title: 'Weekly Meeting + Internal 1-to-1 Conclave',
    subtitle: 'Intra-chapter network building · 1st week kickoff',
    tags: ['CHAPTER', 'INTERNAL 1-TO-1'],
    colors: ['#CC0000', '#C9A84C'],
    eventType: 'chapter',
  },
  {
    date: new Date('2026-04-07'),
    title: 'Go Green — Regional Event',
    subtitle: 'BNI Malappuram Regional Initiative',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-04-11'),
    title: 'LTRT — Leadership Team Role Training',
    subtitle: 'Regional Leadership Training',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-04-14'),
    title: 'Weekly Meeting + Business Training',
    subtitle: 'Post-meeting skill session · Evening: Business Discussions at Cafe',
    tags: ['CHAPTER', 'TRAINING', 'EVENING'],
    colors: ['#CC0000', '#3B82F6', '#A855F7'],
    eventType: 'chapter',
  },
  {
    date: new Date('2026-04-18'),
    title: 'Member Success Program · Regional MSP Session',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-04-21'),
    title: 'Weekly Meeting + Visitors Day Conclave',
    subtitle: '3rd week monthly visitors showcase · Evening: Cricket at Turf',
    tags: ['CHAPTER', 'VISITORS DAY', 'EVENING'],
    colors: ['#CC0000', '#22C55E', '#A855F7'],
    eventType: 'chapter',
  },
  {
    date: new Date('2026-04-25'),
    title: 'Presentation Skill Workshop · Regional Skills Workshop',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-04-28'),
    title: 'Weekly Meeting + Monthly Domestic Trip',
    subtitle: 'Last week chapter outing · Supporting member businesses',
    tags: ['CHAPTER', 'DOMESTIC TRIP'],
    colors: ['#CC0000', '#14B8A6'],
    eventType: 'chapter',
  },
  {
    date: new Date('2026-04-28'),
    title: 'Meet n Greet — Regional · BNI Malappuram Networking',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },

  // ── MAY 2026 ──────────────────────────────────────────────────────────────────
  {
    date: new Date('2026-05-05'),
    title: 'Weekly Meeting + Internal 1-to-1 Conclave',
    subtitle: 'Deepen intra-chapter relationships · 1st week',
    tags: ['CHAPTER', 'INTERNAL 1-TO-1'],
    colors: ['#CC0000', '#C9A84C'],
    eventType: 'chapter',
  },
  {
    date: new Date('2026-05-05'),
    title: 'LTRT — Leadership Team Role Training',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-05-12'),
    title: 'Weekly Meeting + Business Training',
    subtitle: 'Skills development · Evening: Business Discussions at Cafe',
    tags: ['CHAPTER', 'TRAINING', 'EVENING'],
    colors: ['#CC0000', '#3B82F6', '#A855F7'],
    eventType: 'chapter',
  },
  {
    date: new Date('2026-05-16'),
    title: 'BNI India National Conference — Day 1',
    subtitle: 'National level summit · All senior members encouraged',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-05-17'),
    title: 'BNI India National Conference — Day 2',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-05-19'),
    title: 'Weekly Meeting + Visitors Day Conclave',
    subtitle: 'Monthly visitors showcase · Evening: Cricket at Turf',
    tags: ['CHAPTER', 'VISITORS DAY', 'EVENING'],
    colors: ['#CC0000', '#22C55E', '#A855F7'],
    eventType: 'chapter',
  },
  {
    date: new Date('2026-05-26'),
    title: 'Weekly Meeting + Monthly Domestic Trip',
    subtitle: 'Chapter outing to boost member businesses',
    tags: ['CHAPTER', 'DOMESTIC TRIP'],
    colors: ['#CC0000', '#14B8A6'],
    eventType: 'chapter',
  },
  {
    date: new Date('2026-05-30'),
    title: 'DnA Retreat — Day 1',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-05-31'),
    title: 'DnA Retreat — Day 2',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },

  // ── JUNE 2026 ─────────────────────────────────────────────────────────────────
  {
    date: new Date('2026-06-02'),
    title: 'Weekly Meeting + Internal 1-to-1 Conclave',
    subtitle: 'Chapter bonding & network strengthening · 1st week',
    tags: ['CHAPTER', 'INTERNAL 1-TO-1'],
    colors: ['#CC0000', '#C9A84C'],
    eventType: 'chapter',
  },
  {
    date: new Date('2026-06-06'),
    title: 'LTRT — Leadership Team Role Training',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-06-09'),
    title: 'Weekly Meeting + Business Training',
    subtitle: '2nd week training module · Evening: Business Discussions at Cafe',
    tags: ['CHAPTER', 'TRAINING', 'EVENING'],
    colors: ['#CC0000', '#3B82F6', '#A855F7'],
    eventType: 'chapter',
  },
  {
    date: new Date('2026-06-13'),
    title: 'Member Success Program',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-06-16'),
    title: 'Weekly Meeting + Visitors Day Conclave',
    subtitle: 'Invite guests & prospects · Evening: Cricket at Turf',
    tags: ['CHAPTER', 'VISITORS DAY', 'EVENING'],
    colors: ['#CC0000', '#22C55E', '#A855F7'],
    eventType: 'chapter',
  },
  {
    date: new Date('2026-06-20'),
    title: 'Feature Presentation Workshop',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-06-27'),
    title: 'Weekly Presentation Workshop V2.0',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-06-28'),
    title: 'Badminton Tournament',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-06-30'),
    title: 'Weekly Meeting + Monthly Domestic Trip',
    subtitle: 'Last week outing · Business support focused',
    tags: ['CHAPTER', 'DOMESTIC TRIP'],
    colors: ['#CC0000', '#14B8A6'],
    eventType: 'chapter',
  },
  {
    date: new Date('2026-06-30'),
    title: 'Meet and Greet',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },

  // ── JULY 2026 ─────────────────────────────────────────────────────────────────
  {
    date: new Date('2026-07-04'),
    title: 'LTRT — Leadership Team Role Training',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-07-07'),
    title: 'Weekly Meeting + Internal 1-to-1 Conclave',
    subtitle: 'Strengthen intra-chapter bonds · 1st week',
    tags: ['CHAPTER', 'INTERNAL 1-TO-1'],
    colors: ['#CC0000', '#C9A84C'],
    eventType: 'chapter',
  },
  {
    date: new Date('2026-07-07'),
    title: 'Go Green — Regional Event',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-07-11'),
    title: 'Member Success Program',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-07-14'),
    title: 'Weekly Meeting + Inter-Chapter 1-to-1 Conclave + Training',
    subtitle: 'Cross-chapter networking · Business skills · Evening: Cafe',
    tags: ['CHAPTER', 'INTER-CHAPTER', 'TRAINING', 'EVENING'],
    colors: ['#CC0000', '#F97316', '#3B82F6', '#A855F7'],
    eventType: 'chapter',
  },
  {
    date: new Date('2026-07-18'),
    title: 'Art of Networking',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-07-21'),
    title: 'Weekly Meeting + Visitors Day Conclave',
    subtitle: 'Monthly visitors showcase · Evening: Cricket at Turf',
    tags: ['CHAPTER', 'VISITORS DAY', 'EVENING'],
    colors: ['#CC0000', '#22C55E', '#A855F7'],
    eventType: 'chapter',
  },
  {
    date: new Date('2026-07-25'),
    title: 'Regional 121 Conclave',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-07-28'),
    title: 'Weekly Meeting + Monthly Domestic Trip',
    subtitle: 'Chapter outing · Member business support focus',
    tags: ['CHAPTER', 'DOMESTIC TRIP'],
    colors: ['#CC0000', '#14B8A6'],
    eventType: 'chapter',
  },
  {
    date: new Date('2026-07-28'),
    title: 'Meet and Greet',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },

  // ── AUGUST 2026 ───────────────────────────────────────────────────────────────
  {
    date: new Date('2026-08-04'),
    title: 'Weekly Meeting + Internal 1-to-1 Conclave',
    subtitle: '1st week chapter bonding conclave',
    tags: ['CHAPTER', 'INTERNAL 1-TO-1'],
    colors: ['#CC0000', '#C9A84C'],
    eventType: 'chapter',
  },
  {
    date: new Date('2026-08-04'),
    title: 'BNI Connect',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-08-08'),
    title: 'LTRT — Leadership Team Role Training',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-08-11'),
    title: 'Weekly Meeting + Business Training',
    subtitle: '2nd week training module · Evening: Business Discussions at Cafe',
    tags: ['CHAPTER', 'TRAINING', 'EVENING'],
    colors: ['#CC0000', '#3B82F6', '#A855F7'],
    eventType: 'chapter',
  },
  {
    date: new Date('2026-08-15'),
    title: 'Member Success Program',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-08-18'),
    title: 'Weekly Meeting + Visitors Day Conclave',
    subtitle: 'Monthly visitors showcase · Evening: Cricket at Turf',
    tags: ['CHAPTER', 'VISITORS DAY', 'EVENING'],
    colors: ['#CC0000', '#22C55E', '#A855F7'],
    eventType: 'chapter',
  },
  {
    date: new Date('2026-08-18'),
    title: 'Meet and Greet',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-08-22'),
    title: 'Oscar Chapter International Trip — Day 1',
    subtitle: 'Annual international excursion · Aug 22-23 Weekend · Destination TBD',
    tags: ['INTERNATIONAL TRIP'],
    colors: ['#10B981'],
    eventType: 'international',
  },
  {
    date: new Date('2026-08-22'),
    title: 'LT Role Training HT MC',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-08-23'),
    title: 'Oscar Chapter International Trip — Day 2',
    subtitle: 'Business networking & bonding · International experience',
    tags: ['INTERNATIONAL TRIP'],
    colors: ['#10B981'],
    eventType: 'international',
  },
  {
    date: new Date('2026-08-25'),
    title: 'Weekly Meeting + Monthly Domestic Trip',
    subtitle: 'Member business boosting',
    tags: ['CHAPTER', 'DOMESTIC TRIP'],
    colors: ['#CC0000', '#14B8A6'],
    eventType: 'chapter',
  },
  {
    date: new Date('2026-08-29'),
    title: 'Referral Skill Workshop',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },

  // ── SEPTEMBER 2026 ────────────────────────────────────────────────────────────
  {
    date: new Date('2026-09-01'),
    title: 'Weekly Meeting + Internal 1-to-1 Conclave',
    subtitle: '1st week intra-chapter network building',
    tags: ['CHAPTER', 'INTERNAL 1-TO-1'],
    colors: ['#CC0000', '#C9A84C'],
    eventType: 'chapter',
  },
  {
    date: new Date('2026-09-05'),
    title: 'LTRT — Leadership Team Role Training',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-09-08'),
    title: 'Weekly Meeting + Regional 1-to-1 Conclave + Training',
    subtitle: 'Cross-region networking · Post-meeting training · Evening: Cafe',
    tags: ['CHAPTER', 'REGIONAL 1-TO-1', 'TRAINING', 'EVENING'],
    colors: ['#CC0000', '#EC4899', '#3B82F6', '#A855F7'],
    eventType: 'chapter',
  },
  {
    date: new Date('2026-09-12'),
    title: 'Member Success Program',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-09-15'),
    title: 'Weekly Meeting + Visitors Day Conclave',
    subtitle: 'Monthly visitors showcase · Evening: Cricket at Turf',
    tags: ['CHAPTER', 'VISITORS DAY', 'EVENING'],
    colors: ['#CC0000', '#22C55E', '#A855F7'],
    eventType: 'chapter',
  },
  {
    date: new Date('2026-09-19'),
    title: 'Coordinators Training',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-09-22'),
    title: 'Weekly Chapter Meeting',
    subtitle: 'Regular weekly session · Evening: Business Discussions at Cafe',
    tags: ['CHAPTER', 'EVENING'],
    colors: ['#CC0000', '#A855F7'],
    eventType: 'chapter',
  },
  {
    date: new Date('2026-09-26'),
    title: 'Advance MSP Presentations Skill Workshop',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
  {
    date: new Date('2026-09-29'),
    title: 'Weekly Meeting + Monthly Domestic Trip',
    subtitle: 'Closing quarter outing · Member business support',
    tags: ['CHAPTER', 'DOMESTIC TRIP'],
    colors: ['#CC0000', '#14B8A6'],
    eventType: 'chapter',
  },
  {
    date: new Date('2026-09-29'),
    title: 'Meet and Greet · Close the Term',
    subtitle: '',
    tags: ['REGIONAL'],
    colors: ['#6B7280'],
    eventType: 'regional',
  },
]

async function main() {
  console.log('Seeding database...')

  // Create users
  const president = await prisma.user.upsert({
    where: { email: 'president@oscar.bni' },
    update: {},
    create: {
      email: 'president@oscar.bni',
      password: await hashPassword('Oscar@2026!'),
      name: 'Chapter President',
      phone: '9999900001',
      role: 'president',
      business: 'Chapter Leadership',
      category: 'Leadership',
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@oscar.bni' },
    update: {},
    create: {
      email: 'admin@oscar.bni',
      password: await hashPassword('Oscar@2026!'),
      name: 'Chapter Admin',
      phone: '9999900002',
      role: 'admin',
      business: 'Administration',
      category: 'Administration',
    },
  })

  await prisma.user.upsert({
    where: { email: 'member@oscar.bni' },
    update: {},
    create: {
      email: 'member@oscar.bni',
      password: await hashPassword('Oscar@2026!'),
      name: 'Sample Member',
      phone: '9999900003',
      role: 'member',
      business: 'Sample Business',
      category: 'Technology',
    },
  })

  console.log('Users created')

  // Seed events
  let eventsCreated = 0
  for (const event of EVENTS) {
    // Check if event already exists
    const existing = await prisma.event.findFirst({
      where: {
        date: event.date,
        title: event.title,
      },
    })
    if (!existing) {
      await prisma.event.create({
        data: {
          date: event.date,
          title: event.title,
          subtitle: event.subtitle || null,
          tags: JSON.stringify(event.tags),
          colors: JSON.stringify(event.colors),
          eventType: event.eventType,
        },
      })
      eventsCreated++
    }
  }

  console.log(`${eventsCreated} events seeded`)

  // Seed sample contact sphere for sample member
  const member = await prisma.user.findUnique({ where: { email: 'member@oscar.bni' } })
  if (member) {
    const existingContacts = await prisma.contactSphere.count({ where: { userId: member.id } })
    if (existingContacts === 0) {
      await prisma.contactSphere.createMany({
        data: [
          { userId: member.id, contactName: 'Rajesh Kumar', phone: '9876543210', business: 'Construction', relationship: 'colleague', notes: 'Interested in BNI' },
          { userId: member.id, contactName: 'Priya Nair', phone: '9876543211', business: 'Education', relationship: 'friend', notes: 'Running a school' },
          { userId: member.id, contactName: 'Mohammed Salim', phone: '9876543212', business: 'Real Estate', relationship: 'client', notes: 'Has multiple properties' },
        ],
      })
      console.log('Sample contacts seeded')
    }
  }

  // Add sample achievements
  const existingAchievements = await prisma.greenAchievement.count({ where: { userId: member!.id } })
  if (existingAchievements === 0) {
    await prisma.greenAchievement.createMany({
      data: [
        { userId: member!.id, category: 'referral', description: 'Referred Rajesh Kumar to a contractor', points: 2, verified: true, verifiedBy: admin.id },
        { userId: member!.id, category: 'visitor', description: 'Invited Priya Nair to chapter meeting', points: 2, verified: true, verifiedBy: admin.id },
        { userId: member!.id, category: 'one-to-one', description: '1-to-1 with Mohammed Salim', points: 1, verified: false },
      ],
    })
    console.log('Sample achievements seeded')
  }

  console.log('✅ Seeding complete!')
  console.log('\nDefault credentials:')
  console.log('  President: president@oscar.bni / Oscar@2026!')
  console.log('  Admin:     admin@oscar.bni / Oscar@2026!')
  console.log('  Member:    member@oscar.bni / Oscar@2026!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
