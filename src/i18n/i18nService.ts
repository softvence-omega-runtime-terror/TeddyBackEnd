import fs from 'fs';
import path from 'path';
import { TLanguage } from '../modules/user/user.interface';

interface TranslationData {
  [key: string]: string | TranslationData;
}

interface Translations {
  [key: string]: TranslationData;
}

class I18nService {
  private translations: Translations = {};
  private fallbackLanguage: TLanguage = 'en';

  constructor() {
    this.loadTranslations();
  }

  /**
   * Load all translation files from the locales directory
   */
  private loadTranslations(): void {
    const localesPath = path.join(__dirname, '../i18n/locales');
    
    try {
      const files = fs.readdirSync(localesPath);
      
      files.forEach(file => {
        if (file.endsWith('.json')) {
          const language = file.replace('.json', '') as TLanguage;
          const filePath = path.join(localesPath, file);
          
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            this.translations[language] = JSON.parse(content);
          } catch (error) {
            console.error(`Error loading translation file ${file}:`, error);
          }
        }
      });
    } catch (error) {
      console.error('Error loading translations directory:', error);
    }
  }

  /**
   * Translate a key for a specific language
   * @param key - Translation key (e.g., 'auth.login_successful')
   * @param language - Target language
   * @param variables - Variables for interpolation
   * @returns Translated string
   */
  public translate(
    key: string, 
    language: TLanguage = 'en', 
    variables?: Record<string, string>
  ): string {
    const translation = this.getTranslation(key, language) || 
                       this.getTranslation(key, this.fallbackLanguage) || 
                       key;

    if (variables && typeof translation === 'string') {
      return this.interpolate(translation, variables);
    }

    return typeof translation === 'string' ? translation : key;
  }

  /**
   * Get translation from nested object using dot notation
   * @param key - Translation key
   * @param language - Target language
   * @returns Translation value or null
   */
  private getTranslation(key: string, language: TLanguage): string | null {
    const languageTranslations = this.translations[language];
    
    if (!languageTranslations) {
      return null;
    }

    const keys = key.split('.');
    let current: any = languageTranslations;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return null;
      }
    }

    return typeof current === 'string' ? current : null;
  }

  /**
   * Interpolate variables in translation string
   * @param template - Translation template
   * @param variables - Variables to interpolate
   * @returns Interpolated string
   */
  private interpolate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  /**
   * Get all available languages
   * @returns Array of supported languages
   */
  public getAvailableLanguages(): TLanguage[] {
    return Object.keys(this.translations) as TLanguage[];
  }

  /**
   * Check if a language is supported
   * @param language - Language to check
   * @returns True if supported
   */
  public isLanguageSupported(language: string): language is TLanguage {
    return language in this.translations;
  }

  /**
   * Reload translations (useful for development)
   */
  public reloadTranslations(): void {
    this.translations = {};
    this.loadTranslations();
  }

  /**
   * Get multiple translations at once
   * @param keys - Array of translation keys
   * @param language - Target language
   * @returns Object with translated values
   */
  public translateBatch(
    keys: string[], 
    language: TLanguage = 'en'
  ): Record<string, string> {
    const result: Record<string, string> = {};
    
    keys.forEach(key => {
      result[key] = this.translate(key, language);
    });

    return result;
  }

  /**
   * Get translation for currency display
   * @param currencyCode - Currency code (e.g., 'usd', 'eur')
   * @param language - Target language
   * @returns Currency display name
   */
  public translateCurrency(currencyCode: string, language: TLanguage = 'en'): string {
    return this.translate(`currency.${currencyCode.toLowerCase()}`, language);
  }

  /**
   * Get localized currency conversion message
   * @param fromCurrency - Source currency
   * @param toCurrency - Target currency
   * @param language - Target language
   * @returns Localized conversion message
   */
  public getCurrencyConversionMessage(
    fromCurrency: string, 
    toCurrency: string, 
    language: TLanguage = 'en'
  ): string {
    const fromName = this.translateCurrency(fromCurrency, language);
    const toName = this.translateCurrency(toCurrency, language);
    
    return this.translate('currency.converted_from', language, {
      from: fromName,
      to: toName
    });
  }
}

// Create singleton instance
const i18nService = new I18nService();

export default i18nService;