import { Router, Request, Response } from 'express';
import { testGoogleTranslate, getTranslateStatus } from '../util/translateTest';
import googleTranslateService from '../util/googleTranslate';
import { convertCurrency, getExchangeRate } from '../util/currencyConverter';
import { localeMiddleware } from '../middleware/locale';

const testRouter = Router();

// Test endpoint to check Google Translate status
testRouter.get('/translate-status', async (req: Request, res: Response) => {
    try {
        const status = getTranslateStatus();
        res.json({
            status: 'success',
            data: status,
            message: 'Translation service status retrieved'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to get translation status',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Test endpoint to run Google Translate test
testRouter.post('/test-translate', async (req: Request, res: Response) => {
    try {
        const testResult = await testGoogleTranslate();
        res.json({
            status: 'success',
            data: { testPassed: testResult },
            message: testResult ? 'Translation test passed' : 'Translation test failed'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Translation test failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Test endpoint to translate custom text
testRouter.post('/translate-text', (req: Request, res: Response) => {
    (async () => {
        try {
            const { text, targetLanguage, sourceLanguage = 'en' } = req.body;
            
            if (!text || !targetLanguage) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Text and targetLanguage are required'
                });
            }

            const translatedText = await googleTranslateService.translateText(
                text, 
                targetLanguage, 
                sourceLanguage
            );

            res.json({
                status: 'success',
                data: {
                    original: text,
                    translated: translatedText,
                    sourceLanguage,
                    targetLanguage
                },
                message: 'Text translated successfully'
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Translation failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    })();
});

// Test endpoint for currency conversion
testRouter.get('/currency-status', async (req: Request, res: Response) => {
    try {
        const testAmount = 100;
        const fromCurrency = 'USD';
        const toCurrency = 'EUR';
        
        const convertedAmount = await convertCurrency(testAmount, fromCurrency as any, toCurrency as any);
        const exchangeRate = await getExchangeRate(fromCurrency as any, toCurrency as any);
        
        res.json({
            status: 'success',
            data: {
                test: {
                    originalAmount: testAmount,
                    originalCurrency: fromCurrency,
                    convertedAmount,
                    convertedCurrency: toCurrency,
                    exchangeRate
                },
                supportedCurrencies: ['USD', 'EUR', 'SGD', 'GBP', 'AUD']
            },
            message: 'Currency conversion working'
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Test endpoint for both translation AND currency conversion
testRouter.get('/full-i18n-test', localeMiddleware, async (req: Request, res: Response) => {
    try {
        const userLanguage = req.userPreferences?.language || 'en';
        const userCurrency = req.userPreferences?.currency || 'USD';
        
        // Sample financial data (like what comes from group transactions)
        const sampleData = {
            status: "success",
            message: "Groups retrieved successfully",
            currencyNote: `Amounts converted to ${userCurrency}`,
            data: {
                totalGroups: 1,
                groups: [
                    {
                        groupName: "Bangkok Trip",
                        financialSummary: {
                            netBalance: {
                                amount: 100, // Will be converted from USD to user's currency
                                status: "you_owe",
                                currency: "USD"
                            }
                        },
                        groupStats: {
                            currencies: ["US Dollar"]
                        }
                    }
                ]
            }
        };

        // Convert currency if needed
        if (sampleData.data.groups[0].financialSummary.netBalance.currency !== userCurrency) {
            const originalAmount = sampleData.data.groups[0].financialSummary.netBalance.amount;
            const convertedAmount = await convertCurrency(
                originalAmount, 
                'USD' as any, 
                userCurrency as any
            );
            
            sampleData.data.groups[0].financialSummary.netBalance.amount = convertedAmount;
            sampleData.data.groups[0].financialSummary.netBalance.currency = userCurrency;
        }

        // Translate the response
        const translatedResponse = await googleTranslateService.translateApiResponse(sampleData, userLanguage);
        
        res.json({
            status: 'success',
            data: {
                userPreferences: {
                    language: userLanguage,
                    currency: userCurrency
                },
                originalData: sampleData,
                translatedAndConvertedData: translatedResponse
            },
            message: 'Full i18n and currency conversion test completed'
        });
        
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

export default testRouter;