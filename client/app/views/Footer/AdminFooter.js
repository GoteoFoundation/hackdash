
var
    template = require('./templates/admin.hbs')
  , AdminModal = require('../Dashboard/AdminModal')
  , Dashboard = require('../../models/Dashboard')
  ;

module.exports = Backbone.Marionette.ItemView.extend({

  template: template,
  className: 'admin-footer-wrapper',

  templateHelpers: {
    isSetShowcase: function() {
      var user = hackdash.user;
      return this.domain && user.admin_in.indexOf(this.domain) >= 0 && hackdash.userHasPermission(user, 'dashboard_set_showcase');
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
    }
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
    "click @ui.openAdmin": "onOpenAdmin"
  },


  modelEvents: {
    "change": "render"
  },

  onRender: function() {
    $('.tooltips', this.$el).tooltip({});
  },


  serializeData: function() {

    if (this.model && this.model instanceof Dashboard) {

      var msg = __("This Dashboard is open: click to close");

      if (!this.model.get("open")) {
        msg = __("This Dashboard is closed: click to reopen");
      }

      return _.extend({
        switcherMsg: msg
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
    hackdash.app.modals.show(new AdminModal({
      model: this.model
    }));
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
  }

});
