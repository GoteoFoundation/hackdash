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
    return {
      index: this.collection.indexOf(model) + 1,
      total: this.collection.length,
    };
  },


});
