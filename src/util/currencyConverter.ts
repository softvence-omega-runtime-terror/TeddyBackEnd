import axios from 'axios';

// Supported currencies
export type TCurrency = 'USD' | 'EUR' | 'SGD' | 'GBP' | 'AUD';

// Exchange rate cache interface
interface ExchangeRateCache {
  rates: { [key: string]: number };
  lastUpdated: Date;
  baseCurrency: string;
}

// Cache exchange rates for 1 hour
let exchangeRateCache: ExchangeRateCache | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Free API for exchange rates (you can replace with your preferred service)
const EXCHANGE_API_URL = 'https://api.exchangerate-api.com/v4/latest';

/**
 * Fetch current exchange rates from API
 */
const fetchExchangeRates = async (baseCurrency: TCurrency = 'USD'): Promise<{ [key: string]: number }> => {
  try {
    const response = await axios.get(`${EXCHANGE_API_URL}/${baseCurrency}`, {
      timeout: 5000 // 5 second timeout
    });
    
    if (response.data && response.data.rates) {
      return response.data.rates;
    }
    
    throw new Error('Invalid response from exchange rate API');
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    
    // Fallback rates (approximate values - update these periodically)
    const fallbackRates: { [key: string]: number } = {
      'USD': 1.0,
      'EUR': 0.85,
      'GBP': 0.73,
      'SGD': 1.35,
      'AUD': 1.52
    };
    
    return fallbackRates;
  }
};

/**
 * Get cached exchange rates or fetch new ones
 */
const getExchangeRates = async (baseCurrency: TCurrency = 'USD'): Promise<{ [key: string]: number }> => {
  const now = new Date();
  
  // Check if cache is valid
  if (exchangeRateCache && 
      exchangeRateCache.baseCurrency === baseCurrency &&
      (now.getTime() - exchangeRateCache.lastUpdated.getTime()) < CACHE_DURATION) {
    return exchangeRateCache.rates;
  }
  
  // Fetch new rates
  const rates = await fetchExchangeRates(baseCurrency);
  
  // Update cache
  exchangeRateCache = {
    rates,
    lastUpdated: now,
    baseCurrency
  };
  
  return rates;
};

/**
 * Convert amount from one currency to another
 */
export const convertCurrency = async (
  amount: number,
  fromCurrency: TCurrency,
  toCurrency: TCurrency
): Promise<number> => {
  // If same currency, no conversion needed
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  try {
    // Get exchange rates with USD as base
    const rates = await getExchangeRates('USD');
    
    // Convert to USD first, then to target currency
    let usdAmount = amount;
    
    // If source currency is not USD, convert to USD
    if (fromCurrency !== 'USD') {
      const fromRate = rates[fromCurrency];
      if (!fromRate) {
        throw new Error(`Exchange rate not found for ${fromCurrency}`);
      }
      usdAmount = amount / fromRate;
    }
    
    // If target currency is USD, return the USD amount
    if (toCurrency === 'USD') {
      return Math.round(usdAmount * 100) / 100; // Round to 2 decimal places
    }
    
    // Convert from USD to target currency
    const toRate = rates[toCurrency];
    if (!toRate) {
      throw new Error(`Exchange rate not found for ${toCurrency}`);
    }
    
    const convertedAmount = usdAmount * toRate;
    return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
    
  } catch (error) {
    console.error(`Currency conversion failed from ${fromCurrency} to ${toCurrency}:`, error);
    
    // Return original amount as fallback
    return amount;
  }
};

/**
 * Convert multiple amounts in batch for better performance
 */
export const convertCurrencyBatch = async (
  conversions: Array<{
    amount: number;
    fromCurrency: TCurrency;
    toCurrency: TCurrency;
  }>
): Promise<number[]> => {
  // Group by target currency to minimize API calls
  const results: number[] = new Array(conversions.length);
  
  try {
    // Get exchange rates once for all conversions
    const rates = await getExchangeRates('USD');
    
    for (let i = 0; i < conversions.length; i++) {
      const { amount, fromCurrency, toCurrency } = conversions[i];
      
      // If same currency, no conversion needed
      if (fromCurrency === toCurrency) {
        results[i] = amount;
        continue;
      }
      
      // Convert to USD first
      let usdAmount = amount;
      if (fromCurrency !== 'USD') {
        const fromRate = rates[fromCurrency];
        if (fromRate) {
          usdAmount = amount / fromRate;
        }
      }
      
      // Convert from USD to target currency
      if (toCurrency === 'USD') {
        results[i] = Math.round(usdAmount * 100) / 100;
      } else {
        const toRate = rates[toCurrency];
        if (toRate) {
          results[i] = Math.round((usdAmount * toRate) * 100) / 100;
        } else {
          results[i] = amount; // Fallback to original amount
        }
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('Batch currency conversion failed:', error);
    
    // Return original amounts as fallback
    return conversions.map(c => c.amount);
  }
};

/**
 * Get current exchange rate between two currencies
 */
export const getExchangeRate = async (
  fromCurrency: TCurrency,
  toCurrency: TCurrency
): Promise<number> => {
  if (fromCurrency === toCurrency) {
    return 1;
  }
  
  try {
    const rates = await getExchangeRates('USD');
    
    // Convert through USD
    let rate = 1;
    
    if (fromCurrency !== 'USD') {
      const fromRate = rates[fromCurrency];
      if (!fromRate) {
        throw new Error(`Exchange rate not found for ${fromCurrency}`);
      }
      rate = rate / fromRate;
    }
    
    if (toCurrency !== 'USD') {
      const toRate = rates[toCurrency];
      if (!toRate) {
        throw new Error(`Exchange rate not found for ${toCurrency}`);
      }
      rate = rate * toRate;
    }
    
    return Math.round(rate * 10000) / 10000; // Round to 4 decimal places for rates
    
  } catch (error) {
    console.error(`Failed to get exchange rate from ${fromCurrency} to ${toCurrency}:`, error);
    return 1; // Fallback to 1:1 rate
  }
};

/**
 * Clear exchange rate cache (useful for testing or forced refresh)
 */
export const clearExchangeRateCache = (): void => {
  exchangeRateCache = null;
};
