export const formatLargeNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const formatCurrency = (num: number): string => {
  if (num >= 1000000) {
    return `Rp ${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `Rp ${(num / 1000).toFixed(1)}K`;
  }
  return `Rp ${num.toLocaleString()}`;
}; 