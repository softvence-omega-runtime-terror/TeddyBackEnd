// Lightweight i18n utility with in-memory dictionaries.
// Extend or replace with a full library (e.g., i18next) if needed.

export type Translations = Record<string, Record<string, string>>; // lang -> key -> value

const dictionaries: Translations = {
  en: {
    'auth.login.success': 'Logged in successfully',
    'auth.login.failed': 'Invalid credentials',
  },
  id: {
    'auth.login.success': 'Berhasil masuk',
    'auth.login.failed': 'Kredensial tidak valid',
  },
  ms: {
    'auth.login.success': 'Berjaya log masuk',
    'auth.login.failed': 'Kelayakan tidak sah',
  },
  ko: {
    'auth.login.success': '성공적으로 로그인되었습니다',
    'auth.login.failed': '잘못된 자격 증명',
  },
  zh: {
    'auth.login.success': '登录成功',
    'auth.login.failed': '凭证无效',
  },
  ja: {
    'auth.login.success': 'ログインに成功しました',
    'auth.login.failed': '認証情報が無効です',
  },
};

export const supportedLanguages = Object.keys(dictionaries);

export function translate(lang: string | undefined, key: string, fallback?: string): string {
  const l = (lang || 'en') as keyof typeof dictionaries;
  return dictionaries[l]?.[key] ?? dictionaries.en[key] ?? fallback ?? key;
}

export function makeTranslator(lang?: string) {
  return (key: string, fallback?: string) => translate(lang, key, fallback);
}
