export type ActionResult = { error: string } | { success: true };

export function errorResult(error: unknown, fallback = "Something went wrong. Please try again."): ActionResult {
  if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
    return { error: "A record with these details already exists." };
  }
  if (error instanceof Error) {
    return { error: fallback };
  }
  return { error: fallback };
}
