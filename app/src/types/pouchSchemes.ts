// Define a type that represents your stored nodes in PouchDB
export interface PouchDBNodeDocument {
    _id: string;
    _rev: string;
    id: string;
    type: string;
    data: {
        logicalParentId?: string; // New field for logical parent relationship
        [key: string]: any;
    };
    position?: { x: number; y: number }; // Optional position
    parentId?: string;
}