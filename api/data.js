import { put, list } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

const BLOB_FILE_NAME = 'kangjus-data.json';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 1. GET: Ambil seluruh data dari Blob (atau fallback lokal)
  if (req.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: BLOB_FILE_NAME });
      const targetBlob = blobs.find(b => b.pathname === BLOB_FILE_NAME);

      if (targetBlob && targetBlob.downloadUrl) {
        const response = await fetch(targetBlob.downloadUrl);
        const data = await response.json();
        return res.status(200).json(data);
      }

      // Inisialisasi awal jika belum ada di blob
      const fallbackPath = path.join(process.cwd(), 'data.json');
      if (fs.existsSync(fallbackPath)) {
        const localData = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
        await put(BLOB_FILE_NAME, JSON.stringify(localData, null, 2), {
          access: 'public',
          addRandomSuffix: false
        });
        return res.status(200).json(localData);
      }

      return res.status(200).json({ employees: [], attendanceLogs: [] });
    } catch (error) {
      console.error('Error fetching data from Vercel Blob:', error);
      try {
        const fallbackPath = path.join(process.cwd(), 'data.json');
        const localData = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
        return res.status(200).json(localData);
      } catch (e) {
        return res.status(500).json({ error: error.message });
      }
    }
  }

  // 2. POST: Simpan seluruh appData (termasuk update jadwal karyawan atau absensi baru)
  if (req.method === 'POST') {
    try {
      const fullData = req.body;
      if (!fullData || typeof fullData !== 'object') {
        return res.status(400).json({ error: 'Payload data tidak valid' });
      }

      const updatedBlob = await put(BLOB_FILE_NAME, JSON.stringify(fullData, null, 2), {
        access: 'public',
        addRandomSuffix: false
      });

      return res.status(200).json({
        success: true,
        message: 'Data berhasil disinkronkan ke Vercel Blob!',
        url: updatedBlob.url
      });
    } catch (error) {
      console.error('Error saving data to Vercel Blob:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
