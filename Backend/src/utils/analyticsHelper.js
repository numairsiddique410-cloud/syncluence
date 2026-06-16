export const getMonthlyData = (transactions, amountField = "amount") => {
  const monthly = {};

  transactions.forEach((t) => {
    const month = new Date(t.createdAt).toISOString().slice(0, 7); // YYYY-MM

    if (!monthly[month]) {
      monthly[month] = { month, revenue: 0, profit: 0, count: 0 };
    }

    monthly[month].revenue += (t[amountField] != null ? t[amountField] : t.amount) || 0;
    monthly[month].profit += t.platformFee || 0;
    monthly[month].count += 1;
  });

  // Return sorted array (not object) — prevents .map() crash on frontend
  return Object.values(monthly).sort((a, b) =>
    a.month.localeCompare(b.month)
  );
};

export const calculateSuccessRate = (total, failed) => {
  if (total === 0) return 0;
  return Math.round(((total - failed) / total) * 100);
};
