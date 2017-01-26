/**
 * VIEW: Full Project view
 *
 */

var template = require("Project/templates/full.hbs")
  , Comments = require('../../models/Comments')
  , CommentsView = require('./Comments')
  , Sharer = require("../Sharer");

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  id: function(){
    return this.model.get("_id");
  },

  className: "page-ctn project",
  template: template,

  templateHelpers: {
    toolsUrl: function() {
      var status = _.findWhere(hackdash.statuses, {status: this.status});
      if(status) {
        return status.toolsUrl;
      }
      return '';
    },
    showActionContribute: function(){
      if (hackdash.user && this.leader){
        return hackdash.user._id !== this.leader._id && hackdash.userHasPermission(hackdash.user, 'project_join');
      }
      return false;
    },
    showActionFollow: function(){
      if (hackdash.user && this.leader){
        return hackdash.user._id !== this.leader._id && hackdash.userHasPermission(hackdash.user, 'project_follow');
      }
      return false;
    },
    showActionEdit: function(){
      if (hackdash.user && this.leader){
        return hackdash.user._id === this.leader._id || hackdash.userHasPermission(hackdash.user, 'project_update');
      }
      return false;
    },
    showActionDelete: function(){
      if (hackdash.user && this.leader){
        return hackdash.user._id === this.leader._id || hackdash.userHasPermission(hackdash.user, 'project_delete');
      }
      return false;
    },
    isAdminOrLeader: function(){
      var user = hackdash.user;
      if (this.leader && user){
        return user._id === this.leader._id || user.admin_in.indexOf(this.domain) >= 0;
      }
      return false;
    }
  },

  ui: {
    "contribute": ".contributor a",
    "follow": ".follower a",
    "shareLink": '.share'
  },

  regions: {
    "commentsContent": ".comments-ctn"
  },

  events: {
    "click @ui.contribute": "onContribute",
    "click @ui.follow": "onFollow",
    "click .remove a": "onRemove",
    "click .login": "showLogin",
    "click .share": "showShare",
  },

  modelEvents: {
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    this.$el.addClass(this.model.get("status"));
    var self = this;
    $(".tooltips", this.$el).tooltip({});
    if (hackdash.internalComments) {
      // Get comments
      var comments = new Comments();
      comments.project = this.model.get('_id');
      comments.fetch().done(function(){
        console.log('Comments', comments);
        self.commentsContent.show(new CommentsView({
          collection: comments
        }));
      });
    }
    else if (hackdash.discourseUrl) {
      $.getScript("/js/discourse.js");
    }
    else if (hackdash.disqus_shortname) {
      $.getScript("/js/disqus.js");
    }

    $('html, body').scrollTop(0);
  },

  serializeData: function(){
    return _.extend({
      contributing: this.model.isContributor(),
      following: this.model.isFollower()
    }, this.model.toJSON());
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  onContribute: function(e){
    this.ui.contribute.button('loading');
    this.model.toggleContribute();
    e.preventDefault();
  },

  onFollow: function(e){
    this.ui.follow.button('loading');
    this.model.toggleFollow();
    e.preventDefault();
  },

  onRemove: function(){
    if (window.confirm(__("This project is going to be deleted. Are you sure?"))){
      var domain = this.model.get('domain');
      this.model.destroy();

      hackdash.app.router.navigate("/dashboards/" + domain, {
        trigger: true,
        replace: true
      });
    }
  },

  showLogin: function(){
    hackdash.app.showLogin();
  },

  showShare: function(e){
    var el = $(e.target);
    Sharer.show(el, {
      type: 'project',
      model: this.model
    });
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
