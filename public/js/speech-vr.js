let recognition = null;
let isListening = false;
let isVRMode = false;
let vrDisplay = null;
let vrButton = null;

function initSpeechRecognition() {
    console.log('Инициализация голосового распознавания...');
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.error('Голосовое распознавание не поддерживается');
        return false;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'ru-RU';
    
    recognition.onstart = function() {
        console.log('Голосовое распознавание запущено');
        isListening = true;
        updateVoiceStatus('Слушаю...', '#00ffaa');
    };
    
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        console.log('Распознано:', transcript);
        
        updateVoiceStatus(`Распознано: "${transcript}"`, '#00ffaa');
        processVoiceCommand(transcript);
    };
    
    recognition.onerror = function(event) {
        console.error('Ошибка распознавания:', event.error);
        updateVoiceStatus(`Ошибка: ${event.error}`, '#ff4757');
        isListening = false;
    };
    
    recognition.onend = function() {
        console.log('Голосовое распознавание остановлено');
        isListening = false;
        updateVoiceStatus('Готов к распознаванию', '#ffa502');
    };
    
    console.log('Голосовое распознавание инициализировано');
    return true;
}

function updateVoiceStatus(message, color = '#ffffff') {
    const statusElement = document.getElementById('voiceStatus');
    if (!statusElement) return;
    
    const voiceStatus = document.createElement('div');
    voiceStatus.id = 'voiceStatus';
    voiceStatus.innerHTML = `<i class="fas fa-circle" style="color: ${color}"></i> ${message}`;
    voiceStatus.style.cssText = `
        margin-top: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.9rem;
    `;
    
    const modeStatus = document.querySelector('.mode-status');
    if (modeStatus && !document.getElementById('voiceStatus')) {
        modeStatus.appendChild(voiceStatus);
    } else if (document.getElementById('voiceStatus')) {
        document.getElementById('voiceStatus').innerHTML = `<i class="fas fa-circle" style="color: ${color}"></i> ${message}`;
    }
}

function processVoiceCommand(command) {
    console.log('Обрабатываем команду:', command);
    
    const cmd = command.toLowerCase();
    
    if (cmd.includes('конверт') || cmd.includes('перевод') || cmd.includes('сколько')) {
        handleConversionCommand(cmd);
    }
    else if (cmd.includes('доллар') || cmd.includes('usd')) {
        selectCurrency('USD', 'from');
    }
    else if (cmd.includes('евро') || cmd.includes('eur')) {
        selectCurrency('EUR', 'from');
    }
    else if (cmd.includes('фунт') || cmd.includes('gbp')) {
        selectCurrency('GBP', 'from');
    }
    else if (cmd.includes('йен') || cmd.includes('иен') || cmd.includes('jpy')) {
        selectCurrency('JPY', 'from');
    }
    else if (cmd.includes('сумма') || cmd.match(/\d+/)) {
        handleAmountCommand(cmd);
    }
    else if (cmd.includes('помощь') || cmd.includes('команды')) {
        showVoiceHelp();
    }
    else {
        showVoiceMessage(`Не понял команду: "${command}". Скажите "помощь" для списка команд.`);
    }
}

function handleConversionCommand(command) {
    console.log('Обработка команды конвертации:', command);
    
    const amountMatch = command.match(/(\d+)/);
    const amount = amountMatch ? parseInt(amountMatch[1]) : 1000;
    
    const currencies = {
        'доллар': 'USD', 'usd': 'USD',
        'евро': 'EUR', 'eur': 'EUR',
        'фунт': 'GBP', 'gbp': 'GBP',
        'йен': 'JPY', 'иен': 'JPY', 'jpy': 'JPY',
        'рубл': 'RUB', 'rub': 'RUB'
    };
    
    let fromCurrency = 'USD';
    let toCurrency = 'EUR';
    
    for (const [key, value] of Object.entries(currencies)) {
        if (command.includes(key)) {
            if (fromCurrency === 'USD') {
                fromCurrency = value;
            } else {
                toCurrency = value;
                break;
            }
        }
    }
    
    if (window.appState && window.appElements) {
        window.appState.amount = amount;
        window.appState.fromCurrency = fromCurrency;
        window.appState.toCurrency = toCurrency;
        
        window.appElements.amountInput.value = amount;
        window.appElements.fromCurrencyBox.querySelector('.code').textContent = fromCurrency;
        window.appElements.toCurrencyBox.querySelector('.code').textContent = toCurrency;
        
        setTimeout(() => {
            window.appFunctions.performConversion();
            showVoiceMessage(`Конвертирую ${amount} ${fromCurrency} в ${toCurrency}`);
        }, 500);
    }
}

