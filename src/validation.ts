import { userInputError } from "./errors.js";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function assertNonEmpty(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw userInputError(`${field} must not be empty`);
  }
}

export function assertSlug(slug: string): void {
  if (!SLUG_RE.test(slug)) {
    throw userInputError(
      `slug must be lowercase alphanumeric with single hyphen separators`
    );
  }
}

export function assertTake(take: number | null | undefined): number {
  if (take === null || take === undefined) return 20;
  if (!Number.isInteger(take) || take <= 0 || take > 100) {
    throw userInputError("take must be an integer between 1 and 100");
  }
  return take;
}
