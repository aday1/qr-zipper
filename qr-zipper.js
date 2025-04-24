// ======= Part 1 =======
// Constants
const MAX_QR_CAPACITY = 2953; // Maximum bytes for QR code
const MAX_CHUNK_SIZE = 2900; // Slightly less to account for metadata

// DOM Elements - General
const tabs = document.querySelectorAll('.tabs .tab');
const tabContents = document.querySelectorAll('.tab-content');

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
const receiveProgress = document.getElementById('receive-progress');
const receiveStatus = document.getElementById('receive-status');
const chunkStatus = document.getElementById('chunk-status');
const receivedData = document.getElementById('received-data');
const downloadReceivedBtn = document.getElementById('download-received');
const p2pFileInfo = document.getElementById('p2p-file-info');

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
    // If we have partial chunks and at least one is encrypted, update display with password
    if (Object.keys(receivedChunks).length > 0 && 
        Object.values(receivedChunks).some(chunk => chunk.data.startsWith('ENCRYPTED:'))) {
      
      // Remove the highlight once user starts typing
      p2pReceivePassword.classList.remove('needs-password'); 
      
      // Update display with new password
      updatePartialReceivedData();
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
  downloadReceivedBtn.addEventListener('click', () => downloadTextFile(receivedData, 'received-data.txt'));
  
  // Display interval
  displayInterval.addEventListener('input', () => {
    intervalValue.textContent = displayInterval.value + 's';
  });
  
  // Input events for capacity check
  encodeInput.addEventListener('input', updateCapacityInfo);
  p2pInput.addEventListener('input', updateCapacityInfo);
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
    // For P2P tab, just update the status
    if (dataSize > MAX_QR_CAPACITY) {
      const estimatedChunks = Math.ceil(dataSize / MAX_CHUNK_SIZE);
      sendStatus.textContent = `Large file detected: Will be split into ${estimatedChunks} QR codes`;
    } else {
      sendStatus.textContent = `Data size: ${dataSize} bytes (fits in a single QR code)`;
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
    if (!encryptedData.startsWith('ENCRYPTED:')) {
      return encryptedData;
    }
    
    // Remove the prefix and decrypt
    const encryptedContent = encryptedData.substring(10);
    const decrypted = CryptoJS.AES.decrypt(encryptedContent, password).toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      throw new Error('Invalid password or corrupted data');
    }
    
    return decrypted;
  } catch (error) {
    log('Decryption error', {error: error.message});
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
  
  // Encrypt data if password is provided
  const processedData = password ? encryptData(data, password) : data;
  
  // Calculate MD5 hash of the original data for integrity check
  const md5Hash = generateMD5(processedData);
  log('Generated MD5 hash for data', {hash: md5Hash});
  
  // Calculate chunk size accounting for metadata
  // Format: [CHUNK_XXX_OF_XXX][MD5_32_CHARS]
  const metadataSize = `[CHUNK_XXX_OF_XXX][MD5_${md5Hash}]`.length;
  const effectiveChunkSize = MAX_CHUNK_SIZE - metadataSize;
  
  // Split data into chunks
  for (let i = 0; i < processedData.length; i += effectiveChunkSize) {
    chunks.push(processedData.substring(i, i + effectiveChunkSize));
  }
  
  log('Data split into chunks', {count: chunks.length, metadataSize, effectiveChunkSize});
  
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
  
  log('Starting P2P transfer');
  
  const password = p2pPassword.value;
  p2pChunks = splitIntoChunks(data, password);
  currentChunkIndex = 0;
  
  // Display first chunk
  displayCurrentChunk();
  
  startTransferBtn.style.display = 'none';
  stopTransferBtn.style.display = 'inline-block';
  manualNavBtn.style.display = 'inline-block';
  
  transferActive = true;
  sendStatus.textContent = `Sending chunk 1 of ${p2pChunks.length}`;
  sendProgress.style.width = `${(1 / p2pChunks.length) * 100}%`;
  
  // Start auto-slideshow
  const intervalSeconds = parseFloat(displayInterval.value);
  autoPlayInterval = setInterval(showNextChunkAuto, intervalSeconds * 1000);
  
  log('Transfer started', {totalChunks: p2pChunks.length, interval: intervalSeconds});
}

