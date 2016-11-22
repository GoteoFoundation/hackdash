/**
 * VIEW: Question List
 *
 */

var QuestionItem = require('./QuestionItem');

var EmptyView = Backbone.Marionette.ItemView.extend({
  template: _.template('No questions yet!')
});

module.exports = Backbone.Marionette.CollectionView.extend({

  tagName: 'div',
  className: 'list-group',

  childView: QuestionItem,

  emptyView: EmptyView

});
