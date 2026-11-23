/**
 * Server REST API sederhana untuk Kang Jus Attendance
 * Menyimpan data langsung ke file `data.json` secara realtime.
 * Cara menjalankan: node server.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const HTML_FILE = path.join(__dirname, 'index.html');
const LOGO_FILE = path.join(__dirname, 'logo-kang-jus.jpg');

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Endpoint GET /api/data -> Membaca data.json
  if (req.url === '/api/data' && req.method === 'GET') {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Gagal membaca file data.json' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    });
    return;
  }

  // 2. Endpoint POST /api/attendance -> Menyimpan absensi baru ke file data.json
  if (req.url === '/api/attendance' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const newRecord = JSON.parse(body);
        fs.readFile(DATA_FILE, 'utf8', (err, fileData) => {
          let currentData = { employees: [], attendanceLogs: [] };
          if (!err && fileData) {
            currentData = JSON.parse(fileData);
          }
          if (!currentData.attendanceLogs) currentData.attendanceLogs = [];
          currentData.attendanceLogs.unshift(newRecord);

          fs.writeFile(DATA_FILE, JSON.stringify(currentData, null, 2), 'utf8', writeErr => {
            if (writeErr) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Gagal menyimpan ke data.json' }));
              return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Data absensi tersimpan di data.json' }));
          });
        });
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload tidak valid' }));
      }
    });
    return;
  }

  // 3. Serve Frontend Web Mobile
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(HTML_FILE, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('index.html not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  // 4. Serve Logo
  if (req.url === '/logo-kang-jus.jpg') {
    fs.readFile(LOGO_FILE, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Logo not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.end(data);
    });
    return;
  }

  // Default 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`Server Absensi Kang Jus aktif di: http://localhost:${PORT}`);
  console.log(`Menyimpan data langsung ke: ${DATA_FILE}`);
});
