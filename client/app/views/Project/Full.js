/**
 * VIEW: Full Project view
 *
 */

var template = require("Project/templates/full.hbs")
  , ExtraFields = require('./ExtraFields')
  , Forms = require('../../models/Forms')
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

  templateHelpers: function() {
    var self = this;
    return {
      internalComments: function() {
        return hackdash.internalComments;
      },
      statuses: function() {
        return hackdash.statuses;
      },
      activeStatus: function(st1,st2) {
        return st2 === st1 ? ' active' : '';
      },
      linkStatus: function(status) {
        var extra = self.model && self.model.get('extra');
        var text = _.findWhere(hackdash.statuses, {'status' : status});
        if(extra && extra[status]) {
          return '<a href="/projects/' + self.id() + '/' + status + '">' + text.text + '</a>';
        } else {
          return text.text;
        }
      },
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
      showActionForms: function(){
        if (hackdash.user && this.leader){
          if(hackdash.user._id === this.leader._id || hackdash.userHasPermission(hackdash.user, 'form_respond')) {
            return (new Forms()).getForProject(self.id()).length;
          }
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
    };
  },

  ui: {
    "contribute": ".contributor a",
    "follow": ".follower a",
    "shareLink": '.share',
    'statusSteps': '.status-steps'
  },

  regions: {
    "extraFieldsTop": ".extra-fields-top",
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

  initialize:function(options) {
    if(options && options.status) {
      this.currentStatus = _.findWhere(hackdash.statuses, {status: options.status});
    }
    // TODO: Default status (0 or active)
    if(!this.currentStatus && hackdash.statuses && hackdash.statuses.length) {
      this.currentStatus = hackdash.statuses[0];
    }
    console.log(options, this.currentStatus);
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    this.$el.addClass(this.model.get('status'));
    // Status from url
    var extra = this.model && this.model.get('extra');
    if(extra && this.currentStatus && extra[this.currentStatus.status]) {
      this.setStatusView(this.currentStatus);
    }
    var self = this;
    $('.tooltips', this.$el).tooltip({});
    if (hackdash.internalComments) {
      // Get comments
      var comments = new Comments();
      comments.project = this.model.get('_id');
      comments.fetch().done(function(){
        console.log('Comments', comments);
        self.commentsContent.show(new CommentsView({
          collection: comments,
          model: self.model
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
  extraFields: {},

  setStatusView: function(statusObj) {
    // var status = this.model && this.model.get('status');
    //
    $('li', this.ui.statusSteps).removeClass('active');
    $('li.' + statusObj.status, this.ui.statusSteps).addClass('active');
    // Show extra fields
    // Hide required fields
    $('.extra-field', this.$el).show();
    if(this.currentStatus.fields && this.currentStatus.fields.length) {
      // console.log('extra fields',this.currentStatus.fields);
      this.extraFields[this.currentStatus.status] = new ExtraFields({
          model: this.model,
          status: this.currentStatus.status,
          fields: this.currentStatus.fields,
          readOnly: true
        });
      this.extraFieldsTop.show(this.extraFields[this.currentStatus.status]);
      if(this.currentStatus.hide) {
        $('.' + this.currentStatus.hide.join(',.'), this.$el).hide();
      }
    } else {
      this.extraFieldsTop.empty();
    }
  },

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
