import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

const STANDARD_ROLES = [
  { slug: 'admin', label: 'Admin', color: '#3B82F6', accessLevel: 'superadmin', isSystem: true },
  { slug: 'president', label: 'President', color: '#C9A84C', accessLevel: 'officer', isSystem: true },
  { slug: 'vicePresident', label: 'Vice President', color: '#8B5CF6', accessLevel: 'officer', isSystem: true },
  { slug: 'secretary', label: 'Secretary', color: '#10B981', accessLevel: 'officer', isSystem: true },
  { slug: 'treasurer', label: 'Treasurer', color: '#F59E0B', accessLevel: 'officer', isSystem: true },
  { slug: 'mcMember', label: 'MC Member', color: '#EC4899', accessLevel: 'officer', isSystem: true },
  { slug: 'trainingCoordinator', label: 'Training Coordinator', color: '#06B6D4', accessLevel: 'officer', isSystem: true },
  { slug: 'greenClubCoordinator', label: 'GreenClub Coordinator', color: '#22C55E', accessLevel: 'officer', isSystem: true },
  { slug: 'growthCoordinator', label: 'Growth Coordinator', color: '#F97316', accessLevel: 'officer', isSystem: true },
  { slug: 'retentionCoordinator', label: 'Retention Coordinator', color: '#EF4444', accessLevel: 'officer', isSystem: true },
  { slug: 'applicationReviewCoordinator', label: 'Application Review Coordinator', color: '#A855F7', accessLevel: 'officer', isSystem: true },
  { slug: 'member', label: 'Member', color: '#6B7280', accessLevel: 'member', isSystem: true },
]

async function main() {
  for (const role of STANDARD_ROLES) {
    await db.chapterRole.upsert({
      where: { slug: role.slug },
      update: { label: role.label, color: role.color, accessLevel: role.accessLevel },
      create: role,
    })
  }
  console.log('Roles seeded')
}

main().finally(() => db.$disconnect())
