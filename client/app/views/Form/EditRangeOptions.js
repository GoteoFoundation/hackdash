/**
 * Optional fields for Form Editor field type 'Select'
 */

var template = require('./templates/questionOptionsRange.hbs');

module.exports = Backbone.Marionette.ItemView.extend({
  template: template,

  ui: {
    'min': 'input[name=min]',
    'max': 'input[name=max]',
    'options': 'textarea'
  },

  templateHelpers: function() {
    var options = this.model.get('options') || {};
    return {
      options: function() {
        return options.values ? options.values.join("\n") : '';
      },
      min: function() {
        return options.min ? options.min : 0;
      },
      max: function() {
        return options.max ? options.max : 10;
      }
    };
  },

  getOptions: function() {
    var val = this.ui.options.val();
    return {
      values: val.match(/[^\r\n]+/g),
      min: this.ui.min.val(),
      max: this.ui.max.val()
    };
  }
});
