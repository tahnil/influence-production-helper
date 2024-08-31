// pages/api/productImage.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { productId } = req.query;

        if (!productId || Array.isArray(productId)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        // Construct the image directory path
        const imageDir = path.join(process.cwd(), 'src', 'assets', 'images', 'product_icons');

        // Check if the image file exists for the given productId
        const files = fs.readdirSync(imageDir).filter(file => file.startsWith(`${productId}-`));
        let filePath: string;
        let mimeType: string;

        if (files.length === 0) {
            // If the image is not found, use the fallback image (SVG)
            filePath = path.join(imageDir, '0-notfound.svg');
            mimeType = 'image/svg+xml';
        } else {
            // If the image is found, use the first matching file (PNG)
            filePath = path.join(imageDir, files[0]);
            mimeType = 'image/png';
        }

        // Read the image file
        const imageBuffer = fs.readFileSync(filePath);
        const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

        return res.status(200).json({ base64Image });
    } catch (error) {
        console.error('Error loading product image:', error);
        res.status(500).json({
            error: 'Failed to load product image',
        });
    }
}
