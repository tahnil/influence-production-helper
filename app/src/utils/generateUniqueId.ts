// utils/generateUniqueId.ts

export const generateUniqueId = () => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    // console.log('[generateUniqueId] generated new unique id: ',timestamp,'-',randomString);
    return `${timestamp}-${randomString}`;
};
