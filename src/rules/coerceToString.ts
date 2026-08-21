/**
 * AngularJS validated the *view* value, which for a text input is always a
 * string. These rules validate the *model* value instead, so a numeric field
 * (e.g. an amount arriving as JSON number 0) would fail every string rule
 * before its content was even looked at. Coerce numbers to the text the user
 * actually sees in the input; leave everything else (booleans, objects,
 * arrays) to be rejected as before.
 *
 * @returns the string to validate, or null when the value is not coercible.
 */
export function coerceToValidatableString(param: unknown): string | null {
    if (typeof param === 'string') return param
    if (typeof param === 'number' || typeof param === 'bigint') return String(param)
    return null
}
