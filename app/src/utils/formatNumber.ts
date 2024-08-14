export const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        useGrouping: true, // This adds the thousands separators
    }).format(value);
};