
var template = require("Home/templates/home.hbs") // Required as absolute to allow themes
  , TabContent = require("./TabContent")
  , LocaleView = require("./Locale")
  , LoginView = require("../Login")
  , RegisterView = require("../Register")
  , ForgotView = require("../Forgot")
  , StatsView = require("./Stats")
  , DashboardListView = require("./DashboardList")
  , TeamView = require("./Team")
  , PartnersView = require("./Partners")
  , FooterView = require("./Footer")

  // Collections
  , Dashboards = require("../../models/Dashboards")
  , Projects = require("../../models/Projects")
  , Users = require("../../models/Users")
  , Collections = require("../../models/Collections")
  , Team = require("../../models/Team");

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  regions:{
    "dashboards": "#dashboards",
    "projects": "#projects",
    "users": "#users",
    "collections": "#collections",
    "dashboardList": "#dashboard-list",

    "locale": {
      selector: ".locale-list",
      allowMissingEl: true
    },
    "stats": {
      selector: ".stats-ctn",
      allowMissingEl: true
    },
    "team": {
      selector: ".team-ctn",
      allowMissingEl: true
    },
    "partners": {
      selector: ".partners-ctn",
      allowMissingEl: true
    },
    "footer": ".footer-ctn",
  },

  ui: {
    "domain": "#domain",
    "create": "#create-dashboard",
    "createProject": "#create-project",
    "gotoTools": "#goto-tools",
    "dashboardList": "#dashboard-list",
    "errorHolder": "#new-dashboard-error",

    "dashboards": "#dashboards",
    "projects": "#projects",
    "users": "#users",
    "collections": "#collections",

    "tabs": ".nav-tabs.landing",
    "mobileMenu": ".mobile-menu",
    "tabContent": ".tab-content"
  },

  events: {
    "keyup @ui.domain": "validateDomain",
    "click @ui.domain": "checkLogin",
    "click .login": "checkLogin",
    "click @ui.create": "createDashboard",
    "click @ui.createProject": "createProject",
    "click @ui.gotoTools": "gotoTools",
    "click .up-button": "goTop",
    "click @ui.mobileMenu": "toggleMobileMenu",
    "click .continue": "clickContiune",
    "click .btn-profile": "openProfile"
  },

  templateHelpers: {
    homeCreateProject: function(){
      return window.hackdash.homeCreateProject;
    },
    canCreateDashboard: function(){
      if(window.hackdash.publicDashboardCreation) {
        return true;
      }
      return window.hackdash.userHasPermission(window.hackdash.user, 'dashboard_create');
    }
  },

  lists: {
    projects: null,
    dashboards: null,
    users: null,
    collections: null
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    var def = window.hackdash.defaultHomeTab || "dashboards";
    this.section = (options && options.section) || def;

    this.hdTeam = new Team();
    this.hdTeam.fetch();
  },

  onRender: function(){

    this.changeTab();

    if (!this.ui[this.section].hasClass("active")){
      this.ui[this.section].addClass("active");
    }

    this.locale.show(new LocaleView());

    this.stats.show(new StatsView());

    this.team.show(new TeamView({ collection: this.hdTeam }));
    this.partners.show(new PartnersView());

    this.footer.show(new FooterView());

    var self = this;
    _.defer(function(){
      if (self.ui.mobileMenu.is(':visible')){
        self.ui.tabs.addClass('hidden');
      }
    });
  },

  getNewList: function(type){
    switch(type){
      case "dashboards": return new Dashboards();
      case "projects": return new Projects();
      case "users": return new Users();
      case "collections": return new Collections();
    }
  },

  changeTab: function(){

    if (!this[this.section].currentView){

      this.lists[this.section] =
        this.lists[this.section] || this.getNewList(this.section);


      this[this.section].show(new TabContent({
        collection: this.lists[this.section]
      }));
    }

    // console.log(this.section , this.lists[this.section]);
    this.ui[this.section].tab("show");

    if (this.ui.mobileMenu.is(':visible')){
      this.ui.tabs.addClass('hidden');
    }
  },

  toggleMobileMenu: function(){
    if (this.ui.mobileMenu.is(':visible')){
      if (this.ui.tabs.hasClass('hidden')){
        this.ui.tabs.removeClass('hidden');
      }
      else {
        this.ui.tabs.addClass('hidden');
      }
    }
  },

  clickContiune: function(){
    this.animateScroll(true);
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  setSection: function(section){
    this.section = section;
    this.changeTab();
    this.animateScroll();
  },

  errors: {
    "subdomain_invalid": __("5 to 10 chars, no spaces or special"),
    "subdomain_inuse": __("Sorry, that one is in use. Try another one."),
    "sudomain_create_permission": __("Sorry, you don't have permissions to create a dashboard.")
  },

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  openProfile: function(e){
    e.preventDefault();

    window.location = "/users/profile";
  },

  checkLogin: function(){
    if (window.hackdash.user){
      return true;
    }

    var providers = window.hackdash.providers;
    var useLocalLogin = window.hackdash.useLocalLogin;
    var error = window.hackdash.flashError;
    var msg = window.hackdash.flashMessage;
    var app = window.hackdash.app;

    app.modals.show(new LoginView({
      model: new Backbone.Model({
        providers: providers.split(','),
        localLogin: useLocalLogin,
        flashError: error,
        flashMessage: msg,
       })
    }));
  },

  showRegister: function() {
    if (window.hackdash.user){
      return true;
    }

    var error = window.hackdash.flashError;
    var msg = window.hackdash.flashMessage;
    window.hackdash.app.modals.show(new RegisterView({
      model: new Backbone.Model({
        flashError: error,
        flashMessage: msg,
      })
    }));
  },

  showForgot: function(token) {
    if (window.hackdash.user){
      return true;
    }

    var error = window.hackdash.flashError;
    var msg = window.hackdash.flashMessage;

    window.hackdash.app.modals.show(new ForgotView({
      model: new Backbone.Model({
        flashError: error,
        flashMessage: msg,
        token: token
      })
    }));
  },

  validateDomain: function(){
    if (this.checkLogin()){
      var name = this.ui.domain.val().toLowerCase();
      this.cleanErrors();

      if(/^[a-z0-9]{5,20}$/.test(name)) {
        this.cleanErrors();
      } else {
        this.ui.errorHolder
          .removeClass('hidden')
          .text(this.errors.subdomain_invalid + ' [' + name +']');
      }
    }
  },

  createProject: function(){
    if (this.checkLogin()){
      if(this.ui.dashboardList.hasClass('open')) {
        this.ui.dashboardList.removeClass('open');
        this.ui.createProject
          .html(__('Create project'));
        return;
      }

      this.ui.createProject
        .html(__('Where to?'));

      // Load opened dashboards, without minimun 2 projects restriction
      var self = this;
      self.project_dashboards =
        self.project_dashboards || new Dashboards();

      if(self.project_dashboards.length === 0) {
        self.project_dashboards.fetch().done(function() {
          self.dashboardList.show(new DashboardListView({
            collection: self.project_dashboards.getOpened()
          }));
          self.ui.dashboardList.addClass('open');
        });
      } else {
        self.dashboardList.show(new DashboardListView({
          collection: self.project_dashboards.getOpened()
        }));
        self.ui.dashboardList.addClass('open');
      }

    }
  },

  createDashboard: function(){
    if (this.checkLogin()){
      var domain = this.ui.domain.val().toLowerCase();
      this.cleanErrors();

      this.ui.create.button('loading');

      var dash = new Dashboards([]);

      dash.create({ domain: domain }, {
        success: this.redirectToSubdomain.bind(this, domain),
        error: this.showError.bind(this)
      });
    }
  },

  showError: function(view, err){
    this.ui.create.button('reset');

    if (err.responseText === "OK"){
      this.redirectToSubdomain(this.ui.domain.val());
      return;
    }

    var error = JSON.parse(err.responseText).error;
    this.ui.errorHolder
      .removeClass('hidden')
      .text(this.errors[error]);
  },

  cleanErrors: function(){
    this.ui.errorHolder.addClass('hidden').text('');
  },

  goTop: function(){
    this.footer.currentView.goTop();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  animateScroll: function(animate){
    if (this.section){

      var isMobile = this.ui.mobileMenu.is(':visible');

      var top = this.ui.tabs.offset().top + 60;
      var offset = this.ui.tabs.height();

      if (isMobile){
        top = this.ui.tabContent.offset().top;
        offset = 0;
      }

      var pos = (top - offset >= 0 ? top - offset : 0);

      if (animate){
        $("html, body").animate({ scrollTop: pos }, 1500, 'swing');
        return;
      }

      $(window).scrollTop(pos);
    }
  },

  redirectToSubdomain: function(name){
    window.location = '/dashboards/' + name;
  },

  isEnterKey: function(e){
    var key = e.keyCode || e.which;
    return (key === 13);
  }

});
