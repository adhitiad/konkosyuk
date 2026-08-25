export const DP_RATIO = 0.35;

export function calculateDp(totalPrice: number): {
  dpAmount: number;
  remainingAmount: number;
} {
  const dpAmount = totalPrice * DP_RATIO;
  const remainingAmount = totalPrice - dpAmount;
  return { dpAmount, remainingAmount };
}

export function calculateEndDate(startDate: string, months: number): string {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + months);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
