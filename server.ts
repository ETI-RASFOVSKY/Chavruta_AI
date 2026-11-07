/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Express Production Server for Chavruta Smart
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiMiddleware } from './server/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Use server API middleware for all /api endpoints
app.use(apiMiddleware);

// Serve static frontend build
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Chavruta Smart server running on port ${PORT}`);
});
