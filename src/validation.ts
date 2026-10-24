import type { Limits } from "./config";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidTitle(title: string, limits: Limits): boolean {
  return title.length >= limits.titleMin && title.length <= limits.titleMax;
}

/** Returns the normalised address, or null if the input is not a plausible email. */
export function normalizeEmail(input: string, limits: Limits): string | null {
  const email = input.trim().toLowerCase();
  if (email.length > limits.emailMax || !EMAIL_PATTERN.test(email)) return null;
  return email;
}
