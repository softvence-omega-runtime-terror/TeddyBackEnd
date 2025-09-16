import express from 'express';
import { Request, Response } from 'express';
import catchAsync from '../../util/catchAsync';
import { localeMiddleware } from '../../middleware/locale';
import auth from '../../middleware/auth';
import { userRole } from '../../constants';

const testRouter = express.Router();

// Test endpoint to verify i18n is working
const testTranslation = catchAsync(async (req: Request, res: Response) => {
    const message = req.t ? req.t('group.group_created') : 'Group created successfully';
    const locale = req.locale || 'en';
    
    res.status(200).json({
        status: 'success',
        locale: locale,
        message: message,
        userPreferences: req.userPreferences,
        debug: {
            userId: req.user?.id,
            headers: {
                'accept-language': req.headers['accept-language'],
                'x-lang': req.headers['x-lang']
            }
        }
    });
});

// Debug endpoint to check user profile
const debugProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    let profile = null;
    
    if (userId) {
        const { ProfileModel } = await import('../../modules/user/user.model');
        profile = await ProfileModel.findOne({ user_id: userId, isDeleted: false });
    }
    
    res.status(200).json({
        status: 'success',
        userId: userId,
        profile: profile ? {
            language: profile.language,
            preferredCurrency: profile.preferredCurrency,
            email: profile.email,
            name: profile.name
        } : null,
        userPreferences: req.userPreferences,
        locale: req.locale
    });
});

testRouter.get('/test-translation', localeMiddleware, testTranslation);
testRouter.get('/debug-profile', auth([userRole.user]), localeMiddleware, debugProfile);

export default testRouter;