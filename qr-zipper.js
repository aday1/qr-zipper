// ======= Part 1 =======
// Constants
const MAX_QR_CAPACITY = 2953; // Maximum bytes for QR code
const MAX_CHUNK_SIZE = 2900; // Standard chunk size (slightly less than capacity to account for metadata)

// Chunk size constants
const MAX_CHUNK_SIZE_BYTES = 2900;   // Maximum chunk size
const MIN_CHUNK_SIZE_BYTES = 100;    // Minimum viable chunk size for QR codes

// DOM Elements - General
const tabs = document.querySelectorAll('.tabs .tab');
const tabContents = document.querySelectorAll('.tab-content');

// Floating QR elements
const floatingQrContainer = document.getElementById('floating-qr-container');
const floatingQrClose = document.getElementById('floating-qr-close');
const floatingQrContent = document.getElementById('floating-qr-content');
const floatingQrCounter = document.getElementById('floating-qr-counter');
const openQrWindowBtn = document.getElementById('open-qr-window');
const fullscreenQr = document.getElementById('fullscreen-qr');
const fullscreenQrContent = document.getElementById('fullscreen-qr-content');
const fullscreenQrClose = document.getElementById('fullscreen-qr-close');
const fullscreenQrCounter = document.getElementById('fullscreen-qr-counter');

// DOM Elements - Encode
const fileDropArea = document.getElementById('file-drop');
const fileInput = document.getElementById('file-input');
const fileSelectBtn = document.getElementById('file-select-btn');
const encodeInput = document.getElementById('encode-input');
const encodePassword = document.getElementById('encode-password');
const generateQrBtn = document.getElementById('generate-qr');
const clearEncodeBtn = document.getElementById('clear-encode');
const qrcodeContainer = document.getElementById('qrcode');
const encodeMessage = document.getElementById('encode-message');
const downloadQrBtn = document.getElementById('download-qr');
const encodeProgress = document.getElementById('encode-progress');
const capacityInfo = document.getElementById('capacity-info');
const fileInfo = document.getElementById('file-info');

// DOM Elements - Decode
const qrDropArea = document.getElementById('qr-drop');
const qrInput = document.getElementById('qr-input');
const qrSelectBtn = document.getElementById('qr-select-btn');
const decodePassword = document.getElementById('decode-password');
const startCameraBtn = document.getElementById('start-camera');
const stopCameraBtn = document.getElementById('stop-camera');
const takePhotoBtn = document.getElementById('take-photo');
const decodeQrBtn = document.getElementById('decode-qr');
const clearDecodeBtn = document.getElementById('clear-decode');
const decodeOutput = document.getElementById('decode-output');
const decodeMessage = document.getElementById('decode-message');
const downloadDecodedBtn = document.getElementById('download-decoded');
const video = document.getElementById('video');
const cameraSelectContainer = document.getElementById('camera-select-container');
const cameraSelect = document.getElementById('camera-select');
const imagePreview = document.getElementById('image-preview');
const debugInfo = document.getElementById('debug-info');
const debugToggle = document.getElementById('debug-toggle');

// DOM Elements - P2P
const p2pModeBtns = document.querySelectorAll('.p2p-mode-btn');
const sendPanel = document.getElementById('send-panel');
const receivePanel = document.getElementById('receive-panel');
const p2pFileDropArea = document.getElementById('p2p-file-drop');
const p2pFileInput = document.getElementById('p2p-file-input');
const p2pFileSelectBtn = document.getElementById('p2p-file-select-btn');
const p2pInput = document.getElementById('p2p-input');
const p2pPassword = document.getElementById('p2p-password');
const startTransferBtn = document.getElementById('start-transfer');
const stopTransferBtn = document.getElementById('stop-transfer');
const manualNavBtn = document.getElementById('manual-nav');
const p2pQrcodeContainer = document.getElementById('p2p-qrcode');
const sendProgress = document.getElementById('send-progress');
const sendStatus = document.getElementById('send-status');
const debugP2PBtn = document.getElementById('debug-p2p');
const displayInterval = document.getElementById('display-interval');
const intervalValue = document.getElementById('interval-value');
const p2pNavigation = document.querySelector('.p2p-navigation');
const prevChunkBtn = document.getElementById('prev-chunk');
const nextChunkBtn = document.getElementById('next-chunk');
const chunkCounter = document.getElementById('chunk-counter');
const p2pCameraSelectContainer = document.getElementById('p2p-camera-select-container');
const p2pCameraSelect = document.getElementById('p2p-camera-select');
const p2pVideo = document.getElementById('p2p-video');
const p2pReceivePassword = document.getElementById('p2p-receive-password');
const startReceivingBtn = document.getElementById('start-receiving');
const stopReceivingBtn = document.getElementById('stop-receiving');
const p2pSnapshotBtn = document.getElementById('p2p-snapshot');
const forceDecodeBtn = document.getElementById('force-decode');
const manualEntryBtn = document.getElementById('manual-entry');
const manualEntryForm = document.getElementById('manual-entry-form');
const manualQrData = document.getElementById('manual-qr-data');
const submitManualDataBtn = document.getElementById('submit-manual-data');
const cancelManualEntryBtn = document.getElementById('cancel-manual-entry');
const receiveProgress = document.getElementById('receive-progress');
const receiveStatus = document.getElementById('receive-status');
const chunkStatus = document.getElementById('chunk-status');
const receivedData = document.getElementById('received-data');
const chunkLog = document.getElementById('chunk-log');
const downloadReceivedBtn = document.getElementById('download-received');
const downloadRawLogBtn = document.getElementById('download-raw-log');
const p2pFileInfo = document.getElementById('p2p-file-info');
const chunkSizeSlider = document.getElementById('chunk-size-slider');
const chunkSizeValue = document.getElementById('chunk-size-value');

// Global variables
let qrInstance = null;
let p2pQrInstance = null;
let codeReader = null;
let stream = null;
let p2pStream = null;
let videoDevices = [];
let selectedCamera = null;
let selectedP2PCamera = null;
let p2pChunks = [];
let currentChunkIndex = 0;
let transferActive = false;
let autoPlayInterval = null;
let receivedChunks = {};
let totalExpectedChunks = 0;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  initZXing();
  initCameraSelection();
  setupEventListeners();
  console.log('QR Code Zipper initialized');
  
  // Check if we're offline capable
  checkOfflineCapability();
});

// Initialize ZXing library
function initZXing() {
  try {
    codeReader = new ZXing.BrowserMultiFormatReader();
    console.log('ZXing library initialized');
    
    // Add our own wrapper for decoding from ImageData for compatibility
    // Some versions of ZXing have different API methods
    if (!codeReader.decodeFromImageData) {
      codeReader.decodeFromImageData = function(imageData) {
        try {
          // Try different methods based on ZXing version 
          if (typeof ZXing.HTMLCanvasElementLuminanceSource !== 'undefined') {
            // Newer ZXing versions
            const luminanceSource = new ZXing.HTMLCanvasElementLuminanceSource(imageData);
            const binaryBitmap = new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(luminanceSource));
            return Promise.resolve(this.decode(binaryBitmap));
          } else {
            // Fallback for other versions
            return this.decodeFromImage(undefined, imageData);
          }
        } catch (error) {
          return Promise.reject(error);
        }
      };
    }
    
    log('ZXing library initialized and extended with compatibility methods');
  } catch (error) {
    console.error('Error initializing ZXing:', error);
  }
}

// Log messages to debug console
function log(message, obj = null) {
  const timestamp = new Date().toISOString().slice(11, 23);
  let logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage, obj || '');
  
  if (obj) {
    if (typeof obj === 'object') {
      logMessage += '\n' + JSON.stringify(obj, null, 2);
    } else {
      logMessage += '\n' + obj;
    }
  }
  
  debugInfo.textContent += logMessage + '\n';
  debugInfo.scrollTop = debugInfo.scrollHeight;
}

// Setup Event Listeners
function setupEventListeners() {
  // Initially disable the decode button until an image is loaded
  decodeQrBtn.disabled = true;
  
  // Initialize window.encryptedQRData for storing encrypted data while waiting for password
  window.encryptedQRData = null;
  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(`${tab.dataset.tab}-content`).classList.add('active');
    });
  });
  
  // P2P tab switching
  p2pModeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      p2pModeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      if (btn.dataset.mode === 'send') {
        sendPanel.classList.add('active');
        receivePanel.classList.remove('active');
      } else {
        sendPanel.classList.remove('active');
        receivePanel.classList.add('active');
      }
    });
  });
  
  // Debug toggle
  debugToggle.addEventListener('click', () => {
    debugInfo.style.display = debugInfo.style.display === 'none' ? 'block' : 'none';
  });
  
  // Setup drop areas
  setupDropArea(fileDropArea, fileInput, (file) => {
    readTextFile(file, encodeInput, fileInfo);
  });
  
  setupDropArea(qrDropArea, qrInput, (file) => {
    if (file.type.startsWith('image/')) {
      loadQRImage(file);
    } else {
      decodeMessage.textContent = 'Please select an image file';
      decodeMessage.className = 'message error';
    }
  });
  
  setupDropArea(p2pFileDropArea, p2pFileInput, (file) => {
    readTextFile(file, p2pInput, p2pFileInfo);
  });
  
  // Button event listeners
  fileSelectBtn.addEventListener('click', () => fileInput.click());
  qrSelectBtn.addEventListener('click', () => qrInput.click());
  p2pFileSelectBtn.addEventListener('click', () => p2pFileInput.click());
  
  generateQrBtn.addEventListener('click', generateQRCode);
  clearEncodeBtn.addEventListener('click', clearEncode);
  decodeQrBtn.addEventListener('click', decodeQRFromFile);
  clearDecodeBtn.addEventListener('click', clearDecode);
  downloadQrBtn.addEventListener('click', downloadQRCode);
  downloadDecodedBtn.addEventListener('click', () => downloadTextFile(decodeOutput, 'decoded-data.txt'));
  
  // Trigger decode on Enter in password field
  decodePassword.addEventListener('keyup', (event) => {
    if (event.key === 'Enter' && window.encryptedQRData) {
      decodeQRFromFile();
    }
  });
  
  // Update received data preview when password changes for P2P mode
  p2pReceivePassword.addEventListener('input', () => {
    // If we have received chunks, update display whenever password changes
    if (Object.keys(receivedChunks).length > 0) {
      // Remove the highlight once user starts typing
      p2pReceivePassword.classList.remove('needs-password'); 
      
      // Update display with new password
      updatePartialReceivedData();
      
      // Log for debugging
      log('Updating display with new password', {
        chunks: Object.keys(receivedChunks).length,
        hasPassword: p2pReceivePassword.value.length > 0
      });
    }
  });
  
  startCameraBtn.addEventListener('click', startCamera);
  stopCameraBtn.addEventListener('click', stopCamera);
  takePhotoBtn.addEventListener('click', takePhoto);
  
  startTransferBtn.addEventListener('click', startTransfer);
  stopTransferBtn.addEventListener('click', stopTransfer);
  manualNavBtn.addEventListener('click', toggleManualNavigation);
  prevChunkBtn.addEventListener('click', showPreviousChunk);
  nextChunkBtn.addEventListener('click', showNextChunk);
  startReceivingBtn.addEventListener('click', startReceiving);
  stopReceivingBtn.addEventListener('click', stopReceiving);
  
  // Download clean data without chunk markers
  downloadReceivedBtn.addEventListener('click', () => {
    // Check if we have clean data in the receivedData textarea
    if (receivedData.value && receivedData.value.trim() !== '') {
      downloadTextFile(receivedData, 'received-data.txt');
    } else {
      alert('No clean data available to download yet.');
    }
  });
  
  // Download the raw log with chunk information
  if (downloadRawLogBtn) {
    downloadRawLogBtn.addEventListener('click', () => {
      if (chunkLog && chunkLog.value && chunkLog.value.trim() !== '') {
        downloadTextFile(chunkLog, 'reception-log.txt');
      } else {
        alert('No reception log available to download.');
      }
    });
  }
  
  // Force decode button - try to decode with current data even if incomplete
  forceDecodeBtn.addEventListener('click', () => {
    log('Force decode requested');
    receiveStatus.textContent = 'Forcing decode with available chunks...';
    assembleAndDecryptData(true); // Force final assembly
  });
  
  // Manual QR code entry
  manualEntryBtn.addEventListener('click', () => {
    log('Manual entry requested');
    manualEntryForm.style.display = 'block';
    manualQrData.focus();
  });
  
  cancelManualEntryBtn.addEventListener('click', () => {
    manualEntryForm.style.display = 'none';
    manualQrData.value = '';
  });
  
  submitManualDataBtn.addEventListener('click', () => {
    const data = manualQrData.value.trim();
    if (data) {
      log('Processing manually entered QR data', {length: data.length});
      processP2PChunk(data);
      manualQrData.value = '';
      manualEntryForm.style.display = 'none';
    } else {
      alert('Please paste QR code data first');
    }
  });
  
  // Take a single snapshot for testing
  p2pSnapshotBtn.addEventListener('click', () => {
    if (!p2pVideo.srcObject) {
      log('Cannot take snapshot - video not active');
      return;
    }
    
    log('Taking manual snapshot from P2P camera');
    
    try {
      // Create canvas and capture image
      const canvas = document.createElement('canvas');
      canvas.width = p2pVideo.videoWidth;
      canvas.height = p2pVideo.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(p2pVideo, 0, 0, canvas.width, canvas.height);
      
      // Use our multi-method approach to decode
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Add visual feedback
      receiveStatus.textContent = 'Processing snapshot...';
      
      // Create a visible snapshot for debugging
      const dataUrl = canvas.toDataURL('image/png');
      const snapshotImg = new Image();
      snapshotImg.src = dataUrl;
      snapshotImg.style.maxWidth = '200px';
      snapshotImg.style.border = '1px solid white';
      document.querySelector('.camera-container').appendChild(snapshotImg);
      
      // Try to decode with all methods
      try {
        // Method 1: Using our enhanced decode methods
        decodeWithMultipleMethods(canvas, imageData)
          .then(result => {
            if (result && result.text) {
              processP2PChunk(result.text);
            } else {
              log('No QR code found in snapshot');
              receiveStatus.textContent = 'No QR code found in snapshot';
            }
          })
          .catch(err => {
            log('Error decoding snapshot', {error: err.message});
            receiveStatus.textContent = 'Error decoding snapshot: ' + err.message;
          });
      } catch (error) {
        log('Error processing snapshot', {error: error.message});
        receiveStatus.textContent = 'Error processing snapshot: ' + error.message;
      }
    } catch (error) {
      log('Snapshot error', {error: error.message});
      receiveStatus.textContent = 'Error taking snapshot: ' + error.message;
    }
  });
  
  // Display interval
  displayInterval.addEventListener('input', () => {
    intervalValue.textContent = displayInterval.value + 's';
  });
  
  // Update chunk size information when slider changes
  chunkSizeSlider.addEventListener('input', () => {
    const selectedSize = parseInt(chunkSizeSlider.value);
    chunkSizeValue.textContent = `${selectedSize} bytes`;
    updateCapacityInfo();
    log('Chunk size changed', {size: selectedSize});
    
    // Change color based on size
    if (selectedSize <= 300) {
      chunkSizeValue.style.color = 'var(--success)';  // Green for small sizes
    } else if (selectedSize <= 1000) {
      chunkSizeValue.style.color = 'var(--terminal-green)';  // Normal for medium
    } else if (selectedSize <= 2000) {
      chunkSizeValue.style.color = 'var(--info)';  // Blue for larger
    } else {
      chunkSizeValue.style.color = 'var(--warning)';  // Yellow/orange for largest
    }
  });
  
  // Debug button for P2P transfer
  debugP2PBtn.addEventListener('click', () => {
    // Debug info to console
    console.log('P2P Chunks:', p2pChunks);
    console.log('Current Index:', currentChunkIndex);
    console.log('Transfer Active:', transferActive);
    
    // Debug info to page
    debugInfo.style.display = 'block';
    log('--- P2P DEBUG INFO ---');
    log('Current Chunk Index: ' + currentChunkIndex);
    log('Transfer Active: ' + transferActive);
    log('Total Chunks: ' + (p2pChunks ? p2pChunks.length : 'none'));
    
    // Library information
    log('Library status:', {
      qrcode: typeof QRCode,
      zxing: typeof ZXing,
      cryptojs: typeof CryptoJS
    });
    
    // Test creating a simple QR code directly in debug area
    try {
      const testDiv = document.createElement('div');
      testDiv.style.backgroundColor = 'white';
      testDiv.style.padding = '5px';
      testDiv.style.display = 'inline-block';
      testDiv.style.margin = '5px 0';
      
      if (typeof QRCode === 'function') {
        log('Testing QR code generation with simple text');
        const testQR = new QRCode(testDiv, {
          text: 'TEST-QR-CODE',
          width: 100,
          height: 100
        });
        
        debugInfo.appendChild(document.createTextNode('Test QR:'));
        debugInfo.appendChild(testDiv);
        
        if (testDiv.querySelector('img')) {
          log('Test QR code generated successfully');
        } else {
          log('Test QR code failed to generate an image');
        }
      } else {
        log('Cannot test QR code generation - library not available');
      }
    } catch (e) {
      log('Test QR generation error:', {error: e.message});
    }
    
    // Force display if chunks exist
    if (p2pChunks && p2pChunks.length > 0) {
      log('Forcing display of current chunk');
      // Make sure index is valid
      if (currentChunkIndex >= p2pChunks.length) {
        currentChunkIndex = 0;
      }
      
      try {
        // Clear the QR container first
        p2pQrcodeContainer.innerHTML = '';
        
        // Try direct method first for debugging
        const testQRData = p2pChunks[currentChunkIndex];
        log('Chunk data sample:', {
          length: testQRData.length,
          sample: testQRData.substring(0, 30) + '...'
        });
        
        // Attempt to create QR with direct DOM manipulation
        createFallbackQRCode(p2pQrcodeContainer, testQRData);
        
        // Then try normal method
        setTimeout(() => {
          displayCurrentChunk();
        }, 500);
      } catch (err) {
        log('Error during debug QR creation:', {error: err.message});
        sendStatus.textContent = 'Error during debug: ' + err.message;
      }
    } else {
      log('No chunks to display');
      sendStatus.textContent = 'No chunks to display. Create chunks first.';
    }
  });
  
  // Input events for capacity check
  encodeInput.addEventListener('input', updateCapacityInfo);
  p2pInput.addEventListener('input', updateCapacityInfo);
  
  // Floating QR code controls
  floatingQrClose.addEventListener('click', () => {
    floatingQrContainer.style.display = 'none';
  });
  
  // Store reference to the popup window
  let qrPopupWindow = null;
  
  // Function to open QR code in a new window
  function openQrInNewWindow() {
    // Close any existing popup
    if (qrPopupWindow && !qrPopupWindow.closed) {
      qrPopupWindow.close();
    }
    
    // Get the QR code image from floating container
    const qrImg = floatingQrContent.querySelector('img');
    if (!qrImg) {
      log('No QR code image found to open in new window');
      return;
    }
    
    // Get the image source (data URL)
    const qrSrc = qrImg.src;
    const counter = floatingQrCounter.textContent;
    
    // Open a new window with the QR window HTML
    qrPopupWindow = window.open(
      `qr-window.html?qr=${encodeURIComponent(qrSrc)}&counter=${encodeURIComponent(counter)}`,
      'QRCodeWindow',
      'width=600,height=600,resizable=yes,scrollbars=no,toolbar=no,menubar=no,status=no,location=no'
    );
    
    // Focus the window if opened successfully
    if (qrPopupWindow) {
      qrPopupWindow.focus();
      log('Opened QR code in new window');
    } else {
      log('Failed to open QR code window - popup may be blocked');
      alert('Popup blocked! Please allow popups for this site to open the QR code in a new window.');
    }
  }
  
  // Update QR in popup window if it exists
  function updateQrInPopup() {
    if (qrPopupWindow && !qrPopupWindow.closed) {
      const qrImg = floatingQrContent.querySelector('img');
      if (qrImg) {
        // Send message to update the QR code
        qrPopupWindow.postMessage({
          type: 'updateQR',
          qr: qrImg.src,
          counter: floatingQrCounter.textContent
        }, '*');
        
        log('Updated QR code in popup window');
      }
    }
  }
  
  // Add event listener to open QR in new window
  openQrWindowBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openQrInNewWindow();
  });
  
  // Close popup window when floating QR is closed
  floatingQrClose.addEventListener('click', () => {
    if (qrPopupWindow && !qrPopupWindow.closed) {
      qrPopupWindow.close();
      qrPopupWindow = null;
    }
  });
  
  // Close popup window when page unloads
  window.addEventListener('beforeunload', () => {
    if (qrPopupWindow && !qrPopupWindow.closed) {
      qrPopupWindow.close();
    }
  });
}


// ======= Part 2 =======
// Drop area handling
function setupDropArea(dropArea, fileInput, handleFile) {
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
  });
  
  ['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => {
      dropArea.classList.add('active');
    }, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => {
      dropArea.classList.remove('active');
    }, false);
  });
  
  dropArea.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, false);
  
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// File handling
function readTextFile(file, targetElement, infoElement) {
  const reader = new FileReader();
  reader.onload = function(e) {
    targetElement.value = e.target.result;
    if (infoElement) {
      infoElement.textContent = `File: ${file.name} (${formatBytes(file.size)})`;
    }
    updateCapacityInfo();
    log('File read successfully', {name: file.name, size: file.size});
  };
  reader.readAsText(file);
}

function loadQRImage(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    imagePreview.innerHTML = `<img src="${e.target.result}" alt="QR Code">`;
    decodeMessage.textContent = `Image loaded: ${file.name}. Click 'Decode QR Code' to process.`;
    decodeMessage.className = 'message info';
    log('QR image loaded', {name: file.name});
    
    // Enable decode button when image is loaded
    decodeQrBtn.disabled = false;
  };
  reader.readAsDataURL(file);
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Camera handling
async function initCameraSelection() {
  try {
    log('Initializing camera selection...');
    
    // Always show camera selection containers
    cameraSelectContainer.style.display = 'block';
    p2pCameraSelectContainer.style.display = 'block';
    
    // Add placeholders
    const cameraOptions = document.getElementById('camera-options');
    const p2pCameraOptions = document.getElementById('p2p-camera-options');
    
    cameraOptions.innerHTML = '<div class="camera-placeholder">Click "Start Camera" to see available devices</div>';
    p2pCameraOptions.innerHTML = '<div class="camera-placeholder">Click "Start Receiving" to see available devices</div>';
    
    // Add event delegation for camera selection
    cameraOptions.addEventListener('click', function(event) {
      const option = event.target.closest('.camera-option');
      if (option) {
        // Remove selected class from all options
        const allOptions = cameraOptions.querySelectorAll('.camera-option');
        allOptions.forEach(opt => opt.classList.remove('selected'));
        
        // Select this option
        option.classList.add('selected');
        
        // Get the camera ID
        selectedCamera = option.dataset.deviceId;
        log('Camera changed', {id: selectedCamera});
        
        // Restart camera if it's already running
        if (stream) {
          stopCamera();
          startCamera();
        }
      }
    });
    
    // Similar for P2P camera options
    p2pCameraOptions.addEventListener('click', function(event) {
      const option = event.target.closest('.camera-option');
      if (option) {
        // Remove selected class from all options
        const allOptions = p2pCameraOptions.querySelectorAll('.camera-option');
        allOptions.forEach(opt => opt.classList.remove('selected'));
        
        // Select this option
        option.classList.add('selected');
        
        // Get the camera ID
        selectedP2PCamera = option.dataset.deviceId;
        log('P2P camera changed', {id: selectedP2PCamera});
        
        // Restart camera if it's already running
        if (p2pStream) {
          stopReceiving();
          startReceiving();
        }
      }
    });
    
    log('Camera selection initialized');
  } catch (error) {
    log('Camera initialization error', {error: error.message});
  }
}

