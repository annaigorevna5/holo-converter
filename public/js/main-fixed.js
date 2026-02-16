console.log('Holo Converter loaded!');

// Глобальные переменные
let exchangeRates = {};
let currentFromCurrency = 'USD';
let currentToCurrency = 'EUR';
let currentAmount = 1000;
let conversionHistory = [];

// Инициализация приложения
function initApp() {
    console.log('Initializing app...');
    
    // Проверяем наличие всех необходимых элементов
    const requiredElements = [
        'displayAmount', 'displayFromCurrency', 'convertedAmount', 'displayToCurrency',
        'rateFrom', 'rateValue', 'rateTo', 'resultTimestamp'
    ];
    
    let allElementsExist = true;
    requiredElements.forEach(id => {
        if (!document.getElementById(id)) {
            console.error(`❌ Элемент #${id} не найден!`);
            allElementsExist = false;
        }
    });
    
    if (!allElementsExist) {
        console.error('Не все элементы найдены, откладываем инициализацию...');
        setTimeout(initApp, 1000);
        return;
    }
    
    // Загружаем курсы валют
    loadExchangeRates();
    
    // Настраиваем обработчики событий
    setupEventListeners();
    
    // Обновляем отображение
    updateDisplay();
    
    console.log('✅ App initialized successfully');
}

// Загрузка курсов валют
function loadExchangeRates() {
    // Используем фиксированные курсы для демонстрации
    exchangeRates = {
        USD: 1.0,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.5,
        CNY: 7.28,
        CAD: 1.36,
        AUD: 1.53,
        CHF: 0.88,
        MXN: 17.5,
        BRL: 4.95,
        RUB: 92.8,
        INR: 83.2,
        KRW: 1310.0,
        ZAR: 18.9,
        SEK: 10.8,
        NOK: 10.5,
        DKK: 6.88,
        PLN: 4.12,
        CZK: 22.5,
        HUF: 365.0
    };
    
    console.log('Exchange rates loaded:', exchangeRates);
    
    // Обновляем время последнего обновления
    updateLastUpdateTime();
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопка конвертации
    const convertBtn = document.getElementById('convertBtn');
    if (convertBtn) {
        convertBtn.addEventListener('click', performConversion);
    }
    
    // Кнопка обновления курсов
    const refreshBtn = document.getElementById('refreshRates');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadExchangeRates);
    }
    
    // Обмен валют
    const swapBtn = document.getElementById('swapCurrencies');
    if (swapBtn) {
        swapBtn.addEventListener('click', swapCurrencies);
    }
    
    // Быстрые суммы
    document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const amount = this.getAttribute('data-amount');
            if (amount && amount !== 'Custom') {
                setAmount(parseFloat(amount.replace(',', '')));
            }
        });
    });
    
    // Ввод суммы
    const amountInput = document.getElementById('amountInput');
    if (amountInput) {
        amountInput.addEventListener('input', function() {
            const value = parseFloat(this.value) || 0;
            setAmount(value);
        });
    }
    
    // Популярные валюты
    document.querySelectorAll('.currency-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            const currency = this.getAttribute('data-currency');
            if (currency) {
                setToCurrency(currency);
            }
        });
    });
    
    // Отображение валюты 
    const fromDisplay = document.getElementById('fromCurrencyDisplay');
    const toDisplay = document.getElementById('toCurrencyDisplay');
    
    if (fromDisplay) {
        fromDisplay.addEventListener('click', () => openCurrencyModal('from'));
    }
    if (toDisplay) {
        toDisplay.addEventListener('click', () => openCurrencyModal('to'));
    }
    
    // Копирование результата
    const copyBtn = document.getElementById('copyResult');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyResult);
    }
    
    // Голосовой ввод
    const voiceBtn = document.getElementById('voiceInputBtn');
    if (voiceBtn) {
        voiceBtn.addEventListener('click', startVoiceInput);
    }
}

// Обновление отображения
function updateDisplay() {
    console.log('Updating display...');
    
    try {
        // Сумма
        const amountInput = document.getElementById('amountInput');
        if (amountInput) {
            amountInput.value = currentAmount.toFixed(2);
        }
        
        // Отображение суммы
        const displayAmount = document.getElementById('displayAmount');
        if (displayAmount) {
            displayAmount.textContent = formatNumber(currentAmount);
        }
        
        // Валюты
        const displayFromCurrency = document.getElementById('displayFromCurrency');
        if (displayFromCurrency) {
            displayFromCurrency.textContent = currentFromCurrency;
        }
        
        const displayToCurrency = document.getElementById('displayToCurrency');
        if (displayToCurrency) {
            displayToCurrency.textContent = currentToCurrency;
        }
        
        // Символ валюты
        const inputCurrencySymbol = document.getElementById('inputCurrencySymbol');
        if (inputCurrencySymbol) {
            inputCurrencySymbol.textContent = getCurrencySymbol(currentFromCurrency);
        }
        
        // Флаги в отображении валют
        updateCurrencyDisplayFlags();
        
        // Выполняем конвертацию
        performConversion();
        
    } catch (error) {
        console.error('Error in updateDisplay:', error);
    }
}

// Обновление флагов в отображении валют
function updateCurrencyDisplayFlags() {
    const fromFlag = document.querySelector('#fromCurrencyDisplay .currency-flag');
    const toFlag = document.querySelector('#toCurrencyDisplay .currency-flag');
    
    if (fromFlag) {
        fromFlag.textContent = getCurrencyFlag(currentFromCurrency);
    }
    if (toFlag) {
        toFlag.textContent = getCurrencyFlag(currentToCurrency);
    }
}

// Получение символа валюты
function getCurrencySymbol(currency) {
    const symbols = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
        CNY: '¥',
        RUB: '₽',
        INR: '₹',
        KRW: '₩',
        TRY: '₺',
        ILS: '₪'
    };
    return symbols[currency] || '$';
}

// Получение флага валюты
function getCurrencyFlag(currency) {
    const flags = {
        USD: '🇺🇸',
        EUR: '🇪🇺',
        GBP: '🇬🇧',
        JPY: '🇯🇵',
        CNY: '🇨🇳',
        CAD: '🇨🇦',
        AUD: '🇦🇺',
        CHF: '🇨🇭',
        MXN: '🇲🇽',
        BRL: '🇧🇷',
        RUB: '🇷🇺',
        INR: '🇮🇳',
        KRW: '🇰🇷',
        ZAR: '🇿🇦',
        SEK: '🇸🇪',
        NOK: '🇳🇴',
        DKK: '🇩🇰',
        PLN: '🇵🇱',
        CZK: '🇨🇿',
        HUF: '🇭🇺'
    };
    return flags[currency] || '🏳️';
}

// Установка суммы
function setAmount(amount) {
    if (amount >= 0) {
        currentAmount = amount;
        updateDisplay();
    }
}

// Установка целевой валюты
function setToCurrency(currency) {
    console.log('setToCurrency called with:', currency);
    if (currency && currency !== currentToCurrency) {
        currentToCurrency = currency;
        updateDisplay();
        showToast(`Валюта установлена: ${currency}`);
    }
}

// Обмен валют местами
function swapCurrencies() {
    const temp = currentFromCurrency;
    currentFromCurrency = currentToCurrency;
    currentToCurrency = temp;
    updateDisplay();
}

// Выполнение конвертации
function performConversion() {
    try {
        if (!exchangeRates[currentFromCurrency] || !exchangeRates[currentToCurrency]) {
            console.error('Exchange rates not available for selected currencies');
            return;
        }
        
        const rate = exchangeRates[currentToCurrency] / exchangeRates[currentFromCurrency];
        const convertedValue = currentAmount * rate;
        
        // Обновляем отображение результата
        const convertedAmount = document.getElementById('convertedAmount');
        if (convertedAmount) {
            convertedAmount.textContent = formatNumber(convertedValue);
        }
        
        // Обновляем курс
        const rateValue = document.getElementById('rateValue');
        if (rateValue) {
            rateValue.textContent = rate.toFixed(4);
        }
        
        const rateFrom = document.getElementById('rateFrom');
        const rateTo = document.getElementById('rateTo');
        if (rateFrom) rateFrom.textContent = currentFromCurrency;
        if (rateTo) rateTo.textContent = currentToCurrency;
        
        // Добавляем в историю
        addToHistory(convertedValue, rate);
        
        // Показываем уведомление
        showToast(`Converted ${currentAmount} ${currentFromCurrency} to ${convertedValue.toFixed(2)} ${currentToCurrency}`);
        
    } catch (error) {
        console.error('Error in conversion:', error);
        showToast('Error performing conversion', 'error');
    }
}

// Форматирование числа
function formatNumber(number) {
    return number.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Добавление в историю
function addToHistory(convertedValue, rate) {
    const conversion = {
        timestamp: new Date(),
        from: currentFromCurrency,
        to: currentToCurrency,
        amount: currentAmount,
        result: convertedValue,
        rate: rate
    };
    
    conversionHistory.unshift(conversion);
    
    // Ограничиваем историю 50 записями
    if (conversionHistory.length > 50) {
        conversionHistory.pop();
    }
}

// Обновление времени последнего обновления
function updateLastUpdateTime() {
    const lastUpdate = document.getElementById('lastUpdate');
    const resultTimestamp = document.getElementById('resultTimestamp');
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (lastUpdate) lastUpdate.textContent = timeString;
    if (resultTimestamp) resultTimestamp.textContent = timeString;
}

// Открытие модального окна выбора валюты
function openCurrencyModal(type) {
    console.log('Opening currency modal for:', type);
    // Здесь будет код для открытия модального окна
    showToast('Currency selection modal coming soon');
}

// Копирование результата
function copyResult() {
    const convertedAmount = document.getElementById('convertedAmount');
    if (convertedAmount) {
        const text = `${currentAmount} ${currentFromCurrency} = ${convertedAmount.textContent} ${currentToCurrency}`;
        navigator.clipboard.writeText(text)
            .then(() => showToast('Result copied to clipboard'))
            .catch(err => console.error('Failed to copy:', err));
    }
}

// Голосовой ввод
function startVoiceInput() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        showToast('Voice input coming soon');
    } else {
        showToast('Voice recognition not supported in your browser', 'error');
    }
}

// Показать уведомление
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    if (type === 'error') {
        toast.style.borderLeftColor = '#ff4757';
    }
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentNode === toastContainer) {
                toastContainer.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Функция для обновления UI при выборе валюты
function updateCurrencyDisplay(currencyCode) {
    console.log('updateCurrencyDisplay called with:', currencyCode);
    const display = document.getElementById('toCurrencyDisplay');
    if (display) {
        const flag = display.querySelector('.currency-flag');
        const code = display.querySelector('.currency-code');
        const name = display.querySelector('.currency-name');
        const input = document.getElementById('toCurrency');
        
        if (flag) flag.textContent = getCurrencyFlag(currencyCode);
        if (code) code.textContent = currencyCode;
        if (name) name.textContent = getCurrencyName(currencyCode);
        if (input) input.value = currencyCode;
    }
    
    // Обновляем символ валюты если нужно
    const symbol = document.getElementById('inputCurrencySymbol');
    if (symbol) {
        symbol.textContent = getCurrencySymbol(currencyCode);
    }
}

// Получение имени валюты
function getCurrencyName(currencyCode) {
    const names = {
        'USD': 'US Dollar',
        'EUR': 'Euro',
        'GBP': 'British Pound',
        'JPY': 'Japanese Yen',
        'CNY': 'Chinese Yuan',
        'CAD': 'Canadian Dollar',
        'AUD': 'Australian Dollar',
        'CHF': 'Swiss Franc',
        'MXN': 'Mexican Peso',
        'BRL': 'Brazilian Real',
        'RUB': 'Russian Ruble',
        'INR': 'Indian Rupee',
        'KRW': 'Korean Won',
        'TRY': 'Turkish Lira',
        'ZAR': 'South African Rand',
        'SEK': 'Swedish Krona',
        'NOK': 'Norwegian Krone',
        'DKK': 'Danish Krone',
        'PLN': 'Polish Zloty',
        'CZK': 'Czech Koruna',
        'HUF': 'Hungarian Forint',
        'SGD': 'Singapore Dollar',
        'HKD': 'Hong Kong Dollar',
        'AED': 'UAE Dirham',
        'SAR': 'Saudi Riyal',
        'THB': 'Thai Baht',
        'MYR': 'Malaysian Ringgit',
        'IDR': 'Indonesian Rupiah',
        'PHP': 'Philippine Peso',
        'NZD': 'New Zealand Dollar',
        'BGN': 'Bulgarian Lev',
        'RON': 'Romanian Leu',
        'KZT': 'Kazakhstani Tenge',
        'UAH': 'Ukrainian Hryvnia',
        'BYN': 'Belarusian Ruble'
    };
    return names[currencyCode] || currencyCode;
}

// Запуск приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting app...');
    // Даем время на загрузку всех элементов
    setTimeout(initApp, 500);
});

// ==============================================
// ГЛОБАЛЬНЫЙ ОБЪЕКТ ДЛЯ СВЯЗИ С ГЛОБУСОМ
// ==============================================

window.HoloApp = {
    setToCurrency: function(currencyCode) {
        console.log('HoloApp.setToCurrency called with:', currencyCode);
        currentToCurrency = currencyCode;
        updateCurrencyDisplay(currencyCode);
        performConversion();
        showToast(`Валюта установлена: ${currencyCode}`);
    },
    getCurrencySymbol: getCurrencySymbol,
    getCurrencyFlag: getCurrencyFlag,
    showToast: showToast,
    getCurrencyName: getCurrencyName
};

console.log('✅ HoloApp global object registered:', window.HoloApp);