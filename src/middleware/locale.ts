import { Request, Response, NextFunction } from 'express';
import { ProfileModel } from '../modules/user/user.model';
import { makeTranslator } from '../util/i18n';

// Middleware to set req.locale and req.t based on profile language or Accept-Language header
export async function localeMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    // Priority: explicit query/header > user profile > default 'en'
    const headerLang = (req.headers['accept-language'] || '').split(',')[0]?.trim();
    let lang: string | undefined = undefined;

    // If authenticated and we can read profile language
    try {
      const userId = (req as any).user?._id || (req as any).user?.userId || (req as any).user?.id;
      if (userId) {
        const profile = await ProfileModel.findOne({ user_id: userId, isDeleted: false }).lean();
        lang = (profile as any)?.language || undefined;
      }
    } catch {}

    req.locale = (req.query.lang as string) || (req.headers['x-lang'] as string) || lang || headerLang || 'en';
    req.t = makeTranslator(req.locale);
  } catch {
    req.locale = 'en';
    req.t = makeTranslator('en');
  }
  next();
}
