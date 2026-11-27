export function formatMoney(n: number | undefined | null, decimals = 2): string {
  const val = Number(n) || 0;
  return (
    '₹' +
    val.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
}

export function formatMoneyCompact(n: number | undefined | null): string {
  const val = Number(n) || 0;
  const hasCents = Math.round(val * 100) % 100 !== 0;
  return formatMoney(val, hasCents ? 2 : 0);
}
