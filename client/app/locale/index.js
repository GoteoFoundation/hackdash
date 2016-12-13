/*eslint no-console:0*/
var locales = {
  en: require('./en'),
  es: require('./es')
};
// Compatibilize underscore to use in server-side
if(!_) {
  var _ = require('underscore');
}

var current = locales.en;
var _lan = 'en';

module.exports = {

  /**
   * Method to dynamically add locales (ie: from themes)
   * @param {en:{...}, es:{...}} addons an object with all the locales to add/substitute
   */
  addLocales: function(addons) {
    console.log('addLocales1',addons);
    for(var l in addons) {
      if(locales.hasOwnProperty(l)) {
        _.extend(locales[l], addons[l]);
      }
    }
    console.log('addLocales2',locales);
  },

  setLocale: function(lan) {
    //console.log(`i18n: setting Language [${lan}]`);
    if (!locales.hasOwnProperty(lan)){

      if (lan.indexOf('-') > -1 || lan.indexOf('_') > -1){
        var parsed = lan.replace('-', '$').replace('_', '$');
        var newLan = parsed.split('$')[0];

        if (newLan && locales.hasOwnProperty(newLan)){
          lan = newLan;
        }
        else {
          var tr = 'i18n: Could not resolve Language from [${lan}] or language [${newLan}] not found';
          console.warn(tr.replace('${lan}', lan).replace('${newLan}', newLan));
          return;
        }
      }
      else {
        console.warn('i18n: Language [${lan}] not found'.replace('${lan}', lan));
        return;
      }
    }

    _lan = lan;
    current = locales[lan];
  },

  locales: function() {
    return current;
  },

  __: function() {
    var key = arguments[0];
    var params = Array.prototype.slice.call(arguments).slice(1);

    var phrase = current[key];

    if (!phrase){
      if (locales.en.hasOwnProperty(key)){
        phrase = locales.en[key];
        console.warn(
          'i18n: Key [${key}] not found for language [${_lan}]'.replace('${key}', key).replace('${_lan}', _lan));
      }
      else {
        phrase = key;
        console.error('i18n: Key [${key}] not found'.replace('${key}', key));
      }
    }

    return params.reduce(function(str, p, i) {
      return str.replace('{'+ (i+1) +'}', p);
    }, phrase);
  }

};