// This function will be called when actually getting camera access
async function refreshCameraList(isP2P = false) {
  const optionsContainer = isP2P 
    ? document.getElementById('p2p-camera-options') 
    : document.getElementById('camera-options');
  
  try {
    log('Refreshing camera list...');
    
    optionsContainer.innerHTML = '<div class="camera-placeholder">Detecting cameras...</div>';
    
    // First try to enumerate devices without specific permissions
    // This sometimes works and avoids unnecessary permission prompts
    try {
      const initialDevices = await navigator.mediaDevices.enumerateDevices();
      log('Initial enumeration, checking for video devices', { count: initialDevices.filter(d => d.kind === 'videoinput').length });
    } catch (error) {
      log('Initial enumeration failed, will try with permissions', { error: error.message });
    }
    
    // Request camera permission with specific constraints for Linux systems
    let tempStream = null;
    try {
      // Try to get all camera types
      const videoConstraints = {
        video: {
          // Auto-detect available cameras with different facing modes
          facingMode: { ideal: ["user", "environment"] },
          // Request high-resolution to help identify multiple cameras
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      
      tempStream = await navigator.mediaDevices.getUserMedia(videoConstraints);
      log('Temporary camera stream established with advanced options');
    } catch (error) {
      log('Error getting camera with advanced constraints, trying basic constraints', {error: error.message});
      
      try {
        // Fall back to basic permission request
        tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        log('Temporary camera stream established with basic options');
      } catch (fallbackError) {
        log('Error getting basic camera permission', {error: fallbackError.message});
      }
    }

    // Now get the complete list of devices with proper labels
    let videoDevices = [];
    try {
      // Track all device IDs we've seen to avoid duplicates
      const seenDeviceIds = new Set();
      
      // Try multiple enumeration attempts to ensure we get all devices
      // Some Linux systems need a delay after getUserMedia before labels appear
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      // Filter unique video devices
      videoDevices = devices.filter(device => {
        if (device.kind === 'videoinput' && !seenDeviceIds.has(device.deviceId)) {
          seenDeviceIds.add(device.deviceId);
          return true;
        }
        return false;
      });
      
      // If we have a stream but no labeled devices, try one more time after a short delay
      if (tempStream && videoDevices.length > 0 && !videoDevices.some(d => d.label)) {
        log('Got devices but no labels, trying again after delay');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        const refreshedDevices = await navigator.mediaDevices.enumerateDevices();
        
        // Reset our device list with this fresh data
        seenDeviceIds.clear();
        videoDevices = refreshedDevices.filter(device => {
          if (device.kind === 'videoinput' && !seenDeviceIds.has(device.deviceId)) {
            seenDeviceIds.add(device.deviceId);
            return true;
          }
          return false;
        });
      }
      
      log('Video devices found', {
        count: videoDevices.length, 
        devices: videoDevices.map(d => ({
          id: d.deviceId.substring(0, 8) + '...', 
          label: d.label || 'unlabeled'
        }))
      });
    } catch (error) {
      log('Error enumerating devices', {error: error.message});
      videoDevices = [];
    }
    
    // Clean up temporary stream if we created one
    if (tempStream) {
      tempStream.getTracks().forEach(track => track.stop());
    }
    
    // Clear existing options
    optionsContainer.innerHTML = '';
    
    if (videoDevices.length === 0) {
      const noDevicesMsg = document.createElement('div');
      noDevicesMsg.className = 'camera-placeholder';
      noDevicesMsg.textContent = 'No cameras found';
      optionsContainer.appendChild(noDevicesMsg);
      return;
    }
    
    // Check if we have real labels (not empty strings)
    const hasRealLabels = videoDevices.some(device => device.label && device.label.trim() !== '');
    
    if (!hasRealLabels) {
      log('No labeled devices found, using generic names');
    }
    
    // Add camera options as radio buttons within labeled divs
    let selectedDeviceId = isP2P ? selectedP2PCamera : selectedCamera;
    let firstOption = null;
    let selectedOption = null;
    
    // Add special "Auto" option for attempting to auto-detect the best camera
    const autoOption = document.createElement('label');
    autoOption.className = 'camera-option auto-option';
    autoOption.dataset.deviceId = 'auto';
    autoOption.textContent = 'Auto-detect Best Camera';
    optionsContainer.appendChild(autoOption);
    
    if (!selectedDeviceId) {
      autoOption.classList.add('selected');
      selectedDeviceId = 'auto';
      selectedOption = autoOption;
    } else if (selectedDeviceId === 'auto') {
      autoOption.classList.add('selected');
      selectedOption = autoOption;
    }
    
    // Generate more helpful camera names based on what we know
    videoDevices.forEach((device, index) => {
      const option = document.createElement('label');
      option.className = 'camera-option';
      option.dataset.deviceId = device.deviceId;
      
      // Use meaningful label if available, or create a descriptive name
      let cameraName;
      
      if (device.label && device.label.trim() !== '') {
        cameraName = device.label;
      } else {
        if (videoDevices.length === 1) {
          cameraName = 'Default Camera';
        } else if (index === 0) {
          cameraName = 'Primary Camera';
        } else {
          cameraName = `Camera ${index + 1}`;
        }
      }
      
      // Add camera position hint if possible
      if (cameraName.toLowerCase().includes('front') || 
          cameraName.toLowerCase().includes('user') || 
          cameraName.toLowerCase().includes('facetime')) {
        // It's likely a front-facing camera
        if (!cameraName.toLowerCase().includes('front')) {
          cameraName += ' (Front)';
        }
      } else if (cameraName.toLowerCase().includes('back') || 
                cameraName.toLowerCase().includes('rear') ||
                cameraName.toLowerCase().includes('environment')) {
        // It's likely a back-facing camera
        if (!cameraName.toLowerCase().includes('back') && 
            !cameraName.toLowerCase().includes('rear')) {
          cameraName += ' (Back)';
        }
      } else {
        // Check device index for hints
        if (videoDevices.length > 1) {
          if (index === 0) {
            cameraName += ' (Likely Front)';
          } else if (index === 1) {
            cameraName += ' (Likely Back)';
          }
        }
      }
      
      option.textContent = cameraName;
      optionsContainer.appendChild(option);
      
      if (index === 0) {
        firstOption = option;
      }
      
      // Select this device if it matches the previously selected one
      if (selectedDeviceId && device.deviceId === selectedDeviceId) {
        selectedOption = option;
      }
    });
    
    // Apply selection
    if (selectedOption) {
      selectedOption.classList.add('selected');
    } else if (firstOption) {
      firstOption.classList.add('selected');
      selectedDeviceId = firstOption.dataset.deviceId;
    }
    
    // Update selection variables
    if (isP2P) {
      selectedP2PCamera = selectedDeviceId;
      log('Selected P2P camera', {
        deviceId: selectedDeviceId === 'auto' ? 'auto' : (selectedDeviceId.substring(0, 8) + '...')
      });
    } else {
      selectedCamera = selectedDeviceId;
      log('Selected camera', {
        deviceId: selectedDeviceId === 'auto' ? 'auto' : (selectedDeviceId.substring(0, 8) + '...')
      });
    }
    
    log('Camera options populated', {cameras: videoDevices.length, hasRealLabels});
  } catch (error) {
    log('Error refreshing camera list', {error: error.message});
    // Add a fallback option
    optionsContainer.innerHTML = '';
    const errorMsg = document.createElement('div');
    errorMsg.className = 'camera-placeholder error';
    errorMsg.textContent = 'Camera error: ' + error.message;
    optionsContainer.appendChild(errorMsg);
  }
}

// Capacity calculation
function updateCapacityInfo() {
  // Check which tab is active
  const isEncodeTab = document.getElementById('encode-content').classList.contains('active');
  const data = isEncodeTab ? encodeInput.value : p2pInput.value;
  const password = isEncodeTab ? encodePassword.value : p2pPassword.value;
  
  if (!data) {
    if (isEncodeTab) {
      encodeProgress.style.width = '0%';
      capacityInfo.textContent = '0 / ' + MAX_QR_CAPACITY + ' bytes (0%)';
    }
    return;
  }
  
  // Calculate size with encryption if password is provided
  let finalData = data;
  if (password) {
    finalData = encryptData(data, password);
  }
  
  const dataSize = new Blob([finalData]).size;
  const percentage = Math.min(100, (dataSize / MAX_QR_CAPACITY) * 100);
  
  if (isEncodeTab) {
    // Update progress bar and capacity info for encode tab
    encodeProgress.style.width = percentage + '%';
    capacityInfo.textContent = `${dataSize} / ${MAX_QR_CAPACITY} bytes (${Math.round(percentage)}%)`;
    
    // Change color based on usage
    if (percentage > 90) {
      encodeProgress.className = 'progress-bar danger';
    } else if (percentage > 70) {
      encodeProgress.className = 'progress-bar warning';
    } else {
      encodeProgress.className = 'progress-bar';
    }
  } else {
    // For P2P tab, get the currently selected chunk size from slider
    const selectedChunkSize = parseInt(chunkSizeSlider.value);
    
    // Calculate estimated metadata size and effective chunk size
    const metadataEstimate = 50; // Rough estimate for metadata
    const effectiveChunkSize = selectedChunkSize - metadataEstimate;
    
    if (dataSize > MAX_QR_CAPACITY) {
      const estimatedChunks = Math.ceil(dataSize / effectiveChunkSize);
      
      // Add warning for very high chunk counts
      let statusMessage = `Using ${selectedChunkSize} byte chunks: Will create ${estimatedChunks} QR codes`;
      
      if (estimatedChunks > 50) {
        statusMessage += ` (WARNING: High number of codes!)`;
        sendStatus.className = 'warning';
      } else if (estimatedChunks > 20) {
        statusMessage += ` (Note: Moderate number of codes)`;
        sendStatus.className = '';
      } else {
        sendStatus.className = '';
      }
      
      sendStatus.textContent = statusMessage;
    } else {
      sendStatus.textContent = `Data size: ${dataSize} bytes (fits in a single QR code)`;
      sendStatus.className = '';
    }
  }
}

// QR Code Generation
function generateQRCode() {
  const data = encodeInput.value.trim();
  const password = encodePassword.value;
  
  if (!data) {
    encodeMessage.textContent = 'Please enter some data to encode';
    encodeMessage.className = 'message error';
    return;
  }
  
  try {
    // Clear previous QR code
    qrcodeContainer.innerHTML = '';
    
    // Encrypt data if password is provided
    const finalData = password ? encryptData(data, password) : data;
    
    // Check if data size is too large
    const dataSize = new Blob([finalData]).size;
    if (dataSize > MAX_QR_CAPACITY) {
      encodeMessage.textContent = `Data size (${dataSize} bytes) exceeds maximum QR code capacity (${MAX_QR_CAPACITY} bytes). Use P2P Transfer tab for large files.`;
      encodeMessage.className = 'message error';
      log('Data too large for single QR code', {size: dataSize, max: MAX_QR_CAPACITY});
      return;
    }
    
    // Create new QR code
    qrInstance = new QRCode(qrcodeContainer, {
      text: finalData,
      width: 256,
      height: 256,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.L // Using lowest correction level for maximum capacity
    });
    
    // Show success message
    encodeMessage.textContent = `QR code generated successfully. Size: ${dataSize} bytes`;
    encodeMessage.className = 'message success';
    
    // Show download button
    downloadQrBtn.style.display = 'block';
    
    log('QR code generated', {size: dataSize, encrypted: !!password});
  } catch (error) {
    encodeMessage.textContent = `Error generating QR code: ${error.message}`;
    encodeMessage.className = 'message error';
    log('QR generation error', {error: error.message});
  }
}

// Encryption Functions
function encryptData(data, password) {
  try {
    // Add a prefix to identify encrypted data
    const encryptedData = CryptoJS.AES.encrypt(data, password).toString();
    log('Data encrypted successfully');
    return `ENCRYPTED:${encryptedData}`;
  } catch (error) {
    log('Encryption error', {error: error.message});
    throw new Error('Encryption failed: ' + error.message);
  }
}

function decryptData(encryptedData, password) {
  try {
    // Check if data is encrypted
    if (!encryptedData || typeof encryptedData !== 'string') {
      throw new Error('Invalid data format for decryption');
    }
    
    // Log first part of data for debugging
    log('Attempting to decrypt data', {
      startsWithPrefix: encryptedData.startsWith('ENCRYPTED:'),
      dataLength: encryptedData.length,
      passwordLength: password ? password.length : 0,
      firstChars: encryptedData.substring(0, 20) + '...'
    });
    
    if (!encryptedData.startsWith('ENCRYPTED:')) {
      return encryptedData;
    }
    
    // Remove the prefix and decrypt
    const encryptedContent = encryptedData.substring(10);
    
    // Check if the content is a valid base64 format for CryptoJS
    if (!encryptedContent || encryptedContent.length < 10) {
      throw new Error('Encrypted content is too short or invalid');
    }
    
    // Perform decryption
    const decrypted = CryptoJS.AES.decrypt(encryptedContent, password).toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      throw new Error('Invalid password or corrupted data');
    }
    
    log('Decryption successful', {
      resultLength: decrypted.length,
      firstDecryptedChars: decrypted.substring(0, 20) + '...'
    });
    
    return decrypted;
  } catch (error) {
    log('Decryption error', {
      error: error.message,
      errorType: error.name,
      passwordProvided: !!password
    });
    throw new Error('Decryption failed: Incorrect password or corrupted data');
  }
}

// Generate MD5 hash for data integrity
function generateMD5(data) {
  return CryptoJS.MD5(data).toString();
}

// Check if all libraries are loaded and app can run offline
function checkOfflineCapability() {
  try {
    // Check if all required libraries are loaded
    const librariesLoaded = (
      typeof QRCode !== 'undefined' &&
      typeof ZXing !== 'undefined' &&
      typeof CryptoJS !== 'undefined'
    );
    
    if (librariesLoaded) {
      log('All libraries loaded successfully - application is ready for offline use');
      
      // Add offline indicator to footer
      const footer = document.querySelector('footer p');
      if (footer) {
        footer.innerHTML += ' <span style="color: #00ff00;">•</span> OFFLINE READY';
      }
    } else {
      log('WARNING: Some libraries failed to load - offline operation may not work', {
        QRCode: typeof QRCode !== 'undefined',
        ZXing: typeof ZXing !== 'undefined',
        CryptoJS: typeof CryptoJS !== 'undefined'
      });
    }
  } catch (error) {
    log('Error checking offline capability', {error: error.message});
  }
}


// ======= Part 3 =======
// Camera functions
async function startCamera() {
  try {
    log('Starting camera...');
    decodeMessage.textContent = 'Requesting camera access...';
    decodeMessage.className = 'message info';
    
    // WSL DETECTION: Check if we're likely running in WSL
    const isWSL = window.location.href.includes('/mnt/') || 
                 navigator.userAgent.toLowerCase().includes('linux');
    
    log('Environment detection', { isLikelyWSL: isWSL });
    
    // First get access to any camera to trigger permission request
    try {
      // Check if we're in auto mode
      if (selectedCamera === 'auto' || !selectedCamera) {
        // In WSL, use simpler constraints to avoid issues
        if (isWSL) {
          log('Using simple constraints for WSL environment');
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: true,
            audio: false 
          });
        } else {
          // Try to get the environment-facing (back) camera first as it's usually better for QR codes
          try {
            log('Trying to access environment-facing camera first');
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: "environment" } },
              audio: false
            });
            log('Successfully accessed environment-facing camera');
          } catch (envError) {
            log('Failed to access environment camera, falling back to any available camera', { error: envError.message });
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          }
        }
      } else {
        // Use the specifically selected camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: selectedCamera } },
          audio: false
        });
        log('Started camera with selected device', {deviceId: selectedCamera});
      }
      
      // Now refresh the camera list with actual device names
      await refreshCameraList(false);
      
      // Show the video stream
      video.srcObject = stream;
      video.style.display = 'block';
      startCameraBtn.style.display = 'none';
      stopCameraBtn.style.display = 'inline-block';
      takePhotoBtn.style.display = 'inline-block';
      
      decodeMessage.textContent = 'Camera activated. Ready to scan QR codes.';
      decodeMessage.className = 'message success';
      log('Camera started successfully', {
        deviceId: selectedCamera === 'auto' ? 'auto-detected' : selectedCamera
      });
      
      // For WSL environments, add a note about limitations
      if (isWSL) {
        log('Note: In WSL environments, camera access is limited by Windows. You may only see one camera.');
        decodeMessage.textContent += ' Note: Limited camera selection may be available in WSL environments.';
      }
    } catch (error) {
      log('Error starting camera with specific settings, trying basic camera access', {error: error.message});
      
      // Fallback to any camera if specific selection fails
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        // Show the video stream
        video.srcObject = stream;
        video.style.display = 'block';
        startCameraBtn.style.display = 'none';
        stopCameraBtn.style.display = 'inline-block';
        takePhotoBtn.style.display = 'inline-block';
        
        decodeMessage.textContent = 'Camera activated with fallback settings. Ready to scan QR codes.';
        decodeMessage.className = 'message success';
        log('Camera started with fallback', { camera: 'default' });
      } catch (fallbackError) {
        throw fallbackError; // Rethrow to be caught by the outer catch
      }
    }
  } catch (error) {
    decodeMessage.textContent = `Error accessing camera: ${error.message}`;
    decodeMessage.className = 'message error';
    log('Camera access error', {error: error.message});
    
    // On Linux, sometimes permissions are an issue - give specific guidance
    if (error.name === 'NotAllowedError') {
      decodeMessage.textContent = 'Camera access denied. Please check your browser permissions and try again.';
    } else if (error.name === 'NotFoundError') {
      decodeMessage.textContent = 'No cameras found. Please check your camera connections and try again.';
    } else if (error.name === 'NotReadableError') {
      decodeMessage.textContent = 'Camera may be in use by another application. Please close other camera apps and try again.';
    }
  }
}

function stopCamera() {
  if (stream) {
    log('Stopping camera...');
    stream.getTracks().forEach(track => track.stop());
    video.srcObject = null;
    video.style.display = 'none';
  }
  
  startCameraBtn.style.display = 'inline-block';
  stopCameraBtn.style.display = 'none';
  takePhotoBtn.style.display = 'none';
  
  log('Camera stopped');
}

function takePhoto() {
  if (!video.srcObject) {
    decodeMessage.textContent = 'Camera is not active';
    decodeMessage.className = 'message error';
    return;
  }
  
  try {
    log('Taking photo from camera...');
    
    // Create canvas and capture image
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Display preview
    const dataUrl = canvas.toDataURL('image/png');
    imagePreview.innerHTML = `<img src="${dataUrl}" alt="Captured QR Code">`;
    
    // Decode QR code
    decodeQRFromCanvas(canvas);
  } catch (error) {
    decodeMessage.textContent = `Error capturing image: ${error.message}`;
    decodeMessage.className = 'message error';
    log('Photo capture error', {error: error.message});
  }
}

// QR Code Decoding
function decodeQRFromCanvas(canvas) {
  try {
    log('Decoding QR from canvas...');
    
    // Get image data from canvas
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Try multiple methods to decode the QR code
    decodeWithMultipleMethods(canvas, imageData);
  } catch (error) {
    decodeMessage.textContent = `Error processing image: ${error.message}`;
    decodeMessage.className = 'message error';
    log('Canvas processing error', {error: error.message});
  }
}

// Try multiple decoding methods for better compatibility across ZXing versions
function decodeWithMultipleMethods(canvas, imageData) {
  log('Attempting to decode with multiple methods...');
  
  // Method 1: Try decodeFromImageData (our wrapper function)
  tryDecodeMethod(() => codeReader.decodeFromImageData(imageData), 'decodeFromImageData')
    .catch(() => {
      // Method 2: Try decoding using canvas element
      return tryDecodeMethod(() => codeReader.decodeFromImage(canvas), 'decodeFromImage with canvas');
    })
    .catch(() => {
      // Method 3: Create a new image from the canvas and try with that
      const img = new Image();
      img.src = canvas.toDataURL();
      return new Promise((resolve, reject) => {
        img.onload = () => {
          tryDecodeMethod(() => codeReader.decodeFromImage(img), 'decodeFromImage with Image')
            .then(resolve)
            .catch(reject);
        };
        img.onerror = reject;
      });
    })
    .catch(() => {
      // Method 4: Try with a plain bitmap
      if (typeof ZXing.HTMLCanvasElementLuminanceSource !== 'undefined') {
        try {
          const luminanceSource = new ZXing.HTMLCanvasElementLuminanceSource(canvas);
          const binaryBitmap = new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(luminanceSource));
          return tryDecodeMethod(() => Promise.resolve(codeReader.decode(binaryBitmap)), 'direct bitmap decode');
        } catch (e) {
          return Promise.reject(e);
        }
      }
      return Promise.reject(new Error('All decoding methods failed'));
    })
    .catch(error => {
      decodeMessage.textContent = 'No QR code could be found in the image';
      decodeMessage.className = 'message error';
      log('All decode methods failed', {error: error.message});
      
      // Show debug info to help troubleshoot
      debugInfo.style.display = 'block';
    });
}

// Helper to try a specific decode method and process the result
function tryDecodeMethod(decodeFn, methodName) {
  return new Promise((resolve, reject) => {
    try {
      Promise.resolve(decodeFn())
        .then(result => {
          if (result) {
            log(`QR code detected using ${methodName}`, {format: result.format || 'unknown'});
            processQRCodeResult(result.text);
            resolve(result);
          } else {
            reject(new Error(`No result with ${methodName}`));
          }
        })
        .catch(error => {
          log(`Method ${methodName} failed`, {error: error.message});
          reject(error);
        });
    } catch (error) {
      log(`Error in ${methodName}`, {error: error.message});
      reject(error);
    }
  });
}

function decodeQRFromFile() {
  // If we already have stored encrypted data and password is provided, process it directly
  if (window.encryptedQRData && decodePassword.value) {
    log('Processing stored encrypted data with provided password');
    processQRCodeResult(window.encryptedQRData);
    return;
  }
  
  const img = imagePreview.querySelector('img');
  if (!img) {
    decodeMessage.textContent = 'Please select a QR code image first';
    decodeMessage.className = 'message error';
    return;
  }
  
  log('Decoding QR from image file...');
  decodeMessage.textContent = 'Processing image...';
  decodeMessage.className = 'message info';
  
  try {
    // Create canvas from image for more reliable decoding
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Try all our decoding methods using the canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    decodeWithMultipleMethods(canvas, imageData);
  } catch (error) {
    decodeMessage.textContent = `Error decoding QR code: ${error.message}`;
    decodeMessage.className = 'message error';
    log('Decode error', {error: error.message});
  }
}

function processQRCodeResult(data) {
  try {
    log('Processing QR code result', {length: data.length});
    
    // Check if it's a chunk with MD5
    const chunkRegex = /\[CHUNK_(\d{3})_OF_(\d{3})\]\[MD5_([a-f0-9]{32})\](.*)/s;
    const match = data.match(chunkRegex);
    
    if (match) {
      // This is a chunked QR code with MD5
      decodeMessage.textContent = 'This appears to be part of a multi-chunk QR code sequence. Please use the P2P tab to receive multi-part data.';
      decodeMessage.className = 'message info';
      log('Detected chunked QR code', {chunk: match[1], total: match[2]});
      return;
    }
    
    // Regular QR code
    const password = decodePassword.value;
    
    try {
      // Check if encrypted
      const isEncrypted = data.startsWith('ENCRYPTED:');
      
      if (isEncrypted && !password) {
        decodeMessage.textContent = 'This QR code is encrypted. Please enter the password and click "Decode QR Code" again.';
        decodeMessage.className = 'message info';
        
        // Highlight the password field to make it clear that input is needed
        decodePassword.classList.add('needs-password');
        decodePassword.focus();
        
        // Re-enable the decode button since we need it clicked again
        decodeQrBtn.disabled = false;
        
        // Store the encrypted data for later decryption when password is provided
        if (!window.encryptedQRData) {
          window.encryptedQRData = data;
          log('Encrypted QR code stored, waiting for password input');
        }
        return;
      }
      
      // Remove highlight if we're past the password stage
      decodePassword.classList.remove('needs-password');
      
      // Use stored encrypted data if available, otherwise use the current data
      const dataToDecrypt = (isEncrypted || window.encryptedQRData) ? (window.encryptedQRData || data) : data;
      
      // Decrypt if needed
      const decryptedData = (isEncrypted || window.encryptedQRData) && password ? 
                            decryptData(dataToDecrypt, password) : dataToDecrypt;
      
      // Clear the stored encrypted data
      window.encryptedQRData = null;
      
      // Display the decrypted data
      decodeOutput.value = decryptedData;
      decodeMessage.textContent = 'QR code decoded successfully';
      decodeMessage.className = 'message success';
      downloadDecodedBtn.style.display = 'block';
      
      log('QR code decoded successfully', {encrypted: isEncrypted, length: decryptedData.length});
    } catch (error) {
      decodeMessage.textContent = error.message;
      decodeMessage.className = 'message error';
      log('Decryption error', {error: error.message});
    }
  } catch (error) {
    decodeMessage.textContent = `Error processing QR code: ${error.message}`;
    decodeMessage.className = 'message error';
    log('Processing error', {error: error.message});
  }
}

// Utility functions
function clearEncode() {
  encodeInput.value = '';
  encodePassword.value = '';
  qrcodeContainer.innerHTML = '';
  encodeMessage.textContent = '';
  encodeMessage.className = '';
  downloadQrBtn.style.display = 'none';
  fileInfo.textContent = '';
  updateCapacityInfo();
  log('Encode form cleared');
}

function clearDecode() {
  decodeOutput.value = '';
  decodePassword.value = '';
  decodeMessage.textContent = '';
  decodeMessage.className = '';
  downloadDecodedBtn.style.display = 'none';
  imagePreview.innerHTML = '';
  decodeQrBtn.disabled = true; // Disable decode button when cleared
  window.encryptedQRData = null; // Clear any stored encrypted data
  log('Decode form cleared');
}

function downloadQRCode() {
  const qrImage = qrcodeContainer.querySelector('img');
  if (!qrImage) return;
  
  const link = document.createElement('a');
  link.href = qrImage.src;
  link.download = 'qr-code.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  log('QR code image downloaded');
}

function downloadTextFile(textArea, filename) {
  const text = textArea.value;
  if (!text) return;
  
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  log('Text file downloaded', {filename});
}

// Beep sound
function beep() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 800;
    gainNode.gain.value = 0.5;
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    log('Beep error', {error: error.message});
  }
}


// ======= Part 4 =======
// P2P Transfer functions
function splitIntoChunks(data, password = '') {
  const chunks = [];
  
  // Validate data
  if (!data || typeof data !== 'string') {
    log('Invalid data provided to splitIntoChunks', { type: typeof data, length: data ? data.length : 0 });
    throw new Error('Invalid data for chunking');
  }
  
  // Encrypt data if password is provided
  let processedData;
  try {
    processedData = password ? encryptData(data, password) : data;
    log('Data processed for chunking', { encrypted: !!password, length: processedData.length });
  } catch (error) {
    log('Error encrypting data for chunks', { error: error.message });
    throw new Error('Failed to process data: ' + error.message);
  }
  
  // Calculate MD5 hash of the original data for integrity check
  const md5Hash = generateMD5(processedData);
  log('Generated MD5 hash for data', {hash: md5Hash});
  
  // Get selected chunk size from slider
  const selectedChunkSize = parseInt(chunkSizeSlider.value) || 1500; // Fall back to default if parsing fails
  log('Using chunk size', { size: selectedChunkSize });
  
  // Calculate chunk size accounting for metadata
  // Format: [CHUNK_XXX_OF_XXX][MD5_32_CHARS]
  const metadataSize = `[CHUNK_XXX_OF_XXX][MD5_${md5Hash}]`.length;
  const effectiveChunkSize = Math.max(10, selectedChunkSize - metadataSize); // Ensure minimum size
  
  // Split data into chunks
  for (let i = 0; i < processedData.length; i += effectiveChunkSize) {
    chunks.push(processedData.substring(i, i + effectiveChunkSize));
  }
  
  // Handle edge case of empty data
  if (chunks.length === 0) {
    log('Warning: Creating empty chunk for empty data');
    chunks.push('');
  }
  
  log('Data split into chunks', {
    count: chunks.length, 
    metadataSize, 
    effectiveChunkSize,
    chunkSizeSetting: selectedChunkSize
  });
  
  // Add metadata to each chunk
  return chunks.map((chunk, index) => {
    const chunkNum = (index + 1).toString().padStart(3, '0');
    const totalChunks = chunks.length.toString().padStart(3, '0');
    return `[CHUNK_${chunkNum}_OF_${totalChunks}][MD5_${md5Hash}]${chunk}`;
  });
}

function startTransfer() {
  const data = p2pInput.value.trim();
  
  if (!data) {
    sendStatus.textContent = 'Please enter some data to transfer';
    return;
  }
  
  // Verify that QRCode library is loaded
  if (typeof QRCode === 'undefined') {
    sendStatus.textContent = 'Error: QRCode library not loaded. Please refresh the page.';
    log('QRCode library is not available');
    console.error('QRCode library not loaded');
    return;
  }
  
  // Clear any previous display
  p2pQrcodeContainer.innerHTML = '';
  
  // First set UI to loading state
  startTransferBtn.disabled = true;
  startTransferBtn.textContent = 'Processing...';
  sendStatus.textContent = 'Preparing data for transfer...';
  log('Starting P2P transfer', { dataLength: data.length });
  
  // Use setTimeout to allow UI to update before heavy processing
  setTimeout(() => {
    try {
      // Get password if provided
      const password = p2pPassword.value;
      log('Got password for transfer', { hasPassword: !!password });
      
      // Split data into chunks based on selected size
      p2pChunks = splitIntoChunks(data, password);
      log('Split data into chunks', { numChunks: p2pChunks ? p2pChunks.length : 0 });
      
      if (!p2pChunks || p2pChunks.length === 0) {
        throw new Error('Failed to split data into chunks');
      }
      
      // Reset index to first chunk
      currentChunkIndex = 0;
      
      log('Data prepared for transfer', {
        dataLength: data.length,
        chunks: p2pChunks.length,
        hasPassword: !!password,
        firstChunkSize: p2pChunks[0].length
      });
      
      // Update UI
      startTransferBtn.style.display = 'none';
      startTransferBtn.disabled = false;
      startTransferBtn.textContent = 'Start Transfer';
      stopTransferBtn.style.display = 'inline-block';
      manualNavBtn.style.display = 'inline-block';
      
      transferActive = true;
      sendStatus.textContent = `Prepared ${p2pChunks.length} chunks for transfer`;
      
      // Display QR code directly here instead of using displayCurrentChunk
      try {
        // Basic sanity check
        if (!p2pChunks[currentChunkIndex]) {
          throw new Error('First chunk is undefined');
        }
        
        const qrSize = 300; // Default size
        const correctLevel = QRCode.CorrectLevel.L; // Default error correction
        
        // Create the QR code directly
        log('Creating QR code for chunk', { 
          index: currentChunkIndex, 
          chunkLength: p2pChunks[currentChunkIndex].length 
        });
        
        // Make sure container is empty
        p2pQrcodeContainer.innerHTML = '';
        
        // Create new QR code instance
        p2pQrInstance = new QRCode(p2pQrcodeContainer, {
          text: p2pChunks[currentChunkIndex],
          width: qrSize,
          height: qrSize,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: correctLevel
        });
        
        // Update counters and status
        chunkCounter.textContent = `${currentChunkIndex + 1} / ${p2pChunks.length}`;
        sendProgress.style.width = `${((currentChunkIndex + 1) / p2pChunks.length) * 100}%`;
        sendStatus.textContent = `Sending chunk ${currentChunkIndex + 1} of ${p2pChunks.length}`;
        p2pNavigation.style.display = 'flex';
        
        log('QR code successfully created');
      } catch (qrError) {
        log('Error creating QR code directly', { 
          error: qrError.message, 
          qrCodeType: typeof QRCode 
        });
        
        // Try alternate method
        displayCurrentChunk();
      }
      
      // Start auto-slideshow
      const intervalSeconds = parseFloat(displayInterval.value);
      // Clear existing interval if there is one
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
      }
      autoPlayInterval = setInterval(showNextChunkAuto, intervalSeconds * 1000);
      
      log('Transfer started', {totalChunks: p2pChunks.length, interval: intervalSeconds});
    } catch (error) {
      console.error('Transfer error:', error);
      log('Error starting transfer', {error: error.message, stack: error.stack});
      sendStatus.textContent = 'Error: ' + error.message;
      
      // Ensure buttons are in correct state
      startTransferBtn.style.display = 'inline-block';
      startTransferBtn.disabled = false;
      startTransferBtn.textContent = 'Start Transfer';
      stopTransferBtn.style.display = 'none';
      manualNavBtn.style.display = 'none';
    }
  }, 10); // Small delay to let UI update
}

function stopTransfer() {
  log('Stopping transfer');
  
  // Clear auto-advancing
  if (autoPlayInterval) {
    clearInterval(autoPlayInterval);
    autoPlayInterval = null;
  }
  
  // Mark transfer as inactive
  transferActive = false;
  
  // Update UI
  startTransferBtn.style.display = 'inline-block';
  stopTransferBtn.style.display = 'none';
  manualNavBtn.style.display = 'none';
  p2pNavigation.style.display = 'none';
  
  // Clear display
  sendStatus.textContent = 'Transfer stopped';
  p2pQrcodeContainer.innerHTML = '';
  
  // Hide floating QR display
  floatingQrContainer.style.display = 'none';
  
  // Close popup window if it's open
  if (qrPopupWindow && !qrPopupWindow.closed) {
    qrPopupWindow.close();
    qrPopupWindow = null;
  }
  
  // Close popup window if it's open
  if (qrPopupWindow && !qrPopupWindow.closed) {
    qrPopupWindow.close();
    qrPopupWindow = null;
  }
  
  // Keep chunks in memory for possible resume
  log('Transfer stopped', {
    chunksInMemory: p2pChunks ? p2pChunks.length : 0,
    lastIndex: currentChunkIndex
  });
}

function toggleManualNavigation() {
  clearInterval(autoPlayInterval);
  
  const isManualActive = p2pNavigation.style.display === 'flex';
  p2pNavigation.style.display = isManualActive ? 'none' : 'flex';
  
  if (!isManualActive) {
    manualNavBtn.textContent = 'Auto Navigation';
    log('Switched to manual navigation');
  } else {
    manualNavBtn.textContent = 'Manual Navigation';
    // Restart auto-slideshow
    const intervalSeconds = parseFloat(displayInterval.value);
    autoPlayInterval = setInterval(showNextChunkAuto, intervalSeconds * 1000);
    log('Switched to auto navigation', {interval: intervalSeconds});
  }
}

// Fallback function to create QR code manually if the library fails
function createFallbackQRCode(container, text, width = 300, height = 300) {
  log('Using fallback QR code creation', { textLength: text.length });
  
  try {
    // Create a simple canvas and render text as visible content
    const div = document.createElement('div');
    div.className = 'fallback-qr';
    div.style.width = width + 'px';
    div.style.height = height + 'px';
    div.style.backgroundColor = '#fff';
    div.style.color = '#000';
    div.style.padding = '10px';
    div.style.boxSizing = 'border-box';
    div.style.overflow = 'hidden';
    div.style.textAlign = 'center';
    
    // Add a header
    const header = document.createElement('div');
    header.textContent = 'QR DATA:';
    header.style.fontWeight = 'bold';
    header.style.marginBottom = '5px';
    div.appendChild(header);
    
    // Add the text content (first 100 chars)
    const content = document.createElement('div');
    content.textContent = text.substring(0, 100) + (text.length > 100 ? '...' : '');
    content.style.fontSize = '10px';
    content.style.wordBreak = 'break-all';
    div.appendChild(content);
    
    // Clear container and append div
    container.innerHTML = '';
    container.appendChild(div);
    
    return true;
  } catch (error) {
    log('Error in fallback QR creation', { error: error.message });
    return false;
  }
}

function displayCurrentChunk() {
  // Make sure we have chunks
  if (!p2pChunks || !p2pChunks.length) {
    log('No chunks to display');
    sendStatus.textContent = 'No chunks available to display. Start a transfer first.';
    return;
  }
  
  // Validate current index
  if (currentChunkIndex < 0 || currentChunkIndex >= p2pChunks.length) {
    log('Invalid chunk index, resetting to 0', { currentIndex: currentChunkIndex, maxIndex: p2pChunks.length - 1 });
    currentChunkIndex = 0;
  }
  
  // Debug information
  log('Attempting to display chunk', {
    currentIndex: currentChunkIndex,
    totalChunks: p2pChunks.length,
    chunkData: p2pChunks[currentChunkIndex] ? p2pChunks[currentChunkIndex].substring(0, 20) + '...' : 'undefined'
  });
  
  // Clear previous QR code
  p2pQrcodeContainer.innerHTML = '';
  
  // Check if current chunk exists
  if (!p2pChunks[currentChunkIndex]) {
    log('Current chunk is undefined', { index: currentChunkIndex });
    sendStatus.textContent = `Error: Chunk ${currentChunkIndex + 1} is undefined`;
    return;
  }
  
  // Determine QR code size and error correction level based on chunk size
  // For smaller chunks, we can use higher error correction for better reliability
  let correctLevel = QRCode.CorrectLevel.L; // Default low correction
  let qrSize = 300; // Default size
  
  try {
    // Get selected chunk size from slider
    const selectedChunkSize = parseInt(chunkSizeSlider.value) || 1500;
    
    // Set appropriate error correction level based on chunk size
    if (selectedChunkSize <= 200) {
      // For extremely small chunks, use highest error correction
      correctLevel = QRCode.CorrectLevel.H;
      qrSize = 340; // Larger size for better scanning
    } else if (selectedChunkSize <= 400) {
      // For very small chunks, use highest error correction
      correctLevel = QRCode.CorrectLevel.H;
      qrSize = 320; // Slightly larger
    } else if (selectedChunkSize <= 800) {
      // For small chunks, use medium-high error correction
      correctLevel = QRCode.CorrectLevel.Q;
      qrSize = 310;
    } else if (selectedChunkSize <= 1500) {
      // For medium chunks, use medium error correction
      correctLevel = QRCode.CorrectLevel.M;
    }
    
    // Check if QRCode library is available
    if (typeof QRCode === 'undefined') {
      console.error('QRCode is undefined');
      log('QRCode library is not loaded correctly');
      
      // Try fallback method instead of throwing error
      if (createFallbackQRCode(
        p2pQrcodeContainer, 
        p2pChunks[currentChunkIndex], 
        qrSize, 
        qrSize
      )) {
        log('Using fallback QR display method');
      } else {
        throw new Error('QRCode library not loaded and fallback failed');
      }
    } else {
      log('QRCode type:', { type: typeof QRCode });
      
      try {
        // Reset the container first to ensure clean state
        p2pQrcodeContainer.innerHTML = '';
        
        // Create new QR code with the current chunk
        p2pQrInstance = new QRCode(p2pQrcodeContainer, {
          text: p2pChunks[currentChunkIndex],
          width: qrSize,
          height: qrSize,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: correctLevel
        });
        
        // Double check that QR code was created
        if (!p2pQrcodeContainer.querySelector('img')) {
          log('QR code did not render an image element');
          
          // Try fallback method if no image was created
          createFallbackQRCode(
            p2pQrcodeContainer, 
            p2pChunks[currentChunkIndex], 
            qrSize, 
            qrSize
          );
        }
      } catch (qrError) {
        log('Error creating QR code instance', {
          error: qrError.message,
          chunk: p2pChunks[currentChunkIndex].substring(0, 30) + '...'
        });
        
        // Try fallback method
        if (!createFallbackQRCode(
          p2pQrcodeContainer, 
          p2pChunks[currentChunkIndex], 
          qrSize, 
          qrSize
        )) {
          throw qrError;
        }
      }
    }
    
    // Update counter
    chunkCounter.textContent = `${currentChunkIndex + 1} / ${p2pChunks.length}`;
    
    // Update progress bar
    sendProgress.style.width = `${((currentChunkIndex + 1) / p2pChunks.length) * 100}%`;
    
    // Update status
    sendStatus.textContent = `Sending chunk ${currentChunkIndex + 1} of ${p2pChunks.length}`;
    
    // Show the manual navigation (manual nav controls)
    p2pNavigation.style.display = 'flex';
    
    // Update floating QR display - clone the QR code element
    const qrElement = p2pQrcodeContainer.querySelector('img');
    if (qrElement) {
      // Update floating QR container
      floatingQrContent.innerHTML = '';
      const clonedQr = qrElement.cloneNode(true);
      clonedQr.style.maxWidth = '100%';
      floatingQrContent.appendChild(clonedQr);
      floatingQrCounter.textContent = `${currentChunkIndex + 1} / ${p2pChunks.length}`;
      floatingQrContainer.style.display = 'block';
      
      // Update QR code in popup window if it's open
      updateQrInPopup();
    } else if (p2pQrcodeContainer.querySelector('.fallback-qr')) {
      // Handle fallback QR display
      const fallbackQr = p2pQrcodeContainer.querySelector('.fallback-qr');
      floatingQrContent.innerHTML = '';
      const clonedFallback = fallbackQr.cloneNode(true);
      clonedFallback.style.maxWidth = '100%';
      floatingQrContent.appendChild(clonedFallback);
      floatingQrCounter.textContent = `${currentChunkIndex + 1} / ${p2pChunks.length}`;
      floatingQrContainer.style.display = 'block';
      
      // For fallback QR code, we need to create a data URL for the popup
      if (qrPopupWindow && !qrPopupWindow.closed) {
        try {
          // Convert the fallback QR div to an image using html2canvas or a similar approach
          // For simplicity, we'll just use the text content as a placeholder
          const fallbackText = fallbackQr.textContent || 'Fallback QR Code';
          
          // Create a canvas element
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 300;
          canvas.height = 300;
          
          // Fill with white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add black text
          ctx.fillStyle = '#000000';
          ctx.font = '14px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Split text into lines for better readability
          const words = fallbackText.split(' ');
          let line = '';
          let y = 100;
          for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            if (testLine.length > 40) {
              ctx.fillText(line, canvas.width / 2, y);
              line = words[i] + ' ';
              y += 20;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, canvas.width / 2, y);
          
          // Get data URL from canvas
          const dataUrl = canvas.toDataURL('image/png');
          
          // Send to popup window
          qrPopupWindow.postMessage({
            type: 'updateQR',
            qr: dataUrl,
            counter: `${currentChunkIndex + 1} / ${p2pChunks.length} (Fallback Mode)`
          }, '*');
          
          log('Sent fallback QR to popup window');
        } catch (err) {
          log('Error creating fallback QR for popup', { error: err.message });
        }
      }
    }
    
    log('Successfully displayed chunk', {
      current: currentChunkIndex + 1, 
      total: p2pChunks.length,
      size: p2pChunks[currentChunkIndex].length
    });
  } catch (error) {
    log('Error displaying QR code', {error: error.message, stack: error.stack});
    sendStatus.textContent = 'Error displaying QR code: ' + error.message;
    console.error('QR code display error:', error);
  }
}

function showPreviousChunk() {
  if (!p2pChunks || p2pChunks.length === 0) {
    log('No chunks available for navigation');
    return;
  }
  
  try {
    if (currentChunkIndex > 0) {
      currentChunkIndex--;
      displayCurrentChunk();
      log('Showing previous chunk', {index: currentChunkIndex + 1});
    } else {
      // Optional: Loop around to the last chunk
      currentChunkIndex = p2pChunks.length - 1;
      displayCurrentChunk();
      log('Looped to last chunk', {index: currentChunkIndex + 1});
    }
  } catch (error) {
    log('Error showing previous chunk', {error: error.message});
  }
}

function showNextChunk() {
  if (!p2pChunks || p2pChunks.length === 0) {
    log('No chunks available for navigation');
    return;
  }
  
  try {
    if (currentChunkIndex < p2pChunks.length - 1) {
      currentChunkIndex++;
      displayCurrentChunk();
      log('Showing next chunk', {index: currentChunkIndex + 1});
    } else {
      // Optional: Loop around to the first chunk
      currentChunkIndex = 0;
      displayCurrentChunk();
      log('Looped to first chunk');
    }
  } catch (error) {
    log('Error showing next chunk', {error: error.message});
  }
}

function showNextChunkAuto() {
  if (!transferActive || !p2pChunks || p2pChunks.length === 0) {
    log('Auto advance skipped - transfer not active or no chunks');
    return;
  }
  
  try {
    // Advance to next chunk or loop back to beginning
    if (currentChunkIndex < p2pChunks.length - 1) {
      currentChunkIndex++;
    } else {
      currentChunkIndex = 0; // Loop back to beginning
    }
    
    // Display the new chunk
    displayCurrentChunk();
    log('Auto-advanced to next chunk', {index: currentChunkIndex + 1});
  } catch (error) {
    log('Error in auto-advance', {error: error.message});
    // Try to recover by restarting at chunk 0
    currentChunkIndex = 0;
    try {
      displayCurrentChunk();
    } catch (e) {
      // If still failing, stop auto transfer
      clearInterval(autoPlayInterval);
      log('Auto-transfer stopped due to errors');
    }
  }
}


