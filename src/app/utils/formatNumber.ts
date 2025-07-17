export const formatLargeNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(3)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const formatCurrency = (num: number | undefined | null): string => {
  if (num === undefined || num === null) {
    return 'Rp 0';
  }

  const rounded = Math.round(num);

  if (rounded < 1000) {
    return `${rounded.toLocaleString()}`;
  }

  return `Rp ${rounded.toLocaleString()}`;
};