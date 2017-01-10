/**
 * VIEW: Question List
 *
 */

var
    template = require('./templates/formResponses.hbs')
  , ResponsesList = require('./ResponsesList')
  ;

module.exports = Backbone.Marionette.LayoutView.extend({

  template: template,
  className: "page-ctn forms",

  regions: {
    responsesList: ".responses-list",
  },

  events: {
    "click .export-csv": 'exportCSV'
  },

  templateHelpers: {
    domain: function() {
      return window.hackdash.app.dashboard.get('domain');
    }
  },

  onRender: function() {
    var form = this.model;
    var self = this;
    form.fetchResponses(function(err, responses) {
      if(err) {
        return window.alert('Responses cannot be fetched! '+ err);
      }

      // console.log(responses);
      self.responsesList.show(new ResponsesList({
        model: form,
        collection: responses
      }));

    });
  },

  exportCSV: function() {
    window.location = this.model.url() + '/responses?csv';
  }

});
