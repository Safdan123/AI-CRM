export function ok<T>(data: T, message?: string) {
  return { data, message }
}
