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
): { formattedValue: string; scale?: string; unit: string } => {
    const ABSURDLY_LARGE_THRESHOLD = 1e15;

    // Handle absurdly large numbers upfront
    if (Math.abs(value) >= ABSURDLY_LARGE_THRESHOLD) {
        return { formattedValue: 'Oh really?', scale: '', unit: '🧐' };
    }

    let scaledValue = value;
    let unit = '';
    let scale = '';

    if (scaleForUnit && scaleType) {
        switch (scaleType) {
            case 'weight':
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
                break;
            case 'volume':
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
                break;
            case 'units':
                unit = 'units';
                if (Math.abs(value) >= 1e12) {
                    scaledValue = value / 1e12;
                    scale = 'T'; // Trillions
                } else if (Math.abs(value) >= 1e9) {
                    scaledValue = value / 1e9;
                    scale = 'B'; // Billions
                } else if (Math.abs(value) >= 1e6) {
                    scaledValue = value / 1e6;
                    scale = 'M'; // Millions
                } else if (Math.abs(value) >= 1e3) {
                    scaledValue = value / 1e3;
                    scale = 'k'; // Thousands
                }
                break;
        }
    }

    const formattedValue = new Intl.NumberFormat('en-US', {
        minimumFractionDigits,
        maximumFractionDigits: scaledValue < 1 ? maximumFractionDigits : 2,
        useGrouping: true,
    }).format(scaledValue);

    return { formattedValue, scale, unit };
};
