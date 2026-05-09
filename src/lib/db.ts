import postgres from 'postgres'

declare global {
  var __db: ReturnType<typeof postgres> | undefined
}

// Parse PostgreSQL `numeric`/`decimal` (OID 1700) as JS number instead of string.
// postgres.js returns numeric as string by default to preserve precision;
// our schema uses numeric for prices/scores that need .toFixed() and arithmetic.
const NUMERIC_OID = 1700

export const db: ReturnType<typeof postgres> =
  global.__db ??
  postgres(process.env.DATABASE_URL!, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    types: {
      numeric: {
        to: NUMERIC_OID,
        from: [NUMERIC_OID],
        serialize: (x: number) => String(x),
        parse: (x: string) => parseFloat(x),
      },
    },
  })

if (process.env.NODE_ENV !== 'production') {
  global.__db = db
}
