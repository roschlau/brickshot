export function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function checkPresent<T>(value: T | null | undefined, message?: () => string): T {
  if (!isPresent(value)) {
    throw new Error(message?.() ?? 'Required value is missing.');
  }
  return value
}
