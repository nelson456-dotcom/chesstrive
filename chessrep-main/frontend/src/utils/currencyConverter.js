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
    
    console.log('[Currency] Browser locale:', locale, 'Country from locale:', countryFromLocale);
    
    if (countryFromLocale && COUNTRY_TO_CURRENCY[countryFromLocale]) {
      console.log(`[Currency] Using locale-based detection: ${countryFromLocale} -> ${COUNTRY_TO_CURRENCY[countryFromLocale]}`);
      return countryFromLocale;
    }

    // Fallback: Try IP geolocation (free API)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('https://ipapi.co/json/', { 
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Currency] IP geolocation result:', data);
        if (data.country_code && COUNTRY_TO_CURRENCY[data.country_code]) {
          console.log(`[Currency] Detected country from IP: ${data.country_code}, Currency: ${COUNTRY_TO_CURRENCY[data.country_code]}`);
          return data.country_code;
        }
      }
    } catch (e) {
      console.log('[Currency] IP geolocation failed:', e.message);
    }

    // Additional fallback: Try timezone-based detection
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log('[Currency] Browser timezone:', timezone);
      
      // Map common timezones to countries
      const timezoneToCountry = {
        'America/Sao_Paulo': 'BR',
        'America/Argentina': 'AR',
        'America/Mexico_City': 'MX',
        'America/New_York': 'US',
        'America/Los_Angeles': 'US',
        'America/Toronto': 'CA',
        'Europe/London': 'GB',
        'Europe/Paris': 'FR',
        'Europe/Berlin': 'DE',
        'Europe/Rome': 'IT',
        'Europe/Madrid': 'ES',
        'Asia/Tokyo': 'JP',
        'Asia/Shanghai': 'CN',
        'Asia/Kolkata': 'IN',
        'Australia/Sydney': 'AU',
      };
      
      // Check if timezone matches any known timezone
      for (const [tz, country] of Object.entries(timezoneToCountry)) {
        if (timezone.includes(tz.split('/')[1])) {
          if (COUNTRY_TO_CURRENCY[country]) {
            console.log(`[Currency] Detected country from timezone: ${country} -> ${COUNTRY_TO_CURRENCY[country]}`);
            return country;
          }
        }
      }
      
      // Special case for Brazil timezone
      if (timezone.includes('Sao_Paulo') || timezone.includes('Brasilia')) {
        console.log('[Currency] Detected Brazil from timezone');
        return 'BR';
      }
    } catch (e) {
      console.log('[Currency] Timezone detection failed:', e.message);
    }

    // Default to US if all detection methods fail
    console.log('[Currency] All detection methods failed, defaulting to US');
    return 'US';
  } catch (error) {
    console.error('[Currency] Error detecting country:', error);
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
  try {
    const country = await detectUserCountry();
    const currency = getCurrencyForCountry(country);
    const symbol = CURRENCY_SYMBOLS[currency] || '$';
    
    console.log(`[Currency] User currency detected: ${currency} (${symbol}) for country: ${country}`);
    return { currency, symbol, country };
  } catch (error) {
    console.error('[Currency] Error getting user currency:', error);
    return { currency: 'USD', symbol: '$', country: 'US' };
  }
}

