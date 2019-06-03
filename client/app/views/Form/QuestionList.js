/**
 * VIEW: Question List
 *
 */

var Text = require('./Element/Text')
  , Email = require('./Element/Email')
  , Textarea = require('./Element/Textarea')
  , Select = require('./Element/Select')
  , Range = require('./Element/Range')
  , Geocoder = require('./Element/Geocoder')
  , File = require('./Element/File')
  , Checkbox = require('./Element/Checkbox')
  , Bool = require('./Element/Boolean');

var EmptyView = Backbone.Marionette.ItemView.extend({
	template: _.template('<p class="text-danger">No questions on this form!</p>')
});

module.exports = Backbone.Marionette.CollectionView.extend({

  tagName: 'div',

  emptyView: EmptyView,

  getChildView: function(item) {
    switch(item.get('type')) {
      case 'email':
        return Email;
      case 'textarea':
        return Textarea;
      case 'select':
        return Select;
      case 'range':
        return Range;
      case 'geocoder':
        return Geocoder;
      case 'file':
        return File;
      case 'boolean':
        return Bool;
      case 'checkbox':
        return Checkbox;
      default:
        return Text;
    }
  },

  childViewOptions: function (model) {
    var entity = this.model.get('project');
    var public = this.model.get('public');
    var forms = [];
    if(public) {
      entity = this.model.get('user');
      forms = entity && entity.forms || [];
    } else {
      forms = entity && entity.get('forms') || [];
    }
    // console.log('public', public, 'model', model, 'entity', entity);
    var form = this.model;
    var responses = _.find(forms, function(e) { return e.form === form.get('_id'); });

    responses = responses && responses.responses ? responses.responses : [];
    var response = _.find(responses, function(e) { return e.question === model.get('_id'); });
    // console.log('child', forms, 'responses =>', responses, model.get('_id'), 'response =>', response);
    return {
      index: this.collection.indexOf(model) + 1,
      total: this.collection.length,
      responses: responses, // If form element need info about other values
      response: response,
      form: form,
      entity: entity
    };
  },

  getValues: function() {
    var values = [];
    this.collection.each(function(c){
      if(!_.isUndefined(c.get('value'))) {
        values.push({
          question: c.get('_id'),
          value: c.get('value')
        });
      }
    });
    return values;
  }

});
