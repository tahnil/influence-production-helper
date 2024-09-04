// Define a type that represents your stored nodes in PouchDB
export interface PouchDBNodeDocument {
    _id: string;
    _rev: string;
    id: string;
    type: string;
    data: any;
    position?: { x: number; y: number }; // Optional position
    parentId?: string;
}