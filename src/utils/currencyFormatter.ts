export const formatRupiah = (value: number | string) => {
  if (!value) return "Rp. 0";

  const numericValue = typeof value === "string" ? parseFloat(value) : value;

  return `Rp. ${numericValue.toLocaleString("id-ID", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};
