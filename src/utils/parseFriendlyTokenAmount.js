export function parseFriendlyTokenAmount(v) {
  const num = Number(v) / 10 ** 18;
  if (num >= 0.01) {
    if (num < 10) {
      return num.toFixed(2);
    } else if(num<100) {
      return num.toFixed(1);
    } else if(num<1000) {
      return Math.round(num).toFixed(0);
    } else if(num<10000) {
      return (num/1000).toFixed(1) + 'K';
    } else {
      return (num/1000).toFixed(0) + 'K';
    }
  } else {
    return 0;
  }
}
