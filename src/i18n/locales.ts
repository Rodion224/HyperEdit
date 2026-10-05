import { LocaleInfo } from '../types/i18n';

export const LOCALES: LocaleInfo[] = [
  { id: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { id: 'en', name: 'English (US)', nativeName: 'English (US)', flag: '🇺🇸' },
  { id: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { id: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { id: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { id: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { id: 'zh-cn', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
  { id: 'zh-tw', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼' },
  { id: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { id: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { id: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { id: 'pt-br', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', flag: '🇧🇷' },
  { id: 'pt-pt', name: 'Portuguese (Portugal)', nativeName: 'Português', flag: '🇵🇹' },
  { id: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { id: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { id: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { id: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { id: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { id: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { id: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { id: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { id: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  { id: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { id: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { id: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
  { id: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
  { id: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { id: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  { id: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { id: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', rtl: true },
  { id: 'kk', name: 'Kazakh', nativeName: 'Қазақша', flag: '🇰🇿' },
  { id: 'be', name: 'Belarusian', nativeName: 'Беларуская', flag: '🇧🇾' },
];

export function getLocaleById(id: string): LocaleInfo {
  return LOCALES.find((l) => l.id === id) || LOCALES[0];
}
