export function formatListingPrice(value: string) {
  const normalized = value.trim().replace(/^opening bid\s*[·:-]\s*/i, '')
  const match = normalized.match(/^(RWF|Rwf)\s*([\d,]+)(.*)$/)
  if (!match) return normalized

  const [, currency, amount, suffix] = match
  const numericAmount = Number(amount.replaceAll(',', ''))
  if (!Number.isFinite(numericAmount)) return normalized

  return `${currency.toUpperCase()} ${numericAmount.toLocaleString('en-US')}${suffix}`
}
