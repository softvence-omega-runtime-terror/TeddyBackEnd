import { Request, Response, NextFunction } from 'express';
import googleTranslateService from '../util/googleTranslate';

// Language code mapping from your app to Google Translate codes
const LANGUAGE_MAP: { [key: string]: string } = {
    'en': 'en',     // English
    'id': 'id',     // Indonesian
    'ms': 'ms',     // Malay
    'ko': 'ko',     // Korean
    'zh': 'zh',     // Chinese
    'ja': 'ja'      // Japanese
};

/**
 * Middleware to automatically translate API responses based on user language preference
 */
const autoTranslateMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override res.json to intercept and translate responses
    res.json = function(obj: any) {
        // Get user's preferred language from request
        const userLanguage = req.userPreferences?.language || 'en';
        
        // Skip translation if language is English or not supported
        if (userLanguage === 'en' || !LANGUAGE_MAP[userLanguage]) {
            return originalJson(obj);
        }

        // Check if Google Translate service is enabled
        if (!googleTranslateService.isEnabled()) {
            console.log('Google Translate service not enabled, returning original response');
            return originalJson(obj);
        }

        // Translate the response asynchronously
        googleTranslateService.translateApiResponse(obj, LANGUAGE_MAP[userLanguage])
            .then(translatedResponse => {
                originalJson(translatedResponse);
            })
            .catch(error => {
                console.error('Error in auto-translate middleware:', error);
                // Return original response if translation fails
                originalJson(obj);
            });
        
        return this;
    };

    next();
};

export default autoTranslateMiddleware;