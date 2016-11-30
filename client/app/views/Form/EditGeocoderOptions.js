/**
 * Optional fields for Form Editor field type 'Select'
 */

var template = require('./templates/questionOptionsGeocoder.hbs');

module.exports = Backbone.Marionette.ItemView.extend({
  template: template,

  ui: {
    'browser': 'input[type=checkbox]',
  },

  templateHelpers: function() {
    var options = this.model.get('options') || {};
    return {
      browser: function() {
        return !!options.browser;
      }
    };
  },

  getOptions: function() {
    var browser = this.ui.browser.is(':checked');
    return {
      browser: browser,
    };
  }
});