// ======= Part 5 =======
// P2P Receiving functions
async function startReceiving() {
  // Set debug visible to help troubleshoot camera issues
  debugInfo.style.display = 'block';
  
  // Clear any password highlighting
  p2pReceivePassword.classList.remove('needs-password');
  
  // Clear any previous data
  receivedChunks = {};
  totalExpectedChunks = 0;
  try {
    log('Starting P2P receiving...');
    receiveStatus.textContent = 'Requesting camera access...';
    receiveStatus.className = 'message info';
    
    // Reset received chunks
    receivedChunks = {};
    totalExpectedChunks = 0;
    receivedData.value = '';
    chunkLog.value = '';
    downloadReceivedBtn.style.display = 'none';
    downloadRawLogBtn.style.display = 'none';
    
    try {
      // Always try to get the camera regardless of auto mode
      // This is more reliable across different platforms
      try {
        // Try to get the environment-facing (back) camera first as it's better for QR codes
        try {
          log('Trying to access environment-facing camera for P2P');
          p2pStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
            audio: false
          });
          log('Successfully accessed environment-facing camera for P2P');
        } catch (envError) {
          log('Failed to access environment camera for P2P, falling back to any camera', { error: envError.message });
          p2pStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
      } catch (e) {
        // Fallback to any camera
        log('Falling back to any available camera', {error: e.message});
        p2pStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }
      
      // Now refresh the camera list with actual device names
      await refreshCameraList(true);
      
      // Show the video stream
      p2pVideo.srcObject = p2pStream;
      p2pVideo.style.display = 'block';
      
      // Show camera selection - it should now have proper device names
      p2pCameraSelectContainer.style.display = 'block';
      
      startReceivingBtn.style.display = 'none';
      stopReceivingBtn.style.display = 'inline-block';
      p2pSnapshotBtn.style.display = 'inline-block';
      
      // Start scanning for QR codes
      receiveStatus.textContent = 'Camera active. Scanning for QR codes...';
      scanP2PQRCodes();
      
      log('P2P receiving started', {
        camera: selectedP2PCamera === 'auto' ? 'auto-detected' : selectedP2PCamera
      });
    } catch (cameraError) {
      // Try fallback approach for Linux/WSL systems
      try {
        log('First camera access attempt failed, trying with different constraints', {error: cameraError.message});
        
        // Try with very basic constraints - crucial for WSL environments
        p2pStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: false 
        });
        
        // Refresh the camera list
        await refreshCameraList(true);
        
        // Show the video stream
        p2pVideo.srcObject = p2pStream;
        p2pVideo.style.display = 'block';
        
        startReceivingBtn.style.display = 'none';
        stopReceivingBtn.style.display = 'inline-block';
        
        receiveStatus.textContent = 'Camera activated with fallback settings. Scanning for QR codes...';
        scanP2PQRCodes();
        
        log('P2P receiving started with fallback camera');
        return;
      } catch (fallbackError) {
        log('Fallback camera access also failed', {error: fallbackError.message});
      }
      
      // Provide helpful error message based on error type
      log('Camera access error', {error: cameraError.message, name: cameraError.name});
      
      let errorMsg = 'Error accessing camera: ' + cameraError.message;
      
      // Add specific instructions based on error
      if (cameraError.name === 'NotAllowedError') {
        errorMsg = 'Camera access denied. Please allow camera permission in your browser and try again.';
      } else if (cameraError.name === 'NotFoundError') {
        errorMsg = 'No cameras found. Please connect a camera and try again.';
      } else if (cameraError.name === 'NotReadableError' || cameraError.name === 'AbortError') {
        errorMsg = 'Unable to access camera. The camera may be in use by another application.';
      }
      
      receiveStatus.textContent = errorMsg;
      receiveStatus.className = 'message error';
      
      // Ensure the start button is visible again
      startReceivingBtn.style.display = 'inline-block';
      stopReceivingBtn.style.display = 'none';
    }
  } catch (error) {
    receiveStatus.textContent = `Unexpected error: ${error.message}`;
    receiveStatus.className = 'message error';
    log('P2P setup error', {error: error.message});
    
    // Ensure the start button is visible again
    startReceivingBtn.style.display = 'inline-block';
    stopReceivingBtn.style.display = 'none';
  }
}

function stopReceiving() {
  if (p2pStream) {
    log('Stopping P2P receiving...');
    p2pStream.getTracks().forEach(track => track.stop());
    p2pVideo.srcObject = null;
    p2pVideo.style.display = 'none';
  }
  
  startReceivingBtn.style.display = 'inline-block';
  stopReceivingBtn.style.display = 'none';
  p2pSnapshotBtn.style.display = 'none';
  receiveStatus.textContent = 'Receiving stopped';
  
  log('P2P receiving stopped');
}

