import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import PortalTasksClient from './PortalTasksClient'

export default async function PortalTasksPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const chapterId = session.user.chapterId
  const chapter = chapterId
    ? await db.chapter.findUnique({ where: { id: chapterId }, select: { name: true } })
    : null
  const chapterName = chapter ? `BNI ${chapter.name} Chapter` : 'BNI Chapter'

  return <PortalTasksClient userId={session.user.id} userName={session.user.name ?? ''} chapterName={chapterName} />
}
