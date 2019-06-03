/**
 * VIEW: input:Text element in form
 *
 */

var
    Text = require('./Text')
  , template = require('./templates/checkbox.hbs');

module.exports = Text.extend({

  template: template,

  ui: {
    input: '.form-group input'
  },

  templateHelpers: function() {
    var self = this;
    return {
      name: function() {
        return 'el_' + self.model.get('_id');
      },
      values: function() {
        return this.options && this.options.values ? this.options.values : [];
      },
      checked: function(val) {
        var value = self.model.get('value');
        console.log('checkbox values', value, self.model.get('options'));
        if(_.isArray(value) && value.length) {
          return _.indexOf(value, val) > -1 ? ' checked' : '';
        }

        return value === val ? ' checked' : '';
      },
      inputType: function() {
        return self.model.get('options') && self.model.get('options').multiple ? 'checkbox' : 'radio';
      }
    };
  },

  setValue: function() {
    var values = [];
    console.log('set val', this.ui.input);
    this.ui.input.each(function(i, el) {
      if(el.checked) {
        values.push(el.value);
      }
    });
    console.log('setValue', values);
    this.model.set({'value' : values});
  }

});
