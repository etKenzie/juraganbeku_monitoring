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
  return `Rp ${num.toLocaleString()}`;
}; 