import { Response, Request } from 'express';
import { getTranslation, getCurrencyConversionMessage } from '../middleware/userPreferences';
import { getExchangeRate } from './currencyConverter';

interface ResponseData<T> {
  statusCode: number;
  success: boolean;
  message?: string;
  messageKey?: string; // Translation key for the message
  messageVariables?: Record<string, string>; // Variables for message interpolation
  data: T;
  currencyInfo?: {
    originalCurrency?: string;
    convertedCurrency?: string;
    exchangeRate?: number;
  };
}

/**
 * Enhanced sendResponse function with i18n and currency conversion support
 */
const sendResponse = <T>(
  res: Response,
  data: ResponseData<T>,
  req?: Request
) => {
  let finalMessage = data.message;

  // If we have a request object and messageKey, translate the message
  if (req && data.messageKey) {
    finalMessage = getTranslation(req, data.messageKey, data.messageVariables);
  } else if (req && data.message && !data.messageKey) {
    // For backward compatibility, keep the original message if no key provided
    finalMessage = data.message;
  }

  // Prepare response object
  const responseObj: any = {
    statusCode: data.statusCode,
    success: data.success,
    message: finalMessage,
    data: data.data,
  };

  // Add currency conversion info if available
  if (data.currencyInfo) {
    responseObj.currencyInfo = data.currencyInfo;
  }

  res.status(data.statusCode).json(responseObj);
};

/**
 * Send response with translation key
 */
export const sendResponseWithTranslation = <T>(
  res: Response,
  req: Request,
  data: {
    statusCode: number;
    success: boolean;
    messageKey: string;
    messageVariables?: Record<string, string>;
    data: T;
    currencyInfo?: {
      originalCurrency?: string;
      convertedCurrency?: string;
      exchangeRate?: number;
    };
  }
) => {
  sendResponse(res, data, req);
};

/**
 * Send success response with translation
 */
export const sendSuccessResponse = <T>(
  res: Response,
  req: Request,
  data: {
    messageKey: string;
    messageVariables?: Record<string, string>;
    data: T;
    statusCode?: number;
  }
) => {
  sendResponseWithTranslation(res, req, {
    statusCode: data.statusCode || 200,
    success: true,
    messageKey: data.messageKey,
    messageVariables: data.messageVariables,
    data: data.data
  });
};

/**
 * Send error response with translation
 */
export const sendErrorResponse = (
  res: Response,
  req: Request,
  data: {
    messageKey: string;
    messageVariables?: Record<string, string>;
    statusCode?: number;
  }
) => {
  sendResponseWithTranslation(res, req, {
    statusCode: data.statusCode || 400,
    success: false,
    messageKey: data.messageKey,
    messageVariables: data.messageVariables,
    data: null
  });
};

/**
 * Send financial response with currency conversion
 */
export const sendFinancialResponse = async <T>(
  res: Response,
  req: Request,
  data: {
    messageKey: string;
    messageVariables?: Record<string, string>;
    data: T;
    originalCurrency?: string;
    statusCode?: number;
  }
) => {
  const userCurrency = req.userPreferences?.currency || 'USD';
  let currencyInfo;

  // If data contains financial information and currency conversion is needed
  if (data.originalCurrency && data.originalCurrency !== userCurrency) {
    try {
      const exchangeRate = await getExchangeRate(
        data.originalCurrency as import('./currencyConverter').TCurrency, 
        userCurrency as import('./currencyConverter').TCurrency
      );
      
      currencyInfo = {
        originalCurrency: data.originalCurrency,
        convertedCurrency: userCurrency,
        exchangeRate
      };

      // Add currency conversion message to variables
      const conversionMessage = getCurrencyConversionMessage(req, data.originalCurrency, userCurrency);
      data.messageVariables = {
        ...data.messageVariables,
        currencyNote: conversionMessage
      };
    } catch (error) {
      console.error('Currency conversion error:', error);
      // Continue without conversion info
    }
  }

  sendResponseWithTranslation(res, req, {
    statusCode: data.statusCode || 200,
    success: true,
    messageKey: data.messageKey,
    messageVariables: data.messageVariables,
    data: data.data,
    currencyInfo
  });
};

export default sendResponse;
