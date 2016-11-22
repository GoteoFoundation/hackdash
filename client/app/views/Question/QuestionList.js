/**
 * VIEW: Question List
 *
 */

var Item = require('./QuestionItem');

module.exports = Backbone.Marionette.CollectionView.extend({

  tagName: 'div',
  className: 'list-group',

  childView: Item,

});
