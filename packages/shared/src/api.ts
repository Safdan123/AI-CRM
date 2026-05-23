export function ok<T>(data: T, message?: string) {
  return { data, message }
}

export function fail(message: string, statusCode = 400) {
  const err = new Error(message) as Error & { statusCode: number }
  err.statusCode = statusCode
  return err
}
