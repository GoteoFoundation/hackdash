/*! 
* wotify-hackdash - v0.14.0
* Copyright (c) 2016 Platoniq 
*  
*/ 


(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Embed Application
 *
 */

var EmbedRouter = require('./EmbedRouter');

module.exports = function(){

  var app = module.exports = new Backbone.Marionette.Application();

  app.source = "embed";

  function initRegions(){
    app.addRegions({
      header: "header",
      main: "#main",
      footer: "footer"
    });

    $('body').addClass('embedapp');
  }

  function initRouter(){
    app.router = new EmbedRouter();
    Backbone.history.start({ pushState: true });
  }

  app.addInitializer(initRegions);
  app.addInitializer(initRouter);

  window.hackdash.app = app;
  window.hackdash.app.start();
};
},{"./EmbedRouter":2}],2:[function(require,module,exports){
/*
 * Hackdash Router
 */

var Dashboard = require("./models/Dashboard")
  , Project = require("./models/Project")
  , Projects = require("./models/Projects")

  //, Header = require("./views/Header/Embed")

  , ProjectView = require("./views/Project/Embed")
  , DashboardView = require("./views/Dashboard/Embed")
  ;

module.exports = Backbone.Marionette.AppRouter.extend({

  routes : {

      "embed/dashboards/:dash": "showDashboard"
    , "embed/projects/:pid" : "showProject"

  },

  showDashboard: function(dash) {

    var app = window.hackdash.app;
    app.type = "dashboard";

    app.dashboard = new Dashboard();
    app.projects = new Projects();

    if (dash){
      app.dashboard.set('domain', dash);
      app.projects.domain = dash;
    }

    app.dashboard.fetch().done(function(){
      app.projects.fetch({}, { parse: true })
        .done(function(){
          app.projects.buildShowcase(app.dashboard.get("showcase"));
/*
          app.header.show(new Header({
            model: app.dashboard,
            collection: app.projects
          }));
*/
          app.main.show(new DashboardView({
            model: app.dashboard
          }));

        });
    });

  },

  showProject: function(pid){

    var app = window.hackdash.app;
    app.type = "project";

    app.project = new Project({ _id: pid });

    app.project.fetch().done(function(){
      app.main.show(new ProjectView({
        model: app.project
      }));
    });
  },

});

},{"./models/Dashboard":9,"./models/Project":10,"./models/Projects":11,"./views/Dashboard/Embed":15,"./views/Project/Embed":23}],3:[function(require,module,exports){

module.exports = function(){

  window.hackdash = window.hackdash || {};

  window.hackdash.getQueryVariable = function(variable){
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
      var pair = vars[i].split("=");
      if(pair[0] === variable){return decodeURI(pair[1]);}
    }
    return(false);
  };

  if ($.fn.editable){
    // Set global mode for InlineEditor (X-Editable)
    $.fn.editable.defaults.mode = 'inline';
  }

  // Init Helpers
  require('./helpers/handlebars');
  require('./helpers/backboneOverrides');

  Placeholders.init({ live: true, hideOnFocus: true });

  Dropzone.autoDiscover = false;

  window.hackdash.apiURL = "/api/v2";
  window._gaq = window._gaq || [];

  if (window.hackdash.fbAppId){
    $.getScript('//connect.facebook.net/en_US/sdk.js', function(){
      window.FB.init({
        appId: window.hackdash.fbAppId,
        version: 'v2.3'
      });
    });
  }

};

},{"./helpers/backboneOverrides":4,"./helpers/handlebars":5}],4:[function(require,module,exports){
/*
 * Backbone Global Overrides
 *
 */

// Override Backbone.sync to use the PUT HTTP method for PATCH requests
//  when doing Model#save({...}, { patch: true });

var originalSync = Backbone.sync;

Backbone.sync = function(method, model, options) {
  if (method === 'patch') {
    options.type = 'PUT';
  }

  return originalSync(method, model, options);
};

},{}],5:[function(require,module,exports){
/**
 * HELPER: Handlebars Template Helpers
 *
 */

var Handlebars = require("hbsfy/runtime");

Handlebars.registerHelper('embedCode', function() {
  var embedUrl = window.location.protocol + "//" + window.location.host;
  var template = _.template('<iframe src="<%= embedUrl %>" width="100%" height="500" frameborder="0" allowtransparency="true" title="' + hackdash.title + '"></iframe>');

  return template({
    embedUrl: embedUrl
  });
});

Handlebars.registerHelper('statusesText', function(status) {
  var text = _.findWhere(hackdash.statuses, {'status' : status});

  return text && text.text ? text.text : status;
});

Handlebars.registerHelper('firstUpper', function(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
});

Handlebars.registerHelper('firstLetter', function(text) {
  if (text){
    return text.charAt(0);
  }
  return "";
});

Handlebars.registerHelper('markdown', function(md) {
  if (md){
    return markdown.toHTML(md);
  }
  return "";
});

Handlebars.registerHelper('formatLocation', function(loc) {
  var t = '';
  if(!loc) {
    return t;
  }
  if(loc.city) {
    t += loc.city;
  }
  if(loc.region) {
    if(t) {
      t += ', ';
    }
    t += loc.region;
  }
  if(loc.country) {
    if(t) {
      t += ', ';
    }
    t += loc.country;
  }
  return t;
});

Handlebars.registerHelper('disqus_shortname', function() {
  return window.hackdash.disqus_shortname;
});

Handlebars.registerHelper('user', function(prop) {
  if (window.hackdash.user){
    return window.hackdash.user[prop];
  }
});

Handlebars.registerHelper('isLoggedIn', function(options) {
  if (window.hackdash.user){
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

Handlebars.registerHelper('isDashboardView', function(options) {
  if (window.hackdash.app.type === "dashboard"){
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

Handlebars.registerHelper('isLandingView', function(options) {
  if (window.hackdash.app.type === "landing"){
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

Handlebars.registerHelper('isEmbed', function(options) {
  if (window.hackdash.app.source === "embed"){
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

Handlebars.registerHelper('selected', function(foo, bar) {
  return foo === bar ? ' selected' : '';
});

Handlebars.registerHelper('timeAgo', function(date) {
  if (date && moment(date).isValid()) {
    return moment(date).fromNow();
  }

  return "-";
});

Handlebars.registerHelper('formatDate', function(date) {
  if (date && moment(date).isValid()) {
    return moment(date).format("DD/MM/YYYY HH:mm");
  }

  return "-";
});

Handlebars.registerHelper('formatDateLocal', function(date) {
  if (date && moment(date).isValid()) {
    return moment(date).format("DD/MM/YYYY");
  }

  return "";
});

Handlebars.registerHelper('formatDateText', function(date) {
  if (date && moment(date).isValid()) {
    return moment(date).format("DD MMM YYYY, HH:mm");
  }

  return "";
});

Handlebars.registerHelper('formatDateTime', function(date) {
  if (date && moment(date).isValid()) {
    return moment(date).format("HH:mm");
  }

  return "";
});

Handlebars.registerHelper('timeFromSeconds', function(seconds) {

  function format(val){
    return (val < 10) ? "0" + val : val;
  }

  if (seconds && seconds > 0){

    var t = moment.duration(seconds * 1000),
      h = format(t.hours()),
      m = format(t.minutes()),
      s = format(t.seconds());

    return h + ":" + m + ":" + s;
  }

  return "-";
});

Handlebars.registerHelper('getProfileImage', function(user) {

  if (!user){
    return '';
  }

  var img = new window.Image();

  $(img)
    .load(function () { })
    .error(function () {
      $('.' + this.id).attr('src', '//avatars.io/' + user.provider + '/' + user.username);
    })
    .prop({
      id: 'pic-' + user._id,
      src: user.picture,
      'data-id': user._id,
      title: user.name,
      class: 'avatar tooltips pic-' + user._id,
      rel: 'tooltip'
    });

  return new Handlebars.SafeString(img.outerHTML);
});

function getProfileImageHex(user) {

  if (!user){
    return '';
  }

  var img = new window.Image();

  $(img)
    .load(function () { })
    .error(function () {
      $('.' + this.id)
        .css('background-image', 'url(//avatars.io/' + user.provider + '/' + user.username + ')');
    })
    .prop({
      src: user.picture,
      id: 'pic-' + user._id
    });

  var div = $('<div>')
    .prop({
      'data-id': user._id,
      title: user.name,
      class: 'avatar tooltips pic-' + user._id,
      rel: 'tooltip'
    })
    .css('background-image', 'url(' + user.picture + ')')
    .addClass('hexagon');

  div.append('<div class="hex-top"></div><div class="hex-bottom"></div>');

  return new Handlebars.SafeString(div[0].outerHTML);
}

Handlebars.registerHelper('getProfileImageHex', getProfileImageHex);

Handlebars.registerHelper('getMyProfileImageHex', function() {
  return getProfileImageHex(window.hackdash.user);
});

Handlebars.registerHelper('each_upto', function(ary, max, options) {
    if(!ary || ary.length === 0) {
      return options.inverse(this);
    }

    var result = [];
    for(var i = 0; i < max && i < ary.length; ++i) {
      result.push(options.fn(ary[i]));
    }

    return result.join('');
});

Handlebars.registerHelper('each_upto_rnd', function(ary, max, options) {
    if(!ary || ary.length === 0) {
      return options.inverse(this);
    }

    var picks = [];
    function pick(max){
      var rnd = Math.floor(Math.random() * max);
      if (picks.indexOf(rnd) === -1) {
        picks.push(rnd);
        return rnd;
      }
      return pick(max);
    }

    var result = [];
    for(var i = 0; i < max && i < ary.length; ++i) {
      result.push( options.fn(ary[pick(ary.length)]) );
    }

    return result.join('');
});


},{"hbsfy/runtime":45}],6:[function(require,module,exports){
jQuery(function() {
  require('./Initializer')();
  window.hackdash.startApp = require('./EmbedApp');
});
},{"./EmbedApp":1,"./Initializer":3}],7:[function(require,module,exports){
/**
 * Collection: Administrators of a Dashboard
 *
 */

var
  Users = require('./Users'),
  User = require('./User');

module.exports = Users.extend({

  model: User,
  idAttribute: "_id",

  url: function(){
    return hackdash.apiURL + '/' + this.domain + '/admins';
  },

  addAdmin: function(userId){
    $.ajax({
      url: this.url() + '/' + userId,
      type: "POST",
      context: this
    }).done(function(user){
      this.add(user);
    });
  },

});


},{"./User":12,"./Users":13}],8:[function(require,module,exports){

module.exports = Backbone.Collection.extend({

  // when called FETCH triggers 'fetch' event.
  // That way can be set loading state on components.

  fetch: function(options) {
    this.trigger('fetch', this, options);
    return Backbone.Collection.prototype.fetch.call(this, options);
  }

});
},{}],9:[function(require,module,exports){
/**
 * MODEL: dashboard
 *
 */

var Admins = require("./Admins");

module.exports = Backbone.Model.extend({

  defaults: {
    admins: null
  },

  urlRoot: function(){
    if (this.get('domain')){
      return hackdash.apiURL + '/dashboards';
    }
    else {
      throw new Error('Unknown Dashboard domain name');
    }
  },

  idAttribute: "domain",

  initialize: function(){
    this.set("admins", new Admins());
    this.on('change:domain', this.setAdminDomains.bind(this));
    this.setAdminDomains();
  },

  setAdminDomains: function(){
    var admins = this.get("admins");
    admins.domain = this.get('domain');
    this.set("admins", admins);
  },

  isAdmin: function(){
    var user = hackdash.user;
    return user && user.admin_in.indexOf(this.get('domain')) >= 0 || false;
  },

  isOwner: function(){
    var user = hackdash.user;
    var owner = this.get('owner');
    owner = (owner && owner._id) || owner;

    return (user && user._id === owner) || false;
  },

  getStatuses: function() {
    var inactive = this.get('inactiveStatuses') || [];
    return _.map(hackdash.statuses, function(s) {
      if(inactive.indexOf(s.status) !== -1) {
        s.active = false;
      }
      return s;
    });
  }

}, {

  isAdmin: function(dashboard){
    var user = hackdash.user;
    return user && user.admin_in.indexOf(dashboard.get('domain')) >= 0 || false;
  },

  isOwner: function(dashboard){
    var user = hackdash.user;
    var owner = dashboard.get('owner');
    owner = (owner && owner._id) || owner;

    return (user && user._id === owner) || false;
  }

});


},{"./Admins":7}],10:[function(require,module,exports){
/**
 * MODEL: Project
 *
 */

module.exports = Backbone.Model.extend({

  idAttribute: "_id",

  defaults: {
    active: true
  },

  urlRoot: function(){
    return hackdash.apiURL + '/projects';
  },

  doAction: function(type, res, done){
    $.ajax({
      url: this.url() + '/' + res,
      type: type,
      context: this
    }).done(done);
  },

  updateList: function(type, add){
    var list = this.get(type);
    if (!hackdash.user){
      return;
    }

    var uid = hackdash.user._id;

    function exists(){
      return _.find(list, function(usr){
        return (usr._id === uid);
      }) ? true : false;
    }

    if (add && !exists()){
      list.push(hackdash.user);
    }
    else if (!add && exists()){
      var idx = 0;
      _.each(list, function(usr, i){
        if (usr._id === uid) {
          idx = i;
        }
      });

      list.splice(idx, 1);
    }

    this.set(type, list);
    this.trigger("change");
  },

  join: function(){
    this.doAction("POST", "contributors", function(){
      this.updateList("contributors", true);
      window._gaq.push(['_trackEvent', 'Project', 'Join']);
    });
  },

  leave: function(){
    this.doAction("DELETE", "contributors", function(){
      this.updateList("contributors", false);
      window._gaq.push(['_trackEvent', 'Project', 'Leave']);
    });
  },

  follow: function(){
    this.doAction("POST", "followers", function(){
      this.updateList("followers", true);
      window._gaq.push(['_trackEvent', 'Project', 'Follow']);
    });
  },

  unfollow: function(){
    this.doAction("DELETE", "followers", function(){
      this.updateList("followers", false);
      window._gaq.push(['_trackEvent', 'Project', 'Unfollow']);
    });
  },

  toggleContribute: function(){
    if (this.isContributor()){
      return this.leave();
    }

    this.join();
  },

  toggleFollow: function(){
    if (this.isFollower()){
      return this.unfollow();
    }

    this.follow();
  },

  isContributor: function(){
    return this.userExist(this.get("contributors"));
  },

  isFollower: function(){
    return this.userExist(this.get("followers"));
  },

  userExist: function(arr){

    if (!hackdash.user){
      return false;
    }

    var uid = hackdash.user._id;
    return arr && _.find(arr, function(usr){
      return (usr._id === uid);
    }) ? true : false;
  },

});


},{}],11:[function(require,module,exports){
/**
 * Collection: Projects
 *
 */

var
  Project = require('./Project'),
  BaseCollection = require('./BaseCollection');

var Projects = module.exports = BaseCollection.extend({

  model: Project,

  idAttribute: "_id",

  comparators: {
    title: function(a){ return a.get('title'); },
    created_at: function(a){ return -a.get('created_at'); },
    showcase: function(a){ return a.get('showcase'); }
  },

  url: function(){
    if (this.domain){
      return hackdash.apiURL + '/' + this.domain + '/projects';
    }
    return hackdash.apiURL + '/projects';
  },

  parse: function(response){

    this.allItems = response;

    if (hackdash.app.type !== "dashboard"){
      //it is not a dashboard so all projects active
      return response;
    }

    var dashboard = hackdash.app.dashboard;

    var showcase = (dashboard && dashboard.get("showcase")) || [];
    if (showcase.length === 0){
      //no showcase defined: all projects are active
      return response;
    }

    // set active property of a project from showcase mode
    // (only projects at showcase array are active ones)
    _.each(response, function(project){

      if (showcase.indexOf(project._id) >= 0){
        project.active = true;
      }
      else {
        project.active = false;
      }

    });

    return response;
  },

  runSort: function(key){
    this.comparator = this.comparators[key];
    this.sort().trigger('reset');
  },

  buildShowcase: function(showcase){
    _.each(showcase, function(id, i){
      var found = this.where({ _id: id, active: true });
      if (found.length > 0){
        found[0].set("showcase", i);
      }
    }, this);

    this.trigger("reset");
  },

  getActives: function(){
    return new Projects(
      this.filter(function(project){
        return project.get("active");
      })
    );
  },

  getInactives: function(){
    return new Projects(
      this.filter(function(project){
        return !project.get("active");
      })
    );
  },

  search: function(keywords){

    if (keywords.length === 0){
      this.reset(this.allItems);
      return;
    }

    keywords = keywords.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");

    var regex = new RegExp(keywords, 'i');
    var items = [];

    _.each(this.allItems, function(project){
      if (
        regex.test(project.title) ||
        regex.test(project.description) ||
        regex.test(project.whatif) ||
        regex.test(project.tags.join(' '))
        ) {

          return items.push(project);
      }
    });

    this.reset(items);
  },

  getStatusCount: function(){
    var statuses = _.pluck(window.hackdash.statuses, 'status');
    var statusCount = {};

    _.each(statuses, function(status){
      statusCount[status] = this.where({ status: status }).length;
    }, this);

    return statusCount;
  }

});

},{"./BaseCollection":8,"./Project":10}],12:[function(require,module,exports){
/**
 * MODEL: User
 *
 */

module.exports = Backbone.Model.extend({

  idAttribute: "_id",

});

},{}],13:[function(require,module,exports){
/**
 * Collection: Users
 *
 */

var
  User = require('./User'),
  BaseCollection = require('./BaseCollection');

module.exports = BaseCollection.extend({

  model: User,

  idAttribute: "_id",

  url: function(){
    return hackdash.apiURL + '/users';
  },

});


},{"./BaseCollection":8,"./User":12}],14:[function(require,module,exports){
/**
 * VIEW: DashboardHeader Layout
 *
 */

var
    template = require('./templates/dashboard.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  ui: {
    "title": "#dashboard-title",
    "description": "#dashboard-description",
    "link": "#dashboard-link"
  },

  events: {
    "click .logo": "stopPropagation"
  },

  templateHelpers: {
    hackdashURL: function(){
      return "//" + hackdash.baseURL;
    },
    isAdmin: function(){
      var user = hackdash.user;
      return user && user.admin_in.indexOf(this.domain) >= 0 || false;
    }
  },

  modelEvents: {
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    var user = hackdash.user;

    if (user){
      var isAdmin = user.admin_in.indexOf(this.model.get("domain")) >= 0;

      if (isAdmin){
        this.initEditables();
      }
    }

    $('.tooltips', this.$el).tooltip({});
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  stopPropagation: function(e){
    e.stopPropagation();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  placeholders: {
    title: "Hackathon Title",
    description: "brief description of this hackathon",
    link: "url to hackathon site"
  },

  initEditables: function(){
    this.initEditable("title", '<input type="text" maxlength="30">');
    this.initEditable("description", '<textarea maxlength="250"></textarea>', 'textarea');
    this.initEditable("link");
  },

  initEditable: function(type, template, control){
    var ph = this.placeholders;
    var self = this;

    if (this.ui[type].length > 0){

      this.ui[type].editable({
        type: control || 'text',
        title: ph[type],
        emptytext: ph[type],
        placeholder: ph[type],
        tpl: template,
        success: function(response, newValue) {
          self.model.set(type, newValue);
          self.model.save();
        }
      });
    }
  },

});
},{"./templates/dashboard.hbs":16}],15:[function(require,module,exports){
/**
 * VIEW: Dashboard Projects Layout
 *
 */

var template = require('./templates/index.hbs')
  , DashboardView = require('./Dashboard')
  , ProjectsView = require('../Project/Collection')

// Slider View Mode
  , ProjectItemView = require('../Project/Card')
  , EntityList = require("../Home/EntityList")
  , ProjectListSlider = EntityList.extend({ childView: ProjectItemView });

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "page-ctn dashboard",
  template: template,

  regions: {
    "dashboard": ".dash-details",
    "projects": "#dashboard-projects",
  },

  templateHelpers: {
    hackdashURL: function(){
      return "//" + hackdash.baseURL;
    }
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(){
    this.settings = this.getSettings();
  },

  onRender: function(){
    var self = this;

    var sort = hackdash.getQueryVariable('sort');
    var query = hackdash.getQueryVariable('query');
    var status = hackdash.getQueryVariable('status');
    var slider = hackdash.getQueryVariable('slider');

    if (query){
      hackdash.app.projects.search(query);
    }

    if (status){
      hackdash.app.projects.reset(
        hackdash.app.projects.where({ status: status })
      );
    }

    var dashboardView = new DashboardView({
      model: this.model
    });

    var projectsView;

    if (slider){
      this.$el.addClass('slider');

      if (sort){
        var s = '';

        switch(sort){
          case 'name': s = 'title'; break;
          case 'date': s = 'created_at'; break;
          case 'showcase': s = 'showcase'; break;
          default: s = 'created_at'; break;
        }

        if (s === 'showcase'){
          hackdash.app.projects = hackdash.app.projects.getActives();
        }

        hackdash.app.projects.runSort(s);
      }

      projectsView = new ProjectListSlider({
        model: this.model,
        collection: hackdash.app.projects,
        slides: parseInt(slider, 10)
      });
    }
    else {
      projectsView = new ProjectsView({
        model: this.model,
        collection: hackdash.app.projects,
        showcaseMode: false,
        showcaseSort: false
      });

      projectsView.on('ended:render', function(){
        if (sort){
          hackdash.app.projects.trigger("sort:" + sort);
        }
      });
    }

    dashboardView.on('show', function(){
      var ctn = self.dashboard.$el;

      if (!self.settings.title){
        $('h1', ctn).remove();
      }
      if (!self.settings.desc){
        $('p', ctn).remove();
      }
      if (!self.settings.logo){
        $('.logo', ctn).remove();
      }

      if (!self.settings.title && !self.settings.desc){
        $('.header', self.$el).addClass('hidden');
        $('.body .container', self.$el).css('margin-top', 0);
      }
    });

    projectsView.on('show', function(){
      var ctn = self.projects.$el;

      if (!self.settings.pprg){
        $('.progress', ctn).remove();
      }
      if (!self.settings.ptitle){
        $('.details h2', ctn).remove();
      }
      if (!self.settings.pcontrib){
        $('.contributors', ctn).remove();
      }
      if (!self.settings.pacnbar){
        $('.action-bar', ctn).remove();
      }
    });

    this.dashboard.show(dashboardView);
    this.projects.show(projectsView);

    _.defer(function(){
      $('.dash-admins, .dash-buttons, .inactive-ctn').remove();
    });
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  getSettings: function(){
    var settings = ['title', 'desc', 'logo', 'pprg', 'ptitle', 'pcontrib','pacnbar'];
    var hide = hackdash.getQueryVariable('hide');
    hide = (hide && hide.split(',')) || [];

    hide = _.difference(settings, hide);
    var values = _.range(hide.length).map(function () { return 1; });

    return _.object(hide, values);
  }


});
},{"../Home/EntityList":18,"../Project/Card":21,"../Project/Collection":22,"./Dashboard":14,"./templates/index.hbs":17}],16:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "\n  <h1>\n    <a id=\"dashboard-title\">"
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "</a>\n  </h1>\n\n  <p>\n    <a id=\"dashboard-description\">"
    + alias4(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"description","hash":{},"data":data}) : helper)))
    + "</a>\n  </p>\n\n  <p>\n    <a id=\"dashboard-link\">"
    + alias4(((helper = (helper = helpers.link || (depth0 != null ? depth0.link : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"link","hash":{},"data":data}) : helper)))
    + "</a>\n  </p>\n\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : {};

  return "\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.title : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.description : depth0),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n";
},"4":function(container,depth0,helpers,partials,data) {
    var stack1, helper, options, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", buffer = 
  "  <h1>\n";
  stack1 = ((helper = (helper = helpers.isEmbed || (depth0 != null ? depth0.isEmbed : depth0)) != null ? helper : alias2),(options={"name":"isEmbed","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"data":data}),(typeof helper === alias3 ? helper.call(alias1,options) : helper));
  if (!helpers.isEmbed) { stack1 = helpers.blockHelperMissing.call(depth0,stack1,options)}
  if (stack1 != null) { buffer += stack1; }
  return buffer + "    "
    + container.escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "\n  </h1>\n";
},"5":function(container,depth0,helpers,partials,data) {
    var helper;

  return "    <a class=\"logo\" href=\""
    + container.escapeExpression(((helper = (helper = helpers.hackdashURL || (depth0 != null ? depth0.hackdashURL : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"hackdashURL","hash":{},"data":data}) : helper)))
    + "\" target=\"_blank\"></a>\n";
},"7":function(container,depth0,helpers,partials,data) {
    var helper;

  return "  <p>"
    + container.escapeExpression(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"description","hash":{},"data":data}) : helper)))
    + "</p>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.isAdmin : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data})) != null ? stack1 : "");
},"useData":true});

},{"hbsfy/runtime":45}],17:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var helper;

  return "    <a class=\"dash-details\" href=\"/dashboards/"
    + container.escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"domain","hash":{},"data":data}) : helper)))
    + "\" target=\"_blank\"></a>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "    <div class=\"dash-details\"></div>\n";
},"5":function(container,depth0,helpers,partials,data) {
    var helper;

  return "        <a class=\"link tooltips\" href=\""
    + container.escapeExpression(((helper = (helper = helpers.link || (depth0 != null ? depth0.link : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"link","hash":{},"data":data}) : helper)))
    + "\" target=\"_blank\"\n        data-bypass data-original-title=\"Open events website\">\n          <i class=\"fa fa-link\"></i>\n        </a>\n";
},"7":function(container,depth0,helpers,partials,data) {
    var stack1, helper, options, buffer = 
  "    <div class=\"dash-create visible-xs\">\n      <h3 class=\"create-project\">\n        <i class=\"fa fa-plus\"></i>\n";
  stack1 = ((helper = (helper = helpers.isLoggedIn || (depth0 != null ? depth0.isLoggedIn : depth0)) != null ? helper : helpers.helperMissing),(options={"name":"isLoggedIn","hash":{},"fn":container.program(8, data, 0),"inverse":container.program(10, data, 0),"data":data}),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},options) : helper));
  if (!helpers.isLoggedIn) { stack1 = helpers.blockHelperMissing.call(depth0,stack1,options)}
  if (stack1 != null) { buffer += stack1; }
  return buffer + "      </h3>\n    </div>\n";
},"8":function(container,depth0,helpers,partials,data) {
    var helper;

  return "        <a href=\"/dashboards/"
    + container.escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"domain","hash":{},"data":data}) : helper)))
    + "/create\">Create Project</a>\n";
},"10":function(container,depth0,helpers,partials,data) {
    return "        <a class=\"login\">Create Project</a>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, options, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=helpers.blockHelperMissing, buffer = 
  "\n<div class=\"header\">\n  <div class=\"container\">\n\n";
  stack1 = ((helper = (helper = helpers.isEmbed || (depth0 != null ? depth0.isEmbed : depth0)) != null ? helper : alias2),(options={"name":"isEmbed","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data}),(typeof helper === alias3 ? helper.call(alias1,options) : helper));
  if (!helpers.isEmbed) { stack1 = alias4.call(depth0,stack1,options)}
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n    <div class=\"dash-admins\"></div>\n\n    <div class=\"dash-buttons\">\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.link : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "      <a class=\"share tooltips\" data-original-title=\"Share this Event board\">\n        <i class=\"fa fa-share-alt\"></i>\n      </a>\n    </div>\n\n";
  stack1 = ((helper = (helper = helpers.isDashOpen || (depth0 != null ? depth0.isDashOpen : depth0)) != null ? helper : alias2),(options={"name":"isDashOpen","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"data":data}),(typeof helper === alias3 ? helper.call(alias1,options) : helper));
  if (!helpers.isDashOpen) { stack1 = alias4.call(depth0,stack1,options)}
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\n  </div>\n</div>\n\n<div class=\"body\">\n\n  <div class=\"container\">\n\n    <div id=\"dashboard-projects\"></div>\n    <div id=\"inactive-projects\" class=\"hide inactive-ctn\"></div>\n\n  </div>\n\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":45}],18:[function(require,module,exports){
/**
 * VIEW: A collection of Items for a Home Search
 *
 */

var Item = require('./Item');

module.exports = Backbone.Marionette.CollectionView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: 'entities',
  childView: Item,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    // option for fixed slides & not responsive (embeds)
    this.slides = options && options.slides;
  },

  onBeforeRender: function(){
    if (this.initialized && !this.$el.is(':empty')){
      this.destroySlick();
      this.$el.empty();
    }
  },

  onRender: function(){
    var self = this;
    _.defer(function(){
      self.updateGrid();
    });
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  initialized: false,
  destroyed: false,

  destroySlick: function(){
    this.$el.slick('unslick');

    var slick = this.$el.slick('getSlick');
    slick.$list.remove();
    slick.destroy();

    this.destroyed = true;
  },

  updateGrid: function(){
    if (this.initialized && !this.destroyed){
      this.destroySlick();
    }

    if (this.$el.is(':empty')){
      this.initialized = false;
      return;
    }

    var cols = this.slides;
    var responsive = [];

    if (!this.slides) {
      // is home page

      cols = 5;

      responsive = [1450, 1200, 1024, 750, 430].map(function(value){
        var cmode = false;
        if (value <= 430 ){
          cmode = true;
        }

        return {
          breakpoint: value,
          settings: {
            centerMode: cmode,
            slidesToShow: cols,
            slidesToScroll: cols--
          }
        };
      });

      cols = 6;
    }
    // else is embeds

    this.$el.slick({
      centerMode: false,
      dots: false,
      autoplay: false,
      infinite: false,
      adaptiveHeight: true,
      speed: 300,
      slidesToShow: cols,
      slidesToScroll: cols,
      responsive: responsive
    });

    this.$el
      .off('setPosition')
      .on('setPosition', this.replaceIcons.bind(this));

    this.replaceIcons();

    this.initialized = true;
    this.destroyed = false;
  },

  replaceIcons: function(){
    $('.slick-prev', this.$el).html('<i class="fa fa-chevron-left"></i>');
    $('.slick-next', this.$el).html('<i class="fa fa-chevron-right"></i>');
  }

});

},{"./Item":19}],19:[function(require,module,exports){
/**
 * VIEW: An Item of HOME Search
 *
 */

var template = require('./templates/item.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  id: function(){ return this.model.get("_id"); },
  tagName: 'a',
  template: template,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  // Overrided method by an Entity
  getURL: function(){ return false; },
  afterRender: function(){ },

  onRender: function(){

    var url = this.getURL();

    if (url !== false){
      this.$el.attr({ 'href': url });
    }

    if (hackdash.app.type === 'landing'){
      this.$el.attr({ 'data-bypass': true });
      $('.tooltips', this.$el).tooltip({ container: '.tab-content' });
    }
    else {
      $('.tooltips', this.$el).tooltip({ container: '.container' });
    }

    this.afterRender();
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"./templates/item.hbs":20}],20:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper;

  return "<div>"
    + container.escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"_id","hash":{},"data":data}) : helper)))
    + "</div>";
},"useData":true});

},{"hbsfy/runtime":45}],21:[function(require,module,exports){
/**
 * VIEW: An Project of HOME Search
 *
 */

var template = require('./templates/card.hbs');
var ItemView = require('../Home/Item.js');

module.exports = ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: 'entity project',
  template: template,

  ui: {
    "switcher": ".switcher input",
    "contribute": ".contribute",
    "follow": ".follow"
  },

  events: {
    "click @ui.contribute": "onContribute",
    "click @ui.follow": "onFollow",
    "click .contributors a": "stopPropagation",
    "click .demo-link": "stopPropagation"
  },

  modelEvents: {
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  getURL: function(){

    if (this.isShowcaseMode()){
      return false;
    }

    return "/projects/" + this.model.get("_id");
  },

  afterRender: function(){
    this.$el.attr({
        "data-id": this.model.get("_id")
      , "data-name": this.model.get("title")
      , "data-date": this.model.get("created_at")
      , "data-showcase": this.model.get("showcase")
    });

    if (this.model.get("active")){
      this.$el.addClass('filter-active');
    }
    else {
      this.$el.removeClass('filter-active');
    }

    this.initSwitcher();

    if (hackdash.app.source === "embed"){
      this.$el.attr('target', '_blank');
    }
  },

  serializeData: function(){
    var me = (hackdash.user && hackdash.user._id) || '';
    var isOwner = (this.model.get('leader')._id === me ? true : false);
    var isEmbed = (window.hackdash.app.source === "embed" ? true : false);
    var contribs = this.model.get('contributors');

    var noActions = false;

    if (!isEmbed && isOwner && !this.model.get('link')){
      noActions = true;
    }

    return _.extend({
      noActions: noActions,
      isShowcaseMode: this.isShowcaseMode(),
      contributing: this.model.isContributor(),
      following: this.model.isFollower(),
      isOwner: isOwner,
      contributorsMore: contribs.length > 5 ? contribs.length-4 : 0 
    }, this.model.toJSON());
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  stopPropagation: function(e){
    e.stopPropagation();
  },

  onContribute: function(e){
    e.stopPropagation();

    if (hackdash.app.source === "embed"){
      return;
    }

    e.preventDefault();

    if (!window.hackdash.user){
      hackdash.app.showLogin();
      return;
    }

    this.ui.contribute.button('loading');
    this.model.toggleContribute();
  },

  onFollow: function(e){
    e.stopPropagation();

    if (hackdash.app.source === "embed"){
      return;
    }

    e.preventDefault();

    if (!window.hackdash.user){
      hackdash.app.showLogin();
      return;
    }

    this.ui.follow.button('loading');
    this.model.toggleFollow();
  },

  initSwitcher: function(){
    var self = this;

    if (this.ui.switcher.length > 0){
      this.ui.switcher
        .bootstrapSwitch({
          size: 'mini',
          onColor: 'success',
          offColor: 'danger',
          onSwitchChange: function(event, state){
            self.model.set("active", state);
          }
        });
    }
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  isShowcaseMode: function(){
    return hackdash.app.dashboard && hackdash.app.dashboard.isShowcaseMode;
  }

});

},{"../Home/Item.js":19,"./templates/card.hbs":24}],22:[function(require,module,exports){
/**
 * VIEW: Projects of an Instance
 *
 */

var Project = require('./Card');

module.exports = Backbone.Marionette.CollectionView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "entities",
  childView: Project,

  collectionEvents: {
    "remove": "render",
    "sort:date": "sortByDate",
    "sort:name": "sortByName",
    "sort:showcase": "sortByShowcase"
  },

  gutter: 5,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    this.showcaseMode = (options && options.showcaseMode) || false;
    this.showcaseSort = (options && options.showcaseSort) || false;
  },

  onRender: function(){
    _.defer(this.onEndRender.bind(this));
  },

  onEndRender: function(){
    this.updateGrid();
    this.refresh();
    this.trigger('ended:render');
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  updateShowcaseOrder: function(){
    var showcase = [];

    $('.entity', this.$el).sort(function (a, b) {

      var av = ( isNaN(+a.dataset.showcase) ? +a.dataset.delay : +a.dataset.showcase +1);
      var bv = ( isNaN(+b.dataset.showcase) ? +b.dataset.delay : +b.dataset.showcase +1);

      return av - bv;
    }).each(function(i, e){
      showcase.push(e.dataset.id);
    });

    return showcase;
  },

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  sortByName: function(){
    if (!this.wall){
      this.updateGrid();
    }

    this.wall.sortBy(function(a, b) {
      var at = $(a).attr('data-name').toLowerCase()
        , bt = $(b).attr('data-name').toLowerCase();

      if(at < bt) { return -1; }
      if(at > bt) { return 1; }
      return 0;

    }).filter('*');

    this.fixSize();

  },

  sortByDate: function(){
    if (!this.wall){
      this.updateGrid();
    }

    this.wall.sortBy(function(a, b) {
      var at = new Date($(a).attr('data-date'))
        , bt = new Date($(b).attr('data-date'));

      if(at > bt) { return -1; }
      if(at < bt) { return 1; }
      return 0;

    }).filter('*');

    this.fixSize();
  },

  sortByShowcase: function(){
    if (!this.wall){
      this.updateGrid();
    }

    this.wall.sortBy(function(a, b) {
      return $(a).attr('data-showcase') - $(b).attr('data-showcase');
    }).filter('.filter-active');

    this.fixSize();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  updateGrid: function(){
    var self = this;

    if (!this.wall){
      this.wall = new window.freewall(this.$el);
    }

    this.wall.reset({
      draggable: this.showcaseMode,
      animate: true,
      keepOrder: false,
      selector: '.entity',
      cellW: 200,
      cellH: 200,
      gutterY: this.gutter,
      gutterX: this.gutter,
      onResize: this.refresh.bind(this),
      onComplete: function() { },
      onBlockDrop: function() {

        var cols = self.$el.attr('data-total-col');
        var pos = $(this).attr('data-position');
        var ps = pos.split('-');

        var row = parseInt(ps[0],10);
        var showcase = ((row*cols) + parseInt(ps[1],10));

        $(this).attr('data-showcase', showcase+1);
        self.model.isDirty = true;
      }
    });

    if (this.showcaseMode){
      this.$el.addClass("showcase");
      this.sortByShowcase();
      return;
    }

    this.sortByDate();

  },

  refresh: function(){
    this.wall.fitWidth();
    this.wall.refresh();
    this.fixSize();
  },

  fixSize: function(){
    this.$el.height(this.$el.height() + this.gutter*4);
  },

});
},{"./Card":21}],23:[function(require,module,exports){
/**
 * VIEW: An Embed Project
 *
 */

var template = require('./templates/embed.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  id: function(){ return this.model.get("_id"); },

  tagName: 'a',
  className: 'entity project embed-project',
  template: template,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    var url = "/projects/" + this.model.get("_id");
    this.$el.attr({
      'target': '_blank',
      'href': url
    });

    $('.tooltips', this.$el).tooltip({
      container: 'body',
      placement: 'top'
    });
  },

  serializeData: function(){
    return _.extend({
      settings: this.getSettings()
    }, this.model.toJSON());
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  getSettings: function(){
    var settings = ['prg', 'pic', 'title', 'desc', 'contrib','acnbar'];
    var hide = hackdash.getQueryVariable('hide');
    hide = (hide && hide.split(',')) || [];

    hide = _.difference(settings, hide);
    var values = _.range(hide.length).map(function () { return 1; });

    return _.object(hide, values);
  }

});
},{"./templates/embed.hbs":25}],24:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var helper;

  return "  <div class=\"item-cover\" style=\"background-image: url("
    + container.escapeExpression(((helper = (helper = helpers.cover || (depth0 != null ? depth0.cover : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"cover","hash":{},"data":data}) : helper)))
    + ");\"></div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "  <i class=\"item-letter\">"
    + container.escapeExpression((helpers.firstLetter || (depth0 && depth0.firstLetter) || helpers.helperMissing).call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.title : depth0),{"name":"firstLetter","hash":{},"data":data}))
    + "</i>\n";
},"5":function(container,depth0,helpers,partials,data) {
    return "target=\"_blank\"";
},"7":function(container,depth0,helpers,partials,data) {
    return "data-bypass";
},"9":function(container,depth0,helpers,partials,data) {
    return "no-actions";
},"11":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, options, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3=container.escapeExpression, alias4="function", buffer = 
  "\n"
    + ((stack1 = (helpers.each_upto || (depth0 && depth0.each_upto) || alias2).call(alias1,(depth0 != null ? depth0.contributors : depth0),4,{"name":"each_upto","hash":{},"fn":container.program(12, data, 0, blockParams, depths),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "    <li class=\"contrib-plus\">\n      <a href=\"/projects/"
    + alias3(container.lambda((depths[1] != null ? depths[1]._id : depths[1]), depth0))
    + "\"\n";
  stack1 = ((helper = (helper = helpers.isEmbed || (depth0 != null ? depth0.isEmbed : depth0)) != null ? helper : alias2),(options={"name":"isEmbed","hash":{},"fn":container.program(13, data, 0, blockParams, depths),"inverse":container.program(15, data, 0, blockParams, depths),"data":data}),(typeof helper === alias4 ? helper.call(alias1,options) : helper));
  if (!helpers.isEmbed) { stack1 = helpers.blockHelperMissing.call(depth0,stack1,options)}
  if (stack1 != null) { buffer += stack1; }
  return buffer + ">\n        "
    + alias3(((helper = (helper = helpers.contributorsMore || (depth0 != null ? depth0.contributorsMore : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"contributorsMore","hash":{},"data":data}) : helper)))
    + "+\n      </a>\n    </li>\n\n";
},"12":function(container,depth0,helpers,partials,data) {
    var stack1, helper, options, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression, buffer = 
  "    <li>\n      <a href=\"/users/"
    + alias4(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\"\n";
  stack1 = ((helper = (helper = helpers.isEmbed || (depth0 != null ? depth0.isEmbed : depth0)) != null ? helper : alias2),(options={"name":"isEmbed","hash":{},"fn":container.program(13, data, 0),"inverse":container.program(15, data, 0),"data":data}),(typeof helper === alias3 ? helper.call(alias1,options) : helper));
  if (!helpers.isEmbed) { stack1 = helpers.blockHelperMissing.call(depth0,stack1,options)}
  if (stack1 != null) { buffer += stack1; }
  return buffer + ">\n        "
    + alias4((helpers.getProfileImage || (depth0 && depth0.getProfileImage) || alias2).call(alias1,depth0,{"name":"getProfileImage","hash":{},"data":data}))
    + "\n      </a>\n    </li>\n";
},"13":function(container,depth0,helpers,partials,data) {
    return "        target=\"_blank\"\n";
},"15":function(container,depth0,helpers,partials,data) {
    var stack1, helper, options, buffer = 
  "        ";
  stack1 = ((helper = (helper = helpers.isLandingView || (depth0 != null ? depth0.isLandingView : depth0)) != null ? helper : helpers.helperMissing),(options={"name":"isLandingView","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"data":data}),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},options) : helper));
  if (!helpers.isLandingView) { stack1 = helpers.blockHelperMissing.call(depth0,stack1,options)}
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\n      ";
},"17":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "\n"
    + ((stack1 = (helpers.each_upto || (depth0 && depth0.each_upto) || helpers.helperMissing).call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.contributors : depth0),5,{"name":"each_upto","hash":{},"fn":container.program(12, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n";
},"19":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression, alias5=container.lambda;

  return "    <a href=\"/projects/"
    + alias4(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\"\n      class=\"tooltips contribute\" target=\"_blank\"\n      data-original-title=\""
    + alias4(alias5(((stack1 = (depth0 != null ? depth0.contributors : depth0)) != null ? stack1.length : stack1), depth0))
    + " contributors\">Join</a>\n    <a href=\"/projects/"
    + alias4(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\"\n      class=\"tooltips follow\" target=\"_blank\"\n      data-original-title=\""
    + alias4(alias5(((stack1 = (depth0 != null ? depth0.followers : depth0)) != null ? stack1.length : stack1), depth0))
    + " followers\">Follow</a>\n";
},"21":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "\n"
    + ((stack1 = helpers.unless.call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.isOwner : depth0),{"name":"unless","hash":{},"fn":container.program(22, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n";
},"22":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : {};

  return ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.contributing : depth0),{"name":"if","hash":{},"fn":container.program(23, data, 0),"inverse":container.program(25, data, 0),"data":data})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.following : depth0),{"name":"if","hash":{},"fn":container.program(27, data, 0),"inverse":container.program(29, data, 0),"data":data})) != null ? stack1 : "");
},"23":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "      <a\n        class=\"tooltips contribute\"\n        data-loading-text=\"leaving...\"\n        data-original-title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? depth0.contributors : depth0)) != null ? stack1.length : stack1), depth0))
    + " contributors\">Leave</a>\n";
},"25":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "      <a\n        class=\"tooltips contribute\"\n        data-loading-text=\"joining...\"\n        data-original-title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? depth0.contributors : depth0)) != null ? stack1.length : stack1), depth0))
    + " contributors\">Join</a>\n";
},"27":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "      <a\n        class=\"tooltips follow\"\n        data-loading-text=\"unfollowing...\"\n        data-original-title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? depth0.followers : depth0)) != null ? stack1.length : stack1), depth0))
    + " followers\">Unfollow</a>\n";
},"29":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "      <a\n        class=\"tooltips follow\"\n        data-loading-text=\"following...\"\n        data-original-title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? depth0.followers : depth0)) != null ? stack1.length : stack1), depth0))
    + " followers\">Follow</a>\n";
},"31":function(container,depth0,helpers,partials,data) {
    var helper;

  return "  <a class=\"demo-link\" href=\""
    + container.escapeExpression(((helper = (helper = helpers.link || (depth0 != null ? depth0.link : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"link","hash":{},"data":data}) : helper)))
    + "\" target=\"_blank\" data-bypass>Demo</a>\n";
},"33":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.isShowcaseMode : depth0),{"name":"if","hash":{},"fn":container.program(34, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "");
},"34":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "\n  <div class=\"switcher tooltips\" data-placement=\"top\" data-original-title=\"Toggle visibility\">\n    <input type=\"checkbox\" "
    + ((stack1 = helpers["if"].call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.active : depth0),{"name":"if","hash":{},"fn":container.program(35, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + " class=\"switch-small\">\n  </div>\n\n";
},"35":function(container,depth0,helpers,partials,data) {
    return "checked";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, options, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3=container.escapeExpression, alias4="function", alias5=helpers.blockHelperMissing, buffer = 
  "\n<div class=\"progress\" title=\""
    + alias3((helpers.statusesText || (depth0 && depth0.statusesText) || alias2).call(alias1,(depth0 != null ? depth0.status : depth0),{"name":"statusesText","hash":{},"data":data}))
    + "\">\n  <div class=\"progress-bar progress-bar-success progress-bar-striped "
    + alias3(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"status","hash":{},"data":data}) : helper)))
    + "\" role=\"progressbar\">\n  </div>\n</div>\n\n<div class=\"cover\">\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.cover : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.program(3, data, 0, blockParams, depths),"data":data})) != null ? stack1 : "")
    + "</div>\n\n<div class=\"details\">\n  <div>\n    <h2>"
    + alias3(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "</h2>\n    <h3><a href=\"/dashboards/"
    + alias3(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"domain","hash":{},"data":data}) : helper)))
    + "\"\n      ";
  stack1 = ((helper = (helper = helpers.isEmbed || (depth0 != null ? depth0.isEmbed : depth0)) != null ? helper : alias2),(options={"name":"isEmbed","hash":{},"fn":container.program(5, data, 0, blockParams, depths),"inverse":container.program(7, data, 0, blockParams, depths),"data":data}),(typeof helper === alias4 ? helper.call(alias1,options) : helper));
  if (!helpers.isEmbed) { stack1 = alias5.call(depth0,stack1,options)}
  if (stack1 != null) { buffer += stack1; }
  buffer += ">"
    + alias3(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"domain","hash":{},"data":data}) : helper)))
    + "</a></h3>\n    <p class=\"description\">"
    + alias3(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"description","hash":{},"data":data}) : helper)))
    + "</p>\n  </div>\n</div>\n\n<ul class=\"contributors "
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.noActions : depth0),{"name":"if","hash":{},"fn":container.program(9, data, 0, blockParams, depths),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\">\n\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.contributorsMore : depth0),{"name":"if","hash":{},"fn":container.program(11, data, 0, blockParams, depths),"inverse":container.program(17, data, 0, blockParams, depths),"data":data})) != null ? stack1 : "")
    + "</ul>\n\n<div class=\"action-bar text-right "
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.noActions : depth0),{"name":"if","hash":{},"fn":container.program(9, data, 0, blockParams, depths),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\">\n\n  <i class=\"fa fa-clock-o timer tooltips\"\n    data-original-title=\""
    + alias3((helpers.timeAgo || (depth0 && depth0.timeAgo) || alias2).call(alias1,(depth0 != null ? depth0.created_at : depth0),{"name":"timeAgo","hash":{},"data":data}))
    + "\"></i>\n\n  <div class=\"action-links\">\n\n";
  stack1 = ((helper = (helper = helpers.isEmbed || (depth0 != null ? depth0.isEmbed : depth0)) != null ? helper : alias2),(options={"name":"isEmbed","hash":{},"fn":container.program(19, data, 0, blockParams, depths),"inverse":container.program(21, data, 0, blockParams, depths),"data":data}),(typeof helper === alias4 ? helper.call(alias1,options) : helper));
  if (!helpers.isEmbed) { stack1 = alias5.call(depth0,stack1,options)}
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.link : depth0),{"name":"if","hash":{},"fn":container.program(31, data, 0, blockParams, depths),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n  </div>\n\n</div>\n\n";
  stack1 = ((helper = (helper = helpers.isLoggedIn || (depth0 != null ? depth0.isLoggedIn : depth0)) != null ? helper : alias2),(options={"name":"isLoggedIn","hash":{},"fn":container.program(33, data, 0, blockParams, depths),"inverse":container.noop,"data":data}),(typeof helper === alias4 ? helper.call(alias1,options) : helper));
  if (!helpers.isLoggedIn) { stack1 = alias5.call(depth0,stack1,options)}
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"useData":true,"useDepths":true});

},{"hbsfy/runtime":45}],25:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3=container.escapeExpression;

  return "<div class=\"progress\" title=\""
    + alias3((helpers.statusesText || (depth0 && depth0.statusesText) || alias2).call(alias1,(depth0 != null ? depth0.status : depth0),{"name":"statusesText","hash":{},"data":data}))
    + "\">\n  <div class=\"progress-bar progress-bar-success progress-bar-striped "
    + alias3(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"status","hash":{},"data":data}) : helper)))
    + "\" role=\"progressbar\">\n  </div>\n</div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "\n"
    + ((stack1 = helpers["if"].call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.cover : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.program(6, data, 0),"data":data})) != null ? stack1 : "")
    + "\n";
},"4":function(container,depth0,helpers,partials,data) {
    var helper;

  return "    <div class=\"item-cover\" style=\"background-image: url("
    + container.escapeExpression(((helper = (helper = helpers.cover || (depth0 != null ? depth0.cover : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"cover","hash":{},"data":data}) : helper)))
    + ");\"></div>\n";
},"6":function(container,depth0,helpers,partials,data) {
    return "    <i class=\"item-letter\">"
    + container.escapeExpression((helpers.firstLetter || (depth0 && depth0.firstLetter) || helpers.helperMissing).call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.title : depth0),{"name":"firstLetter","hash":{},"data":data}))
    + "</i>\n";
},"8":function(container,depth0,helpers,partials,data) {
    return "  <i class=\"item-letter\">"
    + container.escapeExpression((helpers.firstLetter || (depth0 && depth0.firstLetter) || helpers.helperMissing).call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.title : depth0),{"name":"firstLetter","hash":{},"data":data}))
    + "</i>\n";
},"10":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "  <div class=\"details\">\n    <div>\n      <h2>"
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "</h2>\n      <h3><a href=\"/dashboards/"
    + alias4(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"domain","hash":{},"data":data}) : helper)))
    + "\" target=\"_blank\">"
    + alias4(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"domain","hash":{},"data":data}) : helper)))
    + "</a></h3>\n    </div>\n  </div>\n";
},"12":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "<div class=\"description\">"
    + ((stack1 = (helpers.markdown || (depth0 && depth0.markdown) || helpers.helperMissing).call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.description : depth0),{"name":"markdown","hash":{},"data":data})) != null ? stack1 : "")
    + "</div>\n";
},"14":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "<ul class=\"contributors\">\n"
    + ((stack1 = (helpers.each_upto || (depth0 && depth0.each_upto) || helpers.helperMissing).call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.contributors : depth0),5,{"name":"each_upto","hash":{},"fn":container.program(15, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "</ul>\n";
},"15":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3=container.escapeExpression;

  return "  <li>\n    <a href=\"/users/"
    + alias3(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\" target=\"_blank\">\n      "
    + alias3((helpers.getProfileImage || (depth0 && depth0.getProfileImage) || alias2).call(alias1,depth0,{"name":"getProfileImage","hash":{},"data":data}))
    + "\n    </a>\n  </li>\n";
},"17":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3=container.escapeExpression, alias4="function", alias5=container.lambda;

  return "<div class=\"action-bar text-right\">\n\n  <i class=\"fa fa-clock-o timer tooltips\"\n    data-original-title=\""
    + alias3((helpers.timeAgo || (depth0 && depth0.timeAgo) || alias2).call(alias1,(depth0 != null ? depth0.created_at : depth0),{"name":"timeAgo","hash":{},"data":data}))
    + "\"></i>\n\n    <a href=\"/projects/"
    + alias3(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\"\n      class=\"tooltips contribute\" target=\"_blank\"\n      data-original-title=\""
    + alias3(alias5(((stack1 = (depth0 != null ? depth0.contributors : depth0)) != null ? stack1.length : stack1), depth0))
    + " contributors\">Join</a>\n    <a href=\"/projects/"
    + alias3(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\"\n      class=\"tooltips follow\" target=\"_blank\"\n      data-original-title=\""
    + alias3(alias5(((stack1 = (depth0 != null ? depth0.followers : depth0)) != null ? stack1.length : stack1), depth0))
    + " followers\">Follow</a>\n\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.link : depth0),{"name":"if","hash":{},"fn":container.program(18, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "</div>\n";
},"18":function(container,depth0,helpers,partials,data) {
    var helper;

  return "  <a class=\"demo-link\" href=\""
    + container.escapeExpression(((helper = (helper = helpers.link || (depth0 != null ? depth0.link : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"link","hash":{},"data":data}) : helper)))
    + "\" target=\"_blank\">Demo</a>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : {};

  return "\n"
    + ((stack1 = helpers["if"].call(alias1,((stack1 = (depth0 != null ? depth0.settings : depth0)) != null ? stack1.prg : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n<div class=\"cover\">\n"
    + ((stack1 = helpers["if"].call(alias1,((stack1 = (depth0 != null ? depth0.settings : depth0)) != null ? stack1.pic : stack1),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.program(8, data, 0),"data":data})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers["if"].call(alias1,((stack1 = (depth0 != null ? depth0.settings : depth0)) != null ? stack1.title : stack1),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n</div>\n\n"
    + ((stack1 = helpers["if"].call(alias1,((stack1 = (depth0 != null ? depth0.settings : depth0)) != null ? stack1.desc : stack1),{"name":"if","hash":{},"fn":container.program(12, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers["if"].call(alias1,((stack1 = (depth0 != null ? depth0.settings : depth0)) != null ? stack1.contrib : stack1),{"name":"if","hash":{},"fn":container.program(14, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers["if"].call(alias1,((stack1 = (depth0 != null ? depth0.settings : depth0)) != null ? stack1.acnbar : stack1),{"name":"if","hash":{},"fn":container.program(17, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "");
},"useData":true});

},{"hbsfy/runtime":45}],26:[function(require,module,exports){
'use strict';

exports.__esModule = true;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _handlebarsBase = require('./handlebars/base');

var base = _interopRequireWildcard(_handlebarsBase);

// Each of these augment the Handlebars object. No need to setup here.
// (This is done to easily share code between commonjs and browse envs)

var _handlebarsSafeString = require('./handlebars/safe-string');

var _handlebarsSafeString2 = _interopRequireDefault(_handlebarsSafeString);

var _handlebarsException = require('./handlebars/exception');

var _handlebarsException2 = _interopRequireDefault(_handlebarsException);

var _handlebarsUtils = require('./handlebars/utils');

var Utils = _interopRequireWildcard(_handlebarsUtils);

var _handlebarsRuntime = require('./handlebars/runtime');

var runtime = _interopRequireWildcard(_handlebarsRuntime);

var _handlebarsNoConflict = require('./handlebars/no-conflict');

var _handlebarsNoConflict2 = _interopRequireDefault(_handlebarsNoConflict);

// For compatibility and usage outside of module systems, make the Handlebars object a namespace
function create() {
  var hb = new base.HandlebarsEnvironment();

  Utils.extend(hb, base);
  hb.SafeString = _handlebarsSafeString2['default'];
  hb.Exception = _handlebarsException2['default'];
  hb.Utils = Utils;
  hb.escapeExpression = Utils.escapeExpression;

  hb.VM = runtime;
  hb.template = function (spec) {
    return runtime.template(spec, hb);
  };

  return hb;
}

var inst = create();
inst.create = create;

_handlebarsNoConflict2['default'](inst);

inst['default'] = inst;

exports['default'] = inst;
module.exports = exports['default'];


},{"./handlebars/base":27,"./handlebars/exception":30,"./handlebars/no-conflict":40,"./handlebars/runtime":41,"./handlebars/safe-string":42,"./handlebars/utils":43}],27:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.HandlebarsEnvironment = HandlebarsEnvironment;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utils = require('./utils');

var _exception = require('./exception');

var _exception2 = _interopRequireDefault(_exception);

var _helpers = require('./helpers');

var _decorators = require('./decorators');

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

var VERSION = '4.0.5';
exports.VERSION = VERSION;
var COMPILER_REVISION = 7;

exports.COMPILER_REVISION = COMPILER_REVISION;
var REVISION_CHANGES = {
  1: '<= 1.0.rc.2', // 1.0.rc.2 is actually rev2 but doesn't report it
  2: '== 1.0.0-rc.3',
  3: '== 1.0.0-rc.4',
  4: '== 1.x.x',
  5: '== 2.0.0-alpha.x',
  6: '>= 2.0.0-beta.1',
  7: '>= 4.0.0'
};

exports.REVISION_CHANGES = REVISION_CHANGES;
var objectType = '[object Object]';

function HandlebarsEnvironment(helpers, partials, decorators) {
  this.helpers = helpers || {};
  this.partials = partials || {};
  this.decorators = decorators || {};

  _helpers.registerDefaultHelpers(this);
  _decorators.registerDefaultDecorators(this);
}

HandlebarsEnvironment.prototype = {
  constructor: HandlebarsEnvironment,

  logger: _logger2['default'],
  log: _logger2['default'].log,

  registerHelper: function registerHelper(name, fn) {
    if (_utils.toString.call(name) === objectType) {
      if (fn) {
        throw new _exception2['default']('Arg not supported with multiple helpers');
      }
      _utils.extend(this.helpers, name);
    } else {
      this.helpers[name] = fn;
    }
  },
  unregisterHelper: function unregisterHelper(name) {
    delete this.helpers[name];
  },

  registerPartial: function registerPartial(name, partial) {
    if (_utils.toString.call(name) === objectType) {
      _utils.extend(this.partials, name);
    } else {
      if (typeof partial === 'undefined') {
        throw new _exception2['default']('Attempting to register a partial called "' + name + '" as undefined');
      }
      this.partials[name] = partial;
    }
  },
  unregisterPartial: function unregisterPartial(name) {
    delete this.partials[name];
  },

  registerDecorator: function registerDecorator(name, fn) {
    if (_utils.toString.call(name) === objectType) {
      if (fn) {
        throw new _exception2['default']('Arg not supported with multiple decorators');
      }
      _utils.extend(this.decorators, name);
    } else {
      this.decorators[name] = fn;
    }
  },
  unregisterDecorator: function unregisterDecorator(name) {
    delete this.decorators[name];
  }
};

var log = _logger2['default'].log;

exports.log = log;
exports.createFrame = _utils.createFrame;
exports.logger = _logger2['default'];


},{"./decorators":28,"./exception":30,"./helpers":31,"./logger":39,"./utils":43}],28:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.registerDefaultDecorators = registerDefaultDecorators;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _decoratorsInline = require('./decorators/inline');

var _decoratorsInline2 = _interopRequireDefault(_decoratorsInline);

function registerDefaultDecorators(instance) {
  _decoratorsInline2['default'](instance);
}


},{"./decorators/inline":29}],29:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _utils = require('../utils');

exports['default'] = function (instance) {
  instance.registerDecorator('inline', function (fn, props, container, options) {
    var ret = fn;
    if (!props.partials) {
      props.partials = {};
      ret = function (context, options) {
        // Create a new partials stack frame prior to exec.
        var original = container.partials;
        container.partials = _utils.extend({}, original, props.partials);
        var ret = fn(context, options);
        container.partials = original;
        return ret;
      };
    }

    props.partials[options.args[0]] = options.fn;

    return ret;
  });
};

module.exports = exports['default'];


},{"../utils":43}],30:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];

function Exception(message, node) {
  var loc = node && node.loc,
      line = undefined,
      column = undefined;
  if (loc) {
    line = loc.start.line;
    column = loc.start.column;

    message += ' - ' + line + ':' + column;
  }

  var tmp = Error.prototype.constructor.call(this, message);

  // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
  for (var idx = 0; idx < errorProps.length; idx++) {
    this[errorProps[idx]] = tmp[errorProps[idx]];
  }

  /* istanbul ignore else */
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, Exception);
  }

  try {
    if (loc) {
      this.lineNumber = line;

      // Work around issue under safari where we can't directly set the column value
      /* istanbul ignore next */
      if (Object.defineProperty) {
        Object.defineProperty(this, 'column', { value: column });
      } else {
        this.column = column;
      }
    }
  } catch (nop) {
    /* Ignore if the browser is very particular */
  }
}

Exception.prototype = new Error();

exports['default'] = Exception;
module.exports = exports['default'];


},{}],31:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.registerDefaultHelpers = registerDefaultHelpers;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _helpersBlockHelperMissing = require('./helpers/block-helper-missing');

var _helpersBlockHelperMissing2 = _interopRequireDefault(_helpersBlockHelperMissing);

var _helpersEach = require('./helpers/each');

var _helpersEach2 = _interopRequireDefault(_helpersEach);

var _helpersHelperMissing = require('./helpers/helper-missing');

var _helpersHelperMissing2 = _interopRequireDefault(_helpersHelperMissing);

var _helpersIf = require('./helpers/if');

var _helpersIf2 = _interopRequireDefault(_helpersIf);

var _helpersLog = require('./helpers/log');

var _helpersLog2 = _interopRequireDefault(_helpersLog);

var _helpersLookup = require('./helpers/lookup');

var _helpersLookup2 = _interopRequireDefault(_helpersLookup);

var _helpersWith = require('./helpers/with');

var _helpersWith2 = _interopRequireDefault(_helpersWith);

function registerDefaultHelpers(instance) {
  _helpersBlockHelperMissing2['default'](instance);
  _helpersEach2['default'](instance);
  _helpersHelperMissing2['default'](instance);
  _helpersIf2['default'](instance);
  _helpersLog2['default'](instance);
  _helpersLookup2['default'](instance);
  _helpersWith2['default'](instance);
}


},{"./helpers/block-helper-missing":32,"./helpers/each":33,"./helpers/helper-missing":34,"./helpers/if":35,"./helpers/log":36,"./helpers/lookup":37,"./helpers/with":38}],32:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _utils = require('../utils');

exports['default'] = function (instance) {
  instance.registerHelper('blockHelperMissing', function (context, options) {
    var inverse = options.inverse,
        fn = options.fn;

    if (context === true) {
      return fn(this);
    } else if (context === false || context == null) {
      return inverse(this);
    } else if (_utils.isArray(context)) {
      if (context.length > 0) {
        if (options.ids) {
          options.ids = [options.name];
        }

        return instance.helpers.each(context, options);
      } else {
        return inverse(this);
      }
    } else {
      if (options.data && options.ids) {
        var data = _utils.createFrame(options.data);
        data.contextPath = _utils.appendContextPath(options.data.contextPath, options.name);
        options = { data: data };
      }

      return fn(context, options);
    }
  });
};

module.exports = exports['default'];


},{"../utils":43}],33:[function(require,module,exports){
'use strict';

exports.__esModule = true;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utils = require('../utils');

var _exception = require('../exception');

var _exception2 = _interopRequireDefault(_exception);

exports['default'] = function (instance) {
  instance.registerHelper('each', function (context, options) {
    if (!options) {
      throw new _exception2['default']('Must pass iterator to #each');
    }

    var fn = options.fn,
        inverse = options.inverse,
        i = 0,
        ret = '',
        data = undefined,
        contextPath = undefined;

    if (options.data && options.ids) {
      contextPath = _utils.appendContextPath(options.data.contextPath, options.ids[0]) + '.';
    }

    if (_utils.isFunction(context)) {
      context = context.call(this);
    }

    if (options.data) {
      data = _utils.createFrame(options.data);
    }

    function execIteration(field, index, last) {
      if (data) {
        data.key = field;
        data.index = index;
        data.first = index === 0;
        data.last = !!last;

        if (contextPath) {
          data.contextPath = contextPath + field;
        }
      }

      ret = ret + fn(context[field], {
        data: data,
        blockParams: _utils.blockParams([context[field], field], [contextPath + field, null])
      });
    }

    if (context && typeof context === 'object') {
      if (_utils.isArray(context)) {
        for (var j = context.length; i < j; i++) {
          if (i in context) {
            execIteration(i, i, i === context.length - 1);
          }
        }
      } else {
        var priorKey = undefined;

        for (var key in context) {
          if (context.hasOwnProperty(key)) {
            // We're running the iterations one step out of sync so we can detect
            // the last iteration without have to scan the object twice and create
            // an itermediate keys array.
            if (priorKey !== undefined) {
              execIteration(priorKey, i - 1);
            }
            priorKey = key;
            i++;
          }
        }
        if (priorKey !== undefined) {
          execIteration(priorKey, i - 1, true);
        }
      }
    }

    if (i === 0) {
      ret = inverse(this);
    }

    return ret;
  });
};

module.exports = exports['default'];


},{"../exception":30,"../utils":43}],34:[function(require,module,exports){
'use strict';

exports.__esModule = true;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _exception = require('../exception');

var _exception2 = _interopRequireDefault(_exception);

exports['default'] = function (instance) {
  instance.registerHelper('helperMissing', function () /* [args, ]options */{
    if (arguments.length === 1) {
      // A missing field in a {{foo}} construct.
      return undefined;
    } else {
      // Someone is actually trying to call something, blow up.
      throw new _exception2['default']('Missing helper: "' + arguments[arguments.length - 1].name + '"');
    }
  });
};

module.exports = exports['default'];


},{"../exception":30}],35:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _utils = require('../utils');

exports['default'] = function (instance) {
  instance.registerHelper('if', function (conditional, options) {
    if (_utils.isFunction(conditional)) {
      conditional = conditional.call(this);
    }

    // Default behavior is to render the positive path if the value is truthy and not empty.
    // The `includeZero` option may be set to treat the condtional as purely not empty based on the
    // behavior of isEmpty. Effectively this determines if 0 is handled by the positive path or negative.
    if (!options.hash.includeZero && !conditional || _utils.isEmpty(conditional)) {
      return options.inverse(this);
    } else {
      return options.fn(this);
    }
  });

  instance.registerHelper('unless', function (conditional, options) {
    return instance.helpers['if'].call(this, conditional, { fn: options.inverse, inverse: options.fn, hash: options.hash });
  });
};

module.exports = exports['default'];


},{"../utils":43}],36:[function(require,module,exports){
'use strict';

exports.__esModule = true;

exports['default'] = function (instance) {
  instance.registerHelper('log', function () /* message, options */{
    var args = [undefined],
        options = arguments[arguments.length - 1];
    for (var i = 0; i < arguments.length - 1; i++) {
      args.push(arguments[i]);
    }

    var level = 1;
    if (options.hash.level != null) {
      level = options.hash.level;
    } else if (options.data && options.data.level != null) {
      level = options.data.level;
    }
    args[0] = level;

    instance.log.apply(instance, args);
  });
};

module.exports = exports['default'];


},{}],37:[function(require,module,exports){
'use strict';

exports.__esModule = true;

exports['default'] = function (instance) {
  instance.registerHelper('lookup', function (obj, field) {
    return obj && obj[field];
  });
};

module.exports = exports['default'];


},{}],38:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _utils = require('../utils');

exports['default'] = function (instance) {
  instance.registerHelper('with', function (context, options) {
    if (_utils.isFunction(context)) {
      context = context.call(this);
    }

    var fn = options.fn;

    if (!_utils.isEmpty(context)) {
      var data = options.data;
      if (options.data && options.ids) {
        data = _utils.createFrame(options.data);
        data.contextPath = _utils.appendContextPath(options.data.contextPath, options.ids[0]);
      }

      return fn(context, {
        data: data,
        blockParams: _utils.blockParams([context], [data && data.contextPath])
      });
    } else {
      return options.inverse(this);
    }
  });
};

module.exports = exports['default'];


},{"../utils":43}],39:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _utils = require('./utils');

var logger = {
  methodMap: ['debug', 'info', 'warn', 'error'],
  level: 'info',

  // Maps a given level value to the `methodMap` indexes above.
  lookupLevel: function lookupLevel(level) {
    if (typeof level === 'string') {
      var levelMap = _utils.indexOf(logger.methodMap, level.toLowerCase());
      if (levelMap >= 0) {
        level = levelMap;
      } else {
        level = parseInt(level, 10);
      }
    }

    return level;
  },

  // Can be overridden in the host environment
  log: function log(level) {
    level = logger.lookupLevel(level);

    if (typeof console !== 'undefined' && logger.lookupLevel(logger.level) <= level) {
      var method = logger.methodMap[level];
      if (!console[method]) {
        // eslint-disable-line no-console
        method = 'log';
      }

      for (var _len = arguments.length, message = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        message[_key - 1] = arguments[_key];
      }

      console[method].apply(console, message); // eslint-disable-line no-console
    }
  }
};

