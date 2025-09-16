import { Request, Response, NextFunction } from 'express';
import { ProfileModel } from '../modules/user/user.model';
import i18nService from '../i18n/i18nService';
import { TLanguage } from '../modules/user/user.interface';

// Define currency type to match project standards
export type TCurrency = 'USD' | 'EUR' | 'SGD' | 'GBP' | 'AUD';

// Extend Express Request type to include user preferences
declare global {
  namespace Express {
    interface Request {
      userPreferences?: {
        language: TLanguage;
        currency: TCurrency;
        userId?: string;
      };
    }
  }
}

// Middleware to set req.locale, req.t, and userPreferences based on profile language or Accept-Language header
export async function localeMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    // Priority: explicit query/header > user profile > default 'en'
    const headerLang = (req.headers['accept-language'] || '').split(',')[0]?.trim();
    let lang: string | undefined = undefined;
    let currency: TCurrency = 'USD';
    let userId: string | undefined = undefined;

    // If authenticated and we can read profile language and currency
    try {
      userId = (req as any).user?._id || (req as any).user?.userId || (req as any).user?.id;
      if (userId) {
        const profile = await ProfileModel.findOne({ user_id: userId, isDeleted: false }).lean();
        if (profile) {
          lang = (profile as any)?.language || undefined;
          currency = (profile as any)?.preferredCurrency || 'USD';
        }
      }
    } catch (dbError) {
      console.error('Error fetching user profile in localeMiddleware:', dbError);
    }

    // Check for currency override from headers (for testing)
    const headerCurrency = req.headers['preferred-currency'] as string;
    if (headerCurrency && ['USD', 'EUR', 'SGD', 'GBP', 'AUD'].includes(headerCurrency.toUpperCase())) {
      currency = headerCurrency.toUpperCase() as TCurrency;
    }

    const finalLang = (req.query.lang as string) || (req.headers['x-lang'] as string) || lang || headerLang || 'en';
    
    // Validate language is supported
    req.locale = i18nService.isLanguageSupported(finalLang) ? finalLang : 'en';
    
    // Set user preferences
    req.userPreferences = {
      language: req.locale as TLanguage,
      currency,
      userId
    };
    
    // Create translator function using our comprehensive i18n service
    req.t = (key: string, fallback?: string) => {
      const translation = i18nService.translate(key, req.locale as TLanguage);
      return translation !== key ? translation : (fallback || key);
    };
  } catch (error) {
    console.error('Error in localeMiddleware:', error);
    req.locale = 'en';
    req.userPreferences = {
      language: 'en',
      currency: 'USD'
    };
    req.t = (key: string, fallback?: string) => {
      return i18nService.translate(key, 'en') || fallback || key;
    };
  }
  next();
}
