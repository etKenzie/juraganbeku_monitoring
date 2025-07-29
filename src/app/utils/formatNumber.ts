export const formatLargeNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(3)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const formatCurrency = (num: number | undefined | null, isCurrency: boolean = true): string => {
  if (num === undefined || num === null) {
    return isCurrency ? 'Rp 0' : '0';
  }

  const rounded = Math.round(num);

  // if (isCurrency == true) {
  //   return `Rp ${rounded.toLocaleString()}`;
  // }
  if (rounded < 1000 && rounded > 0) {
    return rounded.toLocaleString();
  }

  return isCurrency ? `Rp ${rounded.toLocaleString()}` : rounded.toLocaleString();
};