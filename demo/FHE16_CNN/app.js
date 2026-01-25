/**
 * FHE16-CNN Demo Frontend
 * Interactive handwritten digit recognition with FHE
 *
 * Copyright (c) 2025 waLLLnut
 */

// DOM Elements
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');
const canvasOverlay = document.getElementById('canvasOverlay');
const inferBtn = document.getElementById('inferBtn');
const clearBtn = document.getElementById('clearBtn');
const apiEndpoint = document.getElementById('apiEndpoint');
const mockToggle = document.getElementById('mockToggle');
const statusArea = document.getElementById('statusArea');
const resultDigit = document.getElementById('resultDigit');
const confidenceBar = document.getElementById('confidenceBar');
const metricsArea = document.getElementById('metricsArea');
const metricTime = document.getElementById('metricTime');
const metricEncrypted = document.getElementById('metricEncrypted');
const samplesGrid = document.getElementById('samplesGrid');

// Encryption settings elements
const encryptionToggle = document.getElementById('encryptionToggle');
const encryptedLayersSlider = document.getElementById('encryptedLayersSlider');
const layerCountLabel = document.getElementById('layerCountLabel');
const layerSelectorContainer = document.getElementById('layerSelectorContainer');
const layerList = document.getElementById('layerList');
const layerInfoArea = document.getElementById('layerInfoArea');
const encryptedLayersList = document.getElementById('encryptedLayersList');
const plainLayersList = document.getElementById('plainLayersList');
const queueStatus = document.getElementById('queueStatus');
const queueLength = document.getElementById('queueLength');
const queueProcessing = document.getElementById('queueProcessing');
const ciphertextArea = document.getElementById('ciphertextArea');
const ciphertextContent = document.getElementById('ciphertextContent');
const ciphertextSize = document.getElementById('ciphertextSize');

// Queue polling interval
let queuePollInterval = null;

// CNN Layer names
const CNN_LAYERS = ['Input', 'Conv', 'ReLU', 'Pool', 'FC'];

// State
let isDrawing = false;
let hasDrawn = false;
let useMock = true;
let useEncryption = true;
let encryptedLayers = 5;

// Initialize
function init() {
    setupCanvas();
    setupEventListeners();
    setupEncryptionSettings();
    renderConfidenceBars();
    loadSamples();
}

// Setup encryption settings
function setupEncryptionSettings() {
    // Encryption toggle
    encryptionToggle.addEventListener('click', () => {
        useEncryption = !useEncryption;
        encryptionToggle.classList.toggle('active', useEncryption);
        layerSelectorContainer.classList.toggle('disabled', !useEncryption);
        updateInferButtonText();
    });

    // Layer slider
    encryptedLayersSlider.addEventListener('input', (e) => {
        encryptedLayers = parseInt(e.target.value);
        layerCountLabel.textContent = encryptedLayers;
        updateLayerList();
    });

    // Initialize layer list
    updateLayerList();
    updateInferButtonText();
}

// Update layer list visualization
function updateLayerList() {
    const layerItems = layerList.querySelectorAll('.layer-item');
    layerItems.forEach((item, index) => {
        const isEncrypted = index < encryptedLayers;
        item.classList.toggle('encrypted', isEncrypted);
        const icon = item.querySelector('.layer-icon');
        icon.textContent = isEncrypted ? '🔐' : '📄';
    });
}

// Update inference button text based on encryption settings
function updateInferButtonText() {
    const btnText = inferBtn.querySelector('span');
    if (!useEncryption || encryptedLayers === 0) {
        btnText.textContent = '📄';
        inferBtn.innerHTML = '<span>📄</span> Run Plaintext Inference';
    } else if (encryptedLayers === 5) {
        btnText.textContent = '🔐';
        inferBtn.innerHTML = '<span>🔐</span> Run Encrypted Inference';
    } else {
        btnText.textContent = '🔐';
        inferBtn.innerHTML = `<span>🔐</span> Run Hybrid (${encryptedLayers}/5 encrypted)`;
    }
}

// Canvas setup
function setupCanvas() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 15;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}

// Event listeners
function setupEventListeners() {
    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    // Touch events
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', stopDrawing);

    // Buttons
    inferBtn.addEventListener('click', runInference);
    clearBtn.addEventListener('click', clearCanvas);

    // Toggle
    mockToggle.addEventListener('click', () => {
        useMock = !useMock;
        mockToggle.classList.toggle('active', useMock);
    });
}

// Drawing functions
function startDrawing(e) {
    isDrawing = true;
    hasDrawn = true;
    canvasOverlay.classList.add('hidden');
    inferBtn.disabled = false;

    const { x, y } = getPosition(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function draw(e) {
    if (!isDrawing) return;

    const { x, y } = getPosition(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function stopDrawing() {
    isDrawing = false;
    ctx.beginPath();
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function getPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function clearCanvas() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    hasDrawn = false;
    canvasOverlay.classList.remove('hidden');
    inferBtn.disabled = true;
    resultDigit.textContent = '?';
    metricsArea.style.display = 'none';
    layerInfoArea.style.display = 'none';
    ciphertextArea.style.display = 'none';
    setStatus('info', 'Draw a digit and run inference');
    renderConfidenceBars();
}

// Get pixel data from canvas
function getPixelData() {
    // Create a temporary 28x28 canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 28;
    tempCanvas.height = 28;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw scaled down version
    tempCtx.fillStyle = '#000';
    tempCtx.fillRect(0, 0, 28, 28);
    tempCtx.drawImage(canvas, 0, 0, 28, 28);

    // Get pixel data
    const imageData = tempCtx.getImageData(0, 0, 28, 28);
    const pixels = [];

    for (let i = 0; i < imageData.data.length; i += 4) {
        // Use grayscale value (average of RGB, though our canvas is white on black)
        const gray = imageData.data[i]; // Red channel is enough for grayscale
        pixels.push(gray);
    }

    return pixels;
}

// Run inference
async function runInference() {
    if (!hasDrawn) return;

    const pixels = getPixelData();
    const effectiveEncryptedLayers = useEncryption ? encryptedLayers : 0;

    const statusMsg = effectiveEncryptedLayers === 0
        ? 'Running plaintext inference...'
        : effectiveEncryptedLayers === 5
            ? 'Running encrypted inference...'
            : `Running hybrid inference (${effectiveEncryptedLayers}/5 layers encrypted)...`;

    setStatus('processing', statusMsg);
    inferBtn.disabled = true;

    try {
        let result;

        if (useMock) {
            // Mock inference with encryption settings
            result = await mockInference(pixels, effectiveEncryptedLayers);
        } else {
            // Real API call with encryption settings
            const endpoint = apiEndpoint.value.trim() || 'http://localhost:3001';

            // Start polling queue status
            startQueuePolling(endpoint);

            const response = await fetch(`${endpoint}/api/infer-sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pixels,
                    encrypted: useEncryption,
                    encrypted_layers: effectiveEncryptedLayers
                })
            });

            // Stop polling when done
            stopQueuePolling();

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            result = await response.json();
        }

        displayResult(result);
    } catch (error) {
        console.error('Inference error:', error);
        setStatus('error', `Error: ${error.message}`);
    } finally {
        inferBtn.disabled = false;
        stopQueuePolling();
    }
}

// Queue status polling
function startQueuePolling(endpoint) {
    stopQueuePolling(); // Clear any existing interval first
    showQueueStatus();
    pollQueueStatus(endpoint);
    queuePollInterval = setInterval(() => pollQueueStatus(endpoint), 1000);
}

function stopQueuePolling() {
    if (queuePollInterval) {
        clearInterval(queuePollInterval);
        queuePollInterval = null;
    }
    hideQueueStatus();
}

async function pollQueueStatus(endpoint) {
    try {
        const response = await fetch(`${endpoint}/api/queue`);
        if (response.ok) {
            const data = await response.json();
            updateQueueDisplay(data);
        }
    } catch (e) {
        // Ignore polling errors
    }
}

function showQueueStatus() {
    if (queueStatus) queueStatus.style.display = 'block';
}

function hideQueueStatus() {
    if (queueStatus) queueStatus.style.display = 'none';
}

function updateQueueDisplay(data) {
    if (queueLength) {
        queueLength.textContent = data.queue_length;
    }
    if (queueProcessing) {
        if (data.is_processing && data.current_task) {
            const elapsed = Math.round(data.current_task.elapsed_ms / 1000);
            queueProcessing.textContent = `Processing (${elapsed}s)`;
        } else {
            queueProcessing.textContent = 'Idle';
        }
    }
}

// Mock inference for demo
function mockInference(pixels, encLayers = 5) {
    return new Promise(resolve => {
        // Simulate processing time - more time for more encrypted layers
        const baseDelay = 100;
        const encryptionOverhead = encLayers * 150; // ~150ms per encrypted layer
        const delay = baseDelay + encryptionOverhead + Math.random() * 200;

        setTimeout(() => {
            // Simple heuristic-based prediction
            const totalInk = pixels.reduce((a, b) => a + b, 0);
            const centerPixels = [];
            const topPixels = [];
            const bottomPixels = [];

            for (let y = 0; y < 28; y++) {
                for (let x = 0; x < 28; x++) {
                    const idx = y * 28 + x;
                    if (y >= 10 && y < 18 && x >= 10 && x < 18) {
                        centerPixels.push(pixels[idx]);
                    }
                    if (y < 14) topPixels.push(pixels[idx]);
                    else bottomPixels.push(pixels[idx]);
                }
            }

            const centerMass = centerPixels.reduce((a, b) => a + b, 0);
            const topMass = topPixels.reduce((a, b) => a + b, 0);
            const bottomMass = bottomPixels.reduce((a, b) => a + b, 0);

            // Generate scores
            const scores = Array(10).fill(0).map(() => Math.random() * 0.05);

            let prediction;

            // Simple pattern matching
            if (totalInk < 15000) {
                prediction = 1;
                scores[1] = 0.75 + Math.random() * 0.2;
            } else if (centerMass > totalInk * 0.15) {
                prediction = 0;
                scores[0] = 0.7 + Math.random() * 0.25;
            } else if (topMass > bottomMass * 1.3) {
                prediction = 7;
                scores[7] = 0.65 + Math.random() * 0.3;
            } else if (bottomMass > topMass * 1.3) {
                prediction = 4;
                scores[4] = 0.6 + Math.random() * 0.35;
            } else {
                prediction = Math.floor(Math.random() * 10);
                scores[prediction] = 0.5 + Math.random() * 0.4;
            }

            // Normalize
            const sum = scores.reduce((a, b) => a + b, 0);
            const normalizedScores = scores.map(s => s / sum);

            // Determine which layers were encrypted
            const encryptedLayerNames = CNN_LAYERS.slice(0, encLayers);
            const plainLayerNames = CNN_LAYERS.slice(encLayers);

            // Generate mock ciphertext sample (looks like real FHE ciphertext hex)
            let ciphertextSample = null;
            let ciphertextTotalSize = 0;
            if (encLayers > 0) {
                // FHE ciphertext is typically very large (MB range)
                ciphertextTotalSize = encLayers * 2.5 * 1024 * 1024; // ~2.5MB per layer
                // Generate realistic-looking hex string (256 bytes = 512 hex chars)
                const hexChars = '0123456789abcdef';
                let hex = '';
                for (let i = 0; i < 512; i++) {
                    hex += hexChars[Math.floor(Math.random() * 16)];
                    if ((i + 1) % 64 === 0 && i < 511) hex += '\n';
                }
                ciphertextSample = hex;
            }

            resolve({
                prediction,
                scores: normalizedScores,
                elapsed_ms: Math.round(delay),
                encrypted: encLayers > 0,
                encrypted_layers: encLayers,
                encrypted_layer_names: encryptedLayerNames,
                plain_layer_names: plainLayerNames,
                total_layers: 5,
                mock: true,
                ciphertext_sample: ciphertextSample,
                ciphertext_total_size: ciphertextTotalSize
            });
        }, delay);
    });
}

// Display result
function displayResult(result) {
    const {
        prediction,
        scores,
        elapsed_ms,
        encrypted,
        mock,
        encrypted_layers = 0,
        encrypted_layer_names = [],
        plain_layer_names = [],
        ciphertext_sample = null,
        ciphertext_total_size = 0
    } = result;

    resultDigit.textContent = prediction;

    // Set status message based on encryption mode
    if (mock) {
        if (encrypted_layers === 0) {
            setStatus('success', 'Demo mode - plaintext inference');
        } else if (encrypted_layers === 5) {
            setStatus('success', 'Demo mode - fully encrypted inference');
        } else {
            setStatus('success', `Demo mode - hybrid inference (${encrypted_layers}/5 layers encrypted)`);
        }
    } else if (encrypted) {
        if (encrypted_layers === 5) {
            setStatus('success', 'Inference completed on fully encrypted data!');
        } else {
            setStatus('success', `Hybrid inference completed (${encrypted_layers}/5 layers encrypted)`);
        }
    } else {
        setStatus('success', 'Plaintext inference completed');
    }

    // Update confidence bars
    if (scores) {
        renderConfidenceBars(scores, prediction);
    }

    // Show metrics
    metricsArea.style.display = 'flex';
    metricTime.textContent = `${elapsed_ms}ms`;

    if (encrypted_layers === 0) {
        metricEncrypted.textContent = 'No';
    } else if (encrypted_layers === 5) {
        metricEncrypted.textContent = 'Full';
    } else {
        metricEncrypted.textContent = `${encrypted_layers}/5`;
    }

    // Show layer info
    layerInfoArea.style.display = 'block';
    encryptedLayersList.textContent = encrypted_layer_names.length > 0
        ? encrypted_layer_names.join(' → ')
        : 'None';
    plainLayersList.textContent = plain_layer_names.length > 0
        ? plain_layer_names.join(' → ')
        : 'None';

    // Show ciphertext preview if available
    if (ciphertext_sample && encrypted_layers > 0) {
        ciphertextArea.style.display = 'block';
        ciphertextContent.textContent = ciphertext_sample;
        ciphertextSize.textContent = formatBytes(ciphertext_total_size);
    } else {
        ciphertextArea.style.display = 'none';
    }
}

// Format bytes to human readable
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Render confidence bars
function renderConfidenceBars(scores = null, highlight = -1) {
    confidenceBar.innerHTML = '';

    for (let i = 0; i < 10; i++) {
        const percent = scores ? (scores[i] * 100).toFixed(1) : 0;
        const isHighlight = i === highlight;

        const item = document.createElement('div');
        item.className = `confidence-item${isHighlight ? ' highlight' : ''}`;
        item.innerHTML = `
            <span class="digit">${i}</span>
            <div class="bar">
                <div class="bar-fill" style="width: ${percent}%"></div>
            </div>
            <span class="percent">${scores ? percent + '%' : '-'}</span>
        `;
        confidenceBar.appendChild(item);
    }
}

// Set status
function setStatus(type, message) {
    statusArea.className = `status ${type}`;

    if (type === 'processing') {
        statusArea.innerHTML = `<div class="spinner"></div><span>${message}</span>`;
    } else {
        statusArea.innerHTML = `<span>${message}</span>`;
    }
}

// Load sample images
function loadSamples() {
    // Embedded sample data
    const samples = getSampleData();

    samples.forEach((sample, index) => {
        const btn = document.createElement('button');
        btn.className = 'sample-btn';
        btn.title = `Digit ${sample.label}`;

        const sampleCanvas = document.createElement('canvas');
        sampleCanvas.width = 28;
        sampleCanvas.height = 28;
        const sampleCtx = sampleCanvas.getContext('2d');

        // Draw sample
        const imageData = sampleCtx.createImageData(28, 28);
        for (let i = 0; i < sample.pixels.length; i++) {
            const idx = i * 4;
            imageData.data[idx] = sample.pixels[i];
            imageData.data[idx + 1] = sample.pixels[i];
            imageData.data[idx + 2] = sample.pixels[i];
            imageData.data[idx + 3] = 255;
        }
        sampleCtx.putImageData(imageData, 0, 0);

        btn.appendChild(sampleCanvas);

        btn.addEventListener('click', () => loadSample(sample.pixels));

        samplesGrid.appendChild(btn);
    });
}

// Load sample to main canvas
function loadSample(pixels) {
    // Clear and draw sample
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Scale up from 28x28 to 280x280
    const imageData = ctx.createImageData(280, 280);

    for (let y = 0; y < 280; y++) {
        for (let x = 0; x < 280; x++) {
            const srcX = Math.floor(x / 10);
            const srcY = Math.floor(y / 10);
            const srcIdx = srcY * 28 + srcX;
            const dstIdx = (y * 280 + x) * 4;

            imageData.data[dstIdx] = pixels[srcIdx];
            imageData.data[dstIdx + 1] = pixels[srcIdx];
            imageData.data[dstIdx + 2] = pixels[srcIdx];
            imageData.data[dstIdx + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    hasDrawn = true;
    canvasOverlay.classList.add('hidden');
    inferBtn.disabled = false;
}

// Sample MNIST data (various digits)
function getSampleData() {
    return [
        // Digit 0
        {
            label: 0,
            pixels: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,49,238,253,253,253,238,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,25,225,253,252,252,252,252,252,252,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,127,252,253,252,252,202,37,37,178,252,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,50,252,253,252,202,50,0,0,25,228,253,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,75,253,254,178,0,0,0,0,25,253,254,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,50,252,253,75,0,0,0,0,25,252,253,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,178,253,0,0,0,0,0,50,252,253,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,178,253,0,0,0,0,0,128,253,254,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,178,253,0,0,0,0,0,128,252,178,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,203,253,50,0,0,0,50,253,253,125,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,203,252,175,0,0,0,128,252,227,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,75,253,253,125,0,75,228,253,75,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,203,252,252,202,228,252,177,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,75,178,253,253,253,178,50,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        },
        // Digit 1
        {
            label: 1,
            pixels: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,171,254,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,114,254,254,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,114,254,197,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,29,228,254,197,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,86,254,254,197,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,86,254,254,197,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,86,254,254,197,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,114,254,254,143,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,254,254,57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,254,254,57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,254,254,226,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,254,254,226,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,254,254,170,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,114,254,254,86,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,171,254,254,29,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,171,254,254,29,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        },
        // Digit 2
        {
            label: 2,
            pixels: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,128,255,255,255,255,191,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,255,255,255,255,255,255,255,255,191,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,255,255,255,255,191,64,64,255,255,255,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,255,255,128,0,0,0,0,255,255,255,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,64,0,0,0,0,0,191,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,255,255,191,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,191,255,255,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,255,255,191,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,255,255,191,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,255,255,191,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,255,255,191,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,255,255,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,191,255,255,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,191,255,255,255,255,255,255,255,255,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        },
        // Digit 3
        {
            label: 3,
            pixels: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,38,166,254,254,254,191,51,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,25,178,247,254,254,254,254,254,254,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,166,254,254,254,203,114,229,254,254,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,38,121,121,64,0,0,203,254,254,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,38,247,254,178,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,127,254,254,203,25,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,254,254,254,76,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,203,254,254,242,178,127,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,25,229,254,254,254,254,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13,76,191,254,254,191,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13,203,254,254,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,254,254,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,254,254,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,102,254,254,203,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13,64,25,0,38,191,254,254,191,13,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,89,254,254,254,254,254,254,254,166,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,127,254,254,254,254,229,121,13,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        },
        // Digit 4
        {
            label: 4,
            pixels: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,197,254,158,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,77,254,254,158,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,107,254,254,158,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,47,238,254,215,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,77,254,254,137,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,197,254,225,27,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,77,254,254,89,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,138,254,254,89,0,0,0,19,108,191,47,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,197,254,225,24,0,0,0,158,254,254,89,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,77,254,254,99,0,0,0,77,246,254,254,89,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,138,254,254,197,157,157,226,254,254,254,254,89,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,59,225,254,254,254,254,254,254,254,254,254,89,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,27,89,166,166,166,166,166,254,254,166,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,254,254,89,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,254,254,89,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,254,254,89,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        },
        // Digit 5
        {
            label: 5,
            pixels: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,121,254,254,254,254,254,206,63,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,63,254,254,254,254,254,254,254,254,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,143,254,254,254,148,81,81,26,26,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,148,254,254,176,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,206,254,254,90,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,206,254,254,116,26,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,206,254,254,254,254,184,81,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,85,254,254,254,254,254,254,201,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,63,143,188,254,254,254,254,175,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,26,116,254,254,254,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,143,254,254,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,143,254,254,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,85,254,254,201,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,26,143,254,254,201,26,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,55,224,254,254,230,26,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,143,254,254,254,206,26,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,206,254,254,201,26,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        },
        // Digit 6
        {
            label: 6,
            pixels: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,62,180,253,253,116,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,247,253,253,253,218,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,253,253,253,253,218,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,100,253,253,253,253,234,42,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,215,253,253,253,191,19,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,35,253,253,253,212,21,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,156,253,253,253,50,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,14,229,253,253,175,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,103,253,253,253,86,0,31,178,253,116,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,178,253,253,253,165,132,247,253,253,196,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,28,238,253,253,253,253,253,253,253,253,196,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,53,253,253,253,253,253,253,253,253,253,196,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,134,253,253,253,253,255,253,253,253,253,196,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,134,253,253,253,253,253,253,253,253,253,196,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,57,234,253,253,253,253,253,253,253,162,19,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,42,175,253,253,253,253,212,72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        },
        // Digit 7
        {
            label: 7,
            pixels: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,84,185,159,151,60,36,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,222,254,254,254,254,241,198,198,198,198,198,198,198,198,170,52,0,0,0,0,0,0,0,0,0,0,0,0,67,114,72,114,163,227,254,225,254,254,254,250,229,254,254,140,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,17,66,14,67,67,67,59,21,236,254,106,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,83,253,209,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,22,233,255,83,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,129,254,238,44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,59,249,254,62,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,133,254,187,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,205,248,58,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,126,254,182,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,75,251,240,57,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,19,221,254,166,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,203,254,219,35,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,38,254,254,77,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,31,224,254,115,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,133,254,254,52,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,61,242,254,254,52,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,121,254,254,219,40,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,121,254,207,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        },
        // Digit 8
        {
            label: 8,
            pixels: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,99,188,253,253,253,242,92,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,92,241,253,253,253,253,253,253,253,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,41,241,253,253,253,173,58,58,232,253,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,99,253,253,236,49,0,0,62,253,253,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,99,253,253,192,0,0,0,62,253,253,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,99,253,253,253,180,99,168,241,253,248,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,181,253,253,253,253,253,253,253,117,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,155,253,253,253,253,253,253,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,62,253,253,253,253,253,253,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,62,236,253,253,222,222,253,253,117,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,180,253,253,241,49,180,253,253,160,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,62,253,253,241,49,0,117,253,253,160,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,180,253,253,117,0,0,62,253,253,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,180,253,253,117,0,0,117,253,253,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,99,253,253,241,168,168,235,253,253,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,160,253,253,253,253,253,253,242,49,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,92,191,253,253,253,173,49,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        },
        // Digit 9
        {
            label: 9,
            pixels: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,73,253,253,253,253,180,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,102,253,252,252,252,252,252,253,194,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,242,252,252,252,240,131,227,253,252,92,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,175,252,252,252,206,30,0,92,253,252,195,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,175,252,252,227,20,0,0,0,253,252,195,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,92,252,252,227,0,0,0,102,253,252,195,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,175,253,248,163,163,163,215,253,224,71,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,21,163,252,252,252,252,252,206,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,82,174,252,252,227,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,175,252,252,112,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,252,252,233,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,252,252,233,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,252,252,233,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,174,253,252,195,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,174,252,239,71,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        }
    ];
}

// Initialize on load
window.addEventListener('DOMContentLoaded', init);
