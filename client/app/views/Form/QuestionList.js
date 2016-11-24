/**
 * VIEW: Question List
 *
 */

var QuestionItem = require('./QuestionItem');

var EmptyView = Backbone.Marionette.ItemView.extend({
	template: _.template('<p class="text-danger">No questions yet!</p>')
});

module.exports = Backbone.Marionette.CollectionView.extend({

  tagName: 'div',
  className: 'list-group',

  childView: QuestionItem,

  emptyView: EmptyView

});
