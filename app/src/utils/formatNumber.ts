// utils/formatNumber.ts

type FormatOptions = {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    scaleForUnit?: boolean;
    scaleType?: 'weight' | 'volume' | 'units' | 'runs' | '';
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
    const ABSURDLY_LARGE_THRESHOLD = 1e15;
    const ROUND_UP_THRESHOLD = 10000;

    // Handle absurdly large numbers upfront
    if (Math.abs(value) >= ABSURDLY_LARGE_THRESHOLD) {
        return { formattedValue: 'Oh really?', unit: '🧐' };
    }

    let scaledValue = value;
    let scale = '';
    let unit = '';

    if (scaleForUnit && scaleType) {
        switch (scaleType) {
            case 'weight':
                if (Math.abs(value) >= 1e9) {
                    scaledValue = value / 1e9;
                    scale = 'mt';
                } else if (Math.abs(value) >= 1e6) {
                    scaledValue = value / 1e6;
                    scale = 'kt';
                } else if (Math.abs(value) >= 1e3) {
                    scaledValue = value / 1e3;
                    scale = 't';
                } else {
                    scale = 'kg';
                }
                unit = 'weight';
                break;
            case 'volume':
                if (Math.abs(value) >= 1e12) {
                    scaledValue = value / 1e12;
                    scale = 'km³'; // Cubic kilometers
                } else if (Math.abs(value) >= 1e9) {
                    scaledValue = value / 1e9;
                    scale = 'hm³'; // Cubic hectometers
                } else if (Math.abs(value) >= 1e3) {
                    scaledValue = value / 1e3;
                    scale = 'm³'; // Cubic meters
                } else {
                    scale = 'L'; // Liters
                }
                unit = 'volume';
                break;
            case 'units':
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
                unit = 'units';
                break;
            case 'runs':
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
                unit = 'runs';
                break;
        }
    }

    // Round up logic for large numbers
    if (Math.abs(scaledValue) >= ROUND_UP_THRESHOLD) {
        scaledValue = Math.ceil(scaledValue);
        minimumFractionDigits = 0;
        maximumFractionDigits = 0;
    }

    const formattedValue = `${new Intl.NumberFormat('en-US', {
        minimumFractionDigits,
        maximumFractionDigits: scaledValue < 1 ? maximumFractionDigits : 2,
        useGrouping: true,
    }).format(scaledValue)} ${scale}`;

    // Handle singular unit names
    if (value === 1) {
        switch (scaleType) {
            case 'units':
                unit = 'unit'; // Singular, e.g., "1 unit"
                break;
            case 'runs':
                unit = 'run'; // Singular, e.g., "1 unit"
                break;
        }
    }

    return { formattedValue, unit };
};
