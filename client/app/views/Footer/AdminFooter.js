
var
    template = require('./templates/admin.hbs')
  , Dashboard = require('../../models/Dashboard');

module.exports = Backbone.Marionette.ItemView.extend({

  template: template,
  className: 'admin-footer-wrapper',

  templateHelpers: function() {
    var self = this;
    return {
      isAdmin: function() {
        var user = hackdash.user;
        if(user) {
          var admin1 = user.admin_in.indexOf(this.domain) >= 0;
          // If it has owner property its a collection
          var admin2 = this.owner && user._id === this.owner._id;
          return admin1 || admin2;
        }
        return false;
      },
      isDashboardForm: function() {
        return (hackdash.app.type === "dashboard_form");
      },
      isCollectionForm: function() {
        return (hackdash.app.type === "collection_form");
      },
      isForm: function() {
        return (hackdash.app.type.indexOf("form") > 0 );
      },
      isDashboard: function() {
        return (hackdash.app.type === "dashboard");
      },
      isCollection: function() {
        return (hackdash.app.type === "collection");
      },
      statuses: function() {
        if(self.model && self.model.getStatuses) {
          return self.model.getStatuses();
        }
        return hackdash.statuses;
      }
    };
  }
  ,

  ui: {
    "switcher": ".dashboard-btn",
    "private": ".dashboard-private",
    "showcaseMode": ".btn-showcase-mode",
    "createShowcase": ".btn-new-project",
    "footerToggle": ".footer-toggle-ctn",
    "openAdmin": ".btn-open-admin",
    "adminContainer": '.footer-dash-ctn',
    "activeStatuses": '.active-statuses'
  },

  events: {
    "click @ui.switcher": "onClickSwitcher",
    "click @ui.private": "onClickPrivate",
    "click .btn-showcase-mode": "changeShowcaseMode",
    "click @ui.openAdmin": "onOpenAdmin",
    "change @ui.activeStatuses": "onSelectStatus"
  },


  modelEvents: {
    "change": "render"
  },

  onRender: function() {
    $('.tooltips', this.$el).tooltip({});
    this.ui.activeStatuses.select2({
      // theme: "bootstrap",
      // minimumResultsForSearch: 10
    });
    // Fix for select2
    $('.select2-container', this.$el).css({width: 'auto'});
  },

  serializeData: function() {

    if (this.model && this.model instanceof Dashboard) {

      var msg1 = __("This Dashboard is open: click to close");
      var msg2 = __("Anyone can see the projects in this Dashboard: click to privatize");

      if (!this.model.get("open")) {
        msg1 = __("This Dashboard is closed: click to reopen");
        msg1 = __("Nobody can see the projects in this Dashboard: click to publish");
      }

      return _.extend({
        switcherMsg: msg1,
        privateMsg: msg2
      }, this.model.toJSON());
    }

    return (this.model && this.model.toJSON()) || {};
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  onOpenAdmin: function() {
    if(this.model) {
      this.model.set({adminOpened: !this.model.get('adminOpened')});
    }
  },

  onClickSwitcher: function() {
    var open = true;

    if (this.ui.switcher.hasClass("dash-open")) {
      open = false;
    }

    $('.tooltips', this.$el).tooltip('hide');

    // console.log('switcher', this.model);
    this.model.set({ "open": open }, { trigger: false });
    this.model.save({ wait: true });
  },

  onClickPrivate: function() {
    var private = true;

    if (this.ui.private.hasClass("dash-private")) {
      private = false;
    }

    $('.tooltips', this.$el).tooltip('hide');

    console.log('private', this.model);
    this.model.set({ "private": private }, { trigger: false });
    this.model.save({ wait: true });
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  changeShowcaseMode: function(){
    if (this.ui.showcaseMode.hasClass("on")){

      this.model.trigger("save:showcase");
      this.model.trigger("end:showcase");

      this.model.isShowcaseMode = false;

      this.ui.showcaseMode
        .html("<i class='btn-danger txt'>" + __("turned_off") + "</i><div>" + __("Edit Showcase") + "</div>")
        .removeClass("on");

      this.ui.createShowcase.removeClass("hide");
      this.ui.footerToggle.removeClass("hide");
    }
    else {
      this.model.isShowcaseMode = true;
      this.model.trigger("edit:showcase");

      this.ui.showcaseMode
        .text(__("Save Showcase"))
        .addClass("btn btn-success on");

      this.ui.createShowcase.addClass("hide");
      this.ui.footerToggle.addClass("hide");
    }
  },

  onSelectStatus: function() {
    var activeStatuses = this.ui.activeStatuses.val() || [];
    var inactiveStatuses = _.filter(hackdash.statuses, function(s) {
        return activeStatuses.indexOf(s.status) === -1;
      });

    console.log(activeStatuses, _.pluck(inactiveStatuses, 'status'));
    this.model.set({
       "inactiveStatuses": _.pluck(inactiveStatuses, 'status')
     }, { trigger: false });
    this.model.save({ wait: true });
  }

});
