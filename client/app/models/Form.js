/**
 * MODEL: Form (bind to a collection or dashboard)
 *
 */

module.exports = Backbone.Model.extend({

  urlRoot: function(){
    return hackdash.apiURL + '/forms'; //Posts requests
  },

  // Get questions as a generic Model
  getQuestions: function(){
    // var self = this;
    var questions = this.get('questions') || [];
    return new Backbone.Collection(questions);
    // return new Backbone.Collection(_.map(questions, function(e, k){
    //     e.questionIndex = k;
    //     // e.form = self; // Original Form
    //     return new Backbone.Model(e);
    //   }));
  },

  // Get responses as a generic Model
  fetchResponses: function(callback){
    if(typeof callback !== 'function') {
      callback = function(){};
    }
    $.ajax({
      url: this.url() + '/responses',
      type: 'GET',
      context: this
    })
    .fail(function(jqXHR) {
      callback(jqXHR.responseText);
    })
    .done(function(responses) {
      callback(null, new Backbone.Collection(responses));
    });
  },

  getMyProjects: function() {
    var projects = this.get('projects') || [];
    return _.filter(projects, function(p) {
      return p.leader._id === hackdash.user._id;
    });
  },

  sendResponse: function(res, callback) {
    if(typeof callback !== 'function') {
      callback = function(){};
    }

    if(!this.get('project').get('_id')) {
      callback('Expected a project property!');
      return;
    }

    var url = this.url() + '/' + this.get('project').get('_id');

    $.ajax({
      url: url,
      type: 'PUT',
      data: JSON.stringify(res),
      contentType: 'application/json; charset=utf-8',
      context: this
    })
    .fail(function(jqXHR) {
      callback(jqXHR.responseText);
    })
    .done(function(msg) {
      callback(null, msg);
    });
  },

  fetchTemplates: function(callback) {
    if(typeof callback !== 'function') {
      callback = function(){};
    }
    $.ajax({
      url: this.urlRoot() + '/templates',
      type: 'GET',
      context: this
    })
    .fail(function(jqXHR) {
      callback(jqXHR.responseText);
    })
    .done(function(templates) {
      callback(null, templates);
    });
  }
});
