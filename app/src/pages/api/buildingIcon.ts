// pages/api/buildingIcon.ts
import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { buildingId } = req.query;

        if (!buildingId) {
            return res.status(400).json({ error: 'Missing buildingId' });
        }

        // Construct the image file path
        const imageDir = path.join(process.cwd(), 'src', 'assets', 'images', 'building_icons');

        // Check if the image file exists
        const files = fs.readdirSync(imageDir).filter(file => file.startsWith(`${buildingId}-`));
        if (files.length === 0) {
            return res.status(404).json({ error: 'Image not found' });
        }

        const filePath = path.join(imageDir, files[0]);
        const fileData = fs.readFileSync(filePath);
        const base64Image = Buffer.from(fileData).toString('base64');
        // console.log('filePath:', filePath, '\nfileData:', fileData, '\nbase64Image:', base64Image);
        res.status(200).json({ base64Image: `data:image/svg+xml;base64,${base64Image}` });
    } catch (error) {
        console.error('Error reading SVG file:', error);
        res.status(500).json({
            error: 'Failed to load building icon'
        });
    }
}