exports['default'] = logger;
module.exports = exports['default'];


},{"./utils":43}],40:[function(require,module,exports){
(function (global){
/* global window */
'use strict';

exports.__esModule = true;

exports['default'] = function (Handlebars) {
  /* istanbul ignore next */
  var root = typeof global !== 'undefined' ? global : window,
      $Handlebars = root.Handlebars;
  /* istanbul ignore next */
  Handlebars.noConflict = function () {
    if (root.Handlebars === Handlebars) {
      root.Handlebars = $Handlebars;
    }
    return Handlebars;
  };
};

module.exports = exports['default'];


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],41:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.checkRevision = checkRevision;
exports.template = template;
exports.wrapProgram = wrapProgram;
exports.resolvePartial = resolvePartial;
exports.invokePartial = invokePartial;
exports.noop = noop;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _utils = require('./utils');

var Utils = _interopRequireWildcard(_utils);

var _exception = require('./exception');

var _exception2 = _interopRequireDefault(_exception);

var _base = require('./base');

function checkRevision(compilerInfo) {
  var compilerRevision = compilerInfo && compilerInfo[0] || 1,
      currentRevision = _base.COMPILER_REVISION;

  if (compilerRevision !== currentRevision) {
    if (compilerRevision < currentRevision) {
      var runtimeVersions = _base.REVISION_CHANGES[currentRevision],
          compilerVersions = _base.REVISION_CHANGES[compilerRevision];
      throw new _exception2['default']('Template was precompiled with an older version of Handlebars than the current runtime. ' + 'Please update your precompiler to a newer version (' + runtimeVersions + ') or downgrade your runtime to an older version (' + compilerVersions + ').');
    } else {
      // Use the embedded version info since the runtime doesn't know about this revision yet
      throw new _exception2['default']('Template was precompiled with a newer version of Handlebars than the current runtime. ' + 'Please update your runtime to a newer version (' + compilerInfo[1] + ').');
    }
  }
}

function template(templateSpec, env) {
  /* istanbul ignore next */
  if (!env) {
    throw new _exception2['default']('No environment passed to template');
  }
  if (!templateSpec || !templateSpec.main) {
    throw new _exception2['default']('Unknown template object: ' + typeof templateSpec);
  }

  templateSpec.main.decorator = templateSpec.main_d;

  // Note: Using env.VM references rather than local var references throughout this section to allow
  // for external users to override these as psuedo-supported APIs.
  env.VM.checkRevision(templateSpec.compiler);

  function invokePartialWrapper(partial, context, options) {
    if (options.hash) {
      context = Utils.extend({}, context, options.hash);
      if (options.ids) {
        options.ids[0] = true;
      }
    }

    partial = env.VM.resolvePartial.call(this, partial, context, options);
    var result = env.VM.invokePartial.call(this, partial, context, options);

    if (result == null && env.compile) {
      options.partials[options.name] = env.compile(partial, templateSpec.compilerOptions, env);
      result = options.partials[options.name](context, options);
    }
    if (result != null) {
      if (options.indent) {
        var lines = result.split('\n');
        for (var i = 0, l = lines.length; i < l; i++) {
          if (!lines[i] && i + 1 === l) {
            break;
          }

          lines[i] = options.indent + lines[i];
        }
        result = lines.join('\n');
      }
      return result;
    } else {
      throw new _exception2['default']('The partial ' + options.name + ' could not be compiled when running in runtime-only mode');
    }
  }

  // Just add water
  var container = {
    strict: function strict(obj, name) {
      if (!(name in obj)) {
        throw new _exception2['default']('"' + name + '" not defined in ' + obj);
      }
      return obj[name];
    },
    lookup: function lookup(depths, name) {
      var len = depths.length;
      for (var i = 0; i < len; i++) {
        if (depths[i] && depths[i][name] != null) {
          return depths[i][name];
        }
      }
    },
    lambda: function lambda(current, context) {
      return typeof current === 'function' ? current.call(context) : current;
    },

    escapeExpression: Utils.escapeExpression,
    invokePartial: invokePartialWrapper,

    fn: function fn(i) {
      var ret = templateSpec[i];
      ret.decorator = templateSpec[i + '_d'];
      return ret;
    },

    programs: [],
    program: function program(i, data, declaredBlockParams, blockParams, depths) {
      var programWrapper = this.programs[i],
          fn = this.fn(i);
      if (data || depths || blockParams || declaredBlockParams) {
        programWrapper = wrapProgram(this, i, fn, data, declaredBlockParams, blockParams, depths);
      } else if (!programWrapper) {
        programWrapper = this.programs[i] = wrapProgram(this, i, fn);
      }
      return programWrapper;
    },

    data: function data(value, depth) {
      while (value && depth--) {
        value = value._parent;
      }
      return value;
    },
    merge: function merge(param, common) {
      var obj = param || common;

      if (param && common && param !== common) {
        obj = Utils.extend({}, common, param);
      }

      return obj;
    },

    noop: env.VM.noop,
    compilerInfo: templateSpec.compiler
  };

  function ret(context) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var data = options.data;

    ret._setup(options);
    if (!options.partial && templateSpec.useData) {
      data = initData(context, data);
    }
    var depths = undefined,
        blockParams = templateSpec.useBlockParams ? [] : undefined;
    if (templateSpec.useDepths) {
      if (options.depths) {
        depths = context != options.depths[0] ? [context].concat(options.depths) : options.depths;
      } else {
        depths = [context];
      }
    }

    function main(context /*, options*/) {
      return '' + templateSpec.main(container, context, container.helpers, container.partials, data, blockParams, depths);
    }
    main = executeDecorators(templateSpec.main, main, container, options.depths || [], data, blockParams);
    return main(context, options);
  }
  ret.isTop = true;

  ret._setup = function (options) {
    if (!options.partial) {
      container.helpers = container.merge(options.helpers, env.helpers);

      if (templateSpec.usePartial) {
        container.partials = container.merge(options.partials, env.partials);
      }
      if (templateSpec.usePartial || templateSpec.useDecorators) {
        container.decorators = container.merge(options.decorators, env.decorators);
      }
    } else {
      container.helpers = options.helpers;
      container.partials = options.partials;
      container.decorators = options.decorators;
    }
  };

  ret._child = function (i, data, blockParams, depths) {
    if (templateSpec.useBlockParams && !blockParams) {
      throw new _exception2['default']('must pass block params');
    }
    if (templateSpec.useDepths && !depths) {
      throw new _exception2['default']('must pass parent depths');
    }

    return wrapProgram(container, i, templateSpec[i], data, 0, blockParams, depths);
  };
  return ret;
}

function wrapProgram(container, i, fn, data, declaredBlockParams, blockParams, depths) {
  function prog(context) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var currentDepths = depths;
    if (depths && context != depths[0]) {
      currentDepths = [context].concat(depths);
    }

    return fn(container, context, container.helpers, container.partials, options.data || data, blockParams && [options.blockParams].concat(blockParams), currentDepths);
  }

  prog = executeDecorators(fn, prog, container, depths, data, blockParams);

  prog.program = i;
  prog.depth = depths ? depths.length : 0;
  prog.blockParams = declaredBlockParams || 0;
  return prog;
}

function resolvePartial(partial, context, options) {
  if (!partial) {
    if (options.name === '@partial-block') {
      var data = options.data;
      while (data['partial-block'] === noop) {
        data = data._parent;
      }
      partial = data['partial-block'];
      data['partial-block'] = noop;
    } else {
      partial = options.partials[options.name];
    }
  } else if (!partial.call && !options.name) {
    // This is a dynamic partial that returned a string
    options.name = partial;
    partial = options.partials[partial];
  }
  return partial;
}

function invokePartial(partial, context, options) {
  options.partial = true;
  if (options.ids) {
    options.data.contextPath = options.ids[0] || options.data.contextPath;
  }

  var partialBlock = undefined;
  if (options.fn && options.fn !== noop) {
    options.data = _base.createFrame(options.data);
    partialBlock = options.data['partial-block'] = options.fn;

    if (partialBlock.partials) {
      options.partials = Utils.extend({}, options.partials, partialBlock.partials);
    }
  }

  if (partial === undefined && partialBlock) {
    partial = partialBlock;
  }

  if (partial === undefined) {
    throw new _exception2['default']('The partial ' + options.name + ' could not be found');
  } else if (partial instanceof Function) {
    return partial(context, options);
  }
}

function noop() {
  return '';
}

function initData(context, data) {
  if (!data || !('root' in data)) {
    data = data ? _base.createFrame(data) : {};
    data.root = context;
  }
  return data;
}

function executeDecorators(fn, prog, container, depths, data, blockParams) {
  if (fn.decorator) {
    var props = {};
    prog = fn.decorator(prog, props, container, depths && depths[0], data, blockParams, depths);
    Utils.extend(prog, props);
  }
  return prog;
}


},{"./base":27,"./exception":30,"./utils":43}],42:[function(require,module,exports){
// Build out our basic SafeString type
'use strict';

exports.__esModule = true;
function SafeString(string) {
  this.string = string;
}

SafeString.prototype.toString = SafeString.prototype.toHTML = function () {
  return '' + this.string;
};

exports['default'] = SafeString;
module.exports = exports['default'];


},{}],43:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.extend = extend;
exports.indexOf = indexOf;
exports.escapeExpression = escapeExpression;
exports.isEmpty = isEmpty;
exports.createFrame = createFrame;
exports.blockParams = blockParams;
exports.appendContextPath = appendContextPath;
var escape = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

var badChars = /[&<>"'`=]/g,
    possible = /[&<>"'`=]/;

function escapeChar(chr) {
  return escape[chr];
}

function extend(obj /* , ...source */) {
  for (var i = 1; i < arguments.length; i++) {
    for (var key in arguments[i]) {
      if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
        obj[key] = arguments[i][key];
      }
    }
  }

  return obj;
}

var toString = Object.prototype.toString;

exports.toString = toString;
// Sourced from lodash
// https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
/* eslint-disable func-style */
var isFunction = function isFunction(value) {
  return typeof value === 'function';
};
// fallback for older versions of Chrome and Safari
/* istanbul ignore next */
if (isFunction(/x/)) {
  exports.isFunction = isFunction = function (value) {
    return typeof value === 'function' && toString.call(value) === '[object Function]';
  };
}
exports.isFunction = isFunction;

/* eslint-enable func-style */

/* istanbul ignore next */
var isArray = Array.isArray || function (value) {
  return value && typeof value === 'object' ? toString.call(value) === '[object Array]' : false;
};

exports.isArray = isArray;
// Older IE versions do not directly support indexOf so we must implement our own, sadly.

function indexOf(array, value) {
  for (var i = 0, len = array.length; i < len; i++) {
    if (array[i] === value) {
      return i;
    }
  }
  return -1;
}

function escapeExpression(string) {
  if (typeof string !== 'string') {
    // don't escape SafeStrings, since they're already safe
    if (string && string.toHTML) {
      return string.toHTML();
    } else if (string == null) {
      return '';
    } else if (!string) {
      return string + '';
    }

    // Force a string conversion as this will be done by the append regardless and
    // the regex test will do this transparently behind the scenes, causing issues if
    // an object's to string has escaped characters in it.
    string = '' + string;
  }

  if (!possible.test(string)) {
    return string;
  }
  return string.replace(badChars, escapeChar);
}

function isEmpty(value) {
  if (!value && value !== 0) {
    return true;
  } else if (isArray(value) && value.length === 0) {
    return true;
  } else {
    return false;
  }
}

function createFrame(object) {
  var frame = extend({}, object);
  frame._parent = object;
  return frame;
}

function blockParams(params, ids) {
  params.path = ids;
  return params;
}

function appendContextPath(contextPath, id) {
  return (contextPath ? contextPath + '.' : '') + id;
}


},{}],44:[function(require,module,exports){
// Create a simple path alias to allow browserify to resolve
// the runtime on a supported path.
module.exports = require('./dist/cjs/handlebars.runtime')['default'];

},{"./dist/cjs/handlebars.runtime":26}],45:[function(require,module,exports){
module.exports = require("handlebars/runtime")["default"];

},{"handlebars/runtime":44}]},{},[6]);
