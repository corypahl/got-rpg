import type { AppData, SyncSettings } from '../types'

function configured(settings: SyncSettings): boolean {
  return Boolean(settings.apiUrl.trim() && settings.accessToken.trim())
}

function endpoint(settings: SyncSettings, path: string): string {
  return `${settings.apiUrl.replace(/\/$/, '')}${path}`
}

async function apiRequest(settings: SyncSettings, path: string, init?: RequestInit): Promise<Response> {
  if (!configured(settings)) throw new Error('Cloud sync is not configured yet.')

  const response = await fetch(endpoint(settings, path), {
    ...init,
    headers: {
      Authorization: `Bearer ${settings.accessToken}`,
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(detail || `Cloud request failed (${response.status}).`)
  }
  return response
}

export async function pullFromCloud(settings: SyncSettings): Promise<AppData | null> {
  const response = await apiRequest(settings, '/state')
  if (response.status === 204) return null
  return response.json() as Promise<AppData>
}

export async function pushToCloud(settings: SyncSettings, data: AppData): Promise<void> {
  await apiRequest(settings, '/state', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function uploadScreenshot(settings: SyncSettings, file: File): Promise<string | null> {
  if (!configured(settings)) return null
  const response = await apiRequest(settings, '/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contentType: file.type || 'image/jpeg', size: file.size }),
  })
  const { uploadUrl, key } = (await response.json()) as { uploadUrl: string; key: string }
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'image/jpeg' },
    body: file,
  })
  if (!uploadResponse.ok) throw new Error('The screenshot could not be uploaded to S3.')
  return key
}

export function isSyncConfigured(settings: SyncSettings): boolean {
  return configured(settings)
}
