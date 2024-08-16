// utils/formatNumber.ts

type FormatOptions = {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    scaleForUnit?: boolean;
    scaleType?: 'weight' | 'volume' | 'units' | '';
};

export const formatNumber = (
    value: number,
    {
        minimumFractionDigits = 0,
        maximumFractionDigits = 2,
        scaleForUnit = false,
        scaleType = ''
    }: FormatOptions = {}
): { formattedValue: string; unit: string } => {
    let scaledValue = value;
    let unit = '';

    if (scaleForUnit) {
        if (scaleType === 'weight') {
            if (Math.abs(value) >= 1e9) {
                scaledValue = value / 1e9;
                unit = 'mt';
            } else if (Math.abs(value) >= 1e6) {
                scaledValue = value / 1e6;
                unit = 'kt';
            } else if (Math.abs(value) >= 1e3) {
                scaledValue = value / 1e3;
                unit = 't';
            } else {
                unit = 'kg';
            }
        } else if (scaleType === 'volume') {
            if (Math.abs(value) >= 1e12) {
                scaledValue = value / 1e12;
                unit = 'km³'; // Cubic kilometers
            } else if (Math.abs(value) >= 1e9) {
                scaledValue = value / 1e9;
                unit = 'hm³'; // Cubic hectometers
            } else if (Math.abs(value) >= 1e3) {
                scaledValue = value / 1e3;
                unit = 'm³'; // Cubic meters
            } else {
                unit = 'L'; // Liters
            }
        } else if (scaleType === 'units') {
            if (Math.abs(value) >= 1e12) {
                scaledValue = value / 1e12;
                unit = 'T'; // Trillions
            } else if (Math.abs(value) >= 1e9) {
                scaledValue = value / 1e9;
                unit = 'B'; // Billions
            } else if (Math.abs(value) >= 1e6) {
                scaledValue = value / 1e6;
                unit = 'M'; // Millions
            } else if (Math.abs(value) >= 1e3) {
                scaledValue = value / 1e3;
                unit = 'k'; // Thousands
            } else {
                unit = ''; // No unit for small numbers
            }
        } else if (scaleType === '') {
            console.log('No scaleType provided');
        }
    }

    const formattedValue = new Intl.NumberFormat('en-US', {
        minimumFractionDigits,
        maximumFractionDigits,
        useGrouping: true,
    }).format(scaledValue);

    return { formattedValue, unit };
};
