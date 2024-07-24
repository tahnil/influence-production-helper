// utils/generateUniqueId.ts

export const generateUniqueId = () => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${randomString}`;
};
