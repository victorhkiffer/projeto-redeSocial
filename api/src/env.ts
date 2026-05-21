import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config({ path: '../.env' })
dotenv.config()

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().optional(),
  POSTGRES_DB: z.string().default('conecta_empreendedor'),
  POSTGRES_USER: z.string().default('conecta'),
  POSTGRES_PASSWORD: z.string().default('conecta_dev'),
  POSTGRES_PORT: z.coerce.number().int().positive().default(5432),
  JWT_ACCESS_SECRET: z.string().default('dev_access_secret_change_me'),
  JWT_REFRESH_SECRET: z.string().default('dev_refresh_secret_change_me'),
  CORS_ORIGIN: z.string().default('http://localhost:5173')
})

export type Env = z.infer<typeof schema>

export const env: Env = schema.parse(process.env)

export function getDatabaseUrl() {
  if (env.DATABASE_URL) return env.DATABASE_URL
  return `postgresql://${encodeURIComponent(env.POSTGRES_USER)}:${encodeURIComponent(env.POSTGRES_PASSWORD)}@localhost:${env.POSTGRES_PORT}/${env.POSTGRES_DB}`
}

