/**
 * VIEW: Question List
 *
 */

var
    template = require('./templates/formItem.hbs')
;
var Handlebars = require("hbsfy/runtime");

module.exports = Backbone.Marionette.LayoutView.extend({

  template: template,

  events: {
  },

  templateHelpers: {
    respondedLabel: function(form, prj) {
      var questions = (form && form.questions) || [];
      var responses = _.findWhere(prj.forms , {form: form._id});
      responses = (responses && responses.responses) || [];
      var percent = Math.min(1, responses.length / questions.length);
      return new Handlebars.SafeString('<strong style="color:hsl(' + (120 * Math.pow(percent,3)) + ', 50%, 50%)">' +
        Math.round(100 * percent) +
        '% ' + __('Answered') + '</strong>');
    },
    canRespond: function() {
      return true;
    },
    canView: function() {
      return true;
    }
  },

  modelEvents: {
    "change": "render"
  },

  initialize: function() {
    if(this.model && this.hasOwnProperty('getMyProjects')) {
      this.model.set({projects: this.model.getMyProjects()});
    }
  }
});
