// utils/TreeVisualizer/fetchBuildingIconBase64.ts

import { useState, useCallback } from 'react';

export const fetchBuildingIconBase64 = async (buildingId: string): Promise<string> => {
    const response = await fetch(`/api/buildingIcon?buildingId=${buildingId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch building icon');
    }
    const { base64Image } = await response.json();
    return base64Image;
};

const useBuildingIcon = () => {
    const [buildingIcon, setBuildingIcon] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const getBuildingIcon = useCallback(async (buildingId: string) => {
        setLoading(true);
        setError(null);
        try {
            const base64Image = await fetchBuildingIconBase64(buildingId);
            setBuildingIcon(base64Image);
            return base64Image; // Return the fetched image
        } catch (error) {
            if (error instanceof Error) {
                setError(`Error: ${error.message}`);
            } else {
                setError('Unexpected error occurred');
            }
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        buildingIcon,
        loading,
        error,
        getBuildingIcon,
    };
};

export default useBuildingIcon;