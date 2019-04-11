module.exports = function(){

  window.hackdash = window.hackdash || {};

  window.hackdash.getQueryVariable = function(variable){
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
      var pair = vars[i].split("=");
      if(pair[0] === variable){return decodeURI(pair[1]);}
    }
    return(false);
  };

  // Check an atomic permissions from the user's role
  window.hackdash.userHasPermission = function(user, perm) {
    if(!user) {
      return false;
    }
    var role = _.findWhere(window.hackdash.roles, {role: user.role}) || {role: null, perms:[]};
    return role.perms.indexOf(perm) >= 0;
  };

  if ($.fn.editable){
    // Set global mode for InlineEditor (X-Editable)
    $.fn.editable.defaults.mode = 'inline';
  }

  var lan = window.hackdash.language;
  if(!window.hackdash.language) {
    lan =
      window.navigator.languages ?
        window.navigator.languages[0] :
        (window.navigator.language || window.navigator.userLanguage || 'en-US');
  }

  var i18n = require('./locale');
  i18n.setLocale(lan);
  i18n.addLocales(window.hackdash.themeLocales);

  window.__ = hackdash.i18n = i18n.__;

  // Init Helpers
  require('./helpers/handlebars');
  require('./helpers/backboneOverrides');

  Placeholders.init({ live: true, hideOnFocus: true });

  Dropzone.autoDiscover = false;

  window.hackdash.apiURL = "/api/v2";
  window._gaq = window._gaq || [];

  if (window.hackdash.fbAppId){
    $.getScript('//connect.facebook.net/en_US/sdk.js', function(){
      window.FB.init({
        appId: window.hackdash.fbAppId,
        version: 'v2.3'
      });
    });
  }

};
