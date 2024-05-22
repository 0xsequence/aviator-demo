export function parseFriendlyTokenAmount(v, decimals) {
  const num = Number(v) / 10 ** 18
    if (num >= 0.01) {
        return num.toFixed(decimals);
      } else {
        return 0
      }
}