import { randomUUID, timingSafeEqual } from 'node:crypto'
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({})
const bucket = process.env.BUCKET_NAME
const syncToken = process.env.SYNC_TOKEN ?? ''
const allowedOrigin = process.env.ALLOWED_ORIGIN ?? '*'

const headers = {
  'access-control-allow-origin': allowedOrigin,
  'access-control-allow-headers': 'authorization,content-type',
  'access-control-allow-methods': 'GET,PUT,POST,OPTIONS',
  'content-type': 'application/json',
}

function response(statusCode, body) {
  return { statusCode, headers, body: body === undefined ? '' : JSON.stringify(body) }
}

function authorized(event) {
  const value = event.headers?.authorization ?? event.headers?.Authorization ?? ''
  const candidate = value.startsWith('Bearer ') ? value.slice(7) : ''
  const expectedBuffer = Buffer.from(syncToken)
  const candidateBuffer = Buffer.from(candidate)
  return expectedBuffer.length > 0 && expectedBuffer.length === candidateBuffer.length && timingSafeEqual(expectedBuffer, candidateBuffer)
}

async function streamToString(stream) {
  return stream.transformToString()
}

export async function handler(event) {
  const method = event.requestContext?.http?.method ?? event.httpMethod
  const path = event.rawPath ?? event.path

  if (method === 'OPTIONS') return response(204)
  if (!authorized(event)) return response(401, { message: 'The access token was not accepted.' })

  try {
    if (method === 'GET' && path === '/state') {
      try {
        const object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: 'data/state.json' }))
        return response(200, JSON.parse(await streamToString(object.Body)))
      } catch (error) {
        if (error?.name === 'NoSuchKey') return response(204)
        throw error
      }
    }

    if (method === 'PUT' && path === '/state') {
      const rawBody = event.isBase64Encoded ? Buffer.from(event.body ?? '', 'base64').toString('utf8') : (event.body ?? '')
      if (Buffer.byteLength(rawBody) > 1_000_000) return response(413, { message: 'The ledger is too large to store.' })
      const data = JSON.parse(rawBody)
      if (data?.schemaVersion !== 1 || !Array.isArray(data.roster) || !Array.isArray(data.teams)) {
        return response(400, { message: 'The ledger payload is not valid.' })
      }
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: 'data/state.json',
        Body: JSON.stringify(data),
        ContentType: 'application/json',
        ServerSideEncryption: 'AES256',
      }))
      return response(200, { saved: true })
    }

    if (method === 'POST' && path === '/upload-url') {
      const payload = JSON.parse(event.body ?? '{}')
      const contentType = String(payload.contentType ?? '')
      const size = Number(payload.size ?? 0)
      if (!contentType.startsWith('image/') || size <= 0 || size > 12_000_000) {
        return response(400, { message: 'Screenshots must be images smaller than 12 MB.' })
      }
      const extension = contentType.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'jpg'
      const key = `screenshots/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`
      const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        ServerSideEncryption: 'AES256',
      }), { expiresIn: 300 })
      return response(200, { uploadUrl, key })
    }

    return response(404, { message: 'Route not found.' })
  } catch (error) {
    console.error(error)
    return response(500, { message: 'The cloud archive could not complete the request.' })
  }
}
