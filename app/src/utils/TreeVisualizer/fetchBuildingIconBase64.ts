// utils/TreeVisualizer/fetchBuildingIconBase64.ts

export const fetchBuildingIconBase64 = async (buildingId: string): Promise<string> => {
    try {
        const response = await fetch(`/api/buildingIcon?buildingId=${buildingId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch building icon');
        }
        const { base64Image } = await response.json();
        return base64Image;
    } catch (error) {
        console.error('Error fetching building icon:', error);
        return '';
    }
};
