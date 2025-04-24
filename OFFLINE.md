# QR-Zipper Offline Setup

This document explains how to use QR-Zipper in a completely offline environment.

## Setup Instructions

1. All necessary JavaScript libraries are now included locally in the `libs/` directory:
   - `qrcode.min.js` - For generating QR codes
   - `zxing.min.js` - For scanning and reading QR codes
   - `crypto-js.min.js` - For encryption/decryption functionality

2. No internet connection is needed to use this application. All processing happens locally on your device.

## Usage Notes

1. To run the application, simply open `qr-zipper.html` in any modern web browser.

2. Browser camera access works offline once permissions are granted.

3. All data processing, including:
   - QR code generation
   - QR code scanning
   - Encryption/decryption
   - Chunking and assembling data
   
   All happens entirely on your device with no external requests.

## Security Features

1. Password protection uses AES encryption via the CryptoJS library
2. MD5 verification ensures data integrity for multi-part transfers
3. All data stays on your device - no network requests

## Troubleshooting

If you experience issues with camera access:
1. Ensure your browser has permission to access the camera
2. Try using the "Start Camera" button to initialize camera access
3. The debug toggle can be used to show detailed logs if issues persist

## Library Information

- QRCode.js v1.0.0 - Local copy in libs/qrcode.min.js
- ZXing JS v0.19.2 - Local copy in libs/zxing.min.js  
- CryptoJS v4.1.1 - Local copy in libs/crypto-js.min.js