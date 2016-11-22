/**
 * VIEW: Question List
 *
 */

var Item = require('./QuestionItem');

module.exports = Backbone.Marionette.CollectionView.extend({

  tagName: 'ul',
  className: 'list-group',

  childView: Item,

});
