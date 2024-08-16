// src/pages/api/productImage.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { productId } = req.query;

        if (!productId || Array.isArray(productId)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        // Construct the image file path
        const imageDir = path.join(process.cwd(), 'src', 'assets', 'images', 'product_icons');

        // Check if the image file exists
        const files = fs.readdirSync(imageDir).filter(file => file.startsWith(`${productId}-`));
        if (files.length === 0) {
            return res.status(404).json({ error: 'Image not found' });
        }

        const filePath = path.join(imageDir, files[0]);
        const imageBuffer = fs.readFileSync(filePath);
        const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
        // console.log('filePath:', filePath, '\nimageBuffer:', imageBuffer, '\nbase64Image:', base64Image);
        return res.status(200).json({ base64Image });
    } catch (error) {
        console.error('Error loading product image:', error);
        res.status(500).json({
            error: 'Failed to load product image',
        });
    }
}
