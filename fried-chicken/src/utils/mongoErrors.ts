export function isDuplicateKeyError(
    err: unknown,
): err is { code: number; keyPattern?: Record<string, unknown> } {
    return typeof err === "object" && err !== null && "code" in err && (err).code === 11000;
}
