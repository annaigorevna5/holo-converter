const API_BASE_URL = 'https://api.exchangerate.host';
let exchangeRatesCache = {};
let currencyListCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

async function fetchCurrencyList() {
    if (currencyListCache && (Date.now() - lastFetchTime) < CACHE_DURATION) {
        return currencyListCache;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/symbols`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();

        if (!data.success) throw new Error('Failed to get currency data');

        const currencies = Object.keys(data.symbols).map(code => {
            const name = data.symbols[code];
            return {
                code: code,
                name: name,
                flag: getFlagEmoji(code)
            };
        });

        currencyListCache = currencies;
        lastFetchTime = Date.now();
        return currencies;
    } catch (error) {
        console.error('Error loading currency list:', error);
        return getDefaultCurrencies();
    }
}

function getFlagEmoji(currencyCode) {
    const countryMap = {
        'USD': 'US', 'CAD': 'CA', 'MXN': 'MX', 'BRL': 'BR', 'ARS': 'AR',
        'CLP': 'CL', 'COP': 'CO', 'EUR': 'EU', 'GBP': 'GB', 'CHF': 'CH',
        'SEK': 'SE', 'NOK': 'NO', 'DKK': 'DK', 'PLN': 'PL', 'RUB': 'RU',
        'TRY': 'TR', 'UAH': 'UA', 'CZK': 'CZ', 'HUF': 'HU', 'JPY': 'JP',
        'CNY': 'CN', 'INR': 'IN', 'KRW': 'KR', 'IDR': 'ID', 'THB': 'TH',
        'VND': 'VN', 'MYR': 'MY', 'SGD': 'SG', 'PHP': 'PH', 'AED': 'AE',
        'SAR': 'SA', 'ZAR': 'ZA', 'EGP': 'EG', 'NGN': 'NG', 'KES': 'KE',
        'AUD': 'AU', 'NZD': 'NZ'
    };

    const countryCode = countryMap[currencyCode] || currencyCode.substring(0, 2).toUpperCase();
    if (countryCode === 'EU') return '🇪🇺';
    if (countryCode.length !== 2) return '🏳️';
    
    const flag = countryCode.toUpperCase().replace(/./g, char =>
        String.fromCodePoint(char.charCodeAt(0) + 127397)
    );
    return flag;
}

function getDefaultCurrencies() {
    return [
        { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
        { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
        { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
        { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵' },
        { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳' },
        { code: 'RUB', name: 'Russian Ruble', flag: '🇷🇺' },
        { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
        { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
        { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
        { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳' }
    ];
}

async function fetchExchangeRate(from, to) {
    const cacheKey = `${from}_${to}`;
    if (exchangeRatesCache[cacheKey] && (Date.now() - lastFetchTime) < CACHE_DURATION) {
        return exchangeRatesCache[cacheKey];
    }

    try {
        const response = await fetch(`${API_BASE_URL}/convert?from=${from}&to=${to}`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();

        if (!data.success) throw new Error('Failed to get exchange rate');

        const rate = data.result;
        exchangeRatesCache[cacheKey] = rate;
        lastFetchTime = Date.now();
        return rate;
    } catch (error) {
        console.error('Error loading exchange rate:', error);
        return getFallbackRate(from, to);
    }
}

function getFallbackRate(from, to) {
    const fallbackRates = {
        'USD_EUR': 0.85,
        'EUR_USD': 1.18,
        'USD_GBP': 0.73,
        'GBP_USD': 1.37,
        'USD_JPY': 110.5,
        'EUR_JPY': 130.2,
        'USD_RUB': 75.0,
        'EUR_RUB': 88.0,
        'USD_CNY': 6.5,
        'EUR_CNY': 7.7,
        'USD_CAD': 1.25,
        'USD_AUD': 1.35,
        'USD_CHF': 0.92,
        'USD_INR': 74.0
    };

    const key = `${from}_${to}`;
    if (fallbackRates[key]) return fallbackRates[key];
    return 1;
}

async function convertCurrency(amount, from, to) {
    if (!amount || amount <= 0) {
        return { amount: 0, from: from, to: to, rate: 0, result: 0 };
    }

    try {
        const rate = await fetchExchangeRate(from, to);
        const result = amount * rate;

        return {
            amount: amount,
            from: from,
            to: to,
            rate: rate,
            result: result
        };
    } catch (error) {
        console.error('Error converting currency:', error);
        return { amount: amount, from: from, to: to, rate: 0, result: 0 };
    }
}

window.currencyAPI = { fetchCurrencyList, fetchExchangeRate, convertCurrency, getFlagEmoji };