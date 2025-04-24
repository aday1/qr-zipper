# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Run Commands
- Open `qr-zipper.html` in a browser to run the application
- No build commands required (plain HTML/CSS/JS)

## Lint/Test Commands
- No formal testing framework implemented
- Use browser console for debugging

## Code Style Guidelines
- **Formatting**: Use consistent indentation (2 spaces)
- **Naming**: Use camelCase for variables and functions
- **HTML**: Standard HTML5 with proper semantic elements
- **CSS**: Organized by component with custom variables (--terminal-*)
- **JavaScript**:
  - Functions organized by feature in sections (marked with comments)
  - DOM elements cached at top of file
  - Event listeners centralized in setupEventListeners()
  - Descriptive variable/function names
  - Detailed logging with the log() function
  - Error handling with try/catch blocks
- **External Libraries**: 
  - qrcodejs for QR generation
  - ZXing for QR scanning
  - CryptoJS for encryption/hashing