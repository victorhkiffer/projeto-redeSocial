import { Pool } from 'pg'
import { getDatabaseUrl } from './env'

export const pool = new Pool({
  connectionString: getDatabaseUrl()
})