function stopTransfer() {
  clearInterval(autoPlayInterval);
  transferActive = false;
  
  startTransferBtn.style.display = 'inline-block';
  stopTransferBtn.style.display = 'none';
  manualNavBtn.style.display = 'none';
  p2pNavigation.style.display = 'none';
  
  sendStatus.textContent = 'Transfer stopped';
  p2pQrcodeContainer.innerHTML = '';
  
  log('Transfer stopped');
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

function displayCurrentChunk() {
  if (!p2pChunks.length) return;
  
  // Clear previous QR code
  p2pQrcodeContainer.innerHTML = '';
  
  // Create new QR code
  p2pQrInstance = new QRCode(p2pQrcodeContainer, {
    text: p2pChunks[currentChunkIndex],
    width: 300,
    height: 300,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.L
  });
  
  // Update counter
  chunkCounter.textContent = `${currentChunkIndex + 1} / ${p2pChunks.length}`;
  
  // Update progress bar
  sendProgress.style.width = `${((currentChunkIndex + 1) / p2pChunks.length) * 100}%`;
  
  // Update status
  sendStatus.textContent = `Sending chunk ${currentChunkIndex + 1} of ${p2pChunks.length}`;
  
  log('Displaying chunk', {current: currentChunkIndex + 1, total: p2pChunks.length});
}

function showPreviousChunk() {
  if (currentChunkIndex > 0) {
    currentChunkIndex--;
    displayCurrentChunk();
    log('Showing previous chunk', {index: currentChunkIndex + 1});
  }
}

function showNextChunk() {
  if (currentChunkIndex < p2pChunks.length - 1) {
    currentChunkIndex++;
    displayCurrentChunk();
    log('Showing next chunk', {index: currentChunkIndex + 1});
  }
}

function showNextChunkAuto() {
  if (!transferActive) return;
  
  if (currentChunkIndex < p2pChunks.length - 1) {
    currentChunkIndex++;
  } else {
    currentChunkIndex = 0; // Loop back to beginning
  }
  
  displayCurrentChunk();
  log('Auto-advanced to next chunk', {index: currentChunkIndex + 1});
}


// ======= Part 5 =======
// P2P Receiving functions
async function startReceiving() {
  // Set debug visible to help troubleshoot camera issues
  debugInfo.style.display = 'block';
  
  // Clear any password highlighting
  p2pReceivePassword.classList.remove('needs-password');
  try {
    log('Starting P2P receiving...');
    receiveStatus.textContent = 'Requesting camera access...';
    receiveStatus.className = 'message info';
    
    // Reset received chunks
    receivedChunks = {};
    totalExpectedChunks = 0;
    receivedData.value = '';
    downloadReceivedBtn.style.display = 'none';
    
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
  receiveStatus.textContent = 'Receiving stopped';
  
  log('P2P receiving stopped');
}

function scanP2PQRCodes() {
  if (!p2pVideo.srcObject) return;
  
  log('Started QR scanning loop');
  
  // Set up continuous scanning
  const scanLoop = async () => {
    if (!p2pVideo.srcObject) return;
    
    try {
      // Create canvas for frame capture
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = p2pVideo.videoWidth;
      canvas.height = p2pVideo.videoHeight;
      
      // Capture frame
      context.drawImage(p2pVideo, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Try to decode QR code
      try {
        const result = await codeReader.decodeFromImageData(imageData);
        if (result && result.text) {
          await processP2PChunk(result.text);
        }
      } catch (error) {
        // No QR code found or other error - just continue scanning
      }
      
      // Continue scanning
      requestAnimationFrame(scanLoop);
    } catch (error) {
      log('Scan error', {error: error.message});
      // Continue scanning despite error
      requestAnimationFrame(scanLoop);
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
      log('Invalid QR chunk format');
      return;
    }
    
    const chunkNumber = parseInt(match[1]);
    const totalChunks = parseInt(match[2]);
    const md5Checksum = match[3];
    let chunkData = match[4];
    
    // Update total chunks expected if this is our first chunk
    if (totalExpectedChunks === 0) {
      totalExpectedChunks = totalChunks;
      log('Detected multi-part transfer', {totalChunks});
      
      // Initialize the textarea and show download button for the streaming data
      receivedData.value = '';
      downloadReceivedBtn.style.display = 'block';
    }
    
    // Skip if we already have this chunk
    if (receivedChunks[chunkNumber]) {
      return;
    }
    
    // Store the chunk with its metadata
    receivedChunks[chunkNumber] = {
      data: chunkData,
      md5: md5Checksum
    };
    beep(); // Play sound to indicate successful scan
    
    // Update status
    const receivedCount = Object.keys(receivedChunks).length;
    receiveStatus.textContent = `Received ${receivedCount} of ${totalChunks} chunks`;
    chunkStatus.textContent = `Just scanned: Chunk ${chunkNumber} of ${totalChunks}`;
    
    // Update progress bar
    receiveProgress.style.width = `${(receivedCount / totalChunks) * 100}%`;
    
    log('Chunk received', {number: chunkNumber, total: totalChunks, count: receivedCount});
    
    // Stream the partial data as we receive it
    updatePartialReceivedData();
    
    // Check if we have all chunks
    if (receivedCount === totalChunks) {
      await assembleAndDecryptData(true); // true = final assembly
    }
  } catch (error) {
    log('Chunk processing error', {error: error.message});
  }
}

// Function to update the received data in real-time as chunks arrive
function updatePartialReceivedData() {
  try {
    // Only proceed if we have expected chunks
    if (totalExpectedChunks === 0) return;
    
    // Check if we have an encryption prefix in any chunk (first chunk should have it)
    const isEncrypted = receivedChunks[1] ? 
      receivedChunks[1].data.startsWith('ENCRYPTED:') : 
      Object.values(receivedChunks).some(chunk => chunk.data.startsWith('ENCRYPTED:'));
    
    // If encrypted and no password, show a placeholder
    if (isEncrypted && !p2pReceivePassword.value) {
      receivedData.value = '[Encrypted data - Enter password to view]';
      
      // Highlight password field to prompt user
      p2pReceivePassword.classList.add('needs-password');
      p2pReceivePassword.focus();
      return;
    }
    
    // Sort chunks by chunk number
    const sortedChunkNumbers = Object.keys(receivedChunks)
      .map(Number)
      .sort((a, b) => a - b);
    
    // Collect chunk data in order, marking missing chunks
    let partialData = '';
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
    
    // Build received data from chunks in received ranges
    for (const range of receivedRanges) {
      for (let i = range.start; i <= range.end; i++) {
        partialData += receivedChunks[i].data;
      }
      // Add a separator between non-consecutive ranges
      if (range !== receivedRanges[receivedRanges.length - 1]) {
        partialData += '\n[...missing data...]\n';
      }
    }
    
    // If we need decryption and have a password, try to decrypt partial data
    if (isEncrypted && p2pReceivePassword.value) {
      try {
        // Create a temporary encrypted version with proper prefix
        const tempEncrypted = 'ENCRYPTED:' + partialData;
        const decrypted = decryptData(tempEncrypted, p2pReceivePassword.value);
        receivedData.value = decrypted + '\n[Streaming partial data - continue scanning...]';
      } catch (error) {
        // Decryption failed - show raw data
        receivedData.value = partialData + '\n[Encrypted data - continue scanning...]';
      }
    } else {
      // Show raw data for non-encrypted content
      receivedData.value = partialData + '\n[Streaming partial data - continue scanning...]';
    }
    
    // Scroll to the bottom
    receivedData.scrollTop = receivedData.scrollHeight;
  } catch (error) {
    log('Error updating partial data', {error: error.message});
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
    
    // If it's the final assembly and we're missing chunks, return early
    if (isFinalAssembly && missingChunks.length > 0) {
      return;
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
    
    // For the final assembly, handle encryption comprehensively
    if (isFinalAssembly) {
      if (combinedData.startsWith('ENCRYPTED:') && password) {
        log('Decrypting complete data...');
        try {
          finalData = decryptData(combinedData, password);
        } catch (error) {
          receiveStatus.textContent = 'Error: Incorrect password for encrypted data';
          log('Decryption error', {error: error.message});
          return;
        }
      } else if (combinedData.startsWith('ENCRYPTED:') && !password) {
        receiveStatus.textContent = 'This data is encrypted. Please enter the password.';
        p2pReceivePassword.classList.add('needs-password');
        p2pReceivePassword.focus();
        log('Password required for encrypted data');
        return;
      }
    } else {
      // For partial assembly, attempt decryption only if we have a password
      if (combinedData.startsWith('ENCRYPTED:') && password) {
        try {
          finalData = decryptData(combinedData, password);
        } catch (error) {
          // Silently fail for partial decryption - we'll try again when we have more chunks
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
      
      log('Data successfully assembled and decoded', {size: finalData.length});
      
      // Stop receiving - only for final assembly
      stopReceiving();
    } else {
      // For partial assembly, update the display but don't stop scanning
      receivedData.value = finalData + 
        (missingChunks.length > 0 ? 
          `\n\n[${missingChunks.length} chunks still missing...]` : 
          '\n\n[All chunks received, verifying...]');
      
      // Scroll to the bottom
      receivedData.scrollTop = receivedData.scrollHeight;
    }
  } catch (error) {
    receiveStatus.textContent = `Error assembling data: ${error.message}`;
    log('Assembly error', {error: error.message});
  }
}


