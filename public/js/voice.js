const HoloVoice = {
    // State
    isListening: false,
    isActive: false,
    recognition: null,
    commands: [],
    lastCommandTime: 0,
    
    // Configuration
    config: {
        language: 'en-US',
        continuous: false,
        interimResults: false,
        maxAlternatives: 1,
        confidence: 0.7,
        
        commands: {
            convert: ['convert', 'change', 'exchange', 'switch'],
            amount: ['amount', 'sum', 'total', 'set to', 'make it'],
            currency: {
                'dollar': 'USD',
                'euro': 'EUR',
                'pound': 'GBP',
                'yen': 'JPY',
                'yuan': 'CNY',
                'ruble': 'RUB',
                'franc': 'CHF',
                'peso': 'MXN',
                'rupee': 'INR'
            },
            help: ['help', 'commands', 'what can i say', 'tutorial'],
            modes: ['mouse mode', 'voice mode', 'hand mode', 'vr mode']
        },
        
        responses: {
            greeting: 'Hello! I am Holo Converter voice assistant. Say "help" for commands.',
            help: 'You can say: "Convert 100 dollars to euros", "Set amount to 500", or "Select yen"',
            listening: 'Listening...',
            notUnderstood: 'Sorry, I did not understand. Try saying "help" for commands.',
            converting: 'Converting {amount} {from} to {to}...',
            success: 'Conversion completed successfully'
        }
    },
    
    // Initialize voice recognition
    init() {
        console.log('[Voice] Initializing voice recognition...');
        
        // Check browser support
        if (!this.isSupported()) {
            console.warn('[Voice] Speech recognition not supported');
            this.showUnsupportedMessage();
            return false;
        }
        
        try {
            // Create recognition instance
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            // Configure recognition
            this.recognition.lang = this.config.language;
            this.recognition.continuous = this.config.continuous;
            this.recognition.interimResults = this.config.interimResults;
            this.recognition.maxAlternatives = this.config.maxAlternatives;
            
            // Setup event handlers
            this.setupEventHandlers();
            
            console.log('[Voice] Voice recognition initialized');
            return true;
            
        } catch (error) {
            console.error('[Voice] Initialization failed:', error);
            HoloUtils.Error.handle(error, 'Voice initialization');
            return false;
        }
    },
    
    // Check browser support
    isSupported() {
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    },
    
    // Setup event handlers
    setupEventHandlers() {
        if (!this.recognition) return;
        
        this.recognition.onstart = () => {
            console.log('[Voice] Recognition started');
            this.isListening = true;
            this.updateStatus('Listening...', '#00ffaa');
            this.showListeningIndicator(true);
        };
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const confidence = event.results[0][0].confidence;
            
            console.log(`[Voice] Recognized: "${transcript}" (confidence: ${confidence})`);
            
            this.updateStatus(`Heard: "${transcript}"`, '#00ffaa');
            
            // Process command if confidence is high enough
            if (confidence >= this.config.confidence) {
                this.processCommand(transcript);
            } else {
                this.speak("Sorry, I didn't catch that. Please try again.");
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('[Voice] Recognition error:', event.error);
            
            this.updateStatus(`Error: ${event.error}`, '#ff4757');
            
            if (event.error === 'not-allowed') {
                this.showPermissionMessage();
            }
            
            this.isListening = false;
            this.showListeningIndicator(false);
        };
        
        this.recognition.onend = () => {
            console.log('[Voice] Recognition ended');
            this.isListening = false;
            this.showListeningIndicator(false);
            
            if (this.isActive) {
                this.updateStatus('Ready for voice commands', '#ffa502');
            }
        };
    },
    
    // Activate voice mode
    activate() {
        console.log('[Voice] Activating voice mode...');
        
        if (!this.recognition && !this.init()) {
            HoloUtils.UI.showNotification('Voice recognition not available', 'error');
            return false;
        }
        
        this.isActive = true;
        this.updateStatus('Voice mode active', '#00ffaa');
        
        // Show voice interface
        this.showVoiceInterface();
        
        // Greet user
        this.speak(this.config.responses.greeting);
        
        console.log('[Voice] Voice mode activated');
        HoloUtils.UI.showNotification('Voice mode activated. Say "help" for commands.', 'success');
        
        return true;
    },
    
    // Deactivate voice mode
    deactivate() {
        console.log('[Voice] Deactivating voice mode...');
        
        if (this.isListening) {
            this.stopListening();
        }
        
        this.isActive = false;
        this.updateStatus('Voice mode inactive', '#8888cc');
        
        // Hide voice interface
        this.hideVoiceInterface();
        
        console.log('[Voice] Voice mode deactivated');
        HoloUtils.UI.showNotification('Voice mode deactivated', 'info');
    },
    
    // Start listening
    startListening() {
        if (!this.recognition || this.isListening) return;
        
        try {
            this.recognition.start();
            console.log('[Voice] Started listening');
        } catch (error) {
            console.error('[Voice] Failed to start listening:', error);
            
            // If already started, stop and retry
            if (error.message.includes('already started')) {
                this.recognition.stop();
                setTimeout(() => this.startListening(), 100);
            }
        }
    },
    
    // Stop listening
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            console.log('[Voice] Stopped listening');
        }
    },
    
    // Toggle listening
    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    },
    
    // Process voice command
    processCommand(transcript) {
        const command = transcript.toLowerCase();
        console.log(`[Voice] Processing command: "${command}"`);
        
        // Record command
        this.commands.push({
            text: command,
            timestamp: Date.now()
        });
        
        // Keep only recent commands
        this.commands = this.commands.filter(cmd => Date.now() - cmd.timestamp < 30000);
        
        // Check command cooldown
        const now = Date.now();
        if (now - this.lastCommandTime < 1000) {
            console.log('[Voice] Command ignored (cooldown)');
            return;
        }
        this.lastCommandTime = now;
        
        // Process different command types
        if (this.isHelpCommand(command)) {
            this.handleHelpCommand();
        } else if (this.isModeCommand(command)) {
            this.handleModeCommand(command);
        } else if (this.isAmountCommand(command)) {
            this.handleAmountCommand(command);
        } else if (this.isCurrencyCommand(command)) {
            this.handleCurrencyCommand(command);
        } else if (this.isConvertCommand(command)) {
            this.handleConvertCommand(command);
        } else {
            this.handleUnknownCommand(command);
        }
    },
    
    // Check if command is help request
    isHelpCommand(command) {
        return this.config.commands.help.some(helpWord => 
            command.includes(helpWord)
        );
    },
    
    // Check if command is mode change
    isModeCommand(command) {
        return this.config.commands.modes.some(mode => 
            command.includes(mode)
        );
    },
    
    // Check if command is amount setting
    isAmountCommand(command) {
        return this.config.commands.amount.some(amountWord => 
            command.includes(amountWord)
        ) || /\d+/.test(command);
    },
    
    // Check if command is currency selection
    isCurrencyCommand(command) {
        return Object.keys(this.config.commands.currency).some(currency => 
            command.includes(currency)
        );
    },
    
    // Check if command is conversion request
    isConvertCommand(command) {
        return this.config.commands.convert.some(convertWord => 
            command.includes(convertWord)
        );
    },
    
    // Handle help command
    handleHelpCommand() {
        console.log('[Voice] Help command received');
        
        this.speak(this.config.responses.help);
        this.showCommandList();
    },
    
    // Handle mode command
    handleModeCommand(command) {
        console.log('[Voice] Mode command received:', command);
        
        let mode = 'mouse';
        
        if (command.includes('voice mode')) {
            mode = 'voice';
        } else if (command.includes('hand mode')) {
            mode = 'hand';
        } else if (command.includes('vr mode')) {
            mode = 'vr';
        }
        
        // Switch mode in main app
        if (window.HoloApp && typeof HoloApp.switchMode === 'function') {
            HoloApp.switchMode(mode);
        }
        
        this.speak(`Switching to ${mode} mode`);
        HoloUtils.UI.showNotification(`Switched to ${mode} mode`, 'info');
    },
    
    // Handle amount command
    handleAmountCommand(command) {
        console.log('[Voice] Amount command received:', command);
        
        // Extract number from command
        const amountMatch = command.match(/(\d+(?:,\d{3})*(?:\.\d+)?)/);
        if (!amountMatch) {
            this.speak("I didn't hear a number. Please say something like 'set amount to 1000'");
            return;
        }
        
        const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        
        // Update amount in main app
        if (window.HoloApp && typeof HoloApp.setAmount === 'function') {
            HoloApp.setAmount(amount);
        }
        
        this.speak(`Amount set to ${amount}`);
        HoloUtils.UI.showNotification(`Amount set to ${HoloUtils.Format.number(amount)}`, 'success');
    },
    
    // Handle currency command
    handleCurrencyCommand(command) {
        console.log('[Voice] Currency command received:', command);
        
        // Find mentioned currency
        let currencyCode = null;
        let currencyType = 'to'; // Default to target currency
        
        // Check for specific keywords
        if (command.includes('from') || command.includes('source')) {
            currencyType = 'from';
        }
        
        // Find currency in command
        for (const [word, code] of Object.entries(this.config.commands.currency)) {
            if (command.includes(word)) {
                currencyCode = code;
                break;
            }
        }
        
        if (!currencyCode) {
            this.speak("I didn't recognize the currency. Please say something like 'select euros'");
            return;
        }
        
        // Update currency in main app
        if (window.HoloApp) {
            if (currencyType === 'from' && typeof HoloApp.setFromCurrency === 'function') {
                HoloApp.setFromCurrency(currencyCode);
            } else if (typeof HoloApp.setToCurrency === 'function') {
                HoloApp.setToCurrency(currencyCode);
            }
        }
        
        const currencyName = this.getCurrencyName(currencyCode);
        this.speak(`${currencyType === 'from' ? 'Source' : 'Target'} currency set to ${currencyName}`);
        
        HoloUtils.UI.showNotification(`${currencyType === 'from' ? 'From' : 'To'} currency: ${currencyCode}`, 'success');
    },
    
    // Handle convert command
    handleConvertCommand(command) {
        console.log('[Voice] Convert command received:', command);
        
        // Extract amount
        const amountMatch = command.match(/(\d+(?:,\d{3})*(?:\.\d+)?)/);
        const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 1000;
        
        // Extract currencies
        let fromCurrency = 'USD';
        let toCurrency = 'EUR';
        
        // Try to detect currencies
        const words = command.split(' ');
        for (let i = 0; i < words.length; i++) {
            const word = words[i].toLowerCase();
            
            if (this.config.commands.currency[word]) {
                if (fromCurrency === 'USD') {
                    fromCurrency = this.config.commands.currency[word];
                } else {
                    toCurrency = this.config.commands.currency[word];
                    break;
                }
            }
            
            // Check for "to" keyword
            if (word === 'to' && i + 1 < words.length) {
                const nextWord = words[i + 1].toLowerCase();
                if (this.config.commands.currency[nextWord]) {
                    toCurrency = this.config.commands.currency[nextWord];
                    break;
                }
            }
        }
        
        // Update app state
        if (window.HoloApp) {
            if (typeof HoloApp.setAmount === 'function') {
                HoloApp.setAmount(amount);
            }
            if (typeof HoloApp.setFromCurrency === 'function') {
                HoloApp.setFromCurrency(fromCurrency);
            }
            if (typeof HoloApp.setToCurrency === 'function') {
                HoloApp.setToCurrency(toCurrency);
            }
            if (typeof HoloApp.convert === 'function') {
                // Small delay to ensure state is updated
                setTimeout(() => HoloApp.convert(), 100);
            }
        }
        
        // Speak confirmation
        const fromName = this.getCurrencyName(fromCurrency);
        const toName = this.getCurrencyName(toCurrency);
        
        this.speak(`Converting ${amount} ${fromName} to ${toName}`);
        
        // Show visual feedback
        this.showConversionPreview(amount, fromCurrency, toCurrency);
    },
    
    // Handle unknown command
    handleUnknownCommand(command) {
        console.log('[Voice] Unknown command:', command);
        
        this.speak(this.config.responses.notUnderstood);
        this.updateStatus(`Unknown: "${command}"`, '#ffa502');
    },
    
    // Text-to-speech
    speak(text) {
        if (!('speechSynthesis' in window)) {
            console.warn('[Voice] Speech synthesis not supported');
            return;
        }
        
        // Cancel any ongoing speech
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.config.language;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onstart = () => {
            console.log('[Voice] Speaking:', text);
        };
        
        utterance.onend = () => {
            console.log('[Voice] Finished speaking');
        };
        
        utterance.onerror = (event) => {
            console.error('[Voice] Speech error:', event);
        };
        
        speechSynthesis.speak(utterance);
    },
    
    // Get currency name from code
    getCurrencyName(code) {
        const names = {
            'USD': 'US dollars',
            'EUR': 'euros',
            'GBP': 'British pounds',
            'JPY': 'Japanese yen',
            'CNY': 'Chinese yuan',
            'RUB': 'Russian rubles',
            'CAD': 'Canadian dollars',
            'AUD': 'Australian dollars',
            'CHF': 'Swiss francs'
        };
        
        return names[code] || code;
    },
    
    // Update status display
    updateStatus(message, color = '#ffffff') {
        // Update status element if exists
        const statusElement = document.getElementById('voiceStatus');
        if (statusElement) {
            statusElement.innerHTML = `<i class="fas fa-circle" style="color: ${color}"></i> ${message}`;
            statusElement.style.display = 'block';
        }
        
        // Update mode indicator
        const modeIndicator = document.getElementById('currentModeIndicator');
        if (modeIndicator && this.isActive) {
            modeIndicator.querySelector('span').textContent = 'Voice';
        }
    },
    
    // Show listening indicator
    showListeningIndicator(show) {
        const indicator = document.getElementById('voiceIndicator') || (() => {
            const div = document.createElement('div');
            div.id = 'voiceIndicator';
            div.className = 'voice-indicator';
            document.body.appendChild(div);
            return div;
        })();
        
        if (show) {
            indicator.innerHTML = `
                <div class="pulsing-circle"></div>
                <div class="listening-text">
                    <i class="fas fa-microphone"></i> Listening...
                </div>
            `;
            indicator.style.display = 'flex';
        } else {
            indicator.style.display = 'none';
        }
    },
    
    // Show voice interface
    showVoiceInterface() {
        const interfaceDiv = document.getElementById('voiceInterface') || (() => {
            const div = document.createElement('div');
            div.id = 'voiceInterface';
            div.className = 'voice-interface';
            document.body.appendChild(div);
            return div;
        })();
        
        interfaceDiv.innerHTML = `
            <div class="voice-header">
                <h3><i class="fas fa-microphone"></i> Voice Control</h3>
                <button class="voice-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="voice-content">
                <div class="voice-visualizer">
                    <div class="visualizer-bar"></div>
                    <div class="visualizer-bar"></div>
                    <div class="visualizer-bar"></div>
                    <div class="visualizer-bar"></div>
                    <div class="visualizer-bar"></div>
                </div>
                <div class="voice-instructions">
                    <p>Try saying:</p>
                    <ul>
                        <li>"Convert 1000 dollars to euros"</li>
                        <li>"Set amount to five hundred"</li>
                        <li>"Select yen as target currency"</li>
                        <li>"Help" for more commands</li>
                    </ul>
                </div>
                <div class="voice-controls">
                    <button class="voice-btn listen-btn">
                        <i class="fas fa-microphone"></i>
                        <span>Start Listening</span>
                    </button>
                    <button class="voice-btn stop-btn">
                        <i class="fas fa-stop"></i>
                        <span>Stop</span>
                    </button>
                </div>
            </div>
        `;
        
        interfaceDiv.style.display = 'block';
        
        // Add event listeners
        interfaceDiv.querySelector('.voice-close').addEventListener('click', () => {
            this.deactivate();
        });
        
        interfaceDiv.querySelector('.listen-btn').addEventListener('click', () => {
            this.startListening();
        });
        
        interfaceDiv.querySelector('.stop-btn').addEventListener('click', () => {
            this.stopListening();
        });
        
        // Add CSS if not already added
        if (!document.getElementById('voice-styles')) {
            this.addVoiceStyles();
        }
    },
    
    // Hide voice interface
    hideVoiceInterface() {
        const interfaceDiv = document.getElementById('voiceInterface');
        if (interfaceDiv) {
            interfaceDiv.style.display = 'none';
        }
        
        this.showListeningIndicator(false);
    },
    
    // Show command list
    showCommandList() {
        const commandList = document.createElement('div');
        commandList.className = 'command-list';
        commandList.innerHTML = `
            <div class="command-list-content">
                <h3><i class="fas fa-list"></i> Available Commands</h3>
                <div class="commands-grid">
                    <div class="command-category">
                        <h4><i class="fas fa-exchange-alt"></i> Conversion</h4>
                        <ul>
                            <li>"Convert 100 dollars to euros"</li>
                            <li>"Exchange 500 pounds for yen"</li>
                            <li>"Switch 1000 yuan to rubles"</li>
                        </ul>
                    </div>
                    <div class="command-category">
                        <h4><i class="fas fa-calculator"></i> Amount</h4>
                        <ul>
                            <li>"Set amount to 250"</li>
                            <li>"Make it 1000"</li>
                            <li>"Change amount to five hundred"</li>
                        </ul>
                    </div>
                    <div class="command-category">
                        <h4><i class="fas fa-flag"></i> Currency</h4>
                        <ul>
                            <li>"Select euros"</li>
                            <li>"Choose yen as target"</li>
                            <li>"From dollars to pounds"</li>
                        </ul>
                    </div>
                    <div class="command-category">
                        <h4><i class="fas fa-cog"></i> Controls</h4>
                        <ul>
                            <li>"Help" - Show commands</li>
                            <li>"Voice mode" - Switch mode</li>
                            <li>"Stop listening" - Stop voice</li>
                        </ul>
                    </div>
                </div>
                <button class="btn btn-primary close-commands">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        `;
        
        document.body.appendChild(commandList);
        
        // Close button
        commandList.querySelector('.close-commands').addEventListener('click', () => {
            if (commandList.parentNode) {
                commandList.parentNode.removeChild(commandList);
            }
        });
    },
    
    // Show conversion preview
    showConversionPreview(amount, from, to) {
        const preview = document.createElement('div');
        preview.className = 'conversion-preview';
        preview.innerHTML = `
            <div class="preview-content">
                <div class="preview-header">
                    <h3><i class="fas fa-bolt"></i> Voice Conversion</h3>
                </div>
                <div class="preview-body">
                    <div class="preview-amount">
                        ${HoloUtils.Format.number(amount)} <span class="currency">${from}</span>
                    </div>
                    <div class="preview-arrow">
                        <i class="fas fa-arrow-right"></i>
                    </div>
                    <div class="preview-result">
                        ?.?? <span class="currency">${to}</span>
                    </div>
                </div>
                <div class="preview-footer">
                    <div class="preview-status">
                        <i class="fas fa-spinner fa-spin"></i> Processing...
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(preview);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (preview.parentNode) {
                preview.parentNode.removeChild(preview);
            }
        }, 3000);
    },
    
    // Show unsupported message
    showUnsupportedMessage() {
        const message = document.createElement('div');
        message.className = 'unsupported-message';
        message.innerHTML = `
            <div class="message-content">
                <i class="fas fa-microphone-slash"></i>
                <h3>Voice Not Supported</h3>
                <p>Your browser does not support voice recognition.</p>
                <p>Please use Chrome, Edge, or Safari for voice features.</p>
            </div>
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 5000);
    },
    
    // Show permission message
    showPermissionMessage() {
        HoloUtils.UI.showNotification(
            'Microphone access is required for voice commands. Please allow microphone access in your browser settings.',
            'warning',
            10000
        );
    },
    
    // Add voice styles
    addVoiceStyles() {
        const style = document.createElement('style');
        style.id = 'voice-styles';
        style.textContent = `
            .voice-indicator {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 40, 80, 0.9);
                border: 2px solid #00ffaa;
                border-radius: 10px;
                padding: 15px 30px;
                display: flex;
                align-items: center;
                gap: 15px;
                z-index: 10000;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            }
            
            .pulsing-circle {
                width: 20px;
                height: 20px;
                background: #00ffaa;
                border-radius: 50%;
                animation: pulse 1.5s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(1.2); }
            }
            
            .listening-text {
                color: white;
                font-family: 'Orbitron', sans-serif;
                font-weight: bold;
            }
            
            .voice-interface {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 350px;
                background: rgba(20, 25, 60, 0.95);
                border: 2px solid #00aaff;
                border-radius: 15px;
                z-index: 10000;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(10px);
            }
            
            .voice-header {
                padding: 15px 20px;
                background: rgba(0, 30, 60, 0.8);
                border-bottom: 1px solid rgba(0, 150, 255, 0.3);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .voice-header h3 {
                margin: 0;
                color: #00ccff;
                font-size: 1.2rem;
            }
            
            .voice-close {
                background: none;
                border: none;
                color: #8888cc;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 5px;
                border-radius: 4px;
                transition: all 0.2s;
            }
            
            .voice-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #ffffff;
            }
            
            .voice-content {
                padding: 20px;
            }
            
            .voice-visualizer {
                display: flex;
                justify-content: center;
                gap: 5px;
                height: 40px;
                margin-bottom: 20px;
            }
            
            .visualizer-bar {
                width: 8px;
                background: #00aaff;
                border-radius: 4px;
                animation: visualizer 1s infinite alternate;
            }
            
            .visualizer-bar:nth-child(1) { animation-delay: 0.1s; }
            .visualizer-bar:nth-child(2) { animation-delay: 0.2s; }
            .visualizer-bar:nth-child(3) { animation-delay: 0.3s; }
            .visualizer-bar:nth-child(4) { animation-delay: 0.4s; }
            .visualizer-bar:nth-child(5) { animation-delay: 0.5s; }
            
            @keyframes visualizer {
                from { height: 10px; }
                to { height: 40px; }
            }
            
            .voice-instructions {
                background: rgba(10, 15, 40, 0.8);
                padding: 15px;
                border-radius: 10px;
                margin-bottom: 20px;
                color: #a0a0ff;
                font-size: 0.9rem;
            }
            
            .voice-instructions ul {
                margin: 10px 0 0 0;
                padding-left: 20px;
            }
            
            .voice-instructions li {
                margin-bottom: 5px;
            }
            
            .voice-controls {
                display: flex;
                gap: 10px;
            }
            
            .voice-btn {
                flex: 1;
                padding: 12px;
                background: rgba(0, 100, 255, 0.8);
                border: none;
                border-radius: 8px;
                color: white;
                font-family: 'Orbitron', sans-serif;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
            }
            
            .voice-btn:hover {
                background: rgba(0, 150, 255, 1);
                transform: translateY(-2px);
            }
            
            .stop-btn {
                background: rgba(255, 50, 50, 0.8);
            }
            
            .stop-btn:hover {
                background: rgba(255, 50, 50, 1);
            }
            
            .command-list {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
            }
            
            .command-list-content {
                background: rgba(30, 35, 70, 0.95);
                border: 2px solid #00aaff;
                border-radius: 20px;
                padding: 30px;
                max-width: 800px;
                max-height: 80vh;
                overflow-y: auto;
            }
            
            .commands-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin: 20px 0;
            }
            
            .command-category {
                background: rgba(10, 15, 40, 0.8);
                padding: 15px;
                border-radius: 10px;
                border: 1px solid rgba(0, 150, 255, 0.3);
            }
            
            .command-category h4 {
                color: #00ccff;
                margin-top: 0;
                margin-bottom: 10px;
                font-size: 1rem;
            }
            
            .command-category ul {
                margin: 0;
                padding-left: 20px;
                color: #c0c0ff;
                font-size: 0.9rem;
            }
            
            .command-category li {
                margin-bottom: 8px;
            }
            
            .conversion-preview {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 10000;
            }
            
            .preview-content {
                background: rgba(30, 35, 70, 0.95);
                border: 2px solid #00ffaa;
                border-radius: 15px;
                padding: 20px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            }
            
            .preview-amount, .preview-result {
                font-size: 2.5rem;
                color: #00ffaa;
                font-family: 'Orbitron', sans-serif;
                font-weight: bold;
            }
            
            .preview-arrow {
                font-size: 2rem;
                color: #00aaff;
                margin: 10px 0;
            }
            
            .preview-status {
                color: #a0a0ff;
                font-size: 0.9rem;
                margin-top: 10px;
            }
            
            .unsupported-message {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(30, 35, 70, 0.95);
                border: 2px solid #ff4757;
                border-radius: 15px;
                padding: 30px;
                text-align: center;
                z-index: 10000;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            }
            
            .unsupported-message i {
                font-size: 4rem;
                color: #ff4757;
                margin-bottom: 20px;
            }
            
            .unsupported-message h3 {
                color: #ff4757;
                margin-bottom: 10px;
            }
            
            .unsupported-message p {
                color: #a0a0ff;
                margin-bottom: 10px;
            }
            
            @media (max-width: 768px) {
                .voice-interface {
                    width: 90%;
                    right: 5%;
                    bottom: 10px;
                }
                
                .commands-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
};

// Make voice module globally available
window.HoloVoice = HoloVoice;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize voice system
    setTimeout(() => {
        if (HoloVoice.init()) {
            console.log('[Voice] Ready for use');
        }
    }, 1500);
    
    // Setup voice button if exists
    const voiceBtn = document.getElementById('voiceInputBtn');
    if (voiceBtn) {
        voiceBtn.addEventListener('click', () => {
            if (HoloVoice.isActive) {
                HoloVoice.deactivate();
            } else {
                HoloVoice.activate();
            }
        });
    }
});

console.log('Holo Converter Voice module loaded');