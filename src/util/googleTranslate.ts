import translate from 'google-translate-api-x';

interface TranslateConfig {
    // No configuration needed for the free package
    enabled?: boolean;
}

class GoogleTranslateService {
    private cache: Map<string, string> = new Map();
    private enabled: boolean = true;
    private rateLimitDelay: number = 100; // Delay between requests to avoid rate limiting

    constructor(config?: TranslateConfig) {
        this.enabled = config?.enabled !== false;
        if (!this.enabled) {
            console.log('Google Translate service disabled');
        }
    }

    /**
     * Add delay to avoid rate limiting
     */
    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Translate text from one language to another using free Google Translate
     */
    async translateText(text: string, targetLanguage: string, sourceLanguage: string = 'auto'): Promise<string> {
        if (!this.enabled) {
            return text; // Return original text if translate is not enabled
        }

        if (!text || !text.trim()) {
            return text;
        }

        // Skip translation if target language is the same as source
        if (targetLanguage === sourceLanguage) {
            return text;
        }

        // Create cache key
        const cacheKey = `${sourceLanguage}-${targetLanguage}-${text}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        try {
            // Add small delay to avoid rate limiting
            await this.delay(this.rateLimitDelay);

            const result = await translate(text, { 
                from: sourceLanguage, 
                to: targetLanguage 
            });

            const translatedText = result.text;

            // Cache the result
            this.cache.set(cacheKey, translatedText);
            
            return translatedText;
        } catch (error) {
            console.error('Translation error:', error);
            return text; // Return original text on error
        }
    }

    /**
     * Translate an object recursively, translating only string values
     */
    async translateObject(obj: any, targetLanguage: string, sourceLanguage: string = 'en'): Promise<any> {
        if (!this.enabled || targetLanguage === sourceLanguage) {
            return obj;
        }

        if (typeof obj === 'string') {
            return await this.translateText(obj, targetLanguage, sourceLanguage);
        }

        if (Array.isArray(obj)) {
            const translatedArray = [];
            for (const item of obj) {
                translatedArray.push(await this.translateObject(item, targetLanguage, sourceLanguage));
            }
            return translatedArray;
        }

        if (typeof obj === 'object' && obj !== null) {
            const translatedObj: any = {};
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'string' && !this.shouldSkipField(key, value)) {
                    // Add comprehensive debug logging for ALL string translations
                    console.log(`🔍 TRANSLATING: key="${key}", value="${value}"`);
                    
                    // Translate string values that should be translated
                    translatedObj[key] = await this.translateText(value, targetLanguage, sourceLanguage);
                    
                    console.log(`✅ TRANSLATED: "${value}" → "${translatedObj[key]}"`);
                } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
                    // Recursively translate nested objects/arrays
                    translatedObj[key] = await this.translateObject(value, targetLanguage, sourceLanguage);
                } else {
                    // Keep other values as-is (numbers, booleans, etc.)
                    if (typeof value === 'string' && this.shouldSkipField(key, value)) {
                        console.log(`⏭️ SKIPPED: key="${key}", value="${value}" (shouldSkip=true)`);
                    }
                    translatedObj[key] = value;
                }
            }
            return translatedObj;
        }

        return obj;
    }

    /**
     * Determine if a field should be skipped from translation
     */
    private shouldSkipField(key: string, value: any): boolean {
        // Skip if value is not a string 
        if (typeof value !== 'string') {
            return true;
        }

        // FORCE TRANSLATE SPECIFIC VALUES
        const forceTranslateValues = ['you_owe', 'you_are_owed', 'settled_up'];
        if (forceTranslateValues.includes(value.toLowerCase())) {
            console.log(`🎯 FORCE TRANSLATING value: "${value}"`);
            return false;
        }

        // Skip only very specific technical fields (exact matches only)
        const exactSkipFields = [
            'email', 'phone', 'url', 'link', 'token', 'key', '_id','type','status','role'
        ];

        if (exactSkipFields.includes(key.toLowerCase())) {
            return true;
        }

        // Skip if it looks like an email
        if (value.includes('@')) {
            return true;
        }

        // Skip if it looks like a URL
        if (value.startsWith('http')) {
            return true;
        }

        // Skip if it's a technical ID (long string of numbers/letters)
        if (/^[0-9a-f\-]{20,}$/i.test(value)) {
            return true;
        }

        // Skip if it's a date format
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
            return true;
        }
        
        // Skip if it's only numbers or just a currency code
        if (/^[0-9\.\,\s\$\€\£\¥]+$/.test(value) || /^[A-Z]{3}$/.test(value)) {
            return true;
        }

        // TRANSLATE EVERYTHING ELSE - be very aggressive
        return false;
    }

    /**
     * Translate API response while preserving structure
     */
    async translateApiResponse(response: any, targetLanguage: string): Promise<any> {
        if (!this.enabled || !response || targetLanguage === 'en') {
            return response;
        }

        try {
            // Create a copy of the response
            const translatedResponse = JSON.parse(JSON.stringify(response));

            // Translate the entire response using the comprehensive translateObject method
            return await this.translateObject(translatedResponse, targetLanguage, 'en');

        } catch (error) {
            console.error('Error translating API response:', error);
            return response; // Return original response on error
        }
    }

    /**
     * Clear translation cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Check if translation service is enabled
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Create and export a singleton instance
const googleTranslateService = new GoogleTranslateService({
    enabled: true // Free package is always enabled
});

export default googleTranslateService;
export { GoogleTranslateService };