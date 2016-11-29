/**
 * VIEW: Question List
 *
 */

var Text = require('./Element/Text')
  , Email = require('./Element/Email')
  , Bool = require('./Element/Boolean');

var EmptyView = Backbone.Marionette.ItemView.extend({
	template: _.template('<p class="text-danger">No questions on this form!</p>')
});

module.exports = Backbone.Marionette.CollectionView.extend({

  tagName: 'div',

  emptyView: EmptyView,

  getChildView: function(item) {
    console.log(item.get('title'), item.get('type'));
    switch(item.get('type')) {
      case 'email':
        return Email;
      case 'boolean':
        return Bool;
      default:
        return Text;
    }
  },

  childViewOptions: function (model) {
    var project = this.model.get('project');
    var form = this.model;
    var forms = project ? project.get('forms') : [];
    var responses = _.find(forms, function(e) { return e.form === form.get('_id'); });
    responses = responses.responses ? responses.responses : [];
    var response = _.find(responses, function(e) { console.log('E',e);return e.question === model.get('_id'); });
    console.log('child', forms, 'responses =>', responses, model.get('_id'), 'response =>', response);
    return {
      index: this.collection.indexOf(model) + 1,
      total: this.collection.length,
      responses: responses, // If form element need info about other values
      response: response
    };
  },


});
