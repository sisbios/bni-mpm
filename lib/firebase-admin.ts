import type { App } from 'firebase-admin/app'
import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

let adminApp: App

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0]
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!serviceAccountJson) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON not set')
  const serviceAccount = JSON.parse(serviceAccountJson)
  adminApp = initializeApp({ credential: cert(serviceAccount) })
  return adminApp
}

export function getFirebaseAdminAuth() {
  return getAuth(getAdminApp())
}
