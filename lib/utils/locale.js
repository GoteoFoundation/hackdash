import {language,theme} from 'config/config';
import i18n from 'client/app/locale';
import server_locales from 'lib/locale';

i18n.setLocale(language || 'en');

if(theme) {
  try {
    // Internal locales
    i18n.addLocales(server_locales);
    console.log("server locales", server_locales);

    if(theme) {
      // Locales from themes
      let locales = require('themes/' + theme + '/locale');
      i18n.addLocales(locales);
      console.log("custom locales from theme " +  theme, locales);
    }

  } catch(e) {
    console.error("Error locales", e);
  }
}

export default i18n.__;