function selectCurrency(currencyCode, type = 'to') {
    console.log(`Голосовой выбор валюты: ${currencyCode} (${type})`);
    
    if (window.appState && window.appElements) {
        if (type === 'from') {
            window.appState.fromCurrency = currencyCode;
            window.appElements.fromCurrencyBox.querySelector('.code').textContent = currencyCode;
        } else {
            window.appState.toCurrency = currencyCode;
            window.appElements.toCurrencyBox.querySelector('.code').textContent = currencyCode;
        }
        
        showVoiceMessage(`Выбрана валюта: ${currencyCode}`);
    }
}

function handleAmountCommand(command) {
    const amountMatch = command.match(/(\d+)/);
    if (amountMatch) {
        const amount = parseInt(amountMatch[1]);
        
        if (window.appState && window.appElements) {
            window.appState.amount = amount;
            window.appElements.amountInput.value = amount;
            
            showVoiceMessage(`Установлена сумма: ${amount}`);
            setTimeout(() => window.appFunctions.performConversion(), 500);
        }
    }
}

function showVoiceHelp() {
    const helpText = `
        Доступные команды:<br>
        • "Конвертируй 1000 долларов в евро"<br>
        • "Сколько будет 500 евро в йенах"<br>
        • "Выбери доллар" или "Выбери евро"<br>
        • "Сумма 2500"<br>
        • "Помощь" - эта справка
    `;
    
    showVoiceMessage(helpText);
}

function showVoiceMessage(message) {
    let messageBox = document.getElementById('voiceMessageBox');
    
    if (!messageBox) {
        messageBox = document.createElement('div');
        messageBox.id = 'voiceMessageBox';
        messageBox.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 40, 80, 0.9);
            color: white;
            padding: 20px;
            border-radius: 15px;
            border: 2px solid #00aaff;
            max-width: 500px;
            z-index: 10000;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        `;
        document.body.appendChild(messageBox);
    }
    
    messageBox.innerHTML = `
        <div style="font-size: 1.2rem; margin-bottom: 10px;">
            <i class="fas fa-microphone"></i> Голосовая команда
        </div>
        <div>${message}</div>
    `;
    
    setTimeout(() => {
        if (messageBox.parentNode) {
            messageBox.style.opacity = '0';
            messageBox.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                if (messageBox.parentNode) {
                    messageBox.parentNode.removeChild(messageBox);
                }
            }, 500);
        }
    }, 3000);
}

function startVoiceInput() {
    console.log('Запуск голосового ввода...');
    
    if (!recognition) {
        const initialized = initSpeechRecognition();
        if (!initialized) {
            showVoiceMessage('Голосовое распознавание не поддерживается');
            return;
        }
    }
    
    if (isListening) {
        recognition.stop();
        return;
    }
    
    try {
        recognition.start();
        showVoiceMessage('Говорите сейчас...');
    } catch (error) {
        console.error('Ошибка запуска распознавания:', error);
        showVoiceMessage('Ошибка доступа к микрофону');
    }
}

function activateVoiceMode() {
    console.log('Активация голосового режима...');
    
    if (!recognition) {
        initSpeechRecognition();
    }
    
    updateVoiceStatus('Голосовой режим активен', '#00ffaa');
    showVoiceMessage('Голосовой режим активирован. Скажите "помощь" для списка команд.');
}

function initVR() {
    console.log('Инициализация VR режима...');
    
    if (!navigator.getVRDisplays) {
        console.log('WebVR не поддерживается');
        return false;
    }
    
    createVRButton();
    
    navigator.getVRDisplays().then(displays => {
        if (displays.length > 0) {
            vrDisplay = displays[0];
            console.log('VR дисплей найден:', vrDisplay);
            
            if (vrButton) {
                vrButton.style.display = 'block';
                updateVRStatus('VR очки доступны', '#2ed573');
            }
        } else {
            console.log('VR дисплеи не найдены');
            updateVRStatus('VR очки не найдены', '#ffa502');
        }
    });
    
    return true;
}

function createVRButton() {
    if (vrButton) return;
    
    vrButton = document.createElement('button');
    vrButton.innerHTML = '<i class="fas fa-vr-cardboard"></i> Войти в VR';
    vrButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px 25px;
        background: linear-gradient(45deg, #ff0080, #8000ff);
        border: none;
        border-radius: 10px;
        color: white;
        font-family: 'Orbitron', sans-serif;
        font-weight: bold;
        cursor: pointer;
        z-index: 1000;
        display: none;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    `;
    
    vrButton.onclick = enterVRMode;
    document.body.appendChild(vrButton);
}

function enterVRMode() {
    console.log('Вход в VR режим...');
    
    if (!vrDisplay) {
        showVRMessage('VR очки не подключены');
        return;
    }
    
    isVRMode = true;
    updateVRStatus('VR режим активен', '#00ffaa');
    
    if (window.appFunctions && window.appFunctions.switchMode) {
        window.appFunctions.switchMode('vr');
    }
    
    showVRMessage('VR режим активирован. Используйте контроллеры для взаимодействия.');
}

function updateVRStatus(message, color = '#ffffff') {
    const statusElement = document.getElementById('vrStatus');
    if (!statusElement) return;
    
    const vrStatus = document.createElement('div');
    vrStatus.id = 'vrStatus';
    vrStatus.innerHTML = `<i class="fas fa-circle" style="color: ${color}"></i> ${message}`;
    vrStatus.style.cssText = `
        margin-top: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.9rem;
    `;
    
    const modeStatus = document.querySelector('.mode-status');
    if (modeStatus && !document.getElementById('vrStatus')) {
        modeStatus.appendChild(vrStatus);
    } else if (document.getElementById('vrStatus')) {
        document.getElementById('vrStatus').innerHTML = `<i class="fas fa-circle" style="color: ${color}"></i> ${message}`;
    }
}

function showVRMessage(message) {
    const messageBox = document.createElement('div');
    messageBox.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        color: #00ffaa;
        padding: 30px;
        border-radius: 20px;
        border: 3px solid #00ffaa;
        font-size: 1.5rem;
        text-align: center;
        z-index: 10000;
        max-width: 80%;
        box-shadow: 0 0 50px #00ffaa;
    `;
    
    messageBox.innerHTML = `
        <div style="margin-bottom: 20px;">
            <i class="fas fa-vr-cardboard fa-3x"></i>
        </div>
        <div>${message}</div>
    `;
    
    document.body.appendChild(messageBox);
    
    setTimeout(() => {
        if (messageBox.parentNode) {
            messageBox.style.opacity = '0';
            messageBox.style.transition = 'opacity 1s';
            setTimeout(() => {
                if (messageBox.parentNode) {
                    messageBox.parentNode.removeChild(messageBox);
                }
            }, 1000);
        }
    }, 3000);
}

function activateVRMode() {
    console.log('Активация VR режима...');
    
    if (!vrButton) {
        initVR();
    }
    
    showVRMessage(`
        <h3>VR режим активирован</h3>
        <p>1. Наденьте VR очки</p>
        <p>2. Используйте контроллеры для выбора валют</p>
        <p>3. Смотрите на маркеры для конвертации</p>
    `);
    
    simulateVRInteraction();
}

function simulateVRInteraction() {
    console.log('Симуляция VR взаимодействия...');
    
    document.body.classList.add('vr-mode');
    
    const style = document.createElement('style');
    style.id = 'vr-styles';
    style.textContent = `
        .vr-mode .control-section {
            transform: perspective(1000px) rotateX(10deg);
            transition: transform 0.5s;
        }
        
        .vr-mode .globe-section {
            transform: scale(1.1);
            transition: transform 0.5s;
        }
        
        .vr-mode .card {
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #00ffaa;
        }
    `;
    
    document.head.appendChild(style);
    
    let vrUpdateInterval = setInterval(() => {
        if (!isVRMode) {
            clearInterval(vrUpdateInterval);
            document.body.classList.remove('vr-mode');
            document.getElementById('vr-styles')?.remove();
            return;
        }
        
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            const randomShake = Math.random() * 2 - 1;
            card.style.transform = `translateY(${randomShake}px)`;
        });
    }, 100);
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Инициализируем модуль голосовых команд и VR...');
    
    initSpeechRecognition();
    initVR();
    
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
        voiceBtn.addEventListener('click', startVoiceInput);
    }
});

window.speechVRApp = {
    startVoiceInput,
    activateVoiceMode,
    activateVRMode,
    processVoiceCommand,
    showVoiceMessage
};

console.log('Модуль голосовых команд и VR загружен');