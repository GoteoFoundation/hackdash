/**
 * VIEW: Comment Item
 *
 */

var
    template = require('./templates/comments.hbs')
  , Comment = require('../../models/Comment')
  , CommentsList = require('./CommentsList')
  , CommentAdd = require('./CommentAdd');

module.exports = Backbone.Marionette.LayoutView.extend({
  template: template,

  className: 'comments col-md-12',

  regions: {
    commentsList: '.comments-list',
    newComment: '.comments-add'
  },

  modelEvents: {
    "change": "render"
  },

  templateHelpers: function(){

  },

  onRender: function() {
    var self = this;
    self.commentsList.show(new CommentsList({
      collection: self.collection
    }));
    self.initNewComment();
  },

  initNewComment: function() {
    var self = this;
    self.comment = new Comment({
        project: self.model && self.model.get('_id'),
        user: hackdash.user && hackdash.user._id
      });
    self.newComment.show(new CommentAdd({
      model: self.comment
    }));
    // Saved comment in the sub-view
    self.comment.on('change',function(){
      self.collection.add(self.comment);
      self.initNewComment();
    });
  },

});
