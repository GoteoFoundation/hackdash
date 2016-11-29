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
    .fail(function(jqXHR, status) {
      console.log('fail', status, jqXHR);
      callback(jqXHR.responseText);
    })
    .done(function(msg) {
      console.log('done',msg);
      callback(null, msg);
    });
  }

});