function scanP2PQRCodes() {
  if (!p2pVideo.srcObject) return;
  
  log('Started QR scanning loop');
  
  // Display immediate feedback in the data field
  receivedData.value = "Camera active and scanning for QR codes...\n\nPosition the QR code in view of the camera.";
  
  // Counter for logging scan attempts (for debugging)
  let scanCounter = 0;
  let lastSuccessTime = Date.now();
  
  // Set up continuous scanning
  const scanLoop = async () => {
    if (!p2pVideo.srcObject) return;
    scanCounter++;
    
    try {
      // Create canvas for frame capture
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = p2pVideo.videoWidth;
      canvas.height = p2pVideo.videoHeight;
      
      // Capture frame
      context.drawImage(p2pVideo, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Every 50 scans without success, log a status update
      const timeSinceLastSuccess = Date.now() - lastSuccessTime;
      if (scanCounter % 50 === 0) {
        log('Still scanning...', {
          attempts: scanCounter,
          timeSinceLastSuccess: `${Math.round(timeSinceLastSuccess/1000)}s`,
          videoSize: `${canvas.width}x${canvas.height}px`
        });
        
        // After 10 seconds with no detection, try different methods
        if (timeSinceLastSuccess > 10000) {
          // Try various ZXing settings to improve detection
          try {
            // Try with our multi-method approach
            log('Trying alternate decode methods after timeout');
            decodeWithMultipleMethods(canvas, imageData);
          } catch (e) {
            // Ignore errors in alternate methods
          }
        }
      }
      
      // Try to decode QR code using multiple methods
      try {
        // Method 1: ZXing's decodeFromImageData (if available)
        if (typeof codeReader.decodeFromImageData === 'function') {
          const result = await codeReader.decodeFromImageData(imageData);
          if (result && result.text) {
            lastSuccessTime = Date.now();
            scanCounter = 0;
            await processP2PChunk(result.text);
          }
        }
        // Method 2: Try direct canvas decoding
        else {
          const result = await codeReader.decodeFromImage(canvas);
          if (result && result.text) {
            lastSuccessTime = Date.now();
            scanCounter = 0;
            await processP2PChunk(result.text);
          }
        }
      } catch (error) {
        // No QR code found or other error - just continue scanning
        // Every 200 attempts, try the alternate decoder
        if (scanCounter % 200 === 0) {
          try {
            // Create an image and try the alternate decode path
            const img = new Image();
            img.src = canvas.toDataURL('image/png');
            img.onload = async () => {
              try {
                const result = await codeReader.decodeFromImage(img);
                if (result && result.text) {
                  lastSuccessTime = Date.now();
                  scanCounter = 0;
                  await processP2PChunk(result.text);
                }
              } catch (e) {
                // Ignore alternates that don't work
              }
            };
          } catch (fallbackError) {
            // Ignore alternative method errors
          }
        }
      }
      
      // Continue scanning with a small delay to prevent overloading
      setTimeout(() => requestAnimationFrame(scanLoop), 10);
    } catch (error) {
      log('Scan error', {error: error.message});
      // Continue scanning despite error, but with a short delay
      setTimeout(() => requestAnimationFrame(scanLoop), 100);
    }
  };
  
  // Start the scan loop
  scanLoop();
}

async function processP2PChunk(data) {
  try {
    // Check if it's a chunk with MD5
    const chunkRegex = /\[CHUNK_(\d{3})_OF_(\d{3})\]\[MD5_([a-f0-9]{32})\](.*)/s;
    const match = data.match(chunkRegex);
    
    if (!match) {
      log('Invalid QR chunk format', {dataPrefix: data.substring(0, 30)});
      return;
    }
    
    const chunkNumber = parseInt(match[1]);
    const totalChunks = parseInt(match[2]);
    const md5Checksum = match[3];
    let chunkData = match[4];
    
    log('Recognized QR chunk format', {
      chunkNumber,
      totalChunks, 
      dataLength: chunkData.length,
      isEncrypted: chunkData.startsWith('ENCRYPTED:')
    });
    
    // Update total chunks expected if this is our first chunk
    if (totalExpectedChunks === 0) {
      totalExpectedChunks = totalChunks;
      log('Detected multi-part transfer', {totalChunks});
      
      // Initialize the textarea and show download button for the streaming data
      receivedData.value = 'Starting to receive data...';
      downloadReceivedBtn.style.display = 'block';
      
      // Force debug display to be visible for troubleshooting
      debugInfo.style.display = 'block';
    }
    
    // Skip if we already have this chunk
    if (receivedChunks[chunkNumber]) {
      log('Already have chunk', {number: chunkNumber});
      return;
    }
    
    // Store the chunk with its metadata
    receivedChunks[chunkNumber] = {
      data: chunkData,
      md5: md5Checksum
    };
    beep(); // Play sound to indicate successful scan
    
    // Update status immediately
    const receivedCount = Object.keys(receivedChunks).length;
    receiveStatus.textContent = `Received ${receivedCount} of ${totalChunks} chunks`;
    chunkStatus.textContent = `Just scanned: Chunk ${chunkNumber} of ${totalChunks}`;
    
    // Update progress bar
    receiveProgress.style.width = `${(receivedCount / totalChunks) * 100}%`;
    
    log('Chunk received', {
      number: chunkNumber, 
      total: totalChunks, 
      count: receivedCount,
      dataStartsWith: chunkData.substring(0, 20) + '...'
    });
    
    // Write a temporary message to show immediate feedback in the chunk log
    chunkLog.value += `\nReceived chunk ${chunkNumber} of ${totalChunks}...`;
    chunkLog.scrollTop = chunkLog.scrollHeight;
    
    // Show download buttons
    downloadReceivedBtn.style.display = 'inline-block';
    downloadRawLogBtn.style.display = 'inline-block';
    
    // Stream the partial data as we receive it - using setTimeout to let UI update first
    setTimeout(() => {
      updatePartialReceivedData();
      
      // Check if we have all chunks
      if (receivedCount === totalChunks) {
        assembleAndDecryptData(true); // true = final assembly
      }
    }, 10);
  } catch (error) {
    log('Chunk processing error', {error: error.message, stack: error.stack});
    // Show error in UI too
    receivedData.value += `\nError processing chunk: ${error.message}`;
  }
}

// Function to update the received data in real-time as chunks arrive
function updatePartialReceivedData() {
  try {
    log('Updating partial data display');
    
    // Only proceed if we have any received chunks
    if (Object.keys(receivedChunks).length === 0) {
      log('No chunks received yet');
      return;
    }
    
    // Even if totalExpectedChunks is 0, we might have received a chunk but not processed it fully
    if (totalExpectedChunks === 0) {
      // Try to determine from the chunks we have
      const anyChunk = Object.values(receivedChunks)[0];
      if (anyChunk && anyChunk.md5) {
        log('Detected chunk but totalExpectedChunks not set', { chunk: anyChunk });
        receivedData.value = 'Detected partial data, starting to receive...';
        chunkLog.value = 'Detected first data chunk, waiting for more information...';
        return;
      }
    }
    
    // Debug info - see what chunks we've received
    const receivedKeys = Object.keys(receivedChunks).sort();
    log('Current received chunks', { 
      count: receivedKeys.length, 
      keys: receivedKeys,
      totalExpected: totalExpectedChunks
    });
    
    // Check if any chunk has encryption (first chunk should have it, but be flexible)
    let isEncrypted = false;
    for (const chunkNum of receivedKeys) {
      if (receivedChunks[chunkNum] && receivedChunks[chunkNum].data &&
          receivedChunks[chunkNum].data.startsWith('ENCRYPTED:')) {
        isEncrypted = true;
        break;
      }
    }
    
    // If encrypted and no password, prompt for password
    if (isEncrypted && !p2pReceivePassword.value) {
      log('Encrypted data detected, waiting for password');
      receivedData.value = '[ENCRYPTED DATA DETECTED]\n\nPlease enter the password in the field above to view the data...';
      chunkLog.value += '\n[ENCRYPTED DATA DETECTED] - Please enter the password\n';
      chunkLog.value += `Received chunks: ${receivedKeys.length} of ${totalExpectedChunks}\n`;
      
      // Highlight password field to prompt user
      p2pReceivePassword.classList.add('needs-password');
      p2pReceivePassword.focus();
      return;
    }
    
    // Update reception log with status details
    chunkLog.value = `RECEPTION LOG\n\n`;
    chunkLog.value += `Total Expected Chunks: ${totalExpectedChunks}\n`;
    chunkLog.value += `Chunks Received: ${receivedKeys.length} (${Math.round((receivedKeys.length/totalExpectedChunks)*100)}%)\n\n`;
    chunkLog.value += `Received Chunks: ${receivedKeys.join(', ')}\n\n`;
    
    if (totalExpectedChunks > receivedKeys.length) {
      const missingChunks = [];
      for (let i = 1; i <= totalExpectedChunks; i++) {
        if (!receivedChunks[i]) {
          missingChunks.push(i);
        }
      }
      chunkLog.value += `Missing Chunks: ${missingChunks.join(', ')}\n\n`;
    }
    
    chunkLog.value += `Data Encryption: ${isEncrypted ? 'Yes' : 'No'}\n`;
    chunkLog.value += `Password Provided: ${p2pReceivePassword.value ? 'Yes' : 'No'}\n\n`;
    chunkLog.value += `Last Update: ${new Date().toLocaleTimeString()}\n`;
    
    // Collect the data we have so far
    let partialData = '';
    let logData = '';
    
    // Option 1: Simple concatenation for testing with limited chunks
    if (receivedKeys.length <= 3) {
      // For small number of chunks, add detailed chunk information to the log
      for (const key of receivedKeys) {
        const chunk = receivedChunks[key];
        logData += `[Chunk ${key}]: ${chunk.data.substring(0, 20)}...\n`;
      }
      chunkLog.value += '\n--- CHUNK DETAILS ---\n' + logData;
    }
    
    // For all chunk counts, build the actual data display
    // Identify contiguous ranges of chunks
    const receivedRanges = [];
    let currentRange = { start: null, end: null };
    
    for (let i = 1; i <= totalExpectedChunks; i++) {
      if (receivedChunks[i]) {
        // Start a new range if needed
        if (currentRange.start === null) {
          currentRange.start = i;
        }
        currentRange.end = i;
      } else if (currentRange.start !== null) {
        // End of a range, store it
        receivedRanges.push({...currentRange});
        currentRange = { start: null, end: null };
      }
    }
    
    // Add the last range if it's open
    if (currentRange.start !== null) {
      receivedRanges.push({...currentRange});
    }
    
    log('Identified data ranges', { ranges: receivedRanges });
    chunkLog.value += '\n--- DATA RANGES ---\n';
    receivedRanges.forEach(range => {
      chunkLog.value += `Chunks ${range.start}-${range.end}\n`;
    });
    
    // Build received data from chunks in received ranges
    for (const range of receivedRanges) {
      for (let i = range.start; i <= range.end; i++) {
        // Only add if we actually have the chunk (defensive check)
        if (receivedChunks[i] && receivedChunks[i].data) {
          partialData += receivedChunks[i].data;
        }
      }
      // Add a separator between non-consecutive ranges
      if (range !== receivedRanges[receivedRanges.length - 1]) {
        partialData += '\n[...missing data...]\n';
      }
    }
    
    // Special handling for encrypted data
    if (isEncrypted && p2pReceivePassword.value) {
      try {
        // For debugging, show what we're trying to decrypt
        log('Attempting to decrypt partial data', {
          partialDataLength: partialData.length,
          hasPassword: p2pReceivePassword.value.length > 0,
          firstChars: partialData.substring(0, 20) + '...'
        });
        
        // Create a temporary encrypted version with proper prefix
        // Only if the data doesn't already have the prefix
        const tempEncrypted = partialData.startsWith('ENCRYPTED:') ? 
          partialData : 'ENCRYPTED:' + partialData;
        
        // Try to decrypt - this might fail for partial data which is expected
        try {
          const decrypted = decryptData(tempEncrypted, p2pReceivePassword.value);
          receivedData.value = decrypted;
          log('Successfully decrypted partial data');
          chunkLog.value += '\n[Decryption successful]';
        } catch (decryptError) {
          // Decryption failed but we have the password - could be partial data or wrong password
          log('Partial decrypt failed', { error: decryptError.message });
          receivedData.value = 'RECEIVED DATA (encrypted):\n\n' + 
            partialData.substring(0, 100) + '...\n\n' +
            '[Decryption pending - continue scanning or check password]';
          chunkLog.value += '\n[Decryption failed: ' + decryptError.message + ']';
        }
      } catch (error) {
        // Fall back to showing the raw data
        log('Decrypt attempt failed', { error: error.message });
        receivedData.value = 'RECEIVED DATA (raw):\n\n' + partialData.substring(0, 200) + 
                         '\n\n[' + Object.keys(receivedChunks).length + ' chunks received]';
        chunkLog.value += '\n[Decrypt error: ' + error.message + ']';
      }
    } else if (!isEncrypted) {
      // Show clean data for non-encrypted content
      receivedData.value = partialData;
      log('Updated display with unencrypted data', {length: partialData.length});
    } else {
      // Encrypted but no password
      receivedData.value = 'ENCRYPTED DATA (waiting for password):\n\n' + 
                       partialData.substring(0, 100) + '...\n\n' +
                       '[Enter password above to view content]';
    }
    
    // Add scanning status to chunk log
    chunkLog.value += '\n\n[LIVE DATA STREAM - continue scanning...]';
    
    // Scroll both areas to the bottom
    receivedData.scrollTop = receivedData.scrollHeight;
    chunkLog.scrollTop = chunkLog.scrollHeight;
  } catch (error) {
    // Even if we have an error, try to show something
    log('Error updating partial data', {error: error.message});
    receivedData.value = 'Error updating display, but data is being received.\n' +
                     'Chunks received: ' + Object.keys(receivedChunks).length;
    chunkLog.value += '\n[Display error: ' + error.message + ']';
  }
}

async function assembleAndDecryptData(isFinalAssembly = false) {
  try {
    log('Assembling chunks...');
    
    // Sort chunks by number
    const sortedChunks = [];
    let md5Hash = null;
    let missingChunks = [];
    
    // Check for missing chunks and collect data
    for (let i = 1; i <= totalExpectedChunks; i++) {
      if (!receivedChunks[i]) {
        missingChunks.push(i);
        if (isFinalAssembly) {
          receiveStatus.textContent = `Missing chunk ${i}. Please continue scanning.`;
          log('Missing chunk', {number: i});
        }
      } else {
        sortedChunks.push(receivedChunks[i].data);
        
        // Store MD5 hash from any chunk (they should all be the same)
        if (!md5Hash) {
          md5Hash = receivedChunks[i].md5;
        }
      }
    }
    
    // If it's the final assembly and we're missing chunks, show a warning but continue if it was forced
    if (isFinalAssembly && missingChunks.length > 0) {
      receiveStatus.textContent = `Warning: Missing ${missingChunks.length} chunks, but continuing with partial data`;
      log('Proceeding with partial data', {missingChunks: missingChunks.length, totalChunks: totalExpectedChunks});
      // We proceed with the chunks we have - this might produce incomplete/corrupted data
    }
    
    // Combine all chunks
    const combinedData = sortedChunks.join('');
    
    // Verify MD5 hash for data integrity in final assembly
    if (isFinalAssembly) {
      const computedMD5 = generateMD5(combinedData);
      log('Verifying data integrity', {expected: md5Hash, computed: computedMD5});
      
      if (computedMD5 !== md5Hash) {
        receiveStatus.textContent = 'Error: Data integrity check failed. MD5 checksums do not match.';
        log('MD5 verification failed', {expected: md5Hash, computed: computedMD5});
        return;
      }
    }
    
    // Decrypt if needed
    const password = p2pReceivePassword.value;
    let finalData = combinedData;
    
    // Check if data is encrypted (might not start with prefix if it's a partial assembly)
    const isFirstChunkEncrypted = receivedChunks[1] && 
                               receivedChunks[1].data.startsWith('ENCRYPTED:');
    const fullDataEncrypted = combinedData.startsWith('ENCRYPTED:');
    const isEncrypted = fullDataEncrypted || isFirstChunkEncrypted;
    
    log('Checking encryption status', {
      fullDataEncrypted,
      isFirstChunkEncrypted,
      isEncrypted,
      hasPassword: !!password,
      isFinalAssembly
    });
    
    // For the final assembly, handle encryption comprehensively
    if (isFinalAssembly) {
      if (isEncrypted && password) {
        log('Decrypting complete data...');
        try {
          // Ensure data has the encryption prefix
          const dataToDecrypt = fullDataEncrypted ? combinedData : 'ENCRYPTED:' + combinedData;
          finalData = decryptData(dataToDecrypt, password);
          log('Decryption successful', {length: finalData.length});
        } catch (error) {
          // Show detailed error message for debugging
          receiveStatus.textContent = 'Error: Incorrect password for encrypted data';
          log('Final decryption error', {
            error: error.message,
            passwordLength: password.length,
            dataPrefix: combinedData.substring(0, 30),
            chunks: Object.keys(receivedChunks).length
          });
          
          // Keep the data encrypted but viewable
          finalData = 'DECRYPTION FAILED: Please check your password.\n\n' +
                     (fullDataEncrypted ? combinedData.substring(10, 100) : combinedData.substring(0, 100)) +
                     '...\n\n[Enter correct password and click "Start Receiving" again]';
          return;
        }
      } else if (isEncrypted && !password) {
        receiveStatus.textContent = 'All data received but it is encrypted. Please enter the password.';
        p2pReceivePassword.classList.add('needs-password');
        p2pReceivePassword.focus();
        log('Password required for completed encrypted data');
        finalData = 'ENCRYPTED DATA RECEIVED SUCCESSFULLY\n\nPlease enter the password above to decrypt and view.';
        return;
      }
    } else {
      // For partial assembly, attempt decryption only if we have a password
      if (isEncrypted && password) {
        try {
          // Ensure data has the encryption prefix for decryption
          const dataToDecrypt = fullDataEncrypted ? combinedData : 'ENCRYPTED:' + combinedData;
          finalData = decryptData(dataToDecrypt, password);
          log('Partial decryption successful');
        } catch (error) {
          // Log but don't show error for partial decryption
          log('Partial decryption failed', {error: error.message});
          finalData = combinedData;
        }
      }
    }
    
    // Display the data
    if (isFinalAssembly) {
      // For final assembly, show the complete data and mark as done
      receivedData.value = finalData;
      receiveStatus.textContent = 'Transfer complete! All chunks received and verified.';
      p2pReceivePassword.classList.remove('needs-password');
      
      // Update log with completion information
      chunkLog.value += '\n\n--- TRANSFER COMPLETE ---\n';
      chunkLog.value += `Total chunks: ${totalExpectedChunks}\n`;
      chunkLog.value += `Final data size: ${finalData.length} bytes\n`;
      chunkLog.value += `MD5 checksum: ${md5Hash}\n`;
      chunkLog.value += `Completed at: ${new Date().toLocaleTimeString()}\n`;
      
      log('Data successfully assembled and decoded', {size: finalData.length});
      
      // Make both download buttons visible and prominent
      downloadReceivedBtn.style.display = 'inline-block';
      downloadRawLogBtn.style.display = 'inline-block';
      
      // Stop receiving - only for final assembly
      stopReceiving();
    } else {
      // For partial assembly, update the display but don't stop scanning
      receivedData.value = finalData;
      
      if (missingChunks.length > 0) {
        chunkLog.value += `\n\n[${missingChunks.length} chunks still missing...]\n`;
        chunkLog.value += `Missing chunks: ${missingChunks.join(', ')}\n`;
      } else {
        chunkLog.value += '\n\n[All chunks received, verifying...]\n';
      }
      
      // Scroll both areas to the bottom
      receivedData.scrollTop = receivedData.scrollHeight;
      chunkLog.scrollTop = chunkLog.scrollHeight;
    }
  } catch (error) {
    receiveStatus.textContent = `Error assembling data: ${error.message}`;
    log('Assembly error', {error: error.message});
  }
}


