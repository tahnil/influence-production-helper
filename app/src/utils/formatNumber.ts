// utils/formatNumber.ts

export const formatNumber = (
    value: number,
    minimumFractionDigits: number = 0,
    maximumFractionDigits: number = 2
) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits,
        maximumFractionDigits,
        useGrouping: true, // This adds the thousands separators
    }).format(value);
};
