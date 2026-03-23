/**
 * seed-region.ts
 * Phase 2 seed: Creates Region + Oscar Chapter, backfills chapterId on all existing rows.
 * Run once after Phase 2 schema migration.
 *
 * Usage:
 *   DATABASE_URL=... npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-region.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding region and chapter...");

  // 1. Create Region
  const region = await prisma.region.upsert({
    where: { slug: "bni-south" },
    update: {},
    create: {
      name: "BNI South Kerala",
      slug: "bni-south",
      isActive: true,
    },
  });
  console.log(`✅ Region: ${region.name} (${region.id})`);

  // 2. Create Oscar Chapter
  const chapter = await prisma.chapter.upsert({
    where: { slug: "oscar" },
    update: {},
    create: {
      regionId: region.id,
      name: "Oscar",
      slug: "oscar",
      city: "Kerala",
      meetingDay: "Tuesday",
      meetingTime: "07:00",
      isActive: true,
    },
  });
  console.log(`✅ Chapter: ${chapter.name} (${chapter.id})`);

  const cid = chapter.id;

  // 3. Backfill chapterId on all existing tables
  console.log("📦 Backfilling chapterId on all tables...");

  const [
    users, events, rsvps, tasks, achievements, goals,
    contacts, logs, settings, roles, palms, pins, memberPins, visitors, slots
  ] = await Promise.all([
    prisma.user.updateMany({ where: { chapterId: null }, data: { chapterId: cid } }),
    prisma.event.updateMany({ where: { chapterId: null }, data: { chapterId: cid } }),
    prisma.eventRSVP.updateMany({ where: { chapterId: null }, data: { chapterId: cid } }),
    prisma.weeklyTask.updateMany({ where: { chapterId: null }, data: { chapterId: cid } }),
    prisma.greenAchievement.updateMany({ where: { chapterId: null }, data: { chapterId: cid } }),
    prisma.businessGoal.updateMany({ where: { chapterId: null }, data: { chapterId: cid } }),
    prisma.contactSphere.updateMany({ where: { chapterId: null }, data: { chapterId: cid } }),
    prisma.auditLog.updateMany({ where: { chapterId: null }, data: { chapterId: cid } }),
    prisma.chapterSetting.updateMany({ where: { chapterId: null }, data: { chapterId: cid } }),
    prisma.chapterRole.updateMany({ where: { chapterId: null }, data: { chapterId: cid } }),
    prisma.palmsEntry.updateMany({ where: { chapterId: null }, data: { chapterId: cid } }),
    prisma.bniPin.updateMany({ where: { chapterId: null, isSystem: false }, data: { chapterId: cid } }),
    prisma.memberPin.updateMany({ where: { chapterId: null }, data: { chapterId: cid } }),
    prisma.visitor.updateMany({ where: { chapterId: null }, data: { chapterId: cid } }),
    prisma.meetingSlot.updateMany({ where: { chapterId: null }, data: { chapterId: cid } }),
  ]);

  console.log(`  Users:           ${users.count}`);
  console.log(`  Events:          ${events.count}`);
  console.log(`  EventRSVPs:      ${rsvps.count}`);
  console.log(`  WeeklyTasks:     ${tasks.count}`);
  console.log(`  Achievements:    ${achievements.count}`);
  console.log(`  BusinessGoals:   ${goals.count}`);
  console.log(`  ContactSpheres:  ${contacts.count}`);
  console.log(`  AuditLogs:       ${logs.count}`);
  console.log(`  ChapterSettings: ${settings.count}`);
  console.log(`  ChapterRoles:    ${roles.count}`);
  console.log(`  PalmsEntries:    ${palms.count}`);
  console.log(`  BniPins:         ${pins.count}`);
  console.log(`  MemberPins:      ${memberPins.count}`);
  console.log(`  Visitors:        ${visitors.count}`);
  console.log(`  MeetingSlots:    ${slots.count}`);

  console.log("\n✅ Phase 2 seed complete!");
  console.log(`   Region ID:  ${region.id}`);
  console.log(`   Chapter ID: ${chapter.id}`);
  console.log(`   Save these IDs — needed for Phase 3 env config.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
