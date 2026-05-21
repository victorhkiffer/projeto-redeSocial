import crypto from 'node:crypto'
import { randomUUID } from 'node:crypto'

export function newOpaqueToken() {
  return `${randomUUID()}.${crypto.randomBytes(32).toString('hex')}`
}

export function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

