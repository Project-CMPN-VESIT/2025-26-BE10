// src/config/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files from the assets folder
import en from '../assets/translations/en.json';
import hi from '../assets/translations/hi.json';

// Define the available language resources
const resources = {
  en: {
    translation: en,
  },
  hi: {
    translation: hi,
  },
};

i18n
  .use(initReactI18next) // Binds i18next to React components
  .init({
    resources,
    lng: 'en', // Set the initial language (can be dynamic later)
    fallbackLng: 'en', // Use English if a specific translation key is missing

    interpolation: {
      escapeValue: false, // React Native handles security, so escaping is unnecessary
    },
    // Set development options (set to false for production release)
    debug: true, 
  });

export default i18n;