/**
 * Optional fields for Form Editor field type 'Select'
 */

var template = require('./templates/questionOptionsFile.hbs');

module.exports = Backbone.Marionette.ItemView.extend({
  template: template,

  ui: {
    'images': 'input[type=checkbox]',
  },

  templateHelpers: function() {
    var options = this.model.get('options') || {};
    return {
      images: function() {
        return !!options.images;
      }
    };
  },

  getOptions: function() {
    var images = this.ui.images.is(':checked');
    return {
      images: images,
    };
  }
});
