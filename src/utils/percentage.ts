export const convertToPercentage = (value: string) => {
  if (!value.includes("/")) return "Invalid data";

  const [numerator, denominator] = value.split("/").map(Number);
  if (denominator === 0) return "Invalid denominator";

  const percentage = (numerator / denominator) * 100;
  return `${percentage.toFixed(2)}%`;
};
