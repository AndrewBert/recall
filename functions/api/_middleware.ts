import type { Env } from '../types'

export const onRequest: PagesFunction<Env> = async (context) => {
  const authHeader = context.request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return Response.json({ error: 'Missing Authorization header' }, { status: 401 })
  }

  const token = authHeader.slice(7)
  if (token !== context.env.API_KEY) {
    return Response.json({ error: 'Invalid API key' }, { status: 401 })
  }

  return context.next()
}
