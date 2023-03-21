export type Result<T> =
  | { ok: true; value: T; error?: undefined }
  | { ok: false; error: Error; value?: undefined }
export type Optional<T> = { ok: true; v: T } | { ok: false }
