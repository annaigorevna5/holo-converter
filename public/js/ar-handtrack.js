const HoloXR = {
    // State
    isActive: false,
    currentMode: null, // 'ar', 'vr', 'hand'
    video: null,
    canvas: null,
    context: null,
    model: null,
    predictions: [],
    gestures: [],
    
    // Configuration
    config: {
        camera: {
            facingMode: 'environment',
            width: 1280,
            height: 720
        },
        handTracking: {
            maxHands: 2,
            scoreThreshold: 0.7
        },
        gestures: {
            victory: { name: 'Convert', gesture: 'victory', action: 'convert' },
            point: { name: 'Select', gesture: 'point', action: 'select' },
            open: { name: 'Recognize', gesture: 'open', action: 'recognize' }
        }
    },
    
    // Initialize XR system
    async init() {
        console.log('[XR] Initializing extended reality system...');
        
        try {
            // Get DOM elements
            this.video = document.getElementById('xrVideo');
            this.canvas = document.getElementById('xrCanvas');
            
            if (!this.video || !this.canvas) {
                throw new Error('XR elements not found');
            }
            
            this.context = this.canvas.getContext('2d');
            this.updateCanvasSize();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Check XR capabilities
            await this.checkCapabilities();
            
            console.log('[XR] System initialized successfully');
            return true;
            
        } catch (error) {
            console.error('[XR] Initialization failed:', error);
            HoloUtils.Error.handle(error, 'XR initialization');
            return false;
        }
    },
    
    // Check device capabilities
    async checkCapabilities() {
        const capabilities = {
            ar: false,
            vr: false,
            handTracking: false,
            camera: false
        };
        
        // Check AR/VR
        if ('xr' in navigator) {
            try {
                const supported = await navigator.xr.isSessionSupported('immersive-ar');
                capabilities.ar = supported;
                
                const vrSupported = await navigator.xr.isSessionSupported('immersive-vr');
                capabilities.vr = vrSupported;
            } catch (error) {
                console.warn('[XR] WebXR check failed:', error);
            }
        }
        
        // Check hand tracking
        if (typeof handTrack !== 'undefined') {
            capabilities.handTracking = true;
        }
        
        // Check camera
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            capabilities.camera = true;
        }
        
        console.log('[XR] Capabilities:', capabilities);
        return capabilities;
    },
    
    // Start AR mode
    async startAR() {
        console.log('[XR] Starting AR mode...');
        
        try {
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: this.config.camera.facingMode,
                    width: { ideal: this.config.camera.width },
                    height: { ideal: this.config.camera.height }
                },
                audio: false
            });
            
            this.video.srcObject = stream;
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.updateCanvasSize();
                    resolve();
                };
            });
            
            this.currentMode = 'ar';
            this.isActive = true;
            
            // Show XR overlay
            this.showOverlay();
            
            console.log('[XR] AR mode started');
            HoloUtils.UI.showNotification('AR mode activated', 'success');
            
            return true;
            
        } catch (error) {
            console.error('[XR] Failed to start AR:', error);
            HoloUtils.Error.handle(error, 'AR startup');
            return false;
        }
    },
    
    // Start hand tracking
    async startHandTracking() {
        console.log('[XR] Starting hand tracking...');
        
        try {
            // Load hand tracking model
            const modelParams = {
                flipHorizontal: true,
                maxNumBoxes: this.config.handTracking.maxHands,
                scoreThreshold: this.config.handTracking.scoreThreshold
            };
            
            this.model = await handTrack.load(modelParams);
            console.log('[XR] Hand tracking model loaded');
            
            // Start AR if not already active
            if (!this.isActive) {
                await this.startAR();
            }
            
            // Start detection loop
            this.detectHands();
            
            console.log('[XR] Hand tracking started');
            HoloUtils.UI.showNotification('Hand tracking activated', 'success');
            
            return true;
            
        } catch (error) {
            console.error('[XR] Failed to start hand tracking:', error);
            HoloUtils.Error.handle(error, 'Hand tracking');
            return false;
        }
    },
    
    // Start VR mode
    async startVR() {
        console.log('[XR] Starting VR mode...');
        
        try {
            if (!('xr' in navigator)) {
                throw new Error('WebXR not supported');
            }
            
            // Check if VR is supported
            const supported = await navigator.xr.isSessionSupported('immersive-vr');
            
            if (!supported) {
                throw new Error('VR not supported on this device');
            }
            
            // Create VR session
            const session = await navigator.xr.requestSession('immersive-vr', {
                optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
            });
            
            this.currentMode = 'vr';
            this.isActive = true;
            
            console.log('[XR] VR session created:', session);
            HoloUtils.UI.showNotification('VR mode activated', 'success');
            
            // Implement VR rendering
            this.showVRInstructions();
            
            return true;
            
        } catch (error) {
            console.error('[XR] Failed to start VR:', error);
            HoloUtils.Error.handle(error, 'VR startup');
            return false;
        }
    },
    
    // Stop XR mode
    stop() {
        console.log('[XR] Stopping XR mode...');
        
        // Stop camera stream
        if (this.video && this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.video.srcObject = null;
        }
        
        // Reset state
        this.isActive = false;
        this.currentMode = null;
        this.predictions = [];
        
        // Hide overlay
        this.hideOverlay();
        
        // Clear canvas
        if (this.context) {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        console.log('[XR] XR mode stopped');
        HoloUtils.UI.showNotification('XR mode deactivated', 'info');
    },
    
    // Hand detection loop
    async detectHands() {
        if (!this.isActive || !this.model || !this.video.readyState) {
            return;
        }
        
        try {
            // Detect hands
            this.predictions = await this.model.detect(this.video);
            
            // Draw predictions
            this.drawPredictions();
            
            // Analyze gestures
            this.analyzeGestures();
            
            // Continue loop
            if (this.isActive) {
                requestAnimationFrame(() => this.detectHands());
            }
            
        } catch (error) {
            console.error('[XR] Hand detection error:', error);
            
            // Retry after delay
            if (this.isActive) {
                setTimeout(() => this.detectHands(), 1000);
            }
        }
    },
    
    // Draw hand predictions
    drawPredictions() {
        if (!this.context || !this.canvas) return;
        
        // Clear canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw each prediction
        this.predictions.forEach(prediction => {
            const [x, y, width, height] = prediction.bbox;
            
            // Draw bounding box
            this.context.strokeStyle = '#00ffaa';
            this.context.lineWidth = 3;
            this.context.strokeRect(x, y, width, height);
            
            // Draw label
            this.context.fillStyle = '#00ffaa';
            this.context.font = '16px Arial';
            this.context.fillText(
                `${prediction.label} (${Math.round(prediction.score * 100)}%)`,
                x,
                y > 20 ? y - 5 : y + 20
            );
            
            // Draw landmarks
            if (prediction.landmarks) {
                this.context.fillStyle = '#ff0000';
                prediction.landmarks.forEach(landmark => {
                    this.context.beginPath();
                    this.context.arc(landmark[0], landmark[1], 5, 0, Math.PI * 2);
                    this.context.fill();
                });
            }
        });
    },
    
    // Analyze hand gestures
    analyzeGestures() {
        const now = Date.now();
        
        this.predictions.forEach(prediction => {
            // Check for specific gestures
            if (prediction.label === 'victory' && prediction.score > 0.8) {
                this.handleGesture('victory', prediction);
            }
            
            if (prediction.label === 'point' && prediction.score > 0.8) {
                this.handleGesture('point', prediction);
            }
            
            if (prediction.label === 'open' && prediction.score > 0.8) {
                this.handleGesture('open', prediction);
            }
        });
    },
    
    // Handle specific gesture
    handleGesture(gestureType, prediction) {
        const gesture = this.config.gestures[gestureType];
        if (!gesture) return;
        
        // Check cooldown
        const lastGesture = this.gestures.find(g => g.type === gestureType);
        if (lastGesture && (Date.now() - lastGesture.timestamp < 2000)) {
            return;
        }
        
        // Record gesture
        this.gestures.push({
            type: gestureType,
            timestamp: Date.now(),
            prediction: prediction
        });
        
        // Keep only recent gestures
        this.gestures = this.gestures.filter(g => Date.now() - g.timestamp < 10000);
        
        // Execute action
        this.executeGestureAction(gesture, prediction);
        
        // Visual feedback
        this.showGestureFeedback(gesture);
    },
    
    // Execute gesture action
    executeGestureAction(gesture, prediction) {
        console.log(`[XR] Gesture detected: ${gesture.name}`);
        
        switch (gesture.action) {
            case 'convert':
                this.triggerConversion();
                break;
                
            case 'select':
                this.handleSelection(prediction);
                break;
                
            case 'recognize':
                this.recognizeCurrency();
                break;
        }
    },
    
    // Trigger conversion
    triggerConversion() {
        console.log('[XR] Triggering conversion via gesture');
        
        // Visual feedback
        this.flashCanvas('#00ffaa');
        
        // Trigger conversion in main app
        if (window.HoloApp && typeof HoloApp.convert === 'function') {
            HoloApp.convert();
        }
        
        // Show notification
        HoloUtils.UI.showNotification('Conversion triggered by hand gesture!', 'success');
    },
    
    // Handle selection gesture
    handleSelection(prediction) {
        const [x, y, width, height] = prediction.bbox;
        const centerX = x + width / 2;
        
        // Divide screen into zones
        const zoneWidth = this.canvas.width / 3;
        
        if (centerX < zoneWidth) {
            console.log('[XR] Selected left zone');
            HoloUtils.UI.showNotification('Selected: Left zone', 'info');
        } else if (centerX < zoneWidth * 2) {
            console.log('[XR] Selected center zone');
            HoloUtils.UI.showNotification('Selected: Center zone', 'info');
        } else {
            console.log('[XR] Selected right zone');
            HoloUtils.UI.showNotification('Selected: Right zone', 'info');
        }
    },
    
    // Recognize currency (simulated)
    recognizeCurrency() {
        console.log('[XR] Attempting currency recognition');
        
        // Simulate recognition
        const currencies = ['USD', 'EUR', 'GBP', 'JPY'];
        const recognized = currencies[Math.floor(Math.random() * currencies.length)];
        
        // Show result in AR
        this.showARText(`Recognized: ${recognized}`, this.canvas.width / 2, 100);
        
        // Update app state
        if (window.HoloApp) {
            HoloApp.setFromCurrency(recognized);
        }
        
        HoloUtils.UI.showNotification(`Banknote recognized: ${recognized}`, 'success');
    },
    
    // Show text in AR
    showARText(text, x, y, color = '#00ffaa') {
        if (!this.context) return;
        
        this.context.save();
        this.context.fillStyle = color;
        this.context.font = 'bold 24px Arial';
        this.context.textAlign = 'center';
        this.context.fillText(text, x, y);
        this.context.restore();
        
        // Clear after delay
        setTimeout(() => {
            if (this.context) {
                this.context.clearRect(x - 150, y - 30, 300, 40);
            }
        }, 3000);
    },
    
    // Show conversion result in AR
    showResult(result) {
        if (!this.context || !this.isActive) return;
        
        const formatter = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        const mainText = `${result.amount} ${result.from} = ${formatter.format(result.result)} ${result.to}`;
        const rateText = `1 ${result.from} = ${formatter.format(result.rate)} ${result.to}`;
        
        // Clear previous result
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw result
        this.showARText(mainText, this.canvas.width / 2, this.canvas.height / 2 - 20);
        this.showARText(rateText, this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        // Visual feedback
        this.flashCanvas('#00ffaa');
    },
    
    // Visual feedback
    flashCanvas(color = '#00ffaa') {
        if (!this.canvas) return;
        
        const originalBorder = this.canvas.style.border;
        this.canvas.style.border = `3px solid ${color}`;
        this.canvas.style.boxShadow = `0 0 30px ${color}`;
        
        setTimeout(() => {
            this.canvas.style.border = originalBorder;
            this.canvas.style.boxShadow = 'none';
        }, 500);
    },
    
    // Show gesture feedback
    showGestureFeedback(gesture) {
        const feedback = document.createElement('div');
        feedback.className = 'gesture-feedback';
        feedback.innerHTML = `
            <div class="gesture-icon">
                <i class="fas fa-hand-${gesture.gesture === 'victory' ? 'peace' : 
                                      gesture.gesture === 'point' ? 'point-up' : 
                                      'paper'}"></i>
            </div>
            <div class="gesture-text">${gesture.name}</div>
        `;
        
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 40, 80, 0.9);
            padding: 20px 30px;
            border-radius: 15px;
            border: 2px solid #00ffaa;
            color: white;
            text-align: center;
            z-index: 10001;
            animation: gestureFeedback 1s ease-out;
        `;
        
        document.body.appendChild(feedback);
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes gestureFeedback {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
            }
        `;
        document.head.appendChild(style);
        
        // Remove after animation
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 1000);
    },
    
    // Show XR overlay
    showOverlay() {
        const overlay = document.getElementById('xrOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    },
    
    // Hide XR overlay
    hideOverlay() {
        const overlay = document.getElementById('xrOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },
    
    // Show VR instructions
    showVRInstructions() {
        const instructions = document.createElement('div');
        instructions.className = 'vr-instructions';
        instructions.innerHTML = `
            <div class="vr-instructions-content">
                <h3><i class="fas fa-vr-cardboard"></i> VR Mode Active</h3>
                <p>Put on your VR headset and use controllers to:</p>
                <ul>
                    <li><i class="fas fa-hand-point-up"></i> Select currencies on the globe</li>
                    <li><i class="fas fa-exchange-alt"></i> Trigger conversions</li>
                    <li><i class="fas fa-arrows-alt"></i> Navigate the 3D space</li>
                </ul>
                <button class="btn btn-primary exit-vr">
                    <i class="fas fa-times"></i> Exit VR
                </button>
            </div>
        `;
        
        instructions.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        document.body.appendChild(instructions);
        
        // Exit button
        instructions.querySelector('.exit-vr').addEventListener('click', () => {
            this.stop();
            if (instructions.parentNode) {
                instructions.parentNode.removeChild(instructions);
            }
        });
    },
    
    // Update canvas size
    updateCanvasSize() {
        if (this.canvas && this.video) {
            this.canvas.width = this.video.clientWidth || this.video.videoWidth || 640;
            this.canvas.height = this.video.clientHeight || this.video.videoHeight || 480;
        }
    },
    
    // Setup event listeners
    setupEventListeners() {
        window.addEventListener('resize', () => this.updateCanvasSize());
        
        // Close XR overlay
        const closeBtn = document.getElementById('closeXR');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.stop());
        }
        
        // Camera switch
        const toggleCamera = document.getElementById('toggleCamera');
        if (toggleCamera) {
            toggleCamera.addEventListener('click', () => this.switchCamera());
        }
    },
    
    // Switch camera (front/back)
    async switchCamera() {
        if (!this.isActive) return;
        
        try {
            // Stop current stream
            if (this.video.srcObject) {
                this.video.srcObject.getTracks().forEach(track => track.stop());
            }
            
            // Toggle facing mode
            this.config.camera.facingMode = 
                this.config.camera.facingMode === 'environment' ? 'user' : 'environment';
            
            // Restart with new camera
            await this.startAR();
            
            HoloUtils.UI.showNotification(`Switched to ${this.config.camera.facingMode === 'environment' ? 'rear' : 'front'} camera`, 'info');
            
        } catch (error) {
            console.error('[XR] Failed to switch camera:', error);
            HoloUtils.Error.handle(error, 'Camera switch');
        }
    }
};

// Make XR module globally available
window.HoloXR = HoloXR;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize XR system
    setTimeout(() => {
        HoloXR.init().then(initialized => {
            if (initialized) {
                console.log('[XR] Ready for use');
            }
        });
    }, 1000);
});

console.log('Holo Converter XR module loaded');