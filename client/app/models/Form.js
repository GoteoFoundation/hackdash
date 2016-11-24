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
    var questions = this.get('questions') || [];
    return new Backbone.Collection(_.map(questions, function(e, k){
        e.index = k;
        return new Backbone.Model(e);
      }));
  }

});
