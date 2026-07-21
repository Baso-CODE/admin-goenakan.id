// Fungsi utilitas untuk format mata uang dinamis
export const formatCurrency = (
  amount: number,
  currencyCode: string = "IDR",
) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};
