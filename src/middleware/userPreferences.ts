import { Request, Response, NextFunction } from 'express';
import { TLanguage } from '../modules/user/user.interface';
import { ProfileModel } from '../modules/user/user.model';
import i18nService from '../i18n/i18nService';

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

/**
 * Middleware to extract and set user language and currency preferences
 * This middleware should be used after authentication middleware
 * Works in conjunction with existing localeMiddleware for language support
 */
export const userPreferencesMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Default preferences
    let language: TLanguage = 'en';
    let currency: TCurrency = 'USD';
    let userId: string | undefined;

    // Extract user ID from request (assuming it's set by auth middleware)
    if (req.user && typeof req.user === 'object' && 'id' in req.user) {
      userId = (req.user as any).id;
    } else if (req.user && typeof req.user === 'object' && '_id' in req.user) {
      userId = (req.user as any)._id;
    } else if (req.user && typeof req.user === 'object' && 'userId' in req.user) {
      userId = (req.user as any).userId;
    }

    // If user is authenticated, fetch their preferences from database
    if (userId) {
      try {
        const userProfile = await ProfileModel.findOne({ 
          user_id: userId, 
          isDeleted: false 
        }).select('language preferredCurrency');
        
        if (userProfile) {
          // Use user's preferred language if set, otherwise default to 'en'
          if (userProfile.language && i18nService.isLanguageSupported(userProfile.language)) {
            language = userProfile.language;
          }

          // Use user's preferred currency if set, otherwise default to 'USD'
          if (userProfile.preferredCurrency) {
            currency = userProfile.preferredCurrency as TCurrency;
          }
        }
      } catch (dbError) {
        console.error('Error fetching user preferences from database:', dbError);
        // Continue with default preferences
      }
    }

    // Check for language override from existing locale (set by localeMiddleware)
    if (req.locale && i18nService.isLanguageSupported(req.locale)) {
      language = req.locale as TLanguage;
    }

    // Check for currency override from headers (for testing or temporary changes)
    const headerCurrency = req.headers['preferred-currency'] as string;
    if (headerCurrency && ['USD', 'EUR', 'SGD', 'GBP', 'AUD'].includes(headerCurrency.toUpperCase())) {
      currency = headerCurrency.toUpperCase() as TCurrency;
    }

    // Set user preferences in request object
    req.userPreferences = {
      language,
      currency,
      userId
    };

    next();
  } catch (error) {
    console.error('Error in userPreferencesMiddleware:', error);
    
    // Set default preferences and continue
    req.userPreferences = {
      language: 'en',
      currency: 'USD'
    };

    next();
  }
};

/**
 * Helper function to get user language from request
 */
export const getUserLanguage = (req: Request): TLanguage => {
  return req.userPreferences?.language || 'en';
};

/**
 * Helper function to get user currency from request
 */
export const getUserCurrency = (req: Request): TCurrency => {
  return req.userPreferences?.currency || 'USD';
};

/**
 * Helper function to get user ID from request
 */
export const getUserId = (req: Request): string | undefined => {
  return req.userPreferences?.userId;
};

/**
 * Middleware to validate currency parameter in requests
 */
export const validateCurrencyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { currency } = req.body;
  
  if (currency && !['USD', 'EUR', 'SGD', 'GBP', 'AUD'].includes(currency.toUpperCase())) {
    const errorMessage = req.t ? req.t('validation.invalid_currency') : 'Invalid currency selected';
    
    res.status(400).json({
      success: false,
      message: errorMessage,
      data: null
    });
    return;
  }
  
  next();
};

/**
 * Middleware to validate language parameter in requests
 */
export const validateLanguageMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { language } = req.body;
  
  if (language && !i18nService.isLanguageSupported(language)) {
    const errorMessage = req.t ? req.t('validation.invalid_language') : 'Invalid language selected';
    
    res.status(400).json({
      success: false,
      message: errorMessage,
      data: null
    });
    return;
  }
  
  next();
};

/**
 * Helper function to get localized translation using our i18n service
 * This works with the user's current language preference
 */
export const getTranslation = (
  req: Request, 
  key: string, 
  variables?: Record<string, string>
): string => {
  const language = getUserLanguage(req);
  return i18nService.translate(key, language, variables);
};

/**
 * Helper function to get currency conversion message
 */
export const getCurrencyConversionMessage = (
  req: Request,
  fromCurrency: string,
  toCurrency: string
): string => {
  const language = getUserLanguage(req);
  return i18nService.getCurrencyConversionMessage(fromCurrency, toCurrency, language);
};