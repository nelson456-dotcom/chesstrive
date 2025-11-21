// Currency conversion utility
// Base currency is USD

const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'CHF',
  CNY: '¥',
  INR: '₹',
  BRL: 'R$',
  MXN: 'MX$',
  RUB: '₽',
  ZAR: 'R',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  TRY: '₺',
  KRW: '₩',
  SGD: 'S$',
  HKD: 'HK$',
  NZD: 'NZ$',
};

// Approximate exchange rates (update these periodically or use an API)
const EXCHANGE_RATES = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 150.0,
  CAD: 1.35,
  AUD: 1.52,
  CHF: 0.88,
  CNY: 7.2,
  INR: 83.0,
  BRL: 4.95,
  MXN: 17.0,
  RUB: 92.0,
  ZAR: 18.5,
  SEK: 10.5,
  NOK: 10.7,
  DKK: 6.85,
  PLN: 4.0,
  TRY: 32.0,
  KRW: 1330.0,
  SGD: 1.34,
  HKD: 7.8,
  NZD: 1.65,
};

// Country to currency mapping
const COUNTRY_TO_CURRENCY = {
  US: 'USD',
  CA: 'CAD',
  GB: 'GBP',
  AU: 'AUD',
  NZ: 'NZD',
  JP: 'JPY',
  CN: 'CNY',
  IN: 'INR',
  BR: 'BRL',
  MX: 'MXN',
  RU: 'RUB',
  ZA: 'ZAR',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  PL: 'PLN',
  TR: 'TRY',
  KR: 'KRW',
  SG: 'SGD',
  HK: 'HKD',
  CH: 'CHF',
  // EU countries
  AT: 'EUR', BE: 'EUR', BG: 'EUR', HR: 'EUR', CY: 'EUR', CZ: 'EUR',
  EE: 'EUR', FI: 'EUR', FR: 'EUR', DE: 'EUR', GR: 'EUR', HU: 'EUR',
  IE: 'EUR', IT: 'EUR', LV: 'EUR', LT: 'EUR', LU: 'EUR', MT: 'EUR',
  NL: 'EUR', PT: 'EUR', RO: 'EUR', SK: 'EUR', SI: 'EUR', ES: 'EUR',
};

/**
 * Detect user's country from browser locale or IP
 * @returns {Promise<string>} Country code (e.g., 'US', 'GB')
 */
export async function detectUserCountry() {
  try {
    // First, try to get from browser locale
    const locale = navigator.language || navigator.userLanguage;
    const countryFromLocale = locale.split('-')[1]?.toUpperCase();
    
    if (countryFromLocale && COUNTRY_TO_CURRENCY[countryFromLocale]) {
      return countryFromLocale;
    }

    // Fallback: Try IP geolocation (free API)
    try {
      const response = await fetch('https://ipapi.co/json/', { timeout: 3000 });
      if (response.ok) {
        const data = await response.json();
        if (data.country_code && COUNTRY_TO_CURRENCY[data.country_code]) {
          return data.country_code;
        }
      }
    } catch (e) {
      console.log('IP geolocation failed, using locale');
    }

    // Default to US if detection fails
    return 'US';
  } catch (error) {
    console.error('Error detecting country:', error);
    return 'US';
  }
}

/**
 * Get currency for a country
 * @param {string} countryCode - Country code (e.g., 'US', 'GB')
 * @returns {string} Currency code (e.g., 'USD', 'GBP')
 */
export function getCurrencyForCountry(countryCode) {
  return COUNTRY_TO_CURRENCY[countryCode] || 'USD';
}

/**
 * Convert USD amount to target currency
 * @param {number} usdAmount - Amount in USD
 * @param {string} targetCurrency - Target currency code (e.g., 'EUR', 'GBP')
 * @returns {number} Converted amount
 */
export function convertCurrency(usdAmount, targetCurrency) {
  const rate = EXCHANGE_RATES[targetCurrency] || 1.0;
  return usdAmount * rate;
}

/**
 * Format price with currency symbol
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (e.g., 'USD', 'EUR')
 * @returns {string} Formatted price string
 */
export function formatPrice(amount, currency = 'USD') {
  const symbol = CURRENCY_SYMBOLS[currency] || '$';
  const rate = EXCHANGE_RATES[currency] || 1.0;
  const convertedAmount = amount * rate;

  // Format based on currency
  if (currency === 'JPY' || currency === 'KRW') {
    // No decimals for JPY and KRW
    return `${symbol}${Math.round(convertedAmount).toLocaleString()}`;
  } else if (currency === 'INR') {
    // Indian Rupee formatting
    return `${symbol}${convertedAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  } else {
    // Standard formatting with 2 decimals
    return `${symbol}${convertedAmount.toFixed(2)}`;
  }
}

/**
 * Get user's currency based on their location
 * @returns {Promise<{currency: string, symbol: string}>}
 */
export async function getUserCurrency() {
  const country = await detectUserCountry();
  const currency = getCurrencyForCountry(country);
  const symbol = CURRENCY_SYMBOLS[currency] || '$';
  
  return { currency, symbol, country };
}

