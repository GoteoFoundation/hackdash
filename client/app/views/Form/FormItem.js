/**
 * VIEW: Question List
 *
 */

var
    template = require('./templates/formItem.hbs')
;

module.exports = Backbone.Marionette.LayoutView.extend({

  template: template,

  events: {
  },

  templateHelpers: {
    opened: function() {
      // console.log('opened',this.openedForm, this._id);
      if(this.openedForm) {
        return this.openedForm === this._id;
      }
      return this.index === this.total;
    }
  },

  modelEvents: {
    "change": "render"
  },

});
