/**
 * VIEW: Question List
 *
 */

var
    template = require('./templates/formResponses.hbs')
  ;

module.exports = Backbone.Marionette.LayoutView.extend({

  template: template,

  regions: {
    responsesList: ".responses-list",
  },

  onRender: function() {
    var form = this.model;
    form.fetchResponses(function(err, responses) {
      if(err) {
        return window.alert('Responses cannot be fetched! '+ err);
      }

      console.log(responses);
    });
  },

});
