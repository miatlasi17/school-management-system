export { cn } from "cn"

import type { ReactNode } from "react"

/**
 * Base UI's <Select.Value> shows the raw selected value instead of its
 * label unless <Select.Root> is given an `items` map to look labels up
 * in (see https://base-ui.com/react/components/select#items) — this
 * builds that map from the same option list already used to render
 * <SelectItem>s, so a pre-filled Select shows a label instead of a
 * raw id/value before the user ever opens the dropdown.
 */
export function toSelectItems(
  options: ReadonlyArray<{ id?: string; value?: string; label: ReactNode }>
): Record<string, ReactNode> {
  const map: Record<string, ReactNode> = {}
  for (const option of options) {
    const key = option.id ?? option.value
    if (key !== undefined) map[key] = option.label
  }
  return map
}
