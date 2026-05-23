import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: 'Route not found.' })
}

export function makeErrorHandler(serviceName: string) {
  return function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: 'Validation failed.',
        issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      })
    }
    if (
      typeof err === 'object' &&
      err !== null &&
      'statusCode' in err &&
      typeof (err as { statusCode?: unknown }).statusCode === 'number'
    ) {
      const typed = err as { statusCode: number; message?: string }
      return res.status(typed.statusCode).json({ message: typed.message ?? 'Request failed.' })
    }
    const message = err instanceof Error ? err.message : 'Unexpected server error.'
    // eslint-disable-next-line no-console
    console.error(`[${serviceName}]`, err)
    return res.status(500).json({ message })
  }
}
