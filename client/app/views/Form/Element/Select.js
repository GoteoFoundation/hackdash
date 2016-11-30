/**
 * VIEW: input:Text element in form
 *
 */

var
    Text = require('./Text')
  , template = require('./templates/select.hbs');

module.exports = Text.extend({

  template: template,

  ui: {
    select: 'select'
  },

  templateHelpers: function() {
    var self = this;
    return {
      name: function() {
        return 'el_' + this._id;
      },
      values: function() {
        return this.options && this.options.values ? this.options.values : [];
      },
      selected: function(val) {
        var value = self.model.get('value');
        if(value && value.length) {
          return _.indexOf(value, val) > -1 ? ' selected' : '';
        }
        return value === val ? ' selected' : '';
      },
      multiple: function() {
        return this.options && this.options.multiple;
      }
    };
  },

  onRender: function() {
    this.ui.select.select2();
  }

});
