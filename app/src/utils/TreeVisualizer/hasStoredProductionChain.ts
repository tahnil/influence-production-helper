import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';

export const hasStoredProductionChain = async (
    productId: string,
    db: PouchDB.Database | null
): Promise<boolean> => {
    if (!db) {
        console.error('PouchDB is not initialized');
        return false;
    }

    try {
        const result = await db.find({
            selector: {
                'data.productDetails.id': productId,
                'data.isRoot': true,
            },
        });

        return result.docs.length > 0;
    } catch (error) {
        console.error('Error checking for stored production chain in PouchDB:', error);
        return false;
    }
};
