/**
 * VIEW: input:Text element in form
 *
 */

var
    Text = require('./Text')
  , template = require('./templates/range.hbs');

module.exports = Text.extend({

  template: template,

  ui: {
    range: 'input'
  },

  templateHelpers: function() {
    var self = this;
    return {
      labelMin: function() {
        return self.values.length ? '' : self.min;
      },
      labelMax: function() {
        return self.values.length ? '' : self.max;
      },
      name: function() {
        return 'el_' + this._id;
      }
    };
  },

  initialize: function(options) {
    if(options.response) {
      this.model.set({'value': options.response.value});
    }
    this.options = this.model.get('options') ? this.model.get('options') : {};
    this.values = this.options && this.options.values ? this.options.values : [];
    this.keys = Object.keys(this.values);
    this.min = this.options && this.options.min ? parseInt(this.options.min) : 0;
    this.max = this.options && this.options.max ? parseInt(this.options.max) : 0;
  },

  onRender: function() {
    this.ui.range.slider({
      min: this.min,
      max: this.max,
      tooltip: this.values.length ? 'hide' : 'show',
      ticks: this.keys,
      ticks_labels: this.values,
      value: this.model.get('value') ? this.model.get('value') : 0
    });
  },

  // Fix for some render issues
  onShow:function() {
    var self = this;
    window.setTimeout(function(){
      self.ui.range.slider('relayout');
    },10);
  }

});
