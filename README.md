# Random Video Chat

Website video chat original menggunakan WebRTC + Socket.IO.

## Jalankan di komputer
1. Install Node.js.
2. Buka terminal di folder ini.
3. Jalankan `npm install`
4. Jalankan `npm start`
5. Buka `http://localhost:3000`

Untuk testing 2 orang, buka URL tersebut di dua tab/browser.

## Deploy
Gunakan hosting yang mendukung Node.js/WebSocket. Untuk penggunaan publik, tambahkan HTTPS karena kamera/mikrofon browser membutuhkan secure context (localhost adalah pengecualian).

## Catatan
Server ini memakai STUN publik untuk membantu koneksi WebRTC. Untuk koneksi yang lebih stabil di jaringan tertentu, tambahkan TURN server.
