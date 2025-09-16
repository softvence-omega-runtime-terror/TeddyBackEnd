import googleTranslateService from '../util/googleTranslate';

/**
 * Test Google Translate functionality
 */
export const testGoogleTranslate = async () => {
    console.log('🔍 Testing Google Translate Service (Free Version)...');
    
    if (!googleTranslateService.isEnabled()) {
        console.log('❌ Google Translate is disabled.');
        return false;
    }

    try {
        // Test basic translation
        const testText = 'Groups retrieved successfully';
        const translatedToJapanese = await googleTranslateService.translateText(testText, 'ja', 'en');
        const translatedToIndonesian = await googleTranslateService.translateText(testText, 'id', 'en');
        
        console.log('✅ Google Translate is working!');
        console.log(`📝 Original: "${testText}"`);
        console.log(`🇯🇵 Japanese: "${translatedToJapanese}"`);
        console.log(`🇮🇩 Indonesian: "${translatedToIndonesian}"`);

        // Test API response translation
        const testResponse = {
            status: 'success',
            message: 'Groups retrieved successfully',
            data: {
                groups: [
                    {
                        groupName: 'Bangkok Trip',
                        netBalance: {
                            status: 'you owe'
                        }
                    }
                ]
            },
            currencyNote: 'Amounts converted to EUR'
        };

        const translatedResponse = await googleTranslateService.translateApiResponse(testResponse, 'ja');
        console.log('🔄 API Response Translation Test:');
        console.log('📤 Original response message:', testResponse.message);
        console.log('📥 Translated response message:', translatedResponse.message);
        
        return true;
    } catch (error) {
        console.error('❌ Google Translate test failed:', error);
        return false;
    }
};

/**
 * Get Google Translate service status
 */
export const getTranslateStatus = () => {
    return {
        enabled: googleTranslateService.isEnabled(),
        cacheStats: googleTranslateService.getCacheStats(),
        package: 'google-translate-api-x (Free)',
        note: 'Using free Google Translate web interface - no API key required'
    };
};