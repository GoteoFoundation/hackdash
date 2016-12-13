/*! 
* wotify-hackdash - v0.14.0
* Copyright (c) 2016 Platoniq 
*  
*/ 


(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Hackdash Application
 *
 */

var HackdashRouter = require('./HackdashRouter')
  , config = require("../../config/config")
  , LoginView = require("./views/Login")
  , MessageView = require("./views/MessageBox")
  , ModalRegion = require('./views/ModalRegion');

module.exports = function(){

  var app = module.exports = new Backbone.Marionette.Application();

  function initRegions(){
    app.addRegions({
      header: "header",
      main: "#main",
      footer: "footer",
      modals: ModalRegion
    });

    app.showLogin = function(){
      var providers = window.hackdash.providers;
      var useLocalLogin = window.hackdash.useLocalLogin;
      var error = window.hackdash.flashError;
      var msg = window.hackdash.flashMessage;

      app.modals.show(new LoginView({
        model: new Backbone.Model({
          providers: providers.split(','),
          localLogin: useLocalLogin,
          flashError: error,
          flashMessage: msg,
        })
      }));
    };

    app.showOKMessage = function(opts){
      app.modals.show(new MessageView({
        model: new Backbone.Model(opts)
      }));
    };

    app.setTitle = function(title){
      window.document.title = title + " - " + config.title;
    };
  }

  function initRouter(){
    app.router = new HackdashRouter();
    app.router.on("route", function(/*route, params*/) {
      app.previousURL = Backbone.history.fragment;
    });
    Backbone.history.start({ pushState: true });
  }

  app.addInitializer(initRegions);
  app.addInitializer(initRouter);

  window.hackdash.app = app;
  window.hackdash.app.start();

  // Add navigation for BackboneRouter to all links
  // unless they have attribute "data-bypass"
  $(window.document).on("click", "a:not([data-bypass])", function(evt) {
    var href = { prop: $(this).prop("href"), attr: $(this).attr("href") };
    var root = window.location.protocol + "//" + window.location.host + (app.root || "");

    if (href.prop && href.prop.slice(0, root.length) === root) {
      evt.preventDefault();
      Backbone.history.navigate(href.attr, { trigger: true });
    }
  });

};

},{"../../config/config":163,"./HackdashRouter":2,"./views/Login":115,"./views/MessageBox":116,"./views/ModalRegion":117}],2:[function(require,module,exports){
/*
 * Hackdash Router
 */

var Dashboard = require("./models/Dashboard")
  , Project = require("./models/Project")
  , Projects = require("./models/Projects")
  , Collection = require("./models/Collection")
  , Profile = require("./models/Profile")
  , Form = require("./models/Form")
  , Forms = require("./models/Forms")

  , Header = require("./views/Header")
  , Footer = require("./views/Footer")

  , HomeLayout = require("./views/Home")
  , ProfileView = require("./views/Profile")
  , ProjectFullView = require("./views/Project/Full")
  , ProjectEditView = require("./views/Project/Edit")
  , DashboardView = require("./views/Dashboard")
  , FormEditView = require("./views/Form/Edit")
  , FormView = require("./views/Form")
  , CollectionView = require("./views/Collection")
  ;

module.exports = Backbone.Marionette.AppRouter.extend({

  routes : {
      "" : "showHome"
    , "login" : "showLogin"
    , "register" : "showRegister"
    , "lost-password" : "showForgot"
    , "lost-password/:token" : "showForgot"

    // LANDING
    , "dashboards" : "showLandingDashboards"
    , "projects" : "showLandingProjects"
    , "users" : "showLandingUsers"
    , "collections" : "showLandingCollections"

    // APP
    , "dashboards/:dash": "showDashboard"
    , "dashboards/:dash/create": "showProjectCreate"
    , "dashboards/:dash/forms": "showDashboardFormsEdit"

    , "forms": "showForms"
    , "forms/:fid": "showForms"
    , "forms/:fid/:pid": "showForms"

    , "projects/:pid/edit" : "showProjectEdit"
    , "projects/:pid" : "showProjectFull"

    , "collections/:cid" : "showCollection"
    , "collections/:cid/forms" : "showCollectionFormsEdit"

    , "users/profile": "showProfile"
    , "users/:user_id" : "showProfile"

  },

  onRoute: function(name, path){
    window._gaq.push(['_trackPageview', path]);
  },

  showHome: function(){
    this.homeView = new HomeLayout();
    var app = window.hackdash.app;
    app.type = "landing";

    app.main.show(this.homeView);
  },

  // Automatic shows login modal
  showLogin: function(){
    this.showHome();
    this.homeView.checkLogin();
  },

  // Automatic shows register modal
  showRegister: function(){
    this.showHome();
    this.homeView.showRegister();
  },

  // Automatic shows register modal
  showForgot: function(token){
    this.showHome();
    this.homeView.showForgot(token);
  },

  getSearchQuery: function(){
    var query = hackdash.getQueryVariable("q");
    var fetchData = {};
    if (query && query.length > 0){
      fetchData = { data: $.param({ q: query }) };
    }

    return fetchData;
  },

  showHomeSection: function(section){
    var app = window.hackdash.app;
    app.type = "landing";

    if (!this.homeView){
      var main = hackdash.app.main;
      this.homeView = new HomeLayout({
        section: section
      });

      main.show(this.homeView);
    }

    this.homeView.setSection(section);
  },

  showLandingDashboards: function(){
    this.showHomeSection("dashboards");
  },

  showLandingProjects: function(){
    this.showHomeSection("projects");
  },

  showLandingUsers: function(){
    this.showHomeSection("users");
  },

  showLandingCollections: function(){
    this.showHomeSection("collections");
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

          app.header.show(new Header({
            model: app.dashboard,
            collection: app.projects
          }));

          app.main.show(new DashboardView({
            model: app.dashboard
          }));

          app.footer.show(new Footer({
            model: app.dashboard
          }));

          app.setTitle(app.dashboard.get('title') || app.dashboard.get('domain'));

        });
    });

  },

  showDashboardFormsEdit: function(dashboard){

    var app = window.hackdash.app;
    var self = this;
    app.type = "dashboard_form";

    app.dashboard = new Dashboard();
    app.dashboard.set('domain', dashboard);
    app.dashboard.fetch().done(function(){
      if(!self.canEditDashboard(window.hackdash.user, app.dashboard.attributes)) {
        window.location = "/dashboards/" + app.dashboard.attributes.domain;
      }

      app.header.show(new Header());

      // here the forms editor
      app.main.show(new FormEditView({
        model: app.dashboard
      }));

      app.footer.show(new Footer({
        model: app.dashboard
      }));
      app.setTitle('Edit forms for ' + (app.dashboard.get('title') || app.dashboard.get('domain')));
    });
  },

  showCollectionFormsEdit: function(cid){

    var app = window.hackdash.app;
    var self = this;
    app.type = "collection_form";

    app.collection = new Collection({ _id: cid });
    // Set group same as _id to allow choose from dashboard or collection in FormView
    app.collection.set('group', cid);
    app.collection.fetch().done(function(){
      if(!self.canEditCollection(window.hackdash.user, app.collection.attributes)) {
        window.location = "/collections/" + app.collection.attributes._id;
      }

      app.header.show(new Header());

      // here the forms editor
      app.main.show(new FormEditView({
        model: app.collection
      }));

      app.footer.show(new Footer({
        model: app.collection
      }));
      app.setTitle('Edit forms for ' + app.collection.get('title'));

    });
  },

  showProjectCreate: function(dashboard){

    var app = window.hackdash.app;
    app.type = "project";

    app.header.show(new Header());

    var dash = new Dashboard({
      domain: dashboard
    });
    dash.fetch().done(function() {
      app.project = new Project({
        domain: dashboard,
        dashboard: dash
      });
      app.main.show(new ProjectEditView({
        model: app.project
      }));
    });

    app.footer.show(new Footer());

    app.setTitle('Create a project');
  },

  showProjectEdit: function(pid){

    var app = window.hackdash.app;
    var self = this;
    app.type = "project";

    app.project = new Project({ _id: pid });

    app.header.show(new Header());

    app.project.fetch().done(function(){
      if(!self.canEditProject(window.hackdash.user, app.project)) {
        // console.log('kickout', console.log(app.project));
        // window.alert('Not allowed to edit this project');
        window.location = "/projects/" + app.project.get('_id');
      }
      var dash = new Dashboard({
        domain: app.project.get('domain')
      });
      dash.fetch().done(function() {
        app.project.set({'dashboard': dash});
        app.main.show(new ProjectEditView({
          model: app.project
        }));
      });
    });

    app.footer.show(new Footer());
    app.setTitle('Edit project');
  },

  showProjectFull: function(pid){

    var app = window.hackdash.app;
    app.type = "project";

    app.project = new Project({ _id: pid });

    app.project.fetch().done(function(){

      app.header.show(new Header());

      app.main.show(new ProjectFullView({
        model: app.project
      }));

      app.setTitle(app.project.get('title') || 'Project');
    });

    app.footer.show(new Footer());
  },

  showCollection: function(collectionId) {

    var app = window.hackdash.app;
    app.type = "collection";

    app.collection = new Collection({ _id: collectionId });

    app.collection
      .fetch({ parse: true })
      .done(function(){

        app.header.show(new Header({
          model: app.collection
        }));

        app.main.show(new CollectionView({
          model: app.collection
        }));

        app.footer.show(new Footer({
          model: app.collection
        }));

        app.setTitle(app.collection.get('title') || 'Collection');
      });
  },

  showForms: function (fid, pid) {
    var app = window.hackdash.app;
    if (!window.hackdash.user) {
      window.location = "/";
    }

    function showView(model, collection) {
      app.header.show(new Header());
      app.main.show(new FormView({
        model: model,
        collection: collection
      }));
      app.footer.show(new Footer());
      app.setTitle('Forms: ' + (model ? model.get('title') : 'Your forms'));
    }

    app.type = 'forms_list';
    if(fid) {
      app.type = 'forms_item';
      // find form
      var form = new Form({
        id: fid
      });
      form.fetch().done(function(){
        if(pid) {
          var project = new Project({
            _id: pid
          });
          project.fetch().done(function(){
            app.type = 'forms_project';
            app.project = project;
            showView(form);
          });
        } else {
          showView(form);
        }
      });
    } else {
      var forms = new Forms();
      forms.fetch().done(function(){
        showView(null, forms);
      });
    }
  },

  showProfile: function(userId) {

    var app = window.hackdash.app;
    app.type = "profile";

    if (userId && userId.indexOf('from') >= 0){
      userId = null;
    }

    if (!userId){
      if (hackdash.user){
        userId = hackdash.user._id;
      }
      else {
        window.location = "/";
      }
    }

    app.profile = new Profile({
      _id: userId
    });

    app.header.show(new Header());

    app.profile.fetch({ parse: true }).done(function(){

      app.main.show(new ProfileView({
        model: app.profile
      }));

      app.footer.show(new Footer());

      app.setTitle(app.profile.get('name') || 'Profile');
    });

  },

  canEditDashboard: function(user, dash) {
    var owner = user && dash && dash.owner && user._id === dash.owner._id;
    var admin = user && dash && _.indexOf(user.admin_in, dash.domain) > -1;
    return owner || admin;
  },

  canEditCollection: function(user, col) {
    return user && col && col.owner && user._id === col.owner._id;
  },

  canEditProject: function(user, project) {
    if(user && project) {
      var isLeader = project.get('leader') && (user._id === project.get('leader')._id);
      var isAdmin = user.admin_in.indexOf(project.get('domain')) >= 0;
      return isLeader || isAdmin;
    }
    return false;
  }
});

},{"./models/Collection":9,"./models/Dashboard":12,"./models/Form":14,"./models/Forms":15,"./models/Profile":16,"./models/Project":17,"./models/Projects":18,"./views/Collection":23,"./views/Dashboard":33,"./views/Footer":42,"./views/Form":75,"./views/Form/Edit":45,"./views/Header":90,"./views/Home":106,"./views/Profile":122,"./views/Project/Edit":129,"./views/Project/Full":130}],3:[function(require,module,exports){

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


},{"hbsfy/runtime":162}],6:[function(require,module,exports){
jQuery(function() {

  require('./Initializer')();
  window.hackdash.startApp = require('./HackdashApp');
});

},{"./HackdashApp":1,"./Initializer":3}],7:[function(require,module,exports){
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


},{"./User":20,"./Users":21}],8:[function(require,module,exports){

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
 * MODEL: Collection (a group of Dashboards)
 *
 */

var Dashboards = require('./Dashboards');

module.exports = Backbone.Model.extend({

  idAttribute: "_id",

  urlRoot: function(){
    return hackdash.apiURL + '/collections'; 
  },

  parse: function(response){
    response.dashboards = new Dashboards(response.dashboards || []);
    return response;
  },

  addDashboard: function(dashId){
    $.ajax({
      url: this.url() + '/dashboards/' + dashId,
      type: "POST",
      context: this
    });

    this.get("dashboards").add({ _id: dashId });
  },

  removeDashboard: function(dashId){
    $.ajax({
      url: this.url() + '/dashboards/' + dashId,
      type: "DELETE",
      context: this
    });

    var result = this.get("dashboards").where({ _id: dashId});
    if (result.length > 0){
      this.get("dashboards").remove(result[0]);
    }
  },

});


},{"./Dashboards":13}],10:[function(require,module,exports){
/**
 * Collection: Collections (group of Dashboards)
 *
 */

var
  Collection = require('./Collection'),
  BaseCollection = require('./BaseCollection');

module.exports = BaseCollection.extend({

  model: Collection,

  idAttribute: "_id",

  url: function(){
    return hackdash.apiURL + '/collections';
  },

  parse: function(response){
    var whiteList = [];

    response.forEach(function(coll){
      if (coll.title && coll.dashboards.length > 0){
        whiteList.push(coll);
      }
    });

    return whiteList;
  },

  getMines: function(){
    $.ajax({
      url: this.url() + '/own',
      context: this
    }).done(function(collections){
      this.reset(collections, { parse: true });
    });
  }

});


},{"./BaseCollection":8,"./Collection":9}],11:[function(require,module,exports){

module.exports = Backbone.Model.extend({

  defaults: {
    dashboards: 0,
    projects: 0,
    users: 0,
    collections: 0,
    releases: 0
  },

  urlRoot: '/counts',

});

},{}],12:[function(require,module,exports){
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


},{"./Admins":7}],13:[function(require,module,exports){
/**
 * MODEL: Dashboards
 *
 */

var BaseCollection = require('./BaseCollection');

var Dashboards = module.exports = BaseCollection.extend({

  url: function(){
    return hackdash.apiURL + "/dashboards";
  },

  idAttribute: "_id",


  getOpened: function(){
    return new Dashboards(
      this.filter(function(dash){
        return dash.get("open");
      })
    );
  },

});


},{"./BaseCollection":8}],14:[function(require,module,exports){
/**
 * MODEL: Form (bind to a collection or dashboard)
 *
 */

module.exports = Backbone.Model.extend({

  urlRoot: function(){
    return hackdash.apiURL + '/forms'; //Posts requests
  },

  // Get questions as a generic Model
  getQuestions: function(){
    // var self = this;
    var questions = this.get('questions') || [];
    return new Backbone.Collection(questions);
    // return new Backbone.Collection(_.map(questions, function(e, k){
    //     e.questionIndex = k;
    //     // e.form = self; // Original Form
    //     return new Backbone.Model(e);
    //   }));
  },

  getMyProjects: function() {
    var projects = this.get('projects') || [];
    return _.filter(projects, function(p) {
      return p.leader._id === hackdash.user._id;
    });
  },

  sendResponse: function(res, callback) {
    if(typeof callback !== 'function') {
      callback = function(){};
    }

    if(!this.get('project').get('_id')) {
      callback('Expected a project property!');
      return;
    }

    var url = this.url() + '/' + this.get('project').get('_id');

    $.ajax({
      url: url,
      type: 'PUT',
      data: JSON.stringify(res),
      contentType: 'application/json; charset=utf-8',
      context: this
    })
    .fail(function(jqXHR) {
      callback(jqXHR.responseText);
    })
    .done(function(msg) {
      callback(null, msg);
    });
  },

  fetchTemplates: function(callback) {
    if(typeof callback !== 'function') {
      callback = function(){};
    }
    $.ajax({
      url: this.urlRoot() + '/templates',
      type: 'GET',
      context: this
    })
    .fail(function(jqXHR) {
      callback(jqXHR.responseText);
    })
    .done(function(templates) {
      callback(null, templates);
    });
  }
});

},{}],15:[function(require,module,exports){
/**
 * Collection: Forms
 *
 */
var
  Form = require('./Form'),
  BaseCollection = require('./BaseCollection');

var Forms = module.exports = BaseCollection.extend({

  model: Form,

  idAttribute: "_id",

  comparators: {
    title: function(a){ return a.get('title'); },
    created_at: function(a){ return -a.get('created_at'); },
  },

  url: function(){
    if (this.domain){
      return hackdash.apiURL + '/dashboards/' + this.domain + '/forms';
    }
    else if (this.group){
      return hackdash.apiURL + '/collections/' + this.group + '/forms';
    }
    return hackdash.apiURL + '/forms'; // User forms
  },

  getActives: function(){

    var forms = new Forms(
      this.filter(function(forms){
        return forms.get("open");
      })
    );

    return forms;
  }

});


},{"./BaseCollection":8,"./Form":14}],16:[function(require,module,exports){
/**
 * MODEL: User
 *
 */

var Projects = require("./Projects");
var Dashboards = require("./Dashboards");
var Collections = require("./Collections");

module.exports = Backbone.Model.extend({

  idAttribute: "_id",

  defaults: {
    collections: new Collections(),
    dashboards: new Collections(),
    projects: new Projects(),
    contributions: new Projects(),
    likes: new Projects()
  },

  urlRoot: function(){
    return hackdash.apiURL + '/profiles';
  },

  parse: function(response){

    response.collections = new Collections(response.collections);
    response.dashboards = new Dashboards(response.dashboards);

    response.projects = new Projects(response.projects);
    response.contributions = new Projects(response.contributions);
    response.likes = new Projects(response.likes);

    response.dashboards.each(function(dash){
      var title = dash.get('title');
      if (!title || (title && !title.length)){
        dash.set('title', dash.get('domain'));
      }
    });

    return response;
  }

});

},{"./Collections":10,"./Dashboards":13,"./Projects":18}],17:[function(require,module,exports){
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


},{}],18:[function(require,module,exports){
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

},{"./BaseCollection":8,"./Project":17}],19:[function(require,module,exports){
/**
 * Collection of Users
 *
 */

var User = require('./User');

module.exports = Backbone.Collection.extend({

  model: User,

  idAttribute: "_id",

  url: function(){
    return hackdash.apiURL + '/users/team';
  },

});


},{"./User":20}],20:[function(require,module,exports){
/**
 * MODEL: User
 *
 */

module.exports = Backbone.Model.extend({

  idAttribute: "_id",

});

},{}],21:[function(require,module,exports){
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


},{"./BaseCollection":8,"./User":20}],22:[function(require,module,exports){
/**
 * VIEW: Collection Header Layout
 *
 */

var
    template = require('./templates/collection.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  ui: {
    "title": "#collection-title",
    "description": "#collection-description",
    "link": "#collection-link"
  },

  templateHelpers: {
    isAdmin: function(){
      return hackdash.user && hackdash.user._id === this.owner._id;
    }
  },

  modelEvents: {
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    if (hackdash.user &&
        hackdash.user._id === this.model.get('owner')._id){

      this.initEditables();
    }

    $('.tooltips', this.$el).tooltip({});
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

  placeholders: {
    title: "Collection of Hackathons Title",
    description: "brief description of this collection of hackathons"
  },

  initEditables: function(){
    this.initEditable("title", '<input type="text" maxlength="30">');
    this.initEditable("description", '<textarea maxlength="250"></textarea>', 'textarea');
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
},{"./templates/collection.hbs":24}],23:[function(require,module,exports){
/**
 * VIEW: Collection Dashboards Layout
 *
 */

var template = require('./templates/index.hbs')
  , CollectionView = require('./Collection')
  , DashboardsView = require('../Dashboard/Collection');

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "page-ctn collection",
  template: template,

  regions: {
    "collection": ".coll-details",
    "dashboards": "#collection-dashboards"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){

    this.collection.show(new CollectionView({
      model: this.model
    }));

    this.dashboards.show(new DashboardsView({
      model: this.model,
      collection: this.model.get('dashboards')
    }));

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
},{"../Dashboard/Collection":28,"./Collection":22,"./templates/index.hbs":25}],24:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "\n  <h1>\n    <a id=\"collection-title\">"
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "</a>\n  </h1>\n\n  <p>\n    <a id=\"collection-description\">"
    + alias4(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"description","hash":{},"data":data}) : helper)))
    + "</a>\n  </p>\n\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : {};

  return "\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.title : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.description : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n";
},"4":function(container,depth0,helpers,partials,data) {
    var helper;

  return "  <h1>"
    + container.escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"title","hash":{},"data":data}) : helper)))
    + "</h1>\n";
},"6":function(container,depth0,helpers,partials,data) {
    var helper;

  return "  <p>"
    + container.escapeExpression(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"description","hash":{},"data":data}) : helper)))
    + "</p>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.isAdmin : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data})) != null ? stack1 : "");
},"useData":true});

},{"hbsfy/runtime":162}],25:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "\n<div class=\"header\">\n  <div class=\"container\">\n    <div class=\"coll-details\"></div>\n  </div>\n</div>\n\n<div class=\"body\">\n\n  <div class=\"container\">\n    <div id=\"collection-dashboards\"></div>\n  </div>\n\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],26:[function(require,module,exports){
/**
 * VIEW: A User Collection
 *
 */

var template = require('./templates/addAdmin.hbs')
  , Users = require('../../models/Users');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "add-admins-modal",
  template: template,

  ui: {
    "txtUser": "#txtUser",
    "addOn": ".add-on"
  },

  events: {
    "click #save": "saveAdmin"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(){
    this.users = new Users();
  },

  onRender: function(){
    this.initTypehead();
  },

  serializeData: function(){
    return _.extend({
      showAdmin: (this.collection.length > 1 ? false : true)
    }, (this.model && this.model.toJSON()) || {});
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  saveAdmin: function(){
    var selected = this.users.find(function(user){
      return user.get('selected');
    });

    if (selected){
      this.collection.addAdmin(selected.get("_id"));
      this.destroy();
    }
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  initTypehead: function(){
    var users = this.users,
      self = this,
      MIN_CHARS_FOR_SERVER_SEARCH = 3;

    this.ui.txtUser.typeahead({
      source: function(query, process){
        if (query.length >= MIN_CHARS_FOR_SERVER_SEARCH){
          users.fetch({
            data: $.param({ q: query }),
            success: function(){
              var usersIds = users.map(function(user){ return user.get('_id').toString(); });
              process(usersIds);
            }
          });
        }
        else {
          process([]);
        }
      },
      matcher: function(){
        return true;
      },
      highlighter: function(uid){
        var user = users.get(uid),
          template = _.template('<img class="avatar" src="<%= picture %>" /> <%= name %>');

        return template({
          picture: user.get('picture'),
          name: user.get('name')
        });
      },
      updater: function(uid) {
        var selectedUser = users.get(uid);
        selectedUser.set('selected', true);
        self.ui.addOn.empty().append('<img class="avatar" src="' + selectedUser.get("picture") + '" />');
        return selectedUser.get('name');
      }
    });
  }

});
},{"../../models/Users":21,"./templates/addAdmin.hbs":34}],27:[function(require,module,exports){
/**
 * VIEW: An Dashboard of HOME Search
 *
 */

var template = require('./templates/card.hbs');
var ItemView = require('../Home/Item.js');

module.exports = ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: 'entity dashboard',
  template: template,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  getURL: function(){
    return "/dashboards/" + this.model.get("domain");
  },

  afterRender: function(){
    var list = $('.list',this.$el);
    var count = this.model.get('covers').length;

    if (count === 0){
      return;
    }

    list.addClass('grid-1');
/*
    if (count >= 4){
      list.addClass('grid-4');
    }

    switch(count){
      case 1: list.addClass('grid-1'); break;
      case 2: list.addClass('grid-2'); break;
      case 3: list.addClass('grid-3'); break;
    }
*/
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
},{"../Home/Item.js":98,"./templates/card.hbs":35}],28:[function(require,module,exports){
/**
 * VIEW: Dashboards
 *
 */

var Dashboard = require('./Card');

module.exports = Backbone.Marionette.CollectionView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "entities",
  childView: Dashboard,

  gutter: 5,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){

    var self = this;
    _.defer(function(){
      self.updateGrid();
      self.refresh();
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

  updateGrid: function(){
    if (!this.wall){
      this.wall = new window.freewall(this.$el);
    }

    this.wall.reset({
      selector: '.entity',
      cellW: 200,
      cellH: 200,
      gutterY: this.gutter,
      gutterX: this.gutter,
      onResize: this.refresh.bind(this)
    });

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
},{"./Card":27}],29:[function(require,module,exports){
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
},{"./templates/dashboard.hbs":36}],30:[function(require,module,exports){
/**
 * VIEW: Login Modal
 *
 */

var template = require('./templates/share.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "share",
  template: template,

  ui: {
    'prg': '#prg',
    'pic': '#pic',
    'title': '#title',
    'desc': '#desc',
    'logo': '#logo',
    'contrib': '#contrib',
    'slider': '#slider',
    'acnbar': '#acnbar',
    'searchbox': '#keywords',

    'status': 'select[name=status]',
    'preview': '.preview iframe',
    'code': '#embed-code',
    'sharelink': '.dash-share-link a'
  },

  events: {
    "click .close": "destroy",
    "click .checkbox": "onClickSetting",
    "keyup @ui.searchbox": "onKeyword",
    "click .btn-group>.btn": "sortClicked",
    "change @ui.status": "onChangeStatus",
    "change #slides": "onChangeSlider"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(){
    this.embedTmpl = _.template('<iframe src="<%= url %>" width="100%" height="450" frameborder="0" allowtransparency="true" title="Hackdash"></iframe>');
  },

  onRender: function(){
    this.reloadPreview();
    $('.modal > .modal-dialog').addClass('big-modal');
  },

  serializeData: function(){
    return _.extend({
      settings: this.settings,
      pSettings: this.projectSettings,
      statuses: this.getStatuses()
    }, this.model.toJSON());
  },

  onDestroy: function(){
    $('.modal > .modal-dialog').removeClass('big-modal');
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  hiddenSettings: [],
  keywords: '',
  sorting: '',
  status: '',
  slider: 0,

  onClickSetting: function(e){
    var ele = $('input', e.currentTarget);
    var id = ele.attr('id');
    var checked = $(ele).is(':checked');
    var idx = this.hiddenSettings.indexOf(id);

    if (id === 'slider'){
      this.onChangeSlider();
      return;
    }

    if (ele.attr('disabled')){
      return;
    }

    function toggleLogo(){
      if (id === "title" && !this.ui.title.is(':checked')){
        this.ui.logo
          .attr('disabled', 'disabled')
          .parents('.checkbox').addClass('disabled');
      }
      else {
        this.ui.logo
          .attr('disabled', false)
          .parents('.checkbox').removeClass('disabled');
      }
    }

    if (checked){
      if(idx > -1){
        this.hiddenSettings.splice(idx, 1);
        this.reloadPreview();
      }

      toggleLogo.call(this);
      return;
    }

    if (idx === -1){
      this.hiddenSettings.push(id);
      this.reloadPreview();
      toggleLogo.call(this);
    }
  },

  onChangeSlider: function(){
    var checked = $("#slider", this.$el).is(':checked');
    var slides = parseInt($('#slides', this.$el).val(), 10);

    if (!slides || slides < 1){
      slides = 1;
    }
    if (slides > 6){
      slides = 6;
    }

    $('#slides', this.$el).val(slides);

    this.slider = checked ? (slides || 1) : 0;

    this.reloadPreview();
  },

  onChangeStatus: function(){
    this.status = this.ui.status.val();

    if (this.status.toLowerCase() === 'all'){
      this.status = null;
    }

    this.reloadPreview();
  },

  onKeyword: function(){
    this.keywords = this.ui.searchbox.val();
    this.reloadPreview();
  },

  sortClicked: function(e){
    e.preventDefault();
    this.sorting = $('input[type=radio]', e.currentTarget)[0].id;
    this.reloadPreview();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  getStatuses: function(){
    var counts = hackdash.app.projects.getStatusCount();
    return _.map(counts, function(item, key){
      return { name: key, count: item };
    });
  },

  reloadPreview: function(){
    var embedUrl = window.location.protocol + "//" + window.location.host;
    var fragment = '/embed/dashboards/' + this.model.get('domain');
    var hide = 'hide=';
    var query = (this.keywords ? '&query=' + this.keywords : '');
    var sort = (this.sorting ? '&sort=' + this.sorting : '');
    var status = (this.status ? '&status=' + this.status : '');
    var slider = (this.slider > 0 ? '&slider=' + this.slider : '');

    _.each(this.hiddenSettings, function(id){
      hide += id + ',';
    }, this);

    var url = embedUrl + fragment + '?' +
      (this.hiddenSettings.length ? hide : '') + query + sort + status + slider;

    this.ui.preview.attr('src', url);
    this.ui.code.val(this.embedTmpl({ url: url }));
    this.ui.sharelink.attr({ href: url }).text(url);
  },

  settings: [{
    code: 'title',
    name: 'Title'
  }, {
    code: 'desc',
    name: 'Description'
  }, {
    code: 'logo',
    name: 'Hackdash Logo'
  }],

  projectSettings: [{
    code: 'pprg',
    name: 'Progress',
    project: true
  }, {
    code: 'ptitle',
    name: 'Title',
    project: true
  }, {
    code: 'pcontrib',
    name: 'Contributors',
    project: true
  }, {
    code: 'pacnbar',
    name: 'Action Bar',
    project: true
  }]

});
},{"./templates/share.hbs":38}],31:[function(require,module,exports){
/**
 * VIEW: User
 *
 */

var template = require('./templates/user.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  tagName: "li",
  template: template,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    $('.tooltips', this.$el).tooltip({});
  }

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
},{"./templates/user.hbs":39}],32:[function(require,module,exports){
/**
 * VIEW: Collection of Users
 *
 */

var template = require('./templates/users.hbs')
  , User = require('./User')
  , AddAdmin = require('./AddAdmin');

module.exports = Backbone.Marionette.CompositeView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  childViewContainer: "ul",
  childView: User,

  events: {
    "click a.add-admins": "showAddAdmins"
  },

  templateHelpers: {
    isAdmin: function(){
      var user = hackdash.user;
      return user && user.admin_in.indexOf(this.domain) >= 0 || false;
    }
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    $('.tooltips', this.$el).tooltip({});
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  showAddAdmins: function(){
    hackdash.app.modals.show(new AddAdmin({
      collection: this.collection
    }));
  }

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"./AddAdmin":26,"./User":31,"./templates/users.hbs":40}],33:[function(require,module,exports){
/**
 * VIEW: Dashboard Projects Layout
 *
 */

var template = require('./templates/index.hbs')
  , UsersView = require('./Users')
  , DashboardView = require('./Dashboard')
  , ProjectsView = require('../Project/Collection')
  , Sharer = require("../Sharer");

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "page-ctn dashboard",
  template: template,

  ui: {
    inactiveCtn: ".inactive-ctn",
    shareLink: '.share'
  },

  events: {
    "click .share": "showShare",
    "click .login": "showLogin"
  },

  regions: {
    "dashboard": ".dash-details",
    "admins": ".dash-admins",
    "projects": "#dashboard-projects",
    "inactives": "#inactive-projects"
  },

  modelEvents:{
    "edit:showcase": "onStartEditShowcase",
    "end:showcase": "onEndEditShowcase",
    "save:showcase": "onSaveEditShowcase"
  },

  templateHelpers: {
    isDashOpen: function(){
      var isDashboard = (hackdash.app.type === "dashboard" ? true : false);
      if (!isDashboard){
        return false;
      }
      return this.open;
    }
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  showcaseMode: false,
  showcaseSort: false,

  onRender: function(){
    var self = this;

    this.dashboard.show(new DashboardView({
      model: this.model
    }));

    this.model.get("admins").fetch().done(function(){
      self.admins.show(new UsersView({
        model: self.model,
        collection: self.model.get("admins")
      }));
    });

    if (this.showcaseMode){
      this.projects.show(new ProjectsView({
        model: this.model,
        collection: hackdash.app.projects.getActives(),
        showcaseMode: true
      }));

      this.ui.inactiveCtn.removeClass("hide");

      this.inactives.show(new ProjectsView({
        model: this.model,
        collection: hackdash.app.projects.getInactives()
      }));

      hackdash.app.projects.off("change:active").on("change:active", function(){
        self.projects.currentView.collection = hackdash.app.projects.getActives();
        self.inactives.currentView.collection = hackdash.app.projects.getInactives();

        self.model.isDirty = true;

        self.projects.currentView.render();
        self.inactives.currentView.render();
      });
    }
    else {
      this.ui.inactiveCtn.addClass("hide");

      var pView = new ProjectsView({
        model: this.model,
        collection: hackdash.app.projects,
        showcaseMode: false,
        showcaseSort: this.showcaseSort
      });

      pView.on('ended:render', function(){
        var sort = hackdash.getQueryVariable('sort');
        if (!self.showcaseSort && sort){
          pView['sortBy' + sort.charAt(0).toUpperCase() + sort.slice(1)]();
        }
      });

      this.projects.show(pView);
    }

    $(".tooltips", this.$el).tooltip({});
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  showLogin: function(){
    hackdash.app.showLogin();
  },

  showShare: function(){
    Sharer.show(this.ui.shareLink, {
      type: 'dashboard',
      model: this.model
    });
  },

  onStartEditShowcase: function(){
    this.showcaseMode = true;
    this.render();
  },

  onSaveEditShowcase: function(){
    var showcase = this.projects.currentView.updateShowcaseOrder();
    this.model.save({ "showcase": showcase });

    this.model.isDirty = false;
    this.onEndEditShowcase();
  },

  onEndEditShowcase: function(){
    this.model.isShowcaseMode = false;
    this.model.trigger("change");

    this.showcaseSort = true;
    this.showcaseMode = false;
    this.render();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});

},{"../Project/Collection":128,"../Sharer":137,"./Dashboard":29,"./Users":32,"./templates/index.hbs":37}],34:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    return "    <p class=\"bg-warning\">Warning! you will NOT be able to delete this dashboard if you add an admin!</p>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "<div class=\"modal-header\">\n  <button type=\"button\" data-dismiss=\"modal\" aria-hidden=\"true\" class=\"close\">×</button>\n  <h3>Add Dashboard Admin</h3>\n</div>\n<div class=\"modal-body\">\n"
    + ((stack1 = helpers["if"].call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.showAdmin : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "  <div class=\"input-group\">\n    <span class=\"input-group-addon\">\n      <i class=\"fa fa-user\"></i>\n    </span>\n    <input id=\"txtUser\" type=\"text\" class=\"form-control\" placeholder=\"type name or username\" autocomplete=\"off\">\n  </div>\n</div>\n<div class=\"modal-footer\">\n  <input id=\"save\" type=\"button\" class=\"btn btn-success pull-right\" value=\"ADD\">\n  <a class=\"btn-cancel pull-left\" data-dismiss=\"modal\">cancel</a>\n</div>";
},"useData":true});

},{"hbsfy/runtime":162}],35:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    return "list";
},"3":function(container,depth0,helpers,partials,data) {
    return "  <div style=\"background-image: url("
    + container.escapeExpression(container.lambda(depth0, depth0))
    + ");\"></div>\n";
},"5":function(container,depth0,helpers,partials,data) {
    return "  <i class=\"item-letter\">"
    + container.escapeExpression((helpers.firstLetter || (depth0 && depth0.firstLetter) || helpers.helperMissing).call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.title : depth0),{"name":"firstLetter","hash":{},"data":data}))
    + "</i>\n";
},"7":function(container,depth0,helpers,partials,data) {
    return "  <i class=\"item-letter\">"
    + container.escapeExpression((helpers.firstLetter || (depth0 && depth0.firstLetter) || helpers.helperMissing).call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.domain : depth0),{"name":"firstLetter","hash":{},"data":data}))
    + "</i>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"cover "
    + ((stack1 = helpers["if"].call(alias1,((stack1 = (depth0 != null ? depth0.covers : depth0)) != null ? stack1.length : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\">\n"
    + ((stack1 = (helpers.each_upto_rnd || (depth0 && depth0.each_upto_rnd) || alias2).call(alias1,(depth0 != null ? depth0.covers : depth0),1,{"name":"each_upto_rnd","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.title : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.program(7, data, 0),"data":data})) != null ? stack1 : "")
    + "</div>\n\n<div class=\"details\">\n  <div>\n    <h2>"
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "</h2>\n    <h3>"
    + alias4(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"domain","hash":{},"data":data}) : helper)))
    + "</h3>\n  </div>\n</div>\n\n<div class=\"action-bar text-center\">\n  <i class=\"fa fa-clock-o timer\" title=\""
    + alias4((helpers.timeAgo || (depth0 && depth0.timeAgo) || alias2).call(alias1,(depth0 != null ? depth0.created_at : depth0),{"name":"timeAgo","hash":{},"data":data}))
    + "\"></i>\n  <span>"
    + alias4(((helper = (helper = helpers.projectsCount || (depth0 != null ? depth0.projectsCount : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"projectsCount","hash":{},"data":data}) : helper)))
    + " Projects</span>\n</div>";
},"useData":true});

},{"hbsfy/runtime":162}],36:[function(require,module,exports){
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

},{"hbsfy/runtime":162}],37:[function(require,module,exports){
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

},{"hbsfy/runtime":162}],38:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "\n        <div class=\"checkbox\">\n          <label>\n            <input id=\""
    + alias4(((helper = (helper = helpers.code || (depth0 != null ? depth0.code : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"code","hash":{},"data":data}) : helper)))
    + "\" type=\"checkbox\" checked> "
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "\n          </label>\n        </div>\n\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "\n          <div class=\"checkbox\">\n            <label>\n              <input id=\""
    + alias4(((helper = (helper = helpers.code || (depth0 != null ? depth0.code : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"code","hash":{},"data":data}) : helper)))
    + "\" type=\"checkbox\" checked> "
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "\n            </label>\n          </div>\n\n";
},"5":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "              <option value=\""
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "\">"
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + " ["
    + alias4(((helper = (helper = helpers.count || (depth0 != null ? depth0.count : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"count","hash":{},"data":data}) : helper)))
    + "]</option>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {};

  return "<div class=\"modal-body\">\n\n  <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\n    <i class=\"fa fa-close\"></i>\n  </button>\n\n  <div class=\"row\">\n    <div class=\"col-md-5 col-lg-3\">\n\n      <h1>embed this event board</h1>\n\n      <div class=\"settings\">\n\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.settings : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n        <form class=\"form-inline slider\">\n          <div class=\"form-group\">\n            <div class=\"checkbox\">\n              <label>\n                <input id=\"slider\" type=\"checkbox\">\n              </label>\n            </div>\n            <label for=\"slider\">Slider</label>\n            <input id=\"slides\" type=\"number\" min=\"1\" max=\"6\" value=\"1\">\n          </div>\n        </form>\n\n        <div>\n          <h5>Projects</h5>\n\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.pSettings : depth0),{"name":"each","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n          <div class=\"form-group\">\n            <select name=\"status\" class=\"form-control status\" value=\""
    + container.escapeExpression(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"status","hash":{},"data":data}) : helper)))
    + "\">\n              <option value=\"all\" selected=\"true\">ANY STATUS</option>\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.statuses : depth0),{"name":"each","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "            </select>\n          </div>\n\n        </div>\n\n      </div>\n\n      <label class=\"get-code\">Add this event board to your website by coping this code below</label>\n      <textarea id=\"embed-code\" onclick=\"this.focus();this.select();\" readonly=\"readonly\"></textarea>\n\n    </div>\n    <div class=\"col-md-7 col-lg-9\" style=\"position:relative;\">\n\n      <div class=\"col-xs-12 col-sm-12 share-dashboard-filters\">\n\n        <div class=\"col-xs-12 col-sm-4 col-md-4\">\n          <input id=\"keywords\" type=\"text\" class=\"form-control\" placeholder=\"keywords\">\n        </div>\n\n        <div class=\"col-xs-12 col-sm-8 col-md-8\">\n          <div class=\"btn-group pull-right\" data-toggle=\"buttons\">\n            <label class=\"btn btn-default\">\n              <input type=\"radio\" name=\"options\" id=\"name\" autocomplete=\"off\"> By Name\n            </label>\n            <label class=\"btn btn-default active\">\n              <input type=\"radio\" name=\"options\" id=\"date\" autocomplete=\"off\"> By Date\n            </label>\n            <label class=\"btn btn-default\">\n              <input type=\"radio\" name=\"options\" id=\"showcase\" autocomplete=\"off\"> Showcase\n            </label>\n          </div>\n        </div>\n\n      </div>\n\n      <div class=\"col-xs-12 dash-share-link\">\n        <h3>Share Link</h3>\n        <a target=\"_blank\" data-bypass=\"true\"></a>\n      </div>\n\n      <div class=\"col-xs-12 dash-preview-help\">\n        <h3>Preview</h3>\n        <p>The embedded code will show exactly what's below</p>\n      </div>\n\n      <div class=\"col-xs-12 preview\">\n        <iframe width=\"100%\" height=\"450\" title=\"Hackdash\" frameborder=\"0\" allowtransparency=\"true\"></iframe>\n      </div>\n    </div>\n  </div>\n\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],39:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3=container.escapeExpression;

  return "<a href=\"/users/"
    + alias3(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\">\n  "
    + alias3((helpers.getProfileImage || (depth0 && depth0.getProfileImage) || alias2).call(alias1,depth0,{"name":"getProfileImage","hash":{},"data":data}))
    + "\n</a>";
},"useData":true});

},{"hbsfy/runtime":162}],40:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    return "<a class=\"tooltips add-admins\" title=\"Add admins\">\n  <i class=\"fa fa-plus\"></i>\n</a>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "<ul></ul>\n"
    + ((stack1 = helpers["if"].call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.isAdmin : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "");
},"useData":true});

},{"hbsfy/runtime":162}],41:[function(require,module,exports){

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

      var msg1 = "This Dashboard is open: click to close";
      var msg2 = "Anyone can see the projects in this Dashboard: click to privatize";

      if (!this.model.get("open")) {
        msg1 = "This Dashboard is closed: click to reopen";
        msg1 = "Nobody can see the projects in this Dashboard: click to publish";
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

  changeShowcaseMode: function() {
    if (this.ui.showcaseMode.hasClass("on")) {

      this.model.trigger("save:showcase");
      this.model.trigger("end:showcase");

      this.model.isShowcaseMode = false;

      this.ui.showcaseMode
        .html("<i class='btn-danger txt'>off</i><div>Edit Showcase</div>")
        .removeClass("on");

      this.ui.createShowcase.removeClass("hide");
      this.ui.footerToggle.removeClass("hide");
    }
    else {
      this.model.isShowcaseMode = true;
      this.model.trigger("edit:showcase");

      this.ui.showcaseMode
        .text("Save Showcase")
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

},{"../../models/Dashboard":12,"./templates/admin.hbs":43}],42:[function(require,module,exports){
var
    template = require('Footer/templates/footer.hbs')
  , AdminFooter = require('./AdminFooter');

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "footer",
  template: template,

  ui: {
    "up": ".up-button"
  },

  regions: {
    'adminRegion': '.admin-footer'
  },

  events: {
    "click @ui.up": "goTop"
  },

  templateHelpers: function() {
    return {
      isAdmin: this.isAnyAdmin.apply(this)
    };
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    this.setStatics();
    if(this.isAnyAdmin()) {
      this.adminRegion.show(new AdminFooter({
        model: this.model
      }));
    }
/*
    if (hackdash.app.type !== "dashboard"){
      this.$el.addClass('unlocked');
    }
*/
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  upBlocked: false,
  goTop: function(){

    if (!this.upBlocked){
      this.upBlocked = true;

      var body = $("html, body"), self = this;
      body.animate({ scrollTop:0 }, 1500, 'swing', function() {
        self.upBlocked = false;
      });
    }
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  isAnyAdmin: function() {
    var user = hackdash.user;

    if(user && this.model) {
      var domain = this.model.get('domain');
      var owner = this.model.get('owner');
      var admin1 = user.admin_in.indexOf(domain) >= 0;
      // If it has owner property its a collection
      var admin2 = owner && user._id === owner._id;
      return admin1 || admin2;
    }
    return false;
  },

  setStatics: function(){
    var statics = ['project', 'profile'];

    if (statics.indexOf(hackdash.app.type) > -1){
      this.$el.addClass('static');
      return;
    }

    function isAdmin(domain){
      var user = hackdash.user;
      return user && user.admin_in.indexOf(domain) >= 0 || false;
    }

    if (hackdash.app.type === 'dashboard' && !isAdmin(this.model.get('domain')) ){
      this.$el.addClass('static');
    }
  }

});

},{"./AdminFooter":41,"Footer/templates/footer.hbs":164}],43:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    return " hidden";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "\n  <div class=\"footer-toggle-ctn\">\n\n    <a href=\"/api/v2/dashboards/"
    + alias4(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"domain","hash":{},"data":data}) : helper)))
    + "/csv\" target=\"_blank\" data-bypass>\n      <i class=\"fa fa-download\"></i>\n      <div>Export .CSV File</div>\n    </a>\n\n    <a class=\"btn-admin-forms\" href=\"/dashboards/"
    + alias4(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"domain","hash":{},"data":data}) : helper)))
    + "/forms\">\n      <i class=\"fa fa-file-text-o\"></i><div>Admin forms</div>\n    </a>\n\n    <a data-placement=\"top\" data-original-title=\""
    + alias4(((helper = (helper = helpers.privateMsg || (depth0 != null ? depth0.privateMsg : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"privateMsg","hash":{},"data":data}) : helper)))
    + "\"\n      class=\"tooltips dashboard-private "
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0["private"] : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.program(6, data, 0),"data":data})) != null ? stack1 : "")
    + "\">\n      <i class=\"txt "
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0["private"] : depth0),{"name":"if","hash":{},"fn":container.program(8, data, 0),"inverse":container.program(10, data, 0),"data":data})) != null ? stack1 : "")
    + "\">"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0["private"] : depth0),{"name":"if","hash":{},"fn":container.program(12, data, 0),"inverse":container.program(14, data, 0),"data":data})) != null ? stack1 : "")
    + "</i>\n      <div>Visibility</div>\n    </a>\n\n    <div class=\"box\"><label>Active statuses</label>\n      <select class=\"active-statuses\" multiple>\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.statuses : depth0),{"name":"each","hash":{},"fn":container.program(16, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "      </select>\n    </div>\n\n  </div>\n\n";
},"4":function(container,depth0,helpers,partials,data) {
    return "dash-private";
},"6":function(container,depth0,helpers,partials,data) {
    return "dash-public";
},"8":function(container,depth0,helpers,partials,data) {
    return "btn-danger";
},"10":function(container,depth0,helpers,partials,data) {
    return "btn-success";
},"12":function(container,depth0,helpers,partials,data) {
    return "Private";
},"14":function(container,depth0,helpers,partials,data) {
    return "Public";
},"16":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "        <option value=\""
    + alias4(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"status","hash":{},"data":data}) : helper)))
    + "\""
    + alias4((helpers.selected || (depth0 && depth0.selected) || alias2).call(alias1,(depth0 != null ? depth0.active : depth0),true,{"name":"selected","hash":{},"data":data}))
    + ">"
    + alias4(((helper = (helper = helpers.text || (depth0 != null ? depth0.text : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"text","hash":{},"data":data}) : helper)))
    + "</option>\n";
},"18":function(container,depth0,helpers,partials,data) {
    var helper;

  return "      <a class=\"btn-admin-forms\" href=\"/collections/"
    + container.escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"_id","hash":{},"data":data}) : helper)))
    + "/forms\">\n        <i class=\"fa fa-file-text-o\"></i><div>Admin forms</div>\n      </a>\n";
},"20":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {};

  return "\n  <a data-placement=\"top\" data-original-title=\""
    + container.escapeExpression(((helper = (helper = helpers.switcherMsg || (depth0 != null ? depth0.switcherMsg : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"switcherMsg","hash":{},"data":data}) : helper)))
    + "\"\n    class=\"tooltips dashboard-btn footer-toggle-ctn "
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.open : depth0),{"name":"if","hash":{},"fn":container.program(21, data, 0),"inverse":container.program(23, data, 0),"data":data})) != null ? stack1 : "")
    + "\">\n    <i class=\"txt "
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.open : depth0),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.program(8, data, 0),"data":data})) != null ? stack1 : "")
    + "\">"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.open : depth0),{"name":"if","hash":{},"fn":container.program(25, data, 0),"inverse":container.program(27, data, 0),"data":data})) != null ? stack1 : "")
    + "</i>\n    <div>Board Status</div>\n  </a>\n\n  <a class=\"btn-showcase-mode\">\n    <i class=\"btn-danger txt\">off</i><div>Edit Showcase</div>\n  </a>\n\n";
},"21":function(container,depth0,helpers,partials,data) {
    return "dash-open";
},"23":function(container,depth0,helpers,partials,data) {
    return "dash-close";
},"25":function(container,depth0,helpers,partials,data) {
    return "Open";
},"27":function(container,depth0,helpers,partials,data) {
    return "Close";
},"29":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.isDashboardForm : depth0),{"name":"if","hash":{},"fn":container.program(30, data, 0),"inverse":container.program(32, data, 0),"data":data})) != null ? stack1 : "");
},"30":function(container,depth0,helpers,partials,data) {
    var helper;

  return "    <a href=\"/dashboards/"
    + container.escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"domain","hash":{},"data":data}) : helper)))
    + "\">\n      <i class=\"fa fa-dashboard\"></i>\n      <div>Back to dashboard</div>\n    </a>\n";
},"32":function(container,depth0,helpers,partials,data) {
    var helper;

  return "    <a href=\"/collections/"
    + container.escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"_id","hash":{},"data":data}) : helper)))
    + "\">\n      <i class=\"fa fa-object-group\"></i>\n      <div>Back to collection</div>\n    </a>\n";
},"34":function(container,depth0,helpers,partials,data) {
    return "  <a class=\"btn-open-admin footer-toggle-ctn\">\n    <i class=\"fa fa-cogs\"></i><div>Admin stuff</div>\n  </a>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : {};

  return "\n<div class=\"footer-dash-ctn"
    + ((stack1 = helpers.unless.call(alias1,(depth0 != null ? depth0.adminOpened : depth0),{"name":"unless","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\">\n\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.isDashboard : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.isCollection : depth0),{"name":"if","hash":{},"fn":container.program(18, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n</div>\n\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.isDashboard : depth0),{"name":"if","hash":{},"fn":container.program(20, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.isForm : depth0),{"name":"if","hash":{},"fn":container.program(29, data, 0),"inverse":container.program(34, data, 0),"data":data})) != null ? stack1 : "")
    + "\n";
},"useData":true});

},{"hbsfy/runtime":162}],44:[function(require,module,exports){
/**
 * VIEW: Login Modal
 *
 */

var template = require('./templates/forgot.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "forgot",
  template: template,

  events: {
    "click .close": "destroy"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------
  initialize: function(options){
    this.flashError = (options && options.model && options.model.attributes && options.model.attributes.flashError) || '';
    this.flashMessage = (options && options.model && options.model.attributes && options.model.attributes.flashMessage) || '';
    this.token = (options && options.model && options.model.attributes && options.model.attributes.token) || null;
  },

  templateHelpers: function() {
    var flashError = this.flashError;
    var flashMessage = this.flashMessage;
    var token = this.token;
    return {
      token: function(){
        return token;
      },
      showErrors: function(){
        return flashError;
      },
      showMessages: function(){
        return flashMessage;
      },
      redirectURL: function(){
        var url = hackdash.app.previousURL || '';
        return (url.length ? '?redirect=' + url : url);
      }
    };
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
},{"./templates/forgot.hbs":138}],45:[function(require,module,exports){
/**
 * VIEW: Form Layout
 *
 */

var
    template = require('./templates/editForms.hbs')
  , EditForm = require('./EditForm')
  , FormList = require('./EditFormList')
  , Form = require("../../models/Form")
  , Forms = require("../../models/Forms")
  ;

module.exports = Backbone.Marionette.LayoutView.extend({

  className: "page-ctn forms",
  template: template,

  regions: {
    formList: ".forms-list",
  },

  events: {
    'click .new-form': 'editForm',
    'click .edit-form': 'editForm'
  },

  modelEvents: {
    "change": "render"
  },

  templateHelpers: {
    itemTitle: function() {
      return this.title || this.domain;
    },
    isDashboard: function() {
      return hackdash.app.type === 'dashboard_form';
    }
  },

  onRender: function(){
    var self = this;

    this.drawFormList();
    // Listens 'edited' event fired in EditForm
    // to reload the list if changes
    hackdash.app.modals.on('form_edited', function(id){
      self.drawFormList(id);
    });
    hackdash.app.modals.on('form_destroyed', function(){
      self.drawFormList();
    });

  },

  drawFormList: function(id) {
    var self = this;
    var forms = new Forms();

    forms.domain = this.model.get('domain'); //one of both will be empty
    forms.group = this.model.get('group');
    forms.fetch().done(function(){
      self.formList.show(new FormList({
        // collection: forms.getActives(),
        collection: forms, // All forms to admin
        openedForm: id
      }));
    });
  },

  editForm: function(e) {
    var id = $(e.target).data('id');
    var form = new Form({
        id: id,
        domain: this.model.get('domain'),
        group: this.model.get('group'),
      });
    // console.log(id ? 'edit' : 'new', id, form);
    if(id) {
      form.fetch().done(function(){
        hackdash.app.modals.show(new EditForm({
          model: form
        }));
      });
    } else {
      hackdash.app.modals.show(new EditForm({
        model: form
      }));
    }
  },

});

},{"../../models/Form":14,"../../models/Forms":15,"./EditForm":47,"./EditFormList":49,"./templates/editForms.hbs":78}],46:[function(require,module,exports){
/**
 * Optional fields for Form Editor field type 'Select'
 */

var template = require('./templates/questionOptionsFile.hbs');

module.exports = Backbone.Marionette.ItemView.extend({
  template: template,

  ui: {
    'images': 'input[type=checkbox]',
  },

  templateHelpers: function() {
    var options = this.model.get('options') || {};
    return {
      images: function() {
        return !!options.images;
      }
    };
  },

  getOptions: function() {
    var images = this.ui.images.is(':checked');
    return {
      images: images,
    };
  }
});

},{"./templates/questionOptionsFile.hbs":85}],47:[function(require,module,exports){
/**
 * VIEW: addQuestion
 *
 */

var
    template = require('./templates/editForm.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  className: "page-ctn form edition",
  template: template,

  ui: {
    'title' : 'input[name=title]',
    'description' : 'textarea[name=description]',
    'template' : 'input[name=template]',
    'fromTemplate': '.from-template'
  },

  events: {
    "click #save": "save",
    "click #delete": "delete",
    "change @ui.fromTemplate": 'createFromTemplate'
  },

  modelEvents: {
    "change": "render"
  },

  errors: {
    "title_required": "Title is required"
  },

  templateHelpers: function() {

    return {
      isNew: function() {
        return !this._id;
      },

      showTemplates: function() {
        return this.templates && this.templates.length;
      },
      getTemplates: function() {
        return _.map(this.templates, function(t) {
          return {
            id: t._id,
            desc: t.title + ' - From ' + (t.group ? 'Collection [' + t.group.title + ']' : 'Dashboard [' + t.domain + ']')
          };
        });
      }
    };
  },

  initialize: function() {
    var self = this;
    if(!self.model.get('_id')) {
      // fetch templates
      self.model.fetchTemplates(function(err, templates) {
        if(err) {
          return window.alert('Templates cannot be fetched! '+ err);
        }
        self.model.set({'templates': templates});
      });
    }
  },

  onRender: function() {
    this.simplemde = new window.SimpleMDE({
      element: this.ui.description.get(0),
      forceSync: true,
      spellChecker: false
    });
    this.ui.fromTemplate.select2({
      theme: 'bootstrap',
      dropdownParent: this.$el
    });
  },

  save: function(){

    var toSave = {
      title: this.ui.title.val(),
      description: this.ui.description.val(),
      template: this.ui.template.is(':checked')
    };

    // console.log(toSave, this.model, this.model.isNew());

    this.cleanErrors();

    $("#save", this.$el).button('loading');

    this.model
      .save(toSave, { patch: true, silent: true })
      .success(this.destroyModal.bind(this))
      .error(this.showError.bind(this));
  },

  createFromTemplate: function() {
    var template = _.findWhere(this.model.get('templates'), {_id: this.ui.fromTemplate.val()});
    var sanitized = _.omit(template, ['_id', 'created_at', 'creator', 'domain', 'group']);
    sanitized.title = '[COPY] ' + sanitized.title;
    // console.log('Create from template', template, sanitized);

    $("#save", this.$el).button('loading');

    this.model.save(sanitized, { patch: true, silent: true })
      .success(this.destroyModal.bind(this))
      .error(this.showError.bind(this));
  },

  delete: function() {
    var id = this.model.get('_id');
    if(!id) {
      return this.destroy();
    }
    if(window.confirm("Are you sure? Kittens may (and will) die!\nForms already responded cannot be deleted.")) {
      $("#delete", this.$el).button('loading');

      this.model
        .destroy({ silent: true })
        .success(this.destroyModal.bind(this))
        .error(this.showError.bind(this));
    }
  },

  destroyModal: function() {
    hackdash.app.modals.trigger('form_destroyed', this.model.get('id'));
    // TODO: update view
    this.destroy();
  },


  showError: function(err) {
    $("#save", this.$el).button('reset');
    $("#delete", this.$el).button('reset');

    if (err.responseText === "OK"){
      this.destroyModal();
      return;
    }

    try {
      var error = JSON.parse(err.responseText).error;
      var ctrl = error.split("_")[0];
      this.ui[ctrl].parents('.control-group').addClass('error');
      this.ui[ctrl].after('<span class="help-inline">' + this.errors[error] + '</span>');
    } catch(e) {
      window.alert(err.responseText);
    }

  },

  cleanErrors: function(){
    $(".error", this.$el).removeClass("error");
    $("span.help-inline", this.$el).remove();
  },
});

},{"./templates/editForm.hbs":76}],48:[function(require,module,exports){
/**
 * VIEW: Question List
 *
 */

var
    template = require('./templates/editFormItem.hbs')
  , Form = require('./../../models/Form')
  , EditQuestion = require('./EditQuestion')
  , QuestionList = require('./EditQuestionList')
  , FormRender = require('./FormRender');

module.exports = Backbone.Marionette.LayoutView.extend({

  template: template,

  regions: {
    questionsList: ".questions-list",
  },

  events: {
    'click .new-question': 'editQuestion',
    'click .preview-form': 'previewForm',
    'click .edit-question': 'editQuestion',
    "click .public-btn": 'onClickSwitcher'
  },

  templateHelpers: {
    opened: function() {
      // console.log('opened',this.openedForm, this._id);
      if(this.openedForm) {
        return this.openedForm === this._id;
      }
      return this.index === this.total;
    }
  },

  modelEvents: {
    "change": "render"
  },


  initialize: function() {
    // console.log('init',this.options.openedForm);
    this.model.set({
        index: this.options.index,
        total: this.options.total,
        openedForm: this.options.openedForm
      });
  },

  serializeData: function(){

    var msg = "This Form is open: click to close";

    if (!this.model.get("open")) {
      msg = "This Form is closed: click to reopen. A message will be sent to all project leaders involved (only if not previously sent)";
    }
    return _.extend({
      switcherMsg: msg
    }, this.model.toJSON());
  },

  onRender: function(){
    $('.tooltips', this.$el).tooltip({});
    this.drawQuestionList();
  },

  drawQuestionList: function() {
    var form = this.model;
    this.questionsList.show(new QuestionList({
      model: form,
      collection: form.getQuestions()
    }));
  },

  previewForm: function() {
    var form = new Form({
      id: this.model.get('_id'),
      domain: this.model.get('domain'),
      group: this.model.get('group'),
      questions: this.model.get('questions')
    });
    // Make a bigger modal
    form.fetch().done(function(){
      $('.modal .modal-dialog').addClass('modal-lg');
      hackdash.app.modals.show(new FormRender({
        model: form
      }));
      $('.modal').one('hide.bs.modal', function() {
        $('.modal .modal-dialog').removeClass('modal-lg');
      });
    });
  },

  editQuestion: function(e) {
    var id = $(e.target).is('[id]') ? $(e.target).attr('id') : null;
    var form = new Form({
      id: this.model.get('_id'),
      domain: this.model.get('domain'),
      group: this.model.get('group'),
      questions: this.model.get('questions'),
      questionId: id
    });

    if(id) {
      // console.log('edit-' + id, form);
      form.fetch().done(function(){
        hackdash.app.modals.show(new EditQuestion({
          model: form
        }));
      });
    } else {
      // console.log('new', form);
      hackdash.app.modals.show(new EditQuestion({
        model: form
      }));
    }
  },

  onClickSwitcher: function(e) {
    var $e = $(e.target).is('[data-id]') ? $(e.target) : $(e.target).closest('.public-btn');
    var self = this;
    var form = new Form({
      id: this.model.get('_id'),
      domain: this.model.get('domain'),
      group: this.model.get('group')
    });
    var open = true;

    if ($e.hasClass("form-open")){
      open = false;
    }

    form.fetch().done(function(){

      $('.tooltips', self.$el).tooltip('hide');

      form.set({ "open": open }, { patch:true, trigger: false });
      form.save({ wait: true });
      self.model = form;
      self.render();
    });
  }

});

},{"./../../models/Form":14,"./EditQuestion":51,"./EditQuestionList":53,"./FormRender":73,"./templates/editFormItem.hbs":77}],49:[function(require,module,exports){
/**
 * VIEW: Form List
 *
 */

var FormItem = require('./EditFormItem');

var EmptyView = Backbone.Marionette.ItemView.extend({
  template: _.template('<p class="text-danger">No forms yet!</p>')
});

module.exports = Backbone.Marionette.CollectionView.extend({

  tagName: 'div',
  className: 'panel-group',

  childView: FormItem,

  emptyView: EmptyView,

  initialize: function() {
    this.openedForm = this.options.openedForm;
  },

  childViewOptions: function (model) {
    return {
      index: this.collection.indexOf(model) + 1,
      total: this.collection.length,
      openedForm: this.openedForm
    };
  },


});

},{"./EditFormItem":48}],50:[function(require,module,exports){
/**
 * Optional fields for Form Editor field type 'Select'
 */

var template = require('./templates/questionOptionsGeocoder.hbs');

module.exports = Backbone.Marionette.ItemView.extend({
  template: template,

  ui: {
    'browser': 'input[type=checkbox]',
  },

  templateHelpers: function() {
    var options = this.model.get('options') || {};
    return {
      browser: function() {
        return !!options.browser;
      }
    };
  },

  getOptions: function() {
    var browser = this.ui.browser.is(':checked');
    return {
      browser: browser,
    };
  }
});

},{"./templates/questionOptionsGeocoder.hbs":86}],51:[function(require,module,exports){
/**
 * VIEW: addQuestion
 *
 */

var
    template = require('./templates/editQuestion.hbs')
  , OptSelect = require('./EditSelectOptions')
  , OptGeocoder = require('./EditGeocoderOptions')
  , OptFile = require('./EditFileOptions')
  , OptRange = require('./EditRangeOptions');

module.exports = Backbone.Marionette.LayoutView.extend({

  className: "page-ctn form edition",
  template: template,

  ui: {
    'title' : 'input[name=title]',
    'type' : 'select[name=type]',
    'help' : 'input[name=help]'
  },

  regions: {
    optionsRegion: '.question-options'
  },

  events: {
    "click #save": "save",
    "click #delete": "delete",
    "change @ui.type": "changeType"
  },

  modelEvents: {
    "change": "render"
  },

  templateHelpers: function() {
    var self = this;
    return {
      title: function() {
        return this.current ? this.current.title : '';
      },
      type: function() {
        return this.current ? this.current.type : null;
      },
      help: function() {
        return this.current ? this.current.help : null;
      },
      typeSelected: function(type) {
        return self.isType.call(this, type) ? ' selected' : '';
      }
    };
  },

  errors: {
    "title_required": "Title is required",
    "type_required": "Type is required"
  },

  initialize: function () {
    var id = this.model.get('questionId');
    if(id) {
      this.model.set({current: _.findWhere(this.model.get('questions'), {_id: id})});
    }
  },

  onRender: function() {
    this.setOptions();
  },

  setOptions: function() {
    var c = this.model.get('current') ? this.model.get('current') : {};
    this.optionsRegion.reset();
    this.subOptions = null;
    var region = null;
    if(c.type === 'select') {
      region = new OptSelect({ model: new Backbone.Model(c) });
    }
    if(c.type === 'range') {
      region = new OptRange({ model: new Backbone.Model(c) });
    }
    if(c.type === 'geocoder') {
      region = new OptGeocoder({ model: new Backbone.Model(c) });
    }
    if(c.type === 'file') {
      region = new OptFile({ model: new Backbone.Model(c) });
    }
    if(region) {
      this.optionsRegion.show(region);
      this.subOptions = region;
    }
  },

  changeType: function() {
    var c = this.model.get('current') ? this.model.get('current') : {};
    c.type = this.ui.type.val();
    c.title = this.ui.title.val();
    c.help = this.ui.help.val();
    this.model.set({current: c});
    this.setOptions();
  },

  /**
   * Saves the question into model.questions and maintants the sub-ObjectID
   */
  save: function(){
    var model = this.model;
    var toSave = {questions: model.get('questions') || []};
    var id = model.get('questionId');
    var query = {
      title: this.ui.title.val(),
      type: this.ui.type.val(),
      help: this.ui.help.val(),
    };
    query.options = this.subOptions && this.subOptions.getOptions() || null;
    if(id) {
      toSave.questions = _.map(toSave.questions, function(q){
          if(q._id === id) {
            return _.extend(q, query);
          }
          return q;
        });
    } else {
      toSave.questions.push(query);
    }
    // console.log(toSave, model, model.isNew());

    this.cleanErrors();

    $("#save", this.$el).button('loading');

    model
      .save(toSave, { patch: true, silent: true })
      .success(this.destroyModal.bind(this))
      .error(this.showError.bind(this));
  },

  delete: function() {
    var id = this.model.get('questionId');
    if(!id) {
      return this.destroy();
    }
    if(window.confirm('Are you sure? Kittens may die!')) {
      var toSave = {questions: this.model.get('questions') || []};
      toSave.questions = _.reject(toSave.questions, function(q){
          return q._id === id;
        });
      $("#delete", this.$el).button('loading');

      this.model
        .save(toSave, { patch: true, silent: true })
        .success(this.destroyModal.bind(this))
        .error(this.showError.bind(this));
    }
  },

  destroyModal: function(){
    hackdash.app.modals.trigger('form_edited', this.model.get('id'));
    // TODO: update view
    this.destroy();
  },


  showError: function(err){
    $("#save", this.$el).button('reset');

    if (err.responseText === "OK"){
      this.destroyModal();
      return;
    }
    try {
      var error = JSON.parse(err.responseText).error;
      var self = this;
      _.each(error.errors, function(o, k) {
        var ctrl = k.substr(k.lastIndexOf('.') + 1);
        self.ui[ctrl].parents('.control-group').addClass('error');
        var m = self.errors[o.path + '_' + o.kind] ? self.errors[o.path + '_' + o.kind] : o.message;
        self.ui[ctrl].after('<span class="help-inline">' + m + '</span>');
      });
    } catch(e) {
      window.alert(e + "\n" + err.responseText);
    }

  },

  cleanErrors: function(){
    $(".error", this.$el).removeClass("error");
    $("span.help-inline", this.$el).remove();
  },

  isType: function(type) {
    var comp = this.current && this.current.type;
    if(!comp) {
      comp = '';
    }
    if(!type) {
      type = '';
    }
    return comp === type;
  },

});

},{"./EditFileOptions":46,"./EditGeocoderOptions":50,"./EditRangeOptions":54,"./EditSelectOptions":55,"./templates/editQuestion.hbs":79}],52:[function(require,module,exports){
/**
 * VIEW: Question List
 *
 */

var
    template = require('./templates/editQuestionItem.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

	template: template,

	templateHelpers: {
		fa: function(type) {
			switch(type) {
				case 'text':
					return 'pencil';
				case 'textarea':
					return 'align-left';
        case 'boolean':
          return 'check-square-o';
        case 'select':
          return 'list';
        case 'range':
          return 'sliders';
        case 'geocoder':
          return 'globe';
				case 'file':
					return 'file-o';
				default:
					return 'edit';
			}
		}
	},

});

},{"./templates/editQuestionItem.hbs":80}],53:[function(require,module,exports){
/**
 * VIEW: Question List
 *
 */

var QuestionItem = require('./EditQuestionItem')
  , Form = require('../../models/Form');

var EmptyView = Backbone.Marionette.ItemView.extend({
	template: _.template('<p class="text-danger">No questions yet!</p>')
});

module.exports = Backbone.Marionette.CollectionView.extend({

  tagName: 'div',
  className: 'list-group',

  childView: QuestionItem,

  emptyView: EmptyView,

  onRender: function() {
    this.$el.sortable({
      onEnd: this.endSortable.bind(this)
    });
  },

  /**
   * Reorders the questions lists and maintains the sub-ObjectId
   * that mongoose generates for the subcollection model.questions
   */
  endSortable: function(evt) {
    if(evt.oldIndex === evt.newIndex) {
      return;
    }
    var questions = this.model.get('questions'),
        questions2 = [];
    // var tmp = questions[evt.oldIndex];
    _.each(questions, function(v, i) {
      if(i === evt.newIndex) {
        if(evt.oldIndex < evt.newIndex) {
          questions2.push(v);
        }
        questions2.push(questions[evt.oldIndex]);
        if(evt.oldIndex > evt.newIndex) {
          questions2.push(v);
        }
      } else if(i !== evt.oldIndex) {
        questions2.push(v);
      }
    });
    var self = this;
    var form = new Form({
      id: this.model.get('_id'),
      domain: this.model.get('domain'),
      group: this.model.get('group')
    });
    this.$el.sortable('destroy');
    this.$el.css({'opacity': 0.4});
    form.fetch().done(function(){
      form.set({ "questions": questions2 }, { patch:true, trigger: false });
      form.save({ wait: true });
      self.model = form;
      self.$el.css({'opacity': 1});
      self.$el.sortable({
        onEnd: self.endSortable.bind(self)
      });
    });
  }
});

},{"../../models/Form":14,"./EditQuestionItem":52}],54:[function(require,module,exports){
/**
 * Optional fields for Form Editor field type 'Select'
 */

var template = require('./templates/questionOptionsRange.hbs');

module.exports = Backbone.Marionette.ItemView.extend({
  template: template,

  ui: {
    'min': 'input[name=min]',
    'max': 'input[name=max]',
    'options': 'textarea'
  },

  templateHelpers: function() {
    var options = this.model.get('options') || {};
    return {
      options: function() {
        return options.values ? options.values.join("\n") : '';
      },
      min: function() {
        return options.min ? options.min : 0;
      },
      max: function() {
        return options.max ? options.max : 10;
      }
    };
  },

  getOptions: function() {
    var val = this.ui.options.val();
    return {
      values: val.match(/[^\r\n]+/g),
      min: this.ui.min.val(),
      max: this.ui.max.val()
    };
  }
});

},{"./templates/questionOptionsRange.hbs":87}],55:[function(require,module,exports){
/**
 * Optional fields for Form Editor field type 'Select'
 */

var template = require('./templates/questionOptionsSelect.hbs');

module.exports = Backbone.Marionette.ItemView.extend({
  template: template,

  ui: {
    'options': 'textarea',
    'multiple': 'input[type=checkbox]',
  },

  templateHelpers: function() {
    var options = this.model.get('options') || {};
    return {
      options: function() {
        return options.values ? options.values.join("\n") : '';
      },
      multiple: function() {
        return !!options.multiple;
      }
    };
  },

  getOptions: function() {
    var val = this.ui.options.val();
    var mult = this.ui.multiple.is(':checked');
    return {
      multiple: mult,
      values: val.match(/[^\r\n]+/g)
    };
  }
});

},{"./templates/questionOptionsSelect.hbs":88}],56:[function(require,module,exports){
/**
 * VIEW: input:Text element in form
 *
 */

var
    Text = require('./Text')
  , template = require('./templates/bool.hbs');

module.exports = Text.extend({

  template: template,

  ui: {
    input: 'input[type=checkbox]'
  },

  templateHelpers: {
    name: function() {
      return 'el_' + this._id;
    }
  },


  onRender: function() {
    this.model.set({'value' : !!this.model.get('value')});
  },

  setValue: function () {
    this.model.set({'value' : this.ui.input.is(':checked')});
  }

});

},{"./Text":62,"./templates/bool.hbs":64}],57:[function(require,module,exports){
/**
 * VIEW: input:Text element in form
 *
 */

var
    Text = require('./Text');

module.exports = Text.extend({

    templateHelpers: {
      type: function() {
        return 'email';
      },
      name: function() {
        return 'el_' + this._id;
      },
      placeholder: function() {
        return 'email@example.com';
      }
    }

});

},{"./Text":62}],58:[function(require,module,exports){
/**
 * VIEW: input:Text element in form
 *
 */

var
    Text = require('./Text')
  , template = require('./templates/file.hbs');

module.exports = Text.extend({

  template: template,

  templateHelpers: function() {
    var self = this;
    return {
      name: function() {
        return 'el_' + self._id;
      },
      // background: function() {
      //   if(self.file.type.indexOf('image') === 0) {
      //     return self.file.url;
      //   }
      //   return null;
      // }
    };
  },

  ui: {
    errorFile: '.error-file',
    dragdrop: '.dropzone'
  },


  onRender: function() {
    this.text = 'Drop File here';
    this.invalidText = 'Only file type is not allowed';
    this.maxSize = 8;
    this.formId = this.form ? this.form.get('_id') : null;
    this.projectId = this.project ? this.project.get('_id') : null;
    if(this.imagesOnly) {
      this.text = 'Drop Image here';
      this.invalidText = 'Only jpg, png and gif are allowed';
    }
    if(this.model) {
      this.imagesOnly = this.model.get('options') && this.model.get('options').images;
      this.file = this.model.get('value');
      this.uploadURL = hackdash.apiURL + '/forms/upload/' + this.formId + '/' + this.projectId + '/' + this.model.get('_id');
    }
    this.initImageDrop();
    // Remove value as it has his own API endpoint
    this.model.unset('value');
  },

  acceptedFiles: function() {
    if(this.imagesOnly) {
      return ['image/jpeg', 'image/png', 'image/gif'];
    }
    return [];
  },

  initImageDrop: function() {
    var self = this;
    var $dragdrop = $('.dropzone', this.$el);

    var zone = new Dropzone(this.ui.dragdrop.get(0), {
      url: this.uploadURL,
      paramName: 'file',
      maxFiles: 1,
      thumbnailWidth: 200,
      maxFilesize: self.maxSize, // MB
      acceptedFiles: self.acceptedFiles().join(','),
      uploadMultiple: false,
      clickable: true,
      addRemoveLinks: true,
      dictDefaultMessage: self.text,
      dictFileTooBig: 'File is too big, ' + self.maxSize + ' Mb is the max',
      dictInvalidFileType: self.invalidText
    });

    // Create the mock file:
    if(self.file) {
      var mockFile = { name: self.file.name, size: self.file.size, accepted: true };
      // Call the default addedfile event handler
      zone.files.push(mockFile);
      zone.emit("addedfile", mockFile);
      // And optionally show the thumbnail of the file:
      if(self.file.type.indexOf('image') === 0) {
        zone.createThumbnailFromUrl(mockFile, self.file.path);
      }
      // zone.emit("maxfilesreached", mockFile);
      zone.emit("complete", mockFile);
    }


    zone.on("error", function(file, message) {
      self.ui.errorFile.removeClass('hidden').text(message);
    });

    zone.on("complete", function(file) {
      if (!file.accepted){
        zone.removeFile(file);
        return;
      }

      self.ui.errorFile.addClass('hidden').text('');

      // var url = JSON.parse(file.xhr.response).href;

      // if(self.file.type.indexOf('image') === 0) {
      //   zone.removeFile(file);
      //   $dragdrop
      //     .css('background-image', 'url(' + url + ')');
      // }

      $('.dz-message span', $dragdrop).css('opacity', '0.6');

    });

    zone.on("removedfile", function(file) {
      console.log('del', file, self.file);
      $.ajax({
        url: self.uploadURL,
        type: 'DELETE',
        data: JSON.stringify({file:self.file}),
        contentType: 'application/json; charset=utf-8',
        context: self
      })
      .fail(function(jqXHR) {
        self.ui.errorFile.removeClass('hidden').text(jqXHR.responseText);
      });
    });
  }

});

},{"./Text":62,"./templates/file.hbs":65}],59:[function(require,module,exports){
/**
 * VIEW: input:Text element in form
 *
 */

var
    Text = require('./Text')
  , template = require('./templates/geocoder.hbs');

module.exports = Text.extend({

  template: template,

  templateHelpers: {
    type: function() {
      return 'text';
    },
    name: function() {
      return 'el_' + this._id;
    },
    placeholder: function() {
      return 'Some nice place';
    },
    location: function() {
      return this.value && this.value.location ? this.value.location : '';
    },
    country: function() {
      return this.value && this.value.country ? this.value.country : '';
    },
    city: function() {
      return this.value && this.value.city ? this.value.city : '';
    },
    region: function() {
      return this.value && this.value.region ? this.value.region : '';
    },
    zip: function() {
      return this.value && this.value.zip ? this.value.zip : '';
    },
    lat: function() {
      return this.value && this.value.coordinates ? this.value.coordinates[0] : '';
    },
    lng: function() {
      return this.value && this.value.coordinates ? this.value.coordinates[1] : '';
    },

  },

  ui: {
    element: 'input.element',
    location: 'input[name=location]',
    lat: 'input[name=lat]',
    lng: 'input[name=lng]',
    country: 'input[name=country]',
    city: 'input[name=city]',
    region: 'input[name=region]',
    zip: 'input[name=zip]'
  },

  events: {
    'change @ui.location': 'changedLocation'
  },

  onRender: function(){
    var value = this.model.get('value');
    this.autocomplete = null;
    this.initGoogleAutocomplete(this.ui.location.get(0));
    this.browser = this.model.get('options') && this.model.get('options').browser;
    if(this.browser && (!value || !value.coordinates || !value.coordinates[0] || !value.coordinates[1])) {
      this.geolocate(); //Ask for browser geolocation
    }
  },

  changedLocation: function() {
    var ob = {
      type: 'Point',
      coordinates: [this.ui.lat.val(), this.ui.lng.val()],
      location: this.ui.location.val(),
      country: this.ui.country.val(),
      city: this.ui.city.val(),
      region: this.ui.region.val(),
      zip: this.ui.zip.val(),
    };
    this.model.set({'value': ob});
  },

  initGoogleAutocomplete: function(el) {
    if(window.google) {
      this.autocomplete = new window.google.maps.places.Autocomplete(el, {types: ['geocode']});
      this.autocomplete.addListener('place_changed', this.fillInAddress.bind(this));
    }
  },

  fillInAddress: function() {
    var place = this.autocomplete.getPlace();
    this.ui.lat.val(place.geometry.location.lat());
    this.ui.lng.val(place.geometry.location.lng());

    // Get each component of the address from the place details
    // and fill the corresponding field on the form.
    for (var i = 0; i < place.address_components.length; i++) {
      var addressType = place.address_components[i].types[0];
      var short = place.address_components[i].short_name;
      var long = place.address_components[i].long_name;
      // console.log(addressType, short, long);
      if(addressType === 'country') {
        this.ui.country.val(short);
      }
      else if(addressType === 'locality') {
        this.ui.city.val(long);
      }
      else if(addressType === 'administrative_area_level_2') {
        this.ui.region.val(short);
      }
      else if(addressType === 'postal_code') {
        this.ui.zip.val(short);
      }
    }
    this.changedLocation();
  },

  // Bias the autocomplete object to the user's geographical location,
  // as supplied by the browser's 'navigator.geolocation' object.
  geolocate: function () {
    if (window.navigator.geolocation) {
      if(this.geolocateAsked) {
        return;
      }
      this.geolocateAsked = true;
      var self = this;
      window.navigator.geolocation.getCurrentPosition(function(position) {
        var geolocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        self.ui.lat.val(geolocation.lat);
        self.ui.lng.val(geolocation.lng);
        var circle = new window.google.maps.Circle({
          center: geolocation,
          radius: position.coords.accuracy
        });

        self.autocomplete.setBounds(circle.getBounds());
        self.changedLocation();
      });
    }
  }
});

},{"./Text":62,"./templates/geocoder.hbs":66}],60:[function(require,module,exports){
/**
 * VIEW: input:Text element in form
 *
 */

var
    Text = require('./Text')
  , template = require('./templates/range.hbs');

module.exports = Text.extend({

  template: template,

  ui: {
    input: 'input'
  },

  templateHelpers: function() {
    var self = this;
    return {
      labelMin: function() {
        return self.values.length ? '' : self.min;
      },
      labelMax: function() {
        return self.values.length ? '' : self.max;
      },
      name: function() {
        return 'el_' + this._id;
      }
    };
  },

  initialize: function(options) {
    if(options.response) {
      this.model.set({'value': options.response.value});
    }
    this.options = this.model.get('options') ? this.model.get('options') : {};
    this.values = this.options && this.options.values ? this.options.values : [];
    this.keys = Object.keys(this.values);
    this.min = this.options && this.options.min ? parseInt(this.options.min) : 0;
    this.max = this.options && this.options.max ? parseInt(this.options.max) : 0;
  },

  onRender: function() {
    this.ui.input.slider({
      min: this.min,
      max: this.max,
      tooltip: this.values.length ? 'hide' : 'show',
      ticks: this.keys,
      ticks_labels: this.values,
      value: this.model.get('value') ? this.model.get('value') : 0
    });
  },

  // Fix for some render issues
  onShow:function() {
    var self = this;
    window.setTimeout(function(){
      self.ui.input.slider('relayout');
    },10);
  }

});

},{"./Text":62,"./templates/range.hbs":68}],61:[function(require,module,exports){
/**
 * VIEW: input:Text element in form
 *
 */

var
    Text = require('./Text')
  , template = require('./templates/select.hbs');

module.exports = Text.extend({

  template: template,

  ui: {
    input: 'select'
  },

  templateHelpers: function() {
    var self = this;
    return {
      name: function() {
        return 'el_' + this._id;
      },
      values: function() {
        return this.options && this.options.values ? this.options.values : [];
      },
      selected: function(val) {
        var value = self.model.get('value');
        if(_.isArray(value) && value.length) {
          return _.indexOf(value, val) > -1 ? ' selected' : '';
        }

        return value === val ? ' selected' : '';
      },
      multiple: function() {
        return this.options && this.options.multiple;
      }
    };
  },

  onRender: function() {
    this.ui.input.select2({
      // theme: "bootstrap",
      minimumResultsForSearch: 10
    });
  }

});

},{"./Text":62,"./templates/select.hbs":69}],62:[function(require,module,exports){
/**
 * VIEW: input:Text element in form
 *
 */

var
    template = require('./templates/input.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  template: template,

  templateHelpers: {
    type: function() {
      return 'text';
    },
    name: function() {
      return 'el_' + this._id;
    }
  },

  ui: {
    input: '.form-control:first'
  },

  events: {
    'change @ui.input': 'setValue'
  },

  initialize: function(options) {
    if(options.response) {
      this.model.set({'value': options.response.value});
    }
    this.form = options.form;
    this.project = options.project;
  },

  setValue: function() {
    console.log('setValue', this.ui.input.val());
    this.model.set({'value' : this.ui.input.val()});
  }
});

},{"./templates/input.hbs":67}],63:[function(require,module,exports){
/**
 * VIEW: input:Text element in form
 *
 */

var
    Text = require('./Text')
  , template = require('./templates/textarea.hbs');

module.exports = Text.extend({

  template: template,

  templateHelpers: {
    name: function() {
      return 'el_' + this._id;
    }
  }

});

},{"./Text":62,"./templates/textarea.hbs":70}],64:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    return " checked=\"true\"";
},"3":function(container,depth0,helpers,partials,data) {
    var helper;

  return "      <p class=\"help-block\">"
    + container.escapeExpression(((helper = (helper = helpers.help || (depth0 != null ? depth0.help : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"help","hash":{},"data":data}) : helper)))
    + "</p>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"form-group\">\n    <div class=\"checkbox\">\n      <label>\n        <input type=\"checkbox\" name=\""
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "\" id=\"q-"
    + alias4(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\" value=\"1\""
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.value : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "> "
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "\n      </label>\n    </div>\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.help : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "</div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],65:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var helper;

  return "    style=\"background-image: url("
    + container.escapeExpression(((helper = (helper = helpers.background || (depth0 != null ? depth0.background : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"background","hash":{},"data":data}) : helper)))
    + ");\"\n    ";
},"3":function(container,depth0,helpers,partials,data) {
    var helper;

  return "    <p class=\"help-block\">"
    + container.escapeExpression(((helper = (helper = helpers.help || (depth0 != null ? depth0.help : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"help","hash":{},"data":data}) : helper)))
    + "</p>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"form-group\">\n  <label for=\"q-"
    + alias4(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\">"
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "</label>\n\n  <div class=\"dropzone item-file\"\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.background : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + ">\n  </div>\n  <p class=\"error-file bg-danger text-danger hidden\"></p>\n\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.help : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "</div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],66:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var helper;

  return " placeholder=\""
    + container.escapeExpression(((helper = (helper = helpers.placeholder || (depth0 != null ? depth0.placeholder : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"placeholder","hash":{},"data":data}) : helper)))
    + "\"";
},"3":function(container,depth0,helpers,partials,data) {
    var helper;

  return "    <p class=\"help-block\">"
    + container.escapeExpression(((helper = (helper = helpers.help || (depth0 != null ? depth0.help : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"help","hash":{},"data":data}) : helper)))
    + "</p>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"form-group\">\n  <label for=\"q-"
    + alias4(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\">"
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "</label>\n  <input type=\"text\" name=\"location\" class=\"form-control\" value=\""
    + alias4(((helper = (helper = helpers.location || (depth0 != null ? depth0.location : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"location","hash":{},"data":data}) : helper)))
    + "\" id=\"q-"
    + alias4(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\""
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.placeholder : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + ">\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.help : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "  <input type=\"hidden\" name=\"lat\" value=\""
    + alias4(((helper = (helper = helpers.lat || (depth0 != null ? depth0.lat : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"lat","hash":{},"data":data}) : helper)))
    + "\">\n  <input type=\"hidden\" name=\"lng\" value=\""
    + alias4(((helper = (helper = helpers.lng || (depth0 != null ? depth0.lng : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"lng","hash":{},"data":data}) : helper)))
    + "\">\n  <input type=\"hidden\" name=\"country\" value=\""
    + alias4(((helper = (helper = helpers.country || (depth0 != null ? depth0.country : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"country","hash":{},"data":data}) : helper)))
    + "\">\n  <input type=\"hidden\" name=\"city\" value=\""
    + alias4(((helper = (helper = helpers.city || (depth0 != null ? depth0.city : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"city","hash":{},"data":data}) : helper)))
    + "\">\n  <input type=\"hidden\" name=\"region\" value=\""
    + alias4(((helper = (helper = helpers.region || (depth0 != null ? depth0.region : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"region","hash":{},"data":data}) : helper)))
    + "\">\n  <input type=\"hidden\" name=\"zip\" value=\""
    + alias4(((helper = (helper = helpers.zip || (depth0 != null ? depth0.zip : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"zip","hash":{},"data":data}) : helper)))
    + "\">\n  <input type=\"hidden\" name=\""
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "\" class=\"element\" value=\""
    + alias4(((helper = (helper = helpers.location || (depth0 != null ? depth0.location : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"location","hash":{},"data":data}) : helper)))
    + "\">\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],67:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var helper;

  return " placeholder=\""
    + container.escapeExpression(((helper = (helper = helpers.placeholder || (depth0 != null ? depth0.placeholder : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"placeholder","hash":{},"data":data}) : helper)))
    + "\"";
},"3":function(container,depth0,helpers,partials,data) {
    var helper;

  return "    <p class=\"help-block\">"
    + container.escapeExpression(((helper = (helper = helpers.help || (depth0 != null ? depth0.help : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"help","hash":{},"data":data}) : helper)))
    + "</p>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"form-group\">\n  <label for=\"q-"
    + alias4(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\">"
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "</label>\n  <input type=\""
    + alias4(((helper = (helper = helpers.type || (depth0 != null ? depth0.type : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"type","hash":{},"data":data}) : helper)))
    + "\" name=\""
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "\" class=\"form-control\" value=\""
    + alias4(((helper = (helper = helpers.value || (depth0 != null ? depth0.value : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"value","hash":{},"data":data}) : helper)))
    + "\" id=\"q-"
    + alias4(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\""
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.placeholder : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + ">\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.help : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "</div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],68:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var helper;

  return "    <p class=\"help-block\">"
    + container.escapeExpression(((helper = (helper = helpers.help || (depth0 != null ? depth0.help : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"help","hash":{},"data":data}) : helper)))
    + "</p>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"form-group\">\n  <label for=\"q-"
    + alias4(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\">"
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "</label>\n  <div class=\"center-block\" style=\"width:90%;padding:25px 5px 10px 5px\">\n  <b>"
    + alias4(((helper = (helper = helpers.labelMin || (depth0 != null ? depth0.labelMin : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"labelMin","hash":{},"data":data}) : helper)))
    + "&nbsp;</b>\n  <input type=\"text\" name=\""
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "\" class=\"form-control\" style=\"width: 90%;\" id=\"q-"
    + alias4(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\">\n  <b>&nbsp;"
    + alias4(((helper = (helper = helpers.labelMax || (depth0 != null ? depth0.labelMax : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"labelMax","hash":{},"data":data}) : helper)))
    + "</b>\n  </div>\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.help : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "</div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],69:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    return " multiple";
},"3":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var alias1=container.escapeExpression;

  return "    <option"
    + alias1(((depths[1] && depths[1].selected) || helpers.helperMissing).call(depth0 != null ? depth0 : {},depth0,{"name":"../selected","hash":{},"data":data}))
    + ">"
    + alias1(container.lambda(depth0, depth0))
    + "</option>\n";
},"5":function(container,depth0,helpers,partials,data) {
    var helper;

  return "    <p class=\"help-block\">"
    + container.escapeExpression(((helper = (helper = helpers.help || (depth0 != null ? depth0.help : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"help","hash":{},"data":data}) : helper)))
    + "</p>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"form-group\">\n  <label for=\"q-"
    + alias4(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\">"
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "</label>\n\n  <select name=\""
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "\" class=\"form-control\" style=\"width: 100%\" "
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.multiple : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + " id=\"q-"
    + alias4(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\">\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.values : depth0),{"name":"each","hash":{},"fn":container.program(3, data, 0, blockParams, depths),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "  </select>\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.help : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0, blockParams, depths),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "</div>\n";
},"useData":true,"useDepths":true});

},{"hbsfy/runtime":162}],70:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var helper;

  return " placeholder=\""
    + container.escapeExpression(((helper = (helper = helpers.placeholder || (depth0 != null ? depth0.placeholder : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"placeholder","hash":{},"data":data}) : helper)))
    + "\"";
},"3":function(container,depth0,helpers,partials,data) {
    var helper;

  return "    <p class=\"help-block\">"
    + container.escapeExpression(((helper = (helper = helpers.help || (depth0 != null ? depth0.help : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"help","hash":{},"data":data}) : helper)))
    + "</p>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"form-group\">\n  <label for=\"q-"
    + alias4(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\">"
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "</label>\n  <textarea name=\""
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "\" class=\"form-control\" id=\"q-"
    + alias4(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\""
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.placeholder : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + ">"
    + alias4(((helper = (helper = helpers.value || (depth0 != null ? depth0.value : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"value","hash":{},"data":data}) : helper)))
    + "</textarea>\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.help : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "</div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],71:[function(require,module,exports){
/**
 * VIEW: Question List
 *
 */

var
    template = require('./templates/formItem.hbs')
;

module.exports = Backbone.Marionette.LayoutView.extend({

  template: template,

  events: {
  },

  templateHelpers: {
  },

  modelEvents: {
    "change": "render"
  },

  initialize: function() {
    if(this.model && this.hasOwnProperty('getMyProjects')) {
      this.model.set({projects: this.model.getMyProjects()});
    }
  }
});

},{"./templates/formItem.hbs":81}],72:[function(require,module,exports){
/**
 * VIEW: Form List
 *
 */

var FormItem = require('./FormItem');

var EmptyView = Backbone.Marionette.ItemView.extend({
  template: _.template('<p class="text-danger">Sorry, no forms for you!</p>')
});

module.exports = Backbone.Marionette.CollectionView.extend({

  tagName: 'div',

  childView: FormItem,

  emptyView: EmptyView,

});

},{"./FormItem":71}],73:[function(require,module,exports){
/**
 * VIEW: Question List
 *
 */

var
    template = require('./templates/formRender.hbs')
  , doneTemplate = require('./templates/formSent.hbs')
  , QuestionList = require('./QuestionList')
  ;

var DoneView = Backbone.Marionette.ItemView.extend({
  template: doneTemplate
});

module.exports = Backbone.Marionette.LayoutView.extend({

  template: template,
  className: 'form-render',

  regions: {
    questionsList: ".questions-list",
    formContent: ".form-content",
    doneRegion: ".done",
  },

  ui: {
    formContent: ".form-content",
  },

  events: {
    'click .send-form': 'sendForm'
  },

  templateHelpers: {
    showErrors: function() {
      return this.errors;
    },
    showMessages: function() {
      return this.messages;
    }
  },

  onRender: function() {
    var form = this.model;
    if(form && form.get('done')) {
      hackdash.app.project = null;
      hackdash.app.type = 'forms_list';
      return this.formContent.show(new DoneView({
        model: this.model.get('project')
      }));
    }
    this.questionsList.show(new QuestionList({
      model: form,
      collection: form.getQuestions()
    }));
  },

  sendForm: function() {
    var values = this.questionsList.currentView.getValues();
    var self = this;
    var res = {
        form: self.model.get('_id'),
        responses: values
      };

    self.model.sendResponse(res, function(err) {
      if(err) {
        return self.model.set({'errors': err});
      }
      self.model.set({done:true, 'messages': 'Data successfully saved!'});
    });
  }
});

},{"./QuestionList":74,"./templates/formRender.hbs":82,"./templates/formSent.hbs":83}],74:[function(require,module,exports){
/**
 * VIEW: Question List
 *
 */

var Text = require('./Element/Text')
  , Email = require('./Element/Email')
  , Textarea = require('./Element/Textarea')
  , Select = require('./Element/Select')
  , Range = require('./Element/Range')
  , Geocoder = require('./Element/Geocoder')
  , File = require('./Element/File')
  , Bool = require('./Element/Boolean');

var EmptyView = Backbone.Marionette.ItemView.extend({
	template: _.template('<p class="text-danger">No questions on this form!</p>')
});

module.exports = Backbone.Marionette.CollectionView.extend({

  tagName: 'div',

  emptyView: EmptyView,

  getChildView: function(item) {
    switch(item.get('type')) {
      case 'email':
        return Email;
      case 'textarea':
        return Textarea;
      case 'select':
        return Select;
      case 'range':
        return Range;
      case 'geocoder':
        return Geocoder;
      case 'file':
        return File;
      case 'boolean':
        return Bool;
      default:
        return Text;
    }
  },

  childViewOptions: function (model) {
    var project = this.model.get('project');
    var form = this.model;
    var forms = project ? project.get('forms') : [];
    var responses = _.find(forms, function(e) { return e.form === form.get('_id'); });

    responses = responses && responses.responses ? responses.responses : [];
    var response = _.find(responses, function(e) { return e.question === model.get('_id'); });
    // console.log('child', forms, 'responses =>', responses, model.get('_id'), 'response =>', response);
    return {
      index: this.collection.indexOf(model) + 1,
      total: this.collection.length,
      responses: responses, // If form element need info about other values
      response: response,
      form: form,
      project: project
    };
  },

  getValues: function() {
    var values = [];
    this.collection.each(function(c){
      if(!_.isUndefined(c.get('value'))) {
        values.push({
          question: c.get('_id'),
          value: c.get('value')
        });
      }
    });
    return values;
  }

});

},{"./Element/Boolean":56,"./Element/Email":57,"./Element/File":58,"./Element/Geocoder":59,"./Element/Range":60,"./Element/Select":61,"./Element/Text":62,"./Element/Textarea":63}],75:[function(require,module,exports){
/**
 * VIEW: Form Layout
 *
 */

var
    template = require('./templates/forms.hbs')
  , FormRender = require('./FormRender')
  , FormList = require('./FormList')
  , FormItem = require('./FormItem')
  ;

module.exports = Backbone.Marionette.LayoutView.extend({

  className: "page-ctn forms",
  template: template,

  regions: {
    formContent: ".forms-content",
  },

  events: {
  },

  modelEvents: {
    "change": "render"
  },

  templateHelpers: function() {
    var flashError = this.flashError;
    var flashMessage = this.flashMessage;
    return {
      showErrors: function(){
        return flashError;
      },
      showMessages: function(){
        return flashMessage;
      },
      formDesc: function() {
        switch(hackdash.app.type) {
          case 'forms_project':
            return 'Form for project <strong>' + this.project.get('title') + '</strong>';
          case 'forms_item':
            return 'List of projects under this form';
          case 'forms_list':
        }
        return 'List of your forms';
      }
    };
  },

  initialize: function() {
    if(this.model && hackdash.app.project) {
      this.model.set({'project': hackdash.app.project});
    }
  },

  onRender: function(){
    var project = hackdash.app.project;
    if(this.collection) {
      // Render list
      this.formContent.show(new FormList({
        collection: this.collection
      }));
    } else if(this.model && project) {
      // Render view
      this.formContent.show(new FormRender({
        model: this.model
      }));
    } else {
      this.formContent.show(new FormItem({
        model: this.model
      }));
    }
  },


});

},{"./FormItem":71,"./FormList":72,"./FormRender":73,"./templates/forms.hbs":84}],76:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    return "Edit form";
},"3":function(container,depth0,helpers,partials,data) {
    return "New form";
},"5":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "      <div class=\"form-group\">\n        <label>Feeling lazy? Create from template:</label>\n        <select class=\"form-control from-template\">\n          <option>Choose one</option>\n"
    + ((stack1 = helpers.each.call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.getTemplates : depth0),{"name":"each","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "        </select>\n\n        <p class=\"help-block\">No questions asked! Content will be copied right away!</p>\n      </div>\n\n      <h3>Naah, a brand new one:</h3>\n\n";
},"6":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "          <option value=\""
    + alias4(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"id","hash":{},"data":data}) : helper)))
    + "\">"
    + alias4(((helper = (helper = helpers.desc || (depth0 != null ? depth0.desc : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"desc","hash":{},"data":data}) : helper)))
    + "</option>\n";
},"8":function(container,depth0,helpers,partials,data) {
    return " checked=\"true\"";
},"10":function(container,depth0,helpers,partials,data) {
    return "    <a id=\"delete\" class=\"btn btn-danger\">Delete</a>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"modal-header\">\n  <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\n    <i class=\"fa fa-close\"></i>\n  </button>\n  <h2 class=\"modal-title\">"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.id : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data})) != null ? stack1 : "")
    + "</h2>\n</div>\n\n<div class=\"modal-body\">\n\n  <div class=\"form-content\">\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.showTemplates : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n    <div class=\"form-group\">\n      <input type=\"text\" class=\"form-control\" name=\"title\" placeholder=\"Form title\" value=\""
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "\">\n    </div>\n\n    <div class=\"form-group\">\n      <textarea class=\"form-control\" name=\"description\" placeholder=\"Optional description/help\">"
    + alias4(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"description","hash":{},"data":data}) : helper)))
    + "</textarea>\n    </div>\n\n    <div class=\"form-group\">\n      <div class=\"checkbox\">\n        <label>\n        <input type=\"checkbox\" name=\"template\" value=\"1\""
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.template : depth0),{"name":"if","hash":{},"fn":container.program(8, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + ">\n        Available as template\n        </label>\n      </div>\n\n      <p class=\"help-block\">Marking this option will allow to create new forms with this same configuration (as it is when it's copied).</p>\n\n    </div>\n\n  </div>\n\n  <a id=\"save\" class=\"btn btn-success\">Save</a>\n\n"
    + ((stack1 = helpers.unless.call(alias1,(depth0 != null ? depth0.isNew : depth0),{"name":"unless","hash":{},"fn":container.program(10, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],77:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    return "true";
},"3":function(container,depth0,helpers,partials,data) {
    return " in";
},"5":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = (helpers.markdown || (depth0 && depth0.markdown) || helpers.helperMissing).call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.description : depth0),{"name":"markdown","hash":{},"data":data})) != null ? stack1 : "");
},"7":function(container,depth0,helpers,partials,data) {
    return "form-open";
},"9":function(container,depth0,helpers,partials,data) {
    return "form-close";
},"11":function(container,depth0,helpers,partials,data) {
    return "btn-success";
},"13":function(container,depth0,helpers,partials,data) {
    return "btn-danger";
},"15":function(container,depth0,helpers,partials,data) {
    return "Open";
},"17":function(container,depth0,helpers,partials,data) {
    return "Close";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"panel panel-default\">\n\n    <div class=\"panel-heading\" role=\"tab\" id=\"h-"
    + alias4(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\">\n      <h4 class=\"panel-title\">\n        <a class=\"pull-left\" role=\"button\" data-toggle=\"collapse\" data-parent=\"#accordion\" href=\"#c-"
    + alias4(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\" aria-expanded=\""
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.opened : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\" aria-controls=\"c-"
    + alias4(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\" data-bypass>\n          "
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "\n        </a>\n        <button class=\"pull-right btn btn-link edit-form\" data-id=\""
    + alias4(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\"><i class=\"fa fa-edit\"></i></button>\n        <div class=\"clearfix\"></div>\n      </h4>\n\n    </div>\n\n    <div id=\"c-"
    + alias4(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\" class=\"panel-collapse collapse"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.opened : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\" role=\"tabpanel\" aria-labelledby=\"h-"
    + alias4(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\">\n      <div class=\"panel-body\">\n\n      "
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.description : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n\n\n      <div class=\"questions-list\"></div>\n\n      <button class=\"btn btn-sm btn-success new-question\">Create a new question</button>\n\n      <button class=\"btn btn-sm btn-info preview-form\">Preview form</button>\n\n      <a data-placement=\"top\" data-original-title=\""
    + alias4(((helper = (helper = helpers.switcherMsg || (depth0 != null ? depth0.switcherMsg : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"switcherMsg","hash":{},"data":data}) : helper)))
    + "\" data-id=\""
    + alias4(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\"\n        class=\"pull-right tooltips public-btn "
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.open : depth0),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.program(9, data, 0),"data":data})) != null ? stack1 : "")
    + "\">\n        <i class=\"txt "
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.open : depth0),{"name":"if","hash":{},"fn":container.program(11, data, 0),"inverse":container.program(13, data, 0),"data":data})) != null ? stack1 : "")
    + "\">"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.open : depth0),{"name":"if","hash":{},"fn":container.program(15, data, 0),"inverse":container.program(17, data, 0),"data":data})) != null ? stack1 : "")
    + "</i>\n        <div>Form Status</div>\n      </a>\n\n\n      </div>\n    </div>\n  </div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],78:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    return "	  	<p>This forms will have to be aswered by the leaders of projects in this dashboard</p>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "	  	<p>This forms will have to be aswered by the leaders of projects in this collection</p>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {};

  return "<div class=\"header\">\n  <div class=\"container\">\n	  <h1>Forms for <small>"
    + container.escapeExpression(((helper = (helper = helpers.itemTitle || (depth0 != null ? depth0.itemTitle : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"itemTitle","hash":{},"data":data}) : helper)))
    + "</small></h1>\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.isDashboard : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data})) != null ? stack1 : "")
    + "  </div>\n\n</div>\n\n<div class=\"body\">\n\n  <div class=\"container\">\n\n    <h3>Current forms:</h3>\n  	<div class=\"forms-list\"></div>\n\n  	<button class=\"btn btn-primary new-form\">Create a new form</button>\n\n  </div>\n\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],79:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    return "Edit question";
},"3":function(container,depth0,helpers,partials,data) {
    return "New question";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"modal-header\">\n  <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\n    <i class=\"fa fa-close\"></i>\n  </button>\n  <h2 class=\"modal-title\">"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0._id : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data})) != null ? stack1 : "")
    + "</h2>\n</div>\n\n<div class=\"modal-body\">\n\n<div class=\"form-content\">\n\n  <div class=\"form-group\">\n    <input type=\"text\" class=\"form-control\" name=\"title\" placeholder=\"Question to respond\" value=\""
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "\">\n  </div>\n  <div class=\"form-group\">\n    <input type=\"text\" class=\"form-control\" name=\"help\" placeholder=\"Help text (if any)\" value=\""
    + alias4(((helper = (helper = helpers.help || (depth0 != null ? depth0.help : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"help","hash":{},"data":data}) : helper)))
    + "\">\n  </div>\n  <div class=\"form-group\">\n\n    <select name=\"type\" class=\"form-control\">\n    	<option value=\"\" disabled"
    + alias4((helpers.typeSelected || (depth0 && depth0.typeSelected) || alias2).call(alias1,null,{"name":"typeSelected","hash":{},"data":data}))
    + ">Question type (choose one)</option>\n      <option value=\"text\""
    + alias4((helpers.typeSelected || (depth0 && depth0.typeSelected) || alias2).call(alias1,"text",{"name":"typeSelected","hash":{},"data":data}))
    + ">One line text</option>\n    	<option value=\"textarea\""
    + alias4((helpers.typeSelected || (depth0 && depth0.typeSelected) || alias2).call(alias1,"textarea",{"name":"typeSelected","hash":{},"data":data}))
    + ">Multiline text</option>\n      <option value=\"boolean\""
    + alias4((helpers.typeSelected || (depth0 && depth0.typeSelected) || alias2).call(alias1,"boolean",{"name":"typeSelected","hash":{},"data":data}))
    + ">Yes or no</option>\n      <option value=\"select\""
    + alias4((helpers.typeSelected || (depth0 && depth0.typeSelected) || alias2).call(alias1,"select",{"name":"typeSelected","hash":{},"data":data}))
    + ">Select list</option>\n      <option value=\"range\""
    + alias4((helpers.typeSelected || (depth0 && depth0.typeSelected) || alias2).call(alias1,"range",{"name":"typeSelected","hash":{},"data":data}))
    + ">Range of elements</option>\n      <option value=\"geocoder\""
    + alias4((helpers.typeSelected || (depth0 && depth0.typeSelected) || alias2).call(alias1,"geocoder",{"name":"typeSelected","hash":{},"data":data}))
    + ">Geografic coordinates with autocomplete</option>\n    	<option value=\"file\""
    + alias4((helpers.typeSelected || (depth0 && depth0.typeSelected) || alias2).call(alias1,"file",{"name":"typeSelected","hash":{},"data":data}))
    + ">Upload file</option>\n    </select>\n  </div>\n\n  <div class=\"question-options\"></div>\n\n  <a id=\"save\" class=\"btn btn-success\">Save</a>\n\n  <a id=\"delete\" class=\"btn btn-danger\">Delete</a>\n\n</div>\n\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],80:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<a class=\"list-group-item edit-question\" id=\""
    + alias4(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\">\n	<i class=\"fa fa-"
    + alias4((helpers.fa || (depth0 && depth0.fa) || alias2).call(alias1,(depth0 != null ? depth0.type : depth0),{"name":"fa","hash":{},"data":data}))
    + " fa-fw\"></i>\n	"
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "\n</a>\n";
},"useData":true});

},{"hbsfy/runtime":162}],81:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1;

  return "      <ul class=\"list-group\">\n"
    + ((stack1 = helpers.each.call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.projects : depth0),{"name":"each","hash":{},"fn":container.program(2, data, 0, blockParams, depths),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "      </ul>\n";
},"2":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "        <li class=\"list-group-item\">\n          <a href=\"/projects/"
    + alias4(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\">\n          <img class=\"media-object\" style=\"max-height: 50px;max-width: 50px;display:inline-block\" src=\""
    + alias4(((helper = (helper = helpers.cover || (depth0 != null ? depth0.cover : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"cover","hash":{},"data":data}) : helper)))
    + "\" alt=\"Project cover\">\n            "
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "\n          </a>\n"
    + ((stack1 = helpers["if"].call(alias1,(depths[1] != null ? depths[1].open : depths[1]),{"name":"if","hash":{},"fn":container.program(3, data, 0, blockParams, depths),"inverse":container.program(5, data, 0, blockParams, depths),"data":data})) != null ? stack1 : "")
    + "          <div class=\"clearfix\"></div>\n        </li>\n";
},"3":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var helper, alias1=container.escapeExpression;

  return "            <a href=\"/forms/"
    + alias1(container.lambda((depths[2] != null ? depths[2]._id : depths[2]), depth0))
    + "/"
    + alias1(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"_id","hash":{},"data":data}) : helper)))
    + "\" class=\"btn btn-info pull-right\">Reply this form</a>\n";
},"5":function(container,depth0,helpers,partials,data) {
    return "            <span class=\"badge\">Closed</span>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing;

  return "<div class=\"panel panel-default\">\n  <div class=\"panel-heading\">\n    <h4 class=\"panel-heading\">"
    + container.escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "</h4>\n    "
    + ((stack1 = (helpers.markdown || (depth0 && depth0.markdown) || alias2).call(alias1,(depth0 != null ? depth0.description : depth0),{"name":"markdown","hash":{},"data":data})) != null ? stack1 : "")
    + "\n  </div>\n\n  <div class=\"panel-body\">\n\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.projects : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n  </div>\n</div>\n";
},"useData":true,"useDepths":true});

},{"hbsfy/runtime":162}],82:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var helper;

  return "    <div class=\"alert alert-danger\" id=\"login-errors\">\n      "
    + container.escapeExpression(((helper = (helper = helpers.showErrors || (depth0 != null ? depth0.showErrors : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"showErrors","hash":{},"data":data}) : helper)))
    + "\n    </div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper;

  return "    <div class=\"alert alert-success\" id=\"login-messages\">\n      "
    + container.escapeExpression(((helper = (helper = helpers.showMessages || (depth0 != null ? depth0.showMessages : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"showMessages","hash":{},"data":data}) : helper)))
    + "\n    </div>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3=container.escapeExpression;

  return "<h3>"
    + alias3(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "</h3>\n\n"
    + ((stack1 = (helpers.markdown || (depth0 && depth0.markdown) || alias2).call(alias1,(depth0 != null ? depth0.description : depth0),{"name":"markdown","hash":{},"data":data})) != null ? stack1 : "")
    + "\n\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.showErrors : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.showMessages : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n<div class=\"form-content\">\n\n  <div class=\"questions-list\"></div>\n\n  <a class=\"btn btn-success send-form\">Send</a>\n\n  <div class=\"pull-right\">\n    <a class=\"btn btn-info\" href=\"/forms\">Go back to forms</a>\n    <a class=\"btn btn-danger\" href=\"/projects/"
    + alias3(container.lambda(((stack1 = (depth0 != null ? depth0.project : depth0)) != null ? stack1.id : stack1), depth0))
    + "\">Go back to project</a>\n  </div>\n\n</div>\n\n<div class=\"done\"></div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],83:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper;

  return "\n<a href=\"/forms\" class=\"btn btn-info\">Back to my forms</a>\n<a href=\"/projects/"
    + container.escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"_id","hash":{},"data":data}) : helper)))
    + "\" class=\"btn btn-danger\">Back to project</a>\n";
},"useData":true});

},{"hbsfy/runtime":162}],84:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var helper;

  return "      <div class=\"alert alert-danger\" id=\"login-errors\">\n        "
    + container.escapeExpression(((helper = (helper = helpers.showErrors || (depth0 != null ? depth0.showErrors : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"showErrors","hash":{},"data":data}) : helper)))
    + "\n      </div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper;

  return "      <div class=\"alert alert-success\" id=\"login-messages\">\n        "
    + container.escapeExpression(((helper = (helper = helpers.showMessages || (depth0 != null ? depth0.showMessages : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"showMessages","hash":{},"data":data}) : helper)))
    + "\n      </div>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {};

  return "<div class=\"header\">\n  <div class=\"container\">\n    <h1>Your forms</h1>\n    <p>"
    + ((stack1 = ((helper = (helper = helpers.formDesc || (depth0 != null ? depth0.formDesc : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"formDesc","hash":{},"data":data}) : helper))) != null ? stack1 : "")
    + "</p>\n  </div>\n\n</div>\n\n<div class=\"body\">\n\n  <div class=\"container\">\n\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.showErrors : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.showMessages : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n  	<div class=\"forms-content\"></div>\n\n  </div>\n\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],85:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    return " checked=\"true\"";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "<div class=\"form-group\">\n  <div class=\"checkbox\">\n    <label>\n      <input type=\"checkbox\" name=\"images\" value=\"1\""
    + ((stack1 = helpers["if"].call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.images : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "> Only images\n    </label>\n  </div>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],86:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    return " checked=\"true\"";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "<div class=\"form-group\">\n  <div class=\"checkbox\">\n    <label>\n      <input type=\"checkbox\" name=\"browser\" value=\"1\""
    + ((stack1 = helpers["if"].call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.browser : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "> Asks for user's browser location\n    </label>\n  </div>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],87:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<p>This is numeric field using a slider to change values</p>\n\n<div class=\"form-inline\">\n<div class=\"form-group\" style=\"width:40%\">\n  <label>Min</label>\n  <input type=\"number\" class=\"form-control\" style=\"width: 100px\" name=\"min\" value=\""
    + alias4(((helper = (helper = helpers.min || (depth0 != null ? depth0.min : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"min","hash":{},"data":data}) : helper)))
    + "\">\n</div>\n<div class=\"form-group\" style=\"width:40%\">\n  <label>Max</label>\n  <input type=\"number\" class=\"form-control\" style=\"width: 100px\" name=\"max\" value=\""
    + alias4(((helper = (helper = helpers.max || (depth0 != null ? depth0.max : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"max","hash":{},"data":data}) : helper)))
    + "\">\n</div>\n</div>\n\n<p class=\"text-danger\" style=\"margin-top: 10px\">Or add discrete values (then the <b>min/max</b> values are ignored). First line is <b>0</b>, second <b>1</b>, etc:</p>\n\n<div class=\"form-group\">\n  <label>Add one option per line (make it short!)</label>\n  <textarea class=\"form-control\" name=\"options\">"
    + alias4(((helper = (helper = helpers.options || (depth0 != null ? depth0.options : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"options","hash":{},"data":data}) : helper)))
    + "</textarea>\n</div>\n\n";
},"useData":true});

},{"hbsfy/runtime":162}],88:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    return " checked=\"true\"";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {};

  return "<div class=\"form-group\">\n  <label>Add one option per line</label>\n  <textarea class=\"form-control\" name=\"options\">"
    + container.escapeExpression(((helper = (helper = helpers.options || (depth0 != null ? depth0.options : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"options","hash":{},"data":data}) : helper)))
    + "</textarea>\n</div>\n\n<div class=\"form-group\">\n  <div class=\"checkbox\">\n    <label>\n      <input type=\"checkbox\" name=\"multiple\" value=\"1\""
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.multiple : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "> Multiple choices\n    </label>\n  </div>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],89:[function(require,module,exports){

var
  template = require('./templates/search.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "search",
  template: template,

  ui: {
    searchbox: "#search"
  },

  events: {
    "keyup @ui.searchbox": "search",
    "click .btn-group>.btn": "sortClicked",
    "click .login": "showLogin"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  lastSearch: "",
  currentSort: "",

  initialize: function(options){
    this.showSort = (options && options.showSort) || false;
    this.collection = options && options.collection;
    this.placeholder = (options && options.placeholder) || "Enter your keywords";
  },

  onRender: function(){
    var query = hackdash.getQueryVariable("q");
    var sort = hackdash.getQueryVariable('sort');

    if (query && query.length > 0){
      this.ui.searchbox.val(query);
      this.search();
    }

    if (sort && sort.length > 0){
      $('input[type=radio]', this.$el)
        .parents('label')
        .removeClass('active');

      $('input[type=radio]#' + sort, this.$el)
        .parents('label')
        .addClass('active');

      this.updateSort(sort);
    }
  },

  serializeData: function(){
    return _.extend({
      showSort: this.showSort,
      placeholder: this.placeholder
    }, this.model.toJSON());
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  showLogin: function(){
    hackdash.app.showLogin();
  },

  sortClicked: function(e){
    e.preventDefault();
    var val = $('input[type=radio]', e.currentTarget)[0].id;
    this.updateSort(val);
  },

  updateSort: function(sort){
    this.collection.trigger("sort:" + sort);

    if (sort !== this.currentSort){
      this.currentSort = sort;
      this.updateURL();
    }
  },

  search: function(){
    var self = this;
    window.clearTimeout(this.timer);

    this.timer = window.setTimeout(function(){
      var keyword = self.ui.searchbox.val();

      if (keyword !== self.lastSearch) {
        self.lastSearch = keyword;

        self.updateURL();
        self.collection.search(keyword);

        var top = $('#dashboard-projects').offset().top;
        var offset = self.$el.parent().height();
        var pos = (top - offset >= 0 ? top - offset : 0);
        $(window).scrollTop(pos);

        var dash = hackdash.app.dashboard;
        var domain = dash && dash.get('domain') || 'unkonwn';
        window._gaq.push(['_trackEvent', 'DashSearch', domain, keyword]);
      }

    }, 300);
  },

  updateURL: function(){
    var keywords = (this.lastSearch ? 'q=' + this.lastSearch : '');
    var sort = (this.currentSort ? 'sort=' + this.currentSort : '');

    var current = decodeURI(Backbone.history.location.search);
    var fragment = Backbone.history.fragment.replace(current, "");

    var search = '?';

    if (keywords){
      search += keywords;
    }

    if (sort){
      search += (keywords ? '&' + sort : sort);
    }

    hackdash.app.router.navigate(fragment + search);
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});

},{"./templates/search.hbs":92}],90:[function(require,module,exports){
var
    template = require('./templates/header.hbs')
  , Search = require('./Search');

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "container-fluid",
  template: template,

  regions: {
    "search": ".search-ctn"
  },

  events: {
    "click .login": "showLogin",
    "click .btn-profile": "openProfile"
  },

  modelEvents: {
    "change": "render"
  },

  templateHelpers: {
    hackdashURL: function(){
      return "//" + hackdash.baseURL;
    },
    isDashboardAdmin: function(){
      var isDashboard = (hackdash.app.type === "dashboard" ? true : false);

      var user = hackdash.user;
      return isDashboard && user && user.admin_in.indexOf(this.domain) >= 0 || false;
    }
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){

    switch(hackdash.app.type){

      case "dashboard":
        this.search.show(new Search({
          showSort: true,
          placeholder: "Enter your keywords",
          model: this.model,
          collection: this.collection
        }));
        break;
    }

    $('.tooltips', this.$el).tooltip({});
    this.$el.addClass(hackdash.app.type);
  },

  serializeData: function(){
    return _.extend({
      fromUrl: this.getURLFrom()
    }, this.model && this.model.toJSON() || {});
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  openProfile: function(e){
    e.preventDefault();

    window.fromURL = '/' + Backbone.history.fragment;

    hackdash.app.router.navigate("/users/profile", {
      trigger: true,
      replace: true
    });
  },

  showLogin: function(){
    hackdash.app.showLogin();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  getURLFrom: function(){
    return '?from=' + window.encodeURI('/' + Backbone.history.fragment);
  }

});
},{"./Search":89,"./templates/header.hbs":91}],91:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var helper;

  return "    <div class=\"pull-right col-xs-3 col-md-3\">\n      <a class=\"btn-profile\">\n        "
    + container.escapeExpression(((helper = (helper = helpers.getMyProfileImageHex || (depth0 != null ? depth0.getMyProfileImageHex : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"getMyProfileImageHex","hash":{},"data":data}) : helper)))
    + "\n      </a>\n      <a class=\"logout\" href=\"/logout\" data-bypass>Log out</a>\n    </div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "    <a class=\"login\">Log in</a>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, options, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", buffer = 
  "\n<div class=\"row main-header\">\n\n  <div class=\"hidden-xs col-sm-10 col-md-10 col-lg-10 col-sm-offset-1 col-md-offset-1 search-ctn\"></div>\n\n  <div class=\"col-xs-2 col-sm-1 col-md-1 col-lg-1 my-profile\">\n";
  stack1 = ((helper = (helper = helpers.isLoggedIn || (depth0 != null ? depth0.isLoggedIn : depth0)) != null ? helper : alias2),(options={"name":"isLoggedIn","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data}),(typeof helper === alias3 ? helper.call(alias1,options) : helper));
  if (!helpers.isLoggedIn) { stack1 = helpers.blockHelperMissing.call(depth0,stack1,options)}
  if (stack1 != null) { buffer += stack1; }
  return buffer + "  </div>\n\n  <a class=\"logo\" href=\""
    + container.escapeExpression(((helper = (helper = helpers.hackdashURL || (depth0 != null ? depth0.hackdashURL : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"hackdashURL","hash":{},"data":data}) : helper)))
    + "\" data-bypass></a>\n\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],92:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "<div class=\"btn-group col-xs-6 col-sm-7 col-sm-offset-1 col-md-5 col-md-offset-0 col-lg-4\" data-toggle=\"buttons\">\n  <label class=\"btn btn-default col-xs-4 col-md-4\">\n    <input type=\"radio\" name=\"options\" id=\"name\" autocomplete=\"off\"> By Name\n  </label>\n  <label class=\"btn btn-default col-xs-4 col-md-4 active\">\n    <input type=\"radio\" name=\"options\" id=\"date\" autocomplete=\"off\"> By Date\n  </label>\n  <label class=\"btn btn-default col-xs-4 col-md-4\">\n    <input type=\"radio\" name=\"options\" id=\"showcase\" autocomplete=\"off\"> Showcase\n  </label>\n</div>\n\n<div class=\"col-sm-4 col-md-3 col-lg-4\">\n"
    + ((stack1 = helpers["if"].call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.open : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "</div>\n";
},"2":function(container,depth0,helpers,partials,data) {
    var stack1, helper, options, buffer = 
  "  <h3 class=\"create-project\">\n    <i class=\"fa fa-plus\"></i>\n";
  stack1 = ((helper = (helper = helpers.isLoggedIn || (depth0 != null ? depth0.isLoggedIn : depth0)) != null ? helper : helpers.helperMissing),(options={"name":"isLoggedIn","hash":{},"fn":container.program(3, data, 0),"inverse":container.program(5, data, 0),"data":data}),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},options) : helper));
  if (!helpers.isLoggedIn) { stack1 = helpers.blockHelperMissing.call(depth0,stack1,options)}
  if (stack1 != null) { buffer += stack1; }
  return buffer + "  </h3>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper;

  return "    <a href=\"/dashboards/"
    + container.escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"domain","hash":{},"data":data}) : helper)))
    + "/create\">Create Project</a>\n";
},"5":function(container,depth0,helpers,partials,data) {
    return "    <a class=\"login\">Create Project</a>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, options, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", buffer = 
  "<div class=\"hidden-sm col-md-4 col-lg-4\">\n\n  <div class=\"input-group\">\n    <input id=\"search\" type=\"text\" class=\"form-control\" placeholder=\""
    + container.escapeExpression(((helper = (helper = helpers.placeholder || (depth0 != null ? depth0.placeholder : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"placeholder","hash":{},"data":data}) : helper)))
    + "\">\n    <span class=\"input-group-btn\">\n      <button class=\"btn btn-primary\" type=\"button\">\n        <i class=\"fa fa-search\"></i>\n      </button>\n    </span>\n  </div>\n\n</div>\n\n";
  stack1 = ((helper = (helper = helpers.isDashboardView || (depth0 != null ? depth0.isDashboardView : depth0)) != null ? helper : alias2),(options={"name":"isDashboardView","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data}),(typeof helper === alias3 ? helper.call(alias1,options) : helper));
  if (!helpers.isDashboardView) { stack1 = helpers.blockHelperMissing.call(depth0,stack1,options)}
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"useData":true});

},{"hbsfy/runtime":162}],93:[function(require,module,exports){
/**
 * VIEW: A Collection of HOME Search
 *
 */

var template = require('./templates/collection.hbs');
var ItemView = require('./Item.js');

module.exports = ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: 'entity collection',
  template: template,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  getURL: function(){
    return "/collections/" + this.model.get("_id");
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
},{"./Item.js":98,"./templates/collection.hbs":107}],94:[function(require,module,exports){
/**
 * VIEW: Counts of HOME
 *
 */

var template = require('./templates/counts.hbs');
var Counts = require('../../models/Counts');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: 'row counts',
  template: template,

  modelEvents: {
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(){
    this.model = new Counts();
    this.model.fetch();
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
},{"../../models/Counts":11,"./templates/counts.hbs":108}],95:[function(require,module,exports){
/**
 * VIEW: simple list of dashboards to create project on it
 *
 */

var DasboardItem = Backbone.Marionette.LayoutView.extend({
  tagName: 'li',
  template: require('./templates/dashboardItemSimple.hbs'),

  ui: {
    "domain": ".domain",
  },

  events: {
    "click @ui.domain": "gotoDomain",
  },

  gotoDomain: function(){

    window.location = "/dashboards/" + this.model.get("domain")  + '/create';
  },

  onRender: function(){
    this.$el.animate({height: '48px'});
  }

});

module.exports = Backbone.Marionette.CollectionView.extend({

  tagName: 'ul',
  className: 'dropdown-menu open',
  childView: DasboardItem,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(){
    var self = this;

    function showLoading(){
      self.ui.loading.removeClass('hidden');
    }

    this.collection.on('fetch', showLoading);

    this.collection.on('reset', function(){
      self.ui.loading.addClass('hidden');
      self.collection.off('fetch', showLoading);
    });
  },

});

},{"./templates/dashboardItemSimple.hbs":109}],96:[function(require,module,exports){
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

},{"./Item":98}],97:[function(require,module,exports){
/**
 * VIEW: Footer
 *
 */

var template = require('Home/templates/footer.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: 'footer',
  template: template,

  ui: {
    'up': '.up-button'
  },

  events: {
    'click @ui.up': 'goTop'
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  upBlocked: false,
  goTop: function(){

    if (!this.upBlocked){
      this.upBlocked = true;

      var body = $("html, body"), self = this;
      body.animate({ scrollTop:0 }, 1500, 'swing', function() {
        self.upBlocked = false;
      });
    }
  }

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});

},{"Home/templates/footer.hbs":165}],98:[function(require,module,exports){
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
},{"./templates/item.hbs":110}],99:[function(require,module,exports){
/**
 * VIEW: Partners for HOME
 *
 */

var template = require('Home/templates/partners.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

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

},{"Home/templates/partners.hbs":167}],100:[function(require,module,exports){

var
  template = require('./templates/search.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "landing-search",
  template: template,

  ui: {
    searchbox: "#search"
  },

  events: {
    "keyup @ui.searchbox": "search",
    "click @ui.searchbox": "moveScroll"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  lastSearch: null,

  onRender: function(){
    var query = hackdash.getQueryVariable("q");
    if (query && query.length > 0){
      this.ui.searchbox.val(query);
      //this.lastSearch = query;
    }

    this.search();
  },

  serializeData: function(){
    return {
      showSort: this.showSort,
      placeholder: this.placeholder
    };
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  search: function(){
    var self = this;
    window.clearTimeout(this.timer);

    this.timer = window.setTimeout(function(){
      var keyword = self.ui.searchbox.val();
      var currentSearch = decodeURI(Backbone.history.location.search);
      var fragment = Backbone.history.fragment.replace(currentSearch, "");

      if (keyword !== self.lastSearch) {
        self.lastSearch = keyword;

        if (keyword.length > 0) {
          fragment = (!fragment.length ? "dashboards" : fragment);
          hackdash.app.router.navigate(fragment + "?q=" + keyword, { trigger: true });

          self.collection.fetch({
            reset: true,
            data: $.param({ q: keyword })
          });

          window._gaq.push(['_trackEvent', 'HomeSearch', fragment, keyword]);
        }
        else {
          hackdash.app.router.navigate(fragment, { trigger: true, replace: true });
          self.collection.fetch({
            reset: true,
            data: $.param({ minProjects: 2 })
          });
        }
      }

    }, 300);
  },

  moveScroll: function(){
    var tabs = $('.nav-tabs.landing');
    var mobileMenu = $('.mobile-menu');

    var isMobile = mobileMenu.is(':visible');

    var top = tabs.offset().top + 60;
    var offset = tabs.height();

    if (isMobile){
      top = this.ui.tabContent.offset().top;
      offset = 0;
    }

    var pos = (top - offset >= 0 ? top - offset : 0);

    $(window).scrollTop(pos);
  }

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});

},{"./templates/search.hbs":111}],101:[function(require,module,exports){

var template = require("./templates/stats.hbs")
  , CountsView = require("./Counts")
  /*, FeedView = require("./Feed")*/;

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "stats",
  template: template,

  regions:{
    "counts": ".counts-ctn",
    "feed": ".feed-ctn"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    this.counts.show(new CountsView());

/*
    this.feed.show(

      new FeedView({

        collection: new Backbone.Collection(
          [{
            user: {
              _id: "54909d0f7fd3d5704c0006c6",
              name: "Alvaro Graves",
              picture: "//www.gravatar.com/avatar/5d79ff6eb94d9754235c7bad525bee81?s=73"
            },
            title: "Is now a collaborator on:",
            description: "una mañana tras un sueño intranquilo Gregorio Samsa",
            created_at: "2014-12-16T20:58:55.225Z"
          },{
            user: {
              _id: "54909d0f7fd3d5704c0006c6",
              name: "Alvaro Graves",
              picture: "//www.gravatar.com/avatar/5d79ff6eb94d9754235c7bad525bee81?s=73"
            },
            title: "Is now a collaborator on:",
            description: "una mañana tras un sueño intranquilo Gregorio Samsa",
            created_at: "2014-12-16T20:58:55.225Z"
          },{
            user: {
              _id: "54909d0f7fd3d5704c0006c6",
              name: "Alvaro Graves",
              picture: "//www.gravatar.com/avatar/5d79ff6eb94d9754235c7bad525bee81?s=73"
            },
            title: "Is now a collaborator on:",
            description: "una mañana tras un sueño intranquilo Gregorio Samsa",
            created_at: "2014-12-16T20:58:55.225Z"
          },{
            user: {
              _id: "54909d0f7fd3d5704c0006c6",
              name: "Alvaro Graves",
              picture: "//www.gravatar.com/avatar/5d79ff6eb94d9754235c7bad525bee81?s=73"
            },
            title: "Is now a collaborator on:",
            description: "una mañana tras un sueño intranquilo Gregorio Samsa",
            created_at: "2014-12-16T20:58:55.225Z"
          },{
            user: {
              _id: "54909d0f7fd3d5704c0006c6",
              name: "Alvaro Graves",
              picture: "//www.gravatar.com/avatar/5d79ff6eb94d9754235c7bad525bee81?s=73"
            },
            title: "Is now a collaborator on:",
            description: "una mañana tras un sueño intranquilo Gregorio Samsa",
            created_at: "2014-12-16T20:58:55.225Z"
          },{
            user: {
              _id: "54909d0f7fd3d5704c0006c6",
              name: "Alvaro Graves",
              picture: "//www.gravatar.com/avatar/5d79ff6eb94d9754235c7bad525bee81?s=73"
            },
            title: "Is now a collaborator on:",
            description: "una mañana tras un sueño intranquilo Gregorio Samsa",
            created_at: "2014-12-16T20:58:55.225Z"
          }])

      })
    );
*/
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
},{"./Counts":94,"./templates/stats.hbs":112}],102:[function(require,module,exports){
/**
 * VIEW: HOME Tab Layout (Search header + collection)
 *
 */

var template = require("./templates/tabContent.hbs");

// Main Views
var
    Search = require("./Search")
  , EntityList = require("./EntityList")

// Item Views
  , ProjectItemView = require('../Project/Card')
  , DashboardItemView = require('../Dashboard/Card')
  , UserItemView = require('./User')
  , CollectionView = require('./Collection')

// List Views
  , ProjectList = EntityList.extend({ childView: ProjectItemView })
  , DashboardList = EntityList.extend({ childView: DashboardItemView })
  , UserList = EntityList.extend({ childView: UserItemView })
  , CollectionList = EntityList.extend({ childView: CollectionView })

// Collection models
  , Projects = require('../../models/Projects')
  , Dashboards = require('../../models/Dashboards')
  , Collections = require('../../models/Collections')
  , Users = require('../../models/Users');

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  ui: {
    "loading": '.loading'
  },

  regions: {
    "header": ".header",
    "content": ".content-place"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(){
    var self = this;

    function showLoading(){
      self.ui.loading.removeClass('hidden');
    }

    this.collection.on('fetch', showLoading);

    this.collection.on('reset', function(){
      self.ui.loading.addClass('hidden');
      self.collection.off('fetch', showLoading);
    });
  },

  onRender: function(){

    if (!this.header.currentView){

      // Fetching data from collection
      this.header.show(new Search({
        collection: this.collection
      }));

      var ListView;
      if(this.collection instanceof Projects){
        ListView = ProjectList;
      }
      else if(this.collection instanceof Dashboards){
        ListView = DashboardList;
      }
      else if(this.collection instanceof Collections){
        ListView = CollectionList;
      }
      else if(this.collection instanceof Users){
        ListView = UserList;
      }

      this.content.show(new ListView({
        collection: this.collection
      }));

    }

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

},{"../../models/Collections":10,"../../models/Dashboards":13,"../../models/Projects":18,"../../models/Users":21,"../Dashboard/Card":27,"../Project/Card":127,"./Collection":93,"./EntityList":96,"./Search":100,"./User":105,"./templates/tabContent.hbs":113}],103:[function(require,module,exports){
/**
 * VIEW: A Team for Home
 *
 */

var User = require('./TeamUser');

module.exports = Backbone.Marionette.CollectionView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  childView: User,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

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
},{"./TeamUser":104}],104:[function(require,module,exports){
/**
 * VIEW: A User Team of HOME
 *
 */

var template = require('Home/templates/user.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: 'team-user',
  template: template,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

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

},{"Home/templates/user.hbs":114}],105:[function(require,module,exports){
/**
 * VIEW: An Dashboard of HOME Search
 *
 */

var template = require('./templates/user.hbs');
var ItemView = require('./Item.js');

module.exports = ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: 'entity user',
  template: template,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  getURL: function(){
    return "/users/" + this.model.get("_id");
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
},{"./Item.js":98,"./templates/user.hbs":114}],106:[function(require,module,exports){

var template = require("Home/templates/home.hbs") // Required as absolute to allow themes
  , TabContent = require("./TabContent")
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

    "stats": ".stats-ctn",
    "team": ".team-ctn",
    "partners": ".partners-ctn",
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
    homeToolsUrl: function(){
      return window.hackdash.homeToolsUrl;
    },
    canCreateDashboard: function(){
      // return true;
      if(window.hackdash.publicDashboardCreation) {
        return true;
      }
      return window.hackdash.user && window.hackdash.user.superadmin;
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
    this.section = (options && options.section) || "dashboards";

    this.hdTeam = new Team();
    this.hdTeam.fetch();
  },

  onRender: function(){

    this.changeTab();

    if (!this.ui[this.section].hasClass("active")){
      this.ui[this.section].addClass("active");
    }

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
    "subdomain_invalid": "5 to 20 chars, no spaces or special",
    "subdomain_inuse": "Sorry, that one is in use. Try another one.",
    "sudomain_create_permission": "Sorry, you don't have permissions to create a dashboard."
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

  gotoTools: function(){
    window.location = window.hackdash.homeToolsUrl;
  },

  createProject: function(){
    if (this.checkLogin()){
      if(this.ui.dashboardList.hasClass('open')) {
        this.ui.dashboardList.removeClass('open');
        this.ui.createProject
          .html('Create project');
        return;
      }

      this.ui.createProject
        .html('Where to?');

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

},{"../../models/Collections":10,"../../models/Dashboards":13,"../../models/Projects":18,"../../models/Team":19,"../../models/Users":21,"../Forgot":44,"../Login":115,"../Register":136,"./DashboardList":95,"./Footer":97,"./Partners":99,"./Stats":101,"./TabContent":102,"./Team":103,"Home/templates/home.hbs":166}],107:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    return "  <i class=\"item-letter\">"
    + container.escapeExpression((helpers.firstLetter || (depth0 && depth0.firstLetter) || helpers.helperMissing).call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.title : depth0),{"name":"firstLetter","hash":{},"data":data}))
    + "</i>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "  <i class=\"item-letter\">"
    + container.escapeExpression((helpers.firstLetter || (depth0 && depth0.firstLetter) || helpers.helperMissing).call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.domain : depth0),{"name":"firstLetter","hash":{},"data":data}))
    + "</i>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"cover\">\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.title : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data})) != null ? stack1 : "")
    + "</div>\n\n<div class=\"details\">\n  <div>\n    <h2>"
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "</h2>\n    <h3 class=\"description\">\n      "
    + alias4(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"description","hash":{},"data":data}) : helper)))
    + "\n    </h3>\n  </div>\n</div>\n\n<div class=\"action-bar text-center\">\n  <i class=\"fa fa-clock-o timer\" title=\""
    + alias4((helpers.timeAgo || (depth0 && depth0.timeAgo) || alias2).call(alias1,(depth0 != null ? depth0.created_at : depth0),{"name":"timeAgo","hash":{},"data":data}))
    + "\"></i>\n  <span>"
    + alias4(container.lambda(((stack1 = (depth0 != null ? depth0.dashboards : depth0)) != null ? stack1.length : stack1), depth0))
    + " Event boards</span>\n  <!--<span>Likes 00</span>\n  <a>Share</a>-->\n</div>";
},"useData":true});

},{"hbsfy/runtime":162}],108:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"col-xs-6 col-sm-4 col-md-4 group\">\n  <div class=\"dashboard\">\n    <h5>"
    + alias4(((helper = (helper = helpers.dashboards || (depth0 != null ? depth0.dashboards : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"dashboards","hash":{},"data":data}) : helper)))
    + "</h5>\n    <h6>dashboards</h6>\n  </div>\n  <div class=\"project\">\n    <h5>"
    + alias4(((helper = (helper = helpers.projects || (depth0 != null ? depth0.projects : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"projects","hash":{},"data":data}) : helper)))
    + "</h5>\n    <h6>projects</h6>\n  </div>\n</div>\n<div class=\"col-xs-6 col-sm-4 col-md-4 group\">\n  <div class=\"user\">\n    <h5>"
    + alias4(((helper = (helper = helpers.users || (depth0 != null ? depth0.users : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"users","hash":{},"data":data}) : helper)))
    + "</h5>\n    <h6>registered users</h6>\n  </div>\n  <div class=\"collection\">\n    <h5>"
    + alias4(((helper = (helper = helpers.collections || (depth0 != null ? depth0.collections : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"collections","hash":{},"data":data}) : helper)))
    + "</h5>\n    <h6>collections</h6>\n  </div>\n</div>\n<div class=\"col-xs-12 col-sm-4 col-md-4 project releases\">\n  <h5>"
    + alias4(((helper = (helper = helpers.releases || (depth0 != null ? depth0.releases : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"releases","hash":{},"data":data}) : helper)))
    + "</h5>\n  <h6>released projects</h6>\n</div>";
},"useData":true});

},{"hbsfy/runtime":162}],109:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var helper;

  return container.escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"title","hash":{},"data":data}) : helper)));
},"3":function(container,depth0,helpers,partials,data) {
    var helper;

  return container.escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"domain","hash":{},"data":data}) : helper)));
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "<a class=\"domain\">"
    + ((stack1 = helpers["if"].call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.title : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data})) != null ? stack1 : "")
    + "</a>\n\n";
},"useData":true});

},{"hbsfy/runtime":162}],110:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper;

  return "<div>"
    + container.escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"_id","hash":{},"data":data}) : helper)))
    + "</div>";
},"useData":true});

},{"hbsfy/runtime":162}],111:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"row\">\n\n  <div class=\"hidden-xs col-sm-3 col-md-4\">\n\n    <div class=\"col-sm-12 col-md-6\">\n\n      <div class=\"media\">\n        <div class=\"media-left\">\n          <i class=\"fa fa-tasks\"></i>\n        </div>\n        <div class=\"media-body\">\n          Inform Progress to community.\n        </div>\n      </div>\n\n    </div>\n    <div class=\"col-sm-12 col-md-6\">\n\n      <div class=\"media\">\n        <div class=\"media-left\">\n          <i class=\"fa fa-cloud-upload\"></i>\n        </div>\n        <div class=\"media-body\">\n          Upload your project to the platform.\n        </div>\n      </div>\n\n    </div>\n\n  </div>\n\n  <div class=\"col-xs-12 col-sm-6 col-md-4\">\n    <div class=\"input-group\">\n      <input id=\"search\" type=\"text\" class=\"form-control\" placeholder=\"enter keywords\">\n      <span class=\"input-group-btn\">\n        <button class=\"btn btn-primary\" type=\"button\">find it</button>\n      </span>\n    </div>\n  </div>\n\n  <div class=\"hidden-xs col-sm-3 col-md-4\">\n\n    <div class=\"col-sm-12 col-md-6\">\n\n      <div class=\"media\">\n        <div class=\"media-left\">\n          <i class=\"fa fa-user-plus\"></i>\n        </div>\n        <div class=\"media-body\">\n          Add Collaborators to your projects.\n        </div>\n      </div>\n\n    </div>\n    <div class=\"col-sm-12 col-md-6\">\n\n      <div class=\"media\">\n        <div class=\"media-left\">\n          <i class=\"fa fa-share-alt\"></i>\n        </div>\n        <div class=\"media-body\">\n          Share your app to the world.\n        </div>\n      </div>\n\n    </div>\n\n  </div>\n\n</div>";
},"useData":true});

},{"hbsfy/runtime":162}],112:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"col-md-12 counts-ctn\"></div>\n<div class=\"col-md-6 feed-ctn hidden\"></div>";
},"useData":true});

},{"hbsfy/runtime":162}],113:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"container-fluid header\">HEAD</div>\n<div class=\"content\">\n  <div class=\"content-place\"></div>\n  <div class=\"loading hidden\">\n    <i class=\"fa fa-spinner fa-pulse\"></i>\n  </div>\n</div>";
},"useData":true});

},{"hbsfy/runtime":162}],114:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<a href=\"/users/"
    + alias4(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\" data-bypass>\n  <div class=\"cover\">\n    <div class=\"item-letter\">\n      "
    + alias4((helpers.getProfileImageHex || (depth0 && depth0.getProfileImageHex) || alias2).call(alias1,depth0,{"name":"getProfileImageHex","hash":{},"data":data}))
    + "\n    </div>\n  </div>\n\n  <div class=\"details\">\n    <h2>"
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "</h2>\n    <div class=\"description\">"
    + alias4(((helper = (helper = helpers.bio || (depth0 != null ? depth0.bio : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"bio","hash":{},"data":data}) : helper)))
    + "</div>\n  </div>\n</a>";
},"useData":true});

},{"hbsfy/runtime":162}],115:[function(require,module,exports){
/**
 * VIEW: Login Modal
 *
 */

var template = require('./templates/login.hbs');
var Register = require("./Register");
var Forgot = require("./Forgot");

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "login",
  template: template,

  ui: {
    "errorHolder": "#login-errors"
  },

  events: {
    "click .register": "register",
    "click .lostpass": "lostPassword",
    "click .close": "destroy"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    this.flashError = (options && options.model && options.model.attributes && options.model.attributes.flashError) || '';
    this.flashMessage = (options && options.model && options.model.attributes && options.model.attributes.flashMessage) || '';
  },

  templateHelpers: function() {
    var flashError = this.flashError;
    var flashMessage = this.flashMessage;
    return {
      showErrors: function(){
        return flashError;
      },
      showMessages: function(){
        return flashMessage;
      },
      redirectURL: function(){
        var url = hackdash.app.previousURL || '';
        return (url.length ? '?redirect=' + url : url);
      }
    };
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  register: function(){
    var flashError = this.flashError;
    hackdash.app.modals.show(new Register({
        model: new Backbone.Model({
          flashError: flashError
         })
      }));
    this.destroy();
  },

  lostPassword: function(){
    var flashError = this.flashError;
    var flashMessage = this.flashMessage;
    hackdash.app.modals.show(new Forgot({
        model: new Backbone.Model({
          flashError: flashError,
          flashMessage: flashMessage,
         })
      }));
    this.destroy();
    return false; // do not follow routes
  }

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"./Forgot":44,"./Register":136,"./templates/login.hbs":139}],116:[function(require,module,exports){
/**
 * VIEW: Login Modal
 *
 */

var template = require('./templates/messageBox.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "message-box",
  template: template,

  events: {
    "click .ok": "destroy",
    "click .close": "destroy"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

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
},{"./templates/messageBox.hbs":140}],117:[function(require,module,exports){
/**
 * REGION: ModalRegion
 * Used to manage Twitter Bootstrap Modals with Backbone Marionette Views
 */

module.exports = Backbone.Marionette.Region.extend({
  el: "#modals-container",

  constructor: function(){
    Backbone.Marionette.Region.prototype.constructor.apply(this, arguments);
    this.on("show", this.showModal, this);
  },

  getEl: function(selector){
    var $el = $(selector);
    $el.on("hidden", this.destroy);
    return $el;
  },

  showModal: function(view){
    view.on("destroy", this.hideModal, this);
    this.$el.parents('.modal').modal('show');
  },

  hideModal: function(){
    this.$el.parents('.modal').modal('hide');
  }

});

},{}],118:[function(require,module,exports){
/**
 * VIEW: ProfileCard
 *
 */

var template = require('./templates/card.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  events: {
    "click .login": "showLogin"
  },

  modelEvents:{
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  showLogin: function(){
    hackdash.app.showLogin();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
},{"./templates/card.hbs":123}],119:[function(require,module,exports){
/**
 * VIEW: ProfileCard Edit
 *
 */

var template = require('./templates/cardEdit.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  ui: {
    "name": "input[name=name]",
    "email": "input[name=email]",
    "bio": "textarea[name=bio]",
    "birthdate": "input[name=birthdate]",
    "gender": "select[name=gender]",
    "location": "input[name=location]",
    "city": "input[name=city]",
    "region": "input[name=region]",
    "country": "input[name=country]",
    "zip": "input[name=zip]",
    "lat": "input[name=lat]",
    "lng": "input[name=lng]",
    "facebook": "input[name=facebook]",
    "twitter": "input[name=twitter]",
    "linkedin": "input[name=linkedin]",
    "instagram": "input[name=instagram]",
    "google": "input[name=google]",
    "github": "input[name=github]",
  },

  events: {
    "click #save": "saveProfile",
    "click #cancel": "cancel",
    "focus @ui.location": "geolocate"
  },

  modelEvents:{
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------
  initialize: function(){
    this.autocomplete = null;
  },

  onRender: function(){
    this.initGoogleAutocomplete(this.ui.location.get(0));
    // console.log(this.model.attributes);
    if(!this.model.attributes.location || !this.model.attributes.location.coordinates || this.model.attributes.location.coordinates.length === 0) {
      this.geolocate(); //Ask for browser geolocation
    }
  },
  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  saveProfile: function(){
    // Mandatory fields
    var toSave = {
      name: this.ui.name.val(),
      email: this.ui.email.val(),
      bio: this.ui.bio.val(),
      social: {
        facebook: this.ui.facebook.val(),
        twitter: this.ui.twitter.val(),
        linkedin: this.ui.linkedin.val(),
        instagram: this.ui.instagram.val(),
        google: this.ui.google.val(),
        github: this.ui.github.val(),
      }
    };
    // Optional
    if(this.ui.birthdate.val()) {
      var d = this.ui.birthdate.val().split('/');
      // We're not sending a Date() object here to not rely on locale timezones
      toSave.birthdate = d[2] + '-' + d[1] + '-' +d[0];
    }
    if(this.ui.gender.val()) {
      toSave.gender = this.ui.gender.val();
    }
    var lat = parseFloat(this.ui.lat.val());
    var lng = parseFloat(this.ui.lng.val());
    if(!isNaN(lat) && !isNaN(lng)) {
      toSave.location = {
        type: 'Point',
        city: this.ui.city.val(),
        region: this.ui.region.val(),
        country: this.ui.country.val(),
        zip: this.ui.zip.val(),
        coordinates: [lat, lng]
      };
    }

    console.log(toSave, this.model.attributes.location);

    this.cleanErrors();
    $("#save", this.$el).button('loading');

    this.model
      .save(toSave, { patch: true, silent: true })
      .error(this.showError.bind(this));
  },

  cancel: function(){
    this.exit();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  errors: {
    "name_required": "Name is required",
    "email_required": "Email is required",
    "email_invalid": "Invalid Email",
    "email_existing": "Already registered Email"
  },

  exit: function(){
    window.fromURL = window.fromURL || window.hackdash.getQueryVariable('from') || '';

    if (window.fromURL){
      hackdash.app.router.navigate(window.fromURL, {
        trigger: true,
        replace: true
      });

      window.fromURL = "";
      return;
    }

    window.location = "/";
  },

  showError: function(err){
    $("#save", this.$el).button('reset');

    if (err.responseText === "OK"){

      $('#cancel').addClass('hidden');
      $('#save').addClass('hidden');
      $(".saved", this.$el).removeClass('hidden').addClass('show');

      window.clearTimeout(this.timer);
      this.timer = window.setTimeout(this.exit.bind(this), 2000);

      return;
    }

    var error = JSON.parse(err.responseText).error;

    if(this.errors[error]) {
      var ctrl = error.split("_")[0];
      this.ui[ctrl].parents('.control-group').addClass('error');
      this.ui[ctrl].after('<span class="help-inline">' + this.errors[error] + '</span>');
    } else {
      // Quick and dirty
      window.alert(error);
    }

  },

  cleanErrors: function(){
    $(".error", this.$el).removeClass("error");
    $("span.help-inline", this.$el).remove();
  },

  initGoogleAutocomplete: function(el) {
    if(window.google) {
      this.autocomplete = new window.google.maps.places.Autocomplete(el, {types: ['geocode']});
      this.autocomplete.addListener('place_changed', this.fillInAddress.bind(this));
    }
  },

  fillInAddress: function() {
    var place = this.autocomplete.getPlace();
    this.ui.lat.val(place.geometry.location.lat());
    this.ui.lng.val(place.geometry.location.lng());

    // Get each component of the address from the place details
    // and fill the corresponding field on the form.
    for (var i = 0; i < place.address_components.length; i++) {
      var addressType = place.address_components[i].types[0];
      var short = place.address_components[i].short_name;
      var long = place.address_components[i].long_name;
      // console.log(addressType, short, long);
      if(addressType === 'country') {
        this.ui.country.val(short);
      }
      else if(addressType === 'locality') {
        this.ui.city.val(long);
      }
      else if(addressType === 'administrative_area_level_2') {
        this.ui.region.val(short);
      }
      else if(addressType === 'postal_code') {
        this.ui.zip.val(short);
      }
    }
  },

  // Bias the autocomplete object to the user's geographical location,
  // as supplied by the browser's 'navigator.geolocation' object.
  geolocate: function () {
    if (window.navigator.geolocation) {
      if(this.geolocateAsked) {
        return;
      }
      this.geolocateAsked = true;
      var self = this;
      window.navigator.geolocation.getCurrentPosition(function(position) {
        var geolocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        self.ui.lat.val(geolocation.lat);
        self.ui.lng.val(geolocation.lng);
        var circle = new window.google.maps.Circle({
          center: geolocation,
          radius: position.coords.accuracy
        });

        self.autocomplete.setBounds(circle.getBounds());
      });
    }
  }

});

},{"./templates/cardEdit.hbs":124}],120:[function(require,module,exports){
/**
 * VIEW: Profile list (collection, dashboard, project)
 *
 */

var Item = require('./ListItem');

module.exports = Backbone.Marionette.CollectionView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  tagName: "ul",
  childView: Item,

  childViewOptions: function() {
    return {
      type: this.type,
      isMyProfile: this.isMyProfile
    };
  },

  showAll: true,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    this.fullList = options.collection || new Backbone.Collection();
    this.type = (options && options.type) || false;
    this.isMyProfile = (options && options.isMyProfile) || false;
  },

  onBeforeRender: function(){
    if (Array.isArray(this.fullList)){
      this.fullList = new Backbone.Collection(this.fullList);
    }

    this.collection = this.fullList;
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
},{"./ListItem":121}],121:[function(require,module,exports){
/**
 * VIEW: Profile Item List
 *
 */

var template = require('./templates/listItem.hbs'),
  Dashboard = require('../../models/Dashboard');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  tagName: "li",
  template: template,

  events: {
    "click .remove-entity": "removeEntity"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    this.type = (options && options.type) || "projects";
    this.isMyProfile = (options && options.isMyProfile) || false;
  },

  serializeData: function(){
    var url,
      isProject = false,
      showDelete = false;

    switch(this.type){
      case "collections":
        url = "/collections/" + this.model.get("_id");
        break;
      case "dashboards":
        url = "/dashboards/" + this.model.get("domain");
        showDelete = this.isMyProfile && Dashboard.isAdmin(this.model);
        break;
      case "projects":
      case "contributions":
      case "likes":
        url = "/projects/" + this.model.get("_id");
        isProject = true;
        break;
    }

    var showImage = (this.type === "collections" || this.type === "dashboards" ? false : true);
    if (showImage){
      showImage = this.model.get('cover');
    }

    return _.extend({
      showImage: showImage,
      isProject: isProject,
      showDelete: showDelete,
      type: this.type,
      url: url
    }, this.model.toJSON());
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  removeEntity: function(e){
    if (this.type !== "dashboards"){
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (!Dashboard.isAdmin(this.model)){
      this.showMessage("Only the Owner can remove this Dashboard.");
      return;
    }

    if (!Dashboard.isOwner(this.model)){
      this.showMessage("Only Dashboards with ONE admin can be removed.");
      return;
    }

    if (this.model.get("projectsCount") > 0){
      this.showMessage("Only Dashboards without Projects can be removed.");
      return;
    }

    if (window.confirm('This action will remove Dashboard ' +
      this.model.get("domain") + '. Are you sure?')){

        var dash = new Dashboard({ domain: this.model.get('domain') });
        dash.destroy().done(function(){
          window.location.reload();
        });
    }
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  showMessage: function(msg){
    hackdash.app.showOKMessage({
      title: "Cannot Remove " + this.model.get('domain') + " Dashboard",
      message: msg,
      type: "danger"
    });
  }

});
},{"../../models/Dashboard":12,"./templates/listItem.hbs":125}],122:[function(require,module,exports){

var
    template = require("./templates/profile.hbs")
  , ProfileCard = require("./Card")
  , ProfileCardEdit = require("./CardEdit")
  , EntityList = require("./EntityList");

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "page-ctn profile",
  template: template,

  regions: {
    "profileCard": ".profile-card",

    "collections": "#collections",
    "dashboards": "#dashboards",
    "projects": "#projects",
    "contributions": "#contributions",
    "likes": "#likes",
  },

  ui: {
    "collections": "#collections",
    "dashboards": "#dashboards",
    "projects": "#projects",
    "contributions": "#contributions",
    "likes": "#likes",
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    this.section = (options && options.section) || "dashboards";
    this.isMyProfile = (hackdash.user && this.model.get("_id") === hackdash.user._id ? true : false);
  },

  onRender: function(){

    this.changeTab();

    if (!this.ui[this.section].hasClass("active")){
      this.ui[this.section].addClass("active");
    }

    if (this.isMyProfile){
      this.profileCard.show(new ProfileCardEdit({
        model: this.model
      }));
    }
    else {
      this.profileCard.show(new ProfileCard({
        model: this.model
      }));
    }

    $('.tooltips', this.$el).tooltip({});

    $('a[data-toggle="tab"]', this.$el).on('shown.bs.tab', this.setSection.bind(this));
    $('html, body').scrollTop(0);
  },

  changeTab: function(){
    if (!this[this.section].currentView){

      this[this.section].show(new EntityList({
        collection: this.model.get(this.section),
        type: this.section,
        isMyProfile: this.isMyProfile
      }));
    }

    this.ui[this.section].tab("show");
  },

  setSection: function(e){
    this.section = e.target.parentElement.id + 's';
    this.changeTab();
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
},{"./Card":118,"./CardEdit":119,"./EntityList":120,"./templates/profile.hbs":126}],123:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var helper;

  return "  <p>"
    + container.escapeExpression(((helper = (helper = helpers.email || (depth0 != null ? depth0.email : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"email","hash":{},"data":data}) : helper)))
    + "</p>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "  <p><a class=\"login\" style=\"color: #A8A8A8;\">[ Log in to reveal e-mail ]</a></p>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, options, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3=container.escapeExpression, alias4="function", buffer = 
  "<div class=\"cover\">"
    + alias3((helpers.getProfileImageHex || (depth0 && depth0.getProfileImageHex) || alias2).call(alias1,depth0,{"name":"getProfileImageHex","hash":{},"data":data}))
    + "</div>\n<h1 class=\"header\">"
    + alias3(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "</h1>\n<div class=\"profileInfo\">\n\n";
  stack1 = ((helper = (helper = helpers.isLoggedIn || (depth0 != null ? depth0.isLoggedIn : depth0)) != null ? helper : alias2),(options={"name":"isLoggedIn","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data}),(typeof helper === alias4 ? helper.call(alias1,options) : helper));
  if (!helpers.isLoggedIn) { stack1 = helpers.blockHelperMissing.call(depth0,stack1,options)}
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\n  <p>"
    + alias3(((helper = (helper = helpers.bio || (depth0 != null ? depth0.bio : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"bio","hash":{},"data":data}) : helper)))
    + "</p>\n</div>";
},"useData":true});

},{"hbsfy/runtime":162}],124:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    return "      <label class=\"email-info\">email only visible for logged in users</label>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "    <a id=\"cancel\" class=\"btn-cancel pull-left\">cancel</a>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3=container.escapeExpression, alias4="function", alias5=container.lambda;

  return "<h1 class=\"header edit\">Edit Your Profile</h1>\n\n<div class=\"cover\">"
    + alias3((helpers.getProfileImageHex || (depth0 && depth0.getProfileImageHex) || alias2).call(alias1,depth0,{"name":"getProfileImageHex","hash":{},"data":data}))
    + "</div>\n\n<form>\n  <div class=\"form-content\">\n    <label class=\"profile-fields-required\">all fields required</label>\n    <div class=\"form-group\">\n      <input name=\"name\" type=\"text\" placeholder=\"Name\" value=\""
    + alias3(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "\" class=\"form-control\"/>\n    </div>\n    <div class=\"form-group\">\n      <input name=\"email\" type=\"text\" placeholder=\"Email\" value=\""
    + alias3(((helper = (helper = helpers.email || (depth0 != null ? depth0.email : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"email","hash":{},"data":data}) : helper)))
    + "\" class=\"form-control\"/>\n"
    + ((stack1 = helpers.unless.call(alias1,(depth0 != null ? depth0.email : depth0),{"name":"unless","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "    </div>\n    <div class=\"form-group\">\n      <textarea name=\"bio\" placeholder=\"Some about you\" class=\"form-control\" rows=\"4\">"
    + alias3(((helper = (helper = helpers.bio || (depth0 != null ? depth0.bio : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"bio","hash":{},"data":data}) : helper)))
    + "</textarea>\n    </div>\n    <div class=\"form-group\">\n      <div class=\"input-group\">\n        <div class=\"input-group-addon\"><i class=\"fa fa-fw fa-facebook\"></i></div>\n        <input name=\"facebook\" type=\"text\" placeholder=\"Facebook profile URL\" value=\""
    + alias3(alias5(((stack1 = (depth0 != null ? depth0.social : depth0)) != null ? stack1.facebook : stack1), depth0))
    + "\" class=\"form-control\"/>\n      </div>\n    </div>\n    <div class=\"form-group\">\n      <div class=\"input-group\">\n        <div class=\"input-group-addon\"><i class=\"fa fa-fw fa-twitter\"></i></div>\n        <input name=\"twitter\" type=\"text\" placeholder=\"Twitter profile URL\" value=\""
    + alias3(alias5(((stack1 = (depth0 != null ? depth0.social : depth0)) != null ? stack1.twitter : stack1), depth0))
    + "\" class=\"form-control\"/>\n      </div>\n    </div>\n    <div class=\"form-group\">\n      <div class=\"input-group\">\n        <div class=\"input-group-addon\"><i class=\"fa fa-fw fa-instagram\"></i></div>\n        <input name=\"instagram\" type=\"text\" placeholder=\"Instagram profile URL\" value=\""
    + alias3(alias5(((stack1 = (depth0 != null ? depth0.social : depth0)) != null ? stack1.instagram : stack1), depth0))
    + "\" class=\"form-control\"/>\n      </div>\n    </div>\n    <div class=\"form-group\">\n      <div class=\"input-group\">\n        <div class=\"input-group-addon\"><i class=\"fa fa-fw fa-linkedin\"></i></div>\n        <input name=\"linkedin\" type=\"text\" placeholder=\"LinkedIn profile URL\" value=\""
    + alias3(alias5(((stack1 = (depth0 != null ? depth0.social : depth0)) != null ? stack1.linkedin : stack1), depth0))
    + "\" class=\"form-control\"/>\n      </div>\n    </div>\n    <div class=\"form-group\">\n      <div class=\"input-group\">\n        <div class=\"input-group-addon\"><i class=\"fa fa-fw fa-github\"></i></div>\n        <input name=\"github\" type=\"text\" placeholder=\"LinkedIn profile URL\" value=\""
    + alias3(alias5(((stack1 = (depth0 != null ? depth0.social : depth0)) != null ? stack1.github : stack1), depth0))
    + "\" class=\"form-control\"/>\n      </div>\n    </div>\n    <div class=\"form-group\">\n      <div class=\"input-group\">\n        <div class=\"input-group-addon\"><i class=\"fa fa-fw fa-google-plus\"></i></div>\n        <input name=\"google\" type=\"text\" placeholder=\"Google+ profile URL\" value=\""
    + alias3(alias5(((stack1 = (depth0 != null ? depth0.social : depth0)) != null ? stack1.google : stack1), depth0))
    + "\" class=\"form-control\"/>\n      </div>\n    </div>\n    <div class=\"form-group\">\n      <p class=\"form-control-static\">This data is for statistics purposes and it is not public:</p>\n    </div>\n    <div class=\"form-group\">\n      <input name=\"birthdate\" type=\"text\" data-provide=\"datepicker\" data-date-format=\"dd/mm/yyyy\" placeholder=\"Date of birth\" value=\""
    + alias3((helpers.formatDateLocal || (depth0 && depth0.formatDateLocal) || alias2).call(alias1,(depth0 != null ? depth0.birthdate : depth0),{"name":"formatDateLocal","hash":{},"data":data}))
    + "\" class=\"form-control\"/>\n    </div>\n    <div class=\"form-group\">\n      <select name=\"gender\" class=\"form-control\">\n        <option value=\"\">Gender</option>\n        <option value=\"M\""
    + alias3((helpers.selected || (depth0 && depth0.selected) || alias2).call(alias1,(depth0 != null ? depth0.gender : depth0),"M",{"name":"selected","hash":{},"data":data}))
    + ">Male</option>\n        <option value=\"F\""
    + alias3((helpers.selected || (depth0 && depth0.selected) || alias2).call(alias1,(depth0 != null ? depth0.gender : depth0),"F",{"name":"selected","hash":{},"data":data}))
    + ">Female</option>\n        <option value=\"O\""
    + alias3((helpers.selected || (depth0 && depth0.selected) || alias2).call(alias1,(depth0 != null ? depth0.gender : depth0),"O",{"name":"selected","hash":{},"data":data}))
    + ">Other</option>\n      </select>\n    </div>\n    <div class=\"form-group\">\n      <input name=\"location\" type=\"text\" placeholder=\"City\" value=\""
    + alias3((helpers.formatLocation || (depth0 && depth0.formatLocation) || alias2).call(alias1,(depth0 != null ? depth0.location : depth0),{"name":"formatLocation","hash":{},"data":data}))
    + "\" class=\"form-control\"/>\n    </div>\n\n      <input name=\"city\" type=\"hidden\" value=\""
    + alias3(alias5(((stack1 = (depth0 != null ? depth0.location : depth0)) != null ? stack1.city : stack1), depth0))
    + "\"/>\n      <input name=\"region\" type=\"hidden\" value=\""
    + alias3(alias5(((stack1 = (depth0 != null ? depth0.location : depth0)) != null ? stack1.region : stack1), depth0))
    + "\"/>\n      <input name=\"country\" type=\"hidden\" value=\""
    + alias3(alias5(((stack1 = (depth0 != null ? depth0.location : depth0)) != null ? stack1.country : stack1), depth0))
    + "\"/>\n      <input name=\"zip\" type=\"hidden\" value=\""
    + alias3(alias5(((stack1 = (depth0 != null ? depth0.location : depth0)) != null ? stack1.zip : stack1), depth0))
    + "\"/>\n      <input name=\"lat\" type=\"hidden\" value=\""
    + alias3(alias5(((stack1 = ((stack1 = (depth0 != null ? depth0.location : depth0)) != null ? stack1.coordinates : stack1)) != null ? stack1["0"] : stack1), depth0))
    + "\"/>\n      <input name=\"lng\" type=\"hidden\" value=\""
    + alias3(alias5(((stack1 = ((stack1 = (depth0 != null ? depth0.location : depth0)) != null ? stack1.coordinates : stack1)) != null ? stack1["1"] : stack1), depth0))
    + "\"/>\n\n  </div>\n  <div class=\"form-actions\">\n    <input id=\"save\" type=\"button\" data-loading-text=\"saving..\" value=\"Save profile URL\" class=\"btn-primary pull-right\"/>\n    <label class=\"saved pull-left hidden\">Profile saved, going back to business ...</label>\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.email : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "  </div>\n</form>\n";
},"useData":true});

},{"hbsfy/runtime":162}],125:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "        <div class=\"progress\" title=\""
    + alias4(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"status","hash":{},"data":data}) : helper)))
    + "\">\n          <div class=\"progress-bar progress-bar-success progress-bar-striped "
    + alias4(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"status","hash":{},"data":data}) : helper)))
    + "\" role=\"progressbar\">\n          </div>\n        </div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper;

  return "        <img src=\""
    + container.escapeExpression(((helper = (helper = helpers.cover || (depth0 != null ? depth0.cover : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"cover","hash":{},"data":data}) : helper)))
    + "\" style=\"width: 64px; height: 64px;\">\n";
},"5":function(container,depth0,helpers,partials,data) {
    return "        <i class=\"item-letter\">"
    + container.escapeExpression((helpers.firstLetter || (depth0 && depth0.firstLetter) || helpers.helperMissing).call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.title : depth0),{"name":"firstLetter","hash":{},"data":data}))
    + "</i>\n";
},"7":function(container,depth0,helpers,partials,data) {
    return "    <button class=\"remove-entity pull-right\">Remove</button>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<a class=\""
    + alias4(((helper = (helper = helpers.type || (depth0 != null ? depth0.type : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"type","hash":{},"data":data}) : helper)))
    + "\" href=\""
    + alias4(((helper = (helper = helpers.url || (depth0 != null ? depth0.url : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"url","hash":{},"data":data}) : helper)))
    + "\">\n  <div class=\"well media\">\n    <div class=\"media-left\">\n\n      <div class=\"cover\">\n\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.isProject : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.showImage : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.program(5, data, 0),"data":data})) != null ? stack1 : "")
    + "\n      </div>\n\n    </div>\n\n    <div class=\"media-body\">\n\n      <h4 class=\"media-heading\">"
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "</h4>\n      <p>"
    + alias4(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"description","hash":{},"data":data}) : helper)))
    + "</p>\n\n    </div>\n\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.showDelete : depth0),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "  </div>\n</a>";
},"useData":true});

},{"hbsfy/runtime":162}],126:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "        <li id=\"collection\" class=\"collection\">\n          <a href=\"#collections\" role=\"tab\" data-toggle=\"tab\" data-bypass=\"true\">\n            <span class=\"coll-length\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? depth0.collections : depth0)) != null ? stack1.length : stack1), depth0))
    + "</span>\n            <h3>Collections</h3>\n          </a>\n        </li>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression;

  return "\n<div class=\"header\">\n  <div class=\"container\">\n\n    <div class=\"profile-card\"></div>\n\n    <div class=\"text-center\">\n\n      <ul class=\"nav nav-tabs\" role=\"tablist\">\n\n"
    + ((stack1 = helpers["if"].call(depth0 != null ? depth0 : {},((stack1 = (depth0 != null ? depth0.collections : depth0)) != null ? stack1.length : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n        <li id=\"dashboard\" class=\"dashboard\">\n          <a href=\"#dashboards\" role=\"tab\" data-toggle=\"tab\" data-bypass=\"true\">\n            <span class=\"dash-length\">"
    + alias2(alias1(((stack1 = (depth0 != null ? depth0.dashboards : depth0)) != null ? stack1.length : stack1), depth0))
    + "</span>\n            <h3>Event boards</h3>\n          </a>\n        </li>\n        <li id=\"project\" class=\"project\">\n          <a href=\"#projects\" role=\"tab\" data-toggle=\"tab\" data-bypass=\"true\">\n            <span class=\"proj-length\">"
    + alias2(alias1(((stack1 = (depth0 != null ? depth0.projects : depth0)) != null ? stack1.length : stack1), depth0))
    + "</span>\n            <h3>Projects</h3>\n          </a>\n        </li>\n        <li id=\"contribution\" class=\"contributions\">\n          <a href=\"#contributions\" role=\"tab\" data-toggle=\"tab\" data-bypass=\"true\">\n            <span class=\"contrib-length\">"
    + alias2(alias1(((stack1 = (depth0 != null ? depth0.contributions : depth0)) != null ? stack1.length : stack1), depth0))
    + "</span>\n            <h3>Contributions</h3>\n          </a>\n        </li>\n        <li id=\"like\" class=\"likes\">\n          <a href=\"#likes\" role=\"tab\" data-toggle=\"tab\" data-bypass=\"true\">\n            <span class=\"likes-length\">"
    + alias2(alias1(((stack1 = (depth0 != null ? depth0.likes : depth0)) != null ? stack1.length : stack1), depth0))
    + "</span>\n            <h3>Following</h3>\n          </a>\n        </li>\n\n      </ul>\n\n    </div>\n\n  </div>\n</div>\n\n<div class=\"body\">\n  <div class=\"container\">\n\n    <div class=\"tab-content\">\n      <div role=\"tabpanel\" class=\"tab-pane\" id=\"dashboards\"></div>\n      <div role=\"tabpanel\" class=\"tab-pane\" id=\"projects\"></div>\n      <div role=\"tabpanel\" class=\"tab-pane\" id=\"collections\"></div>\n      <div role=\"tabpanel\" class=\"tab-pane\" id=\"contributions\"></div>\n      <div role=\"tabpanel\" class=\"tab-pane\" id=\"likes\"></div>\n    </div>\n\n  </div>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],127:[function(require,module,exports){
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

},{"../Home/Item.js":98,"./templates/card.hbs":132}],128:[function(require,module,exports){
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
},{"./Card":127}],129:[function(require,module,exports){
/**
 * VIEW: Project
 *
 */

var template = require('./templates/edit.hbs')
  // , Dashboard = require('../models/dashboard.js')
  ;

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "page-ctn project edition",
  template: template,

  ui: {
    "title": "input[name=title]",
    "description": "textarea[name=description]",
    "whatif": "textarea[name=whatif]",
    "link": "input[name=link]",
    "tags": "select[name=tags]",
    "status": "select[name=status]",
    "errorCover": ".error-cover"
  },

  events: {
    "click #ghImportBtn": "showGhImport",
    "click #searchGh": "searchRepo",

    "click #save": "save",
    "click #cancel": "cancel"
  },

  templateHelpers: {
    toolsUrl: function() {
      var status = _.findWhere(hackdash.statuses, {status: this.status});
      if(status) {
        console.log(status, status.toolsUrl);
        return status.toolsUrl;
      }
      return '';
    },
    selected: function(val) {
      return this.tags && _.indexOf(this.tags, val) > -1 ? ' selected' : '';
    },
    statuses: function(){
      return this.dashboard.getStatuses();
    }
  },

  modelEvents: {
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onShow: function(){
    this.initSelect2();
    this.initImageDrop();
    this.simplemde = new window.SimpleMDE({
      element: this.ui.description.get(0),
      forceSync: true,
      spellChecker: false
    });
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  showGhImport: function(e){
    $(".gh-import", this.$el).removeClass('hide');
    this.ui.description.css('margin-top', '30px');
    e.preventDefault();
  },

  searchRepo: function(e){
    var $repo = $("#txt-repo", this.$el),
      $btn = $("#searchGh", this.$el),
      repo = $repo.val();

    $repo.removeClass('btn-danger');
    $btn.button('loading');

    if(repo.length) {
      $.ajax({
        url: 'https://api.github.com/repos/' + repo,
        dataType: 'json',
        contentType: 'json',
        context: this
      })
      .done(this.fillGhProjectForm)
      .error(function(){
        $repo.addClass('btn-danger');
        $btn.button('reset');
      });
    }
    else {
      $repo.addClass('btn-danger');
      $btn.button('reset');
    }

    e.preventDefault();
  },

  save: function(){

    var toSave = {
      title: this.ui.title.val(),
      description: this.ui.description.val(),
      whatif: this.ui.whatif.val(),
      link: this.ui.link.val(),
      tags: this.ui.tags.val(),
      status: this.ui.status.val(),
      cover: this.model.get('cover')
    };

    this.cleanErrors();

    $("#save", this.$el).button('loading');

    this.model
      .save(toSave, { patch: true, silent: true })
      .success(this.redirect.bind(this))
      .error(this.showError.bind(this));
  },

  cancel: function(){
    this.redirect();
  },

  redirect: function(){
    var url = "/dashboards/" + this.model.get('domain');

    if (!this.model.isNew()){
      url = "/projects/" + this.model.get('_id');
    }

    hackdash.app.router.navigate(url, { trigger: true, replace: true });
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  errors: {
    "title_required": "Title is required",
    "description_required": "Description is required",
    "status_invalid": "Invalid status"
  },

  showError: function(err){
    $("#save", this.$el).button('reset');

    if (err.responseText === "OK"){
      this.redirect();
      return;
    }

    var error;
    try {
      error = JSON.parse(err.responseText).error;
    } catch (e) {
      error = err.responseText;
    }

    var ctrl = error.split("_")[0];
    var el = this.ui[ctrl] ? this.ui[ctrl] : this.ui.status;
    el.parents('.control-group').addClass('error');
    el.after('<span class="help-inline">' + (this.errors[error] ? this.errors[error] : error) + '</span>');
  },

  cleanErrors: function(){
    $(".error", this.$el).removeClass("error");
    $("span.help-inline", this.$el).remove();
  },

  initSelect2: function(){
    if (this.model.get('status')){
      this.ui.status.val(this.model.get('status'));
    }

    this.ui.status.select2({
      // theme: 'bootstrap',
      minimumResultsForSearch: 10
    });


    $('a.select2-choice').attr('href', null);

    this.ui.tags.select2({
      tags: true,
      // tags:[],
      // formatNoMatches: function(){ return ''; },
      // maximumInputLength: 20,
      tokenSeparators: [","]
    });
  },

  initImageDrop: function(){
    var self = this;
    var $dragdrop = $('#dragdrop', this.$el);

    var coverZone = new Dropzone("#dragdrop", {
      url: hackdash.apiURL + '/projects/cover',
      paramName: 'cover',
      maxFiles: 1,
      maxFilesize: 8, // MB
      acceptedFiles: 'image/jpeg,image/png,image/gif',
      uploadMultiple: false,
      clickable: true,
      dictDefaultMessage: 'Drop Image Here',
      dictFileTooBig: 'File is too big, 8 Mb is the max',
      dictInvalidFileType: 'Only jpg, png and gif are allowed'
    });

    coverZone.on("error", function(file, message) {
      self.ui.errorCover.removeClass('hidden').text(message);
    });

    coverZone.on("complete", function(file) {
      if (!file.accepted){
        coverZone.removeFile(file);
        return;
      }

      self.ui.errorCover.addClass('hidden').text('');

      var url = JSON.parse(file.xhr.response).href;
      self.model.set({ "cover": url }, { silent: true });

      coverZone.removeFile(file);

      $dragdrop
        .css('background-image', 'url(' + url + ')');

      $('.dz-message span', $dragdrop).css('opacity', '0.6');

    });
  },

  fillGhProjectForm: function(project) {
    this.ui.title.val(project.name);
    this.ui.description.text(project.description);
    this.ui.link.val(project.html_url);
    this.ui.tags.select2("data", [{id: project.language, text:project.language}]);
    this.ui.status.select2("val", "building");

    $("#searchGh", this.$el).button('reset');
    $("#txt-repo", this.$el).val('');
  }

});

},{"./templates/edit.hbs":133}],130:[function(require,module,exports){
/**
 * VIEW: Full Project view
 *
 */

var template = require("./templates/full.hbs")
  , Sharer = require("../Sharer");

module.exports = Backbone.Marionette.ItemView.extend({

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
        console.log(status, status.toolsUrl);
        return status.toolsUrl;
      }
      return '';
    },
    showActions: function(){
      if (hackdash.user && this.leader){
        return hackdash.user._id !== this.leader._id;
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
    $(".tooltips", this.$el).tooltip({});
    $.getScript("/js/disqus.js");

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
    if (window.confirm("This project is going to be deleted. Are you sure?")){
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

},{"../Sharer":137,"./templates/full.hbs":134}],131:[function(require,module,exports){
/**
 * VIEW: Login Modal
 *
 */

var template = require('./templates/share.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "share",
  template: template,

  ui: {
    'prg': '#prg',
    'pic': '#pic',
    'title': '#title',
    'desc': '#desc',
    'contrib': '#contrib',
    'acnbar': '#acnbar',

    'preview': '.preview iframe',
    'code': '#embed-code'
  },

  events: {
    "click .close": "destroy",
    "click .checkbox": "onClickSetting"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(){
    this.embedTmpl = _.template('<iframe src="<%= url %>" width="100%" height="450" frameborder="0" allowtransparency="true" title="Hackdash"></iframe>');
  },

  onRender: function(){
    this.reloadPreview();
  },

  serializeData: function(){
    return _.extend({
      settings: this.settings
    }, this.model.toJSON());
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  hiddenSettings: [],

  onClickSetting: function(e){
    var ele = $('input', e.currentTarget);
    var id = ele.attr('id');
    var checked = $(ele).is(':checked');
    var idx = this.hiddenSettings.indexOf(id);

    if (checked){
      if(idx > -1){
        this.hiddenSettings.splice(idx, 1);
        this.reloadPreview();
      }
      return;
    }

    if (idx === -1){
      this.hiddenSettings.push(id);
      this.reloadPreview();
    }
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  reloadPreview: function(){
    var embedUrl = window.location.protocol + "//" + window.location.host;
    var fragment = '/embed/projects/' + this.model.get('_id');
    var hide = '?hide=';

    _.each(this.hiddenSettings, function(id){
      hide += id + ',';
    }, this);

    var url = embedUrl + fragment + (this.hiddenSettings.length ? hide : '');

    this.ui.preview.attr('src', url);
    this.ui.code.val(this.embedTmpl({ url: url }));
  },

  settings: [{
    code: 'prg',
    name: 'Progress'
  }, {
    code: 'pic',
    name: 'Picture'
  }, {
    code: 'title',
    name: 'Title'
  }, {
    code: 'desc',
    name: 'Description'
  }, {
    code: 'contrib',
    name: 'Contributors'
  }, {
    code: 'acnbar',
    name: 'Action Bar'
  }]

});
},{"./templates/share.hbs":135}],132:[function(require,module,exports){
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

},{"hbsfy/runtime":162}],133:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    return "    <div id=\"ghImportHolder\" class=\"hidden-xs\">\n\n      <div class=\"project-link\">\n        <a id=\"ghImportBtn\" >\n          <label>Import Project</label>\n          <div>\n            <i class=\"fa fa-github\"></i>\n            <span class=\"github\">GitHub</span>\n          </div>\n        </a>\n      </div>\n\n      <div class=\"gh-import input-group col-md-4 hide\">\n        <input id=\"txt-repo\" type=\"text\" class=\"form-control\" placeholder=\"username / repository\">\n        <span class=\"input-group-btn\">\n          <button id=\"searchGh\" class=\"btn btn-blue\" type=\"button\" data-loading-text=\"LOADING\">\n            import\n          </button>\n        </span>\n      </div>\n\n    </div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3=container.escapeExpression;

  return "              <option value=\""
    + alias3(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"status","hash":{},"data":data}) : helper)))
    + "\""
    + ((stack1 = helpers.unless.call(alias1,(depth0 != null ? depth0.active : depth0),{"name":"unless","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + ">"
    + alias3((helpers.statusesText || (depth0 && depth0.statusesText) || alias2).call(alias1,(depth0 != null ? depth0.status : depth0),{"name":"statusesText","hash":{},"data":data}))
    + "</option>\n";
},"4":function(container,depth0,helpers,partials,data) {
    return " disabled";
},"6":function(container,depth0,helpers,partials,data) {
    var helper;

  return "          style=\"background-image: url("
    + container.escapeExpression(((helper = (helper = helpers.cover || (depth0 != null ? depth0.cover : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"cover","hash":{},"data":data}) : helper)))
    + ");\"\n          ";
},"8":function(container,depth0,helpers,partials,data) {
    return "          <option selected>"
    + container.escapeExpression(container.lambda(depth0, depth0))
    + "</option>\n";
},"10":function(container,depth0,helpers,partials,data) {
    var helper;

  return "          <a class=\"btn btn-primary bnt-red\" href=\""
    + container.escapeExpression(((helper = (helper = helpers.toolsUrl || (depth0 != null ? depth0.toolsUrl : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"toolsUrl","hash":{},"data":data}) : helper)))
    + "\" target=\"_blank\" data-bypass>Tools for this stage</a>\n";
},"12":function(container,depth0,helpers,partials,data) {
    var helper;

  return "          href=\"/projects/"
    + container.escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"_id","hash":{},"data":data}) : helper)))
    + "\"\n";
},"14":function(container,depth0,helpers,partials,data) {
    var helper;

  return "          href=\"/dashboards/"
    + container.escapeExpression(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"domain","hash":{},"data":data}) : helper)))
    + "\"\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "\n<div class=\"header\">\n  <div class=\"container\">\n    <h1>\n      <input name=\"title\" type=\"text\" placeholder=\"Project Title\" value=\""
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "\" class=\"form-control\"/>\n    </h1>\n    <h3 class=\"page-link-left\">\n      <a href=\"/dashboards/"
    + alias4(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"domain","hash":{},"data":data}) : helper)))
    + "\">"
    + alias4(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"domain","hash":{},"data":data}) : helper)))
    + "</a>\n    </h3>\n  </div>\n</div>\n\n<div class=\"body\">\n  <div class=\"bg-body-entity\"></div>\n  <div class=\"container\">\n\n"
    + ((stack1 = helpers.unless.call(alias1,(depth0 != null ? depth0._id : depth0),{"name":"unless","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n    <div class=\"col-md-4\">\n\n      <div class=\"cover\">\n\n        <div class=\"progress\" title=\""
    + alias4((helpers.statusesText || (depth0 && depth0.statusesText) || alias2).call(alias1,(depth0 != null ? depth0.status : depth0),{"name":"statusesText","hash":{},"data":data}))
    + "\">\n          <div class=\"status\">\n            <select name=\"status\" id=\"status\" class=\"form-control\" value=\""
    + alias4(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"status","hash":{},"data":data}) : helper)))
    + "\">\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.statuses : depth0),{"name":"each","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "            </select>\n          </div>\n        </div>\n\n        <div id=\"dragdrop\" class=\"dropzone item-cover\"\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.cover : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + ">\n        </div>\n        <p class=\"error-cover bg-danger text-danger hidden\"></p>\n\n      </div>\n\n    </div>\n\n    <div class=\"col-md-8\">\n      <div class=\"description\">\n        <textarea id=\"description\" name=\"description\" placeholder=\"Description\">"
    + alias4(((helper = (helper = helpers.description || (depth0 != null ? depth0.description : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"description","hash":{},"data":data}) : helper)))
    + "</textarea>\n      </div>\n      <div class=\"whatif\">\n        <textarea id=\"whatif\" name=\"whatif\" placeholder=\"[What if as a <type of user>]\n      [I could <specific action>]\n      [with <open content / tool>]\n      [so <benefit / goal>]\">"
    + alias4(((helper = (helper = helpers.whatif || (depth0 != null ? depth0.whatif : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"whatif","hash":{},"data":data}) : helper)))
    + "</textarea>\n      </div>\n      <div class=\"tags\">\n        <select id=\"tags\" name=\"tags\" multiple placeholder=\"Tags ( comma separated values )\" class=\"form-control\">\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.tags : depth0),{"name":"each","hash":{},"fn":container.program(8, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "        </select>\n      </div>\n      <div class=\"link\">\n        <input id=\"link\" type=\"text\" name=\"link\" placeholder=\"Project URL Demo\" class=\"form-control\" value=\""
    + alias4(((helper = (helper = helpers.link || (depth0 != null ? depth0.link : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"link","hash":{},"data":data}) : helper)))
    + "\"/>\n      </div>\n    </div>\n\n    <div class=\"col-md-8 buttons-panel\">\n\n      <div class=\"pull-right save\">\n        <a id=\"save\" class=\"btn btn-success\">Save</a>\n      </div>\n\n      <div class=\"pull-right cancel\">\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.toolsUrl : depth0),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n        <a id=\"cancel\" class=\"btn btn-danger\"\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0._id : depth0),{"name":"if","hash":{},"fn":container.program(12, data, 0),"inverse":container.program(14, data, 0),"data":data})) != null ? stack1 : "")
    + "        >Cancel</a>\n      </div>\n\n    </div>\n\n  </div>\n\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],134:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    return "no-cover";
},"3":function(container,depth0,helpers,partials,data) {
    var helper;

  return "        <div class=\"item-cover\"\n          style=\"background-image: url("
    + container.escapeExpression(((helper = (helper = helpers.cover || (depth0 != null ? depth0.cover : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"cover","hash":{},"data":data}) : helper)))
    + ");\"></div>\n";
},"5":function(container,depth0,helpers,partials,data) {
    return "        <i class=\"item-letter\">"
    + container.escapeExpression((helpers.firstLetter || (depth0 && depth0.firstLetter) || helpers.helperMissing).call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.title : depth0),{"name":"firstLetter","hash":{},"data":data}))
    + "</i>\n";
},"7":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "\n"
    + ((stack1 = helpers["if"].call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.showActions : depth0),{"name":"if","hash":{},"fn":container.program(8, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n";
},"8":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : {};

  return "\n          <div class=\"contributor\">\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.contributing : depth0),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.program(11, data, 0),"data":data})) != null ? stack1 : "")
    + "          </div>\n          <div class=\"follower\">\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.following : depth0),{"name":"if","hash":{},"fn":container.program(13, data, 0),"inverse":container.program(15, data, 0),"data":data})) != null ? stack1 : "")
    + "          </div>\n\n";
},"9":function(container,depth0,helpers,partials,data) {
    return "            <a data-loading-text=\"leaving...\" class=\"btn btn-default leave\">Leave</a>\n";
},"11":function(container,depth0,helpers,partials,data) {
    return "            <a data-loading-text=\"joining...\" class=\"btn btn-default join\">Join</a>\n";
},"13":function(container,depth0,helpers,partials,data) {
    return "            <a data-loading-text=\"unfollowing...\" class=\"btn btn-default unfollow\">Unfollow</a>\n";
},"15":function(container,depth0,helpers,partials,data) {
    return "            <a data-loading-text=\"following...\" class=\"btn btn-default follow\">Follow</a>\n";
},"17":function(container,depth0,helpers,partials,data) {
    return "\n        <a class=\"btn btn-default login\">Follow</a>\n        <a class=\"btn btn-default login\">Join</a>\n\n";
},"19":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3=container.escapeExpression;

  return "          <a class=\"pull-left\" href=\"/users/"
    + alias3(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "\">\n            "
    + alias3((helpers.getProfileImageHex || (depth0 && depth0.getProfileImageHex) || alias2).call(alias1,depth0,{"name":"getProfileImageHex","hash":{},"data":data}))
    + "\n          </a>\n";
},"21":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : {},depth0,{"name":"if","hash":{},"fn":container.program(22, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "");
},"22":function(container,depth0,helpers,partials,data) {
    var alias1=container.lambda, alias2=container.escapeExpression;

  return "        <li>\n          <a href=\"/projects?q="
    + alias2(alias1(depth0, depth0))
    + "\" data-bypass=\"true\">"
    + alias2(alias1(depth0, depth0))
    + "</a>\n        </li>\n";
},"24":function(container,depth0,helpers,partials,data) {
    var helper;

  return "    <div class=\"pull-right\">\n      <a href=\""
    + container.escapeExpression(((helper = (helper = helpers.link || (depth0 != null ? depth0.link : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"link","hash":{},"data":data}) : helper)))
    + "\" target=\"__blank\" class=\"btn btn-default\">demo</a>\n    </div>\n";
},"26":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : {};

  return "\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.isAdminOrLeader : depth0),{"name":"if","hash":{},"fn":container.program(27, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.showActions : depth0),{"name":"if","hash":{},"fn":container.program(30, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n";
},"27":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {};

  return "      <div class=\"pull-right remove\">\n        <a class=\"btn btn-danger\">Remove</a>\n      </div>\n      <div class=\"pull-right edit\">\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.toolsUrl : depth0),{"name":"if","hash":{},"fn":container.program(28, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "        <a class=\"btn btn-info\" href=\"/forms\" data-bypass>Forms</a>\n        <a class=\"btn btn-success\" href=\"/projects/"
    + container.escapeExpression(((helper = (helper = helpers._id || (depth0 != null ? depth0._id : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"_id","hash":{},"data":data}) : helper)))
    + "/edit\">Edit</a>\n      </div>\n";
},"28":function(container,depth0,helpers,partials,data) {
    var helper;

  return "          <a class=\"btn btn-primary bnt-red\" href=\""
    + container.escapeExpression(((helper = (helper = helpers.toolsUrl || (depth0 != null ? depth0.toolsUrl : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"toolsUrl","hash":{},"data":data}) : helper)))
    + "\" target=\"_blank\" data-bypass>Tools for this stage</a>\n";
},"30":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : {};

  return "\n      <div class=\"pull-left bottom-buttons\">\n\n        <div class=\"pull-left contributor\">\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.contributing : depth0),{"name":"if","hash":{},"fn":container.program(31, data, 0),"inverse":container.program(33, data, 0),"data":data})) != null ? stack1 : "")
    + "        </div>\n        <div class=\"pull-left follower\">\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.following : depth0),{"name":"if","hash":{},"fn":container.program(35, data, 0),"inverse":container.program(37, data, 0),"data":data})) != null ? stack1 : "")
    + "        </div>\n\n      </div>\n";
},"31":function(container,depth0,helpers,partials,data) {
    return "          <a data-loading-text=\"leaving...\" class=\"btn btn-default leave\">Leave</a>\n";
},"33":function(container,depth0,helpers,partials,data) {
    return "          <a data-loading-text=\"joining...\" class=\"btn btn-default join\">Join</a>\n";
},"35":function(container,depth0,helpers,partials,data) {
    return "          <a data-loading-text=\"unfollowing...\" class=\"btn btn-default unfollow\">Unfollow</a>\n";
},"37":function(container,depth0,helpers,partials,data) {
    return "          <a data-loading-text=\"following...\" class=\"btn btn-default follow\">Follow</a>\n";
},"39":function(container,depth0,helpers,partials,data) {
    return "\n      <div class=\"pull-left bottom-buttons\">\n        <a class=\"btn btn-default login\">Follow</a>\n        <a class=\"btn btn-default login\">Join</a>\n      </div>\n\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, options, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression, alias5=helpers.blockHelperMissing, alias6=container.lambda, buffer = 
  "\n<div class=\"header\">\n  <div class=\"container\">\n    <h1>"
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "</h1>\n    <h4>"
    + alias4(((helper = (helper = helpers.whatif || (depth0 != null ? depth0.whatif : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"whatif","hash":{},"data":data}) : helper)))
    + "</h4>\n    <h3 class=\"page-link-left\">\n      <a href=\"/dashboards/"
    + alias4(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"domain","hash":{},"data":data}) : helper)))
    + "\">"
    + alias4(((helper = (helper = helpers.domain || (depth0 != null ? depth0.domain : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"domain","hash":{},"data":data}) : helper)))
    + "</a>\n    </h3>\n  </div>\n</div>\n\n<div class=\"body\">\n  <div class=\"bg-body-entity\"></div>\n  <div class=\"container\">\n\n    <div class=\"col-md-4\">\n\n      <div class=\"cover "
    + ((stack1 = helpers.unless.call(alias1,(depth0 != null ? depth0.cover : depth0),{"name":"unless","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\">\n\n        <div class=\"progress\" title=\""
    + alias4(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"status","hash":{},"data":data}) : helper)))
    + "\">\n          <div class=\""
    + alias4(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"status","hash":{},"data":data}) : helper)))
    + "\"></div>\n          <div class=\"status\">"
    + alias4((helpers.statusesText || (depth0 && depth0.statusesText) || alias2).call(alias1,(depth0 != null ? depth0.status : depth0),{"name":"statusesText","hash":{},"data":data}))
    + "</div>\n        </div>\n\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.cover : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.program(5, data, 0),"data":data})) != null ? stack1 : "")
    + "      </div>\n\n\n      <div class=\"buttons-panel top-buttons\">\n\n";
  stack1 = ((helper = (helper = helpers.isLoggedIn || (depth0 != null ? depth0.isLoggedIn : depth0)) != null ? helper : alias2),(options={"name":"isLoggedIn","hash":{},"fn":container.program(7, data, 0),"inverse":container.program(17, data, 0),"data":data}),(typeof helper === alias3 ? helper.call(alias1,options) : helper));
  if (!helpers.isLoggedIn) { stack1 = alias5.call(depth0,stack1,options)}
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n        <a class=\"share tooltips share-top\" data-original-title=\"Share this Project\">\n          <i class=\"fa fa-share-alt\"></i>\n        </a>\n      </div>\n\n      <div class=\"people\">\n\n        <div class=\"clearfix\">\n          <h5>Managed by</h5>\n          <a class=\"pull-left\" href=\"/users/"
    + alias4(alias6(((stack1 = (depth0 != null ? depth0.leader : depth0)) != null ? stack1._id : stack1), depth0))
    + "\">\n            "
    + alias4((helpers.getProfileImageHex || (depth0 && depth0.getProfileImageHex) || alias2).call(alias1,(depth0 != null ? depth0.leader : depth0),{"name":"getProfileImageHex","hash":{},"data":data}))
    + "\n          </a>\n        </div>\n\n        <div class=\"clearfix\">\n          <h5>Contributors ["
    + alias4(alias6(((stack1 = (depth0 != null ? depth0.contributors : depth0)) != null ? stack1.length : stack1), depth0))
    + "]</h5>\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.contributors : depth0),{"name":"each","hash":{},"fn":container.program(19, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "        </div>\n\n        <div class=\"clearfix\">\n          <h5>Followers ["
    + alias4(alias6(((stack1 = (depth0 != null ? depth0.followers : depth0)) != null ? stack1.length : stack1), depth0))
    + "]</h5>\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.followers : depth0),{"name":"each","hash":{},"fn":container.program(19, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "        </div>\n\n      </div>\n\n    </div>\n\n    <div class=\"col-md-8\">\n      <div class=\"description\">\n        "
    + ((stack1 = (helpers.markdown || (depth0 && depth0.markdown) || alias2).call(alias1,(depth0 != null ? depth0.description : depth0),{"name":"markdown","hash":{},"data":data})) != null ? stack1 : "")
    + "\n      </div>\n      <ul class=\"tags clearfix col-md-10\">\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.tags : depth0),{"name":"each","hash":{},"fn":container.program(21, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "      </ul>\n      <div class=\"share-ctn clearfix col-md-2 share-inner\">\n        <a class=\"share tooltips\" data-original-title=\"Share this Project\">\n          <i class=\"fa fa-share-alt\"></i>\n        </a>\n      </div>\n    </div>\n\n    <div class=\"col-md-12 buttons-panel\">\n\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.link : depth0),{"name":"if","hash":{},"fn":container.program(24, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n";
  stack1 = ((helper = (helper = helpers.isLoggedIn || (depth0 != null ? depth0.isLoggedIn : depth0)) != null ? helper : alias2),(options={"name":"isLoggedIn","hash":{},"fn":container.program(26, data, 0),"inverse":container.program(39, data, 0),"data":data}),(typeof helper === alias3 ? helper.call(alias1,options) : helper));
  if (!helpers.isLoggedIn) { stack1 = alias5.call(depth0,stack1,options)}
  if (stack1 != null) { buffer += stack1; }
  return buffer + "    </div>\n\n  </div>\n\n  <div class=\"container disqus-ctn\">\n    <div id=\"disqus_thread\" class=\"col-md-12\"></div>\n  </div>\n\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],135:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "\n        <div class=\"checkbox\">\n          <label>\n            <input id=\""
    + alias4(((helper = (helper = helpers.code || (depth0 != null ? depth0.code : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"code","hash":{},"data":data}) : helper)))
    + "\" type=\"checkbox\" checked> "
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "\n          </label>\n        </div>\n\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "<div class=\"modal-body\">\n\n  <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\n    <i class=\"fa fa-close\"></i>\n  </button>\n\n  <div class=\"row\">\n    <div class=\"col-md-5\">\n\n      <h1>embed this project</h1>\n\n      <div class=\"settings\">\n\n"
    + ((stack1 = helpers.each.call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.settings : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n      </div>\n\n      <label class=\"get-code\">Add this project to your website by coping this code below</label>\n      <textarea id=\"embed-code\" onclick=\"this.focus();this.select();\" readonly=\"readonly\"></textarea>\n\n    </div>\n    <div class=\"col-md-7\" style=\"position:relative;\">\n      <div class=\"preview\">\n        <iframe width=\"100%\" height=\"450\"\n          frameborder=\"0\" allowtransparency=\"true\" title=\"Hackdash\"></iframe>\n      </div>\n    </div>\n  </div>\n\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],136:[function(require,module,exports){
/**
 * VIEW: Login Modal
 *
 */

var template = require('./templates/register.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "register",
  template: template,

  events: {
    "click .close": "destroy"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------
  initialize: function(options){
    this.flashError = (options && options.model && options.model.attributes && options.model.attributes.flashError) || '';
  },

  templateHelpers: function() {
    var flashError = this.flashError;
    return {
      showErrors: function(){
        return flashError;
      },
      redirectURL: function(){
        var url = hackdash.app.previousURL || '';
        return (url.length ? '?redirect=' + url : url);
      }
    };
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
},{"./templates/register.hbs":141}],137:[function(require,module,exports){
/**
 * VIEW: Share Popover
 *
 */

var template = require('./templates/sharer.hbs'),
  DashboardEmbed = require("./Dashboard/Share"),
  ProjectEmbed = require("./Project/Share");

/*jshint scripturl:true */

var Sharer = module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  id: 'sharer-dialog',
  className: "sharer",
  template: template,

  events: {
    "click .embed": "showEmbed",
    "click .close": "destroy",

    "click .facebook": "showFBShare",
    "click .linkedin": "showLinkedInShare"
  },

  shareText: {
    dashboard: 'Hacking at ',
    project: 'Hacking '
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    this.type = (options && options.type) || '';
  },

  serializeData: function(){
    return _.extend({
      networks: this.getNetworks()
    }, (this.model && this.model.toJSON()) || {});
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  showEmbed: function(){
    var Share;

    switch(this.type){
      case 'dashboard': Share = DashboardEmbed; break;
      case 'project': Share = ProjectEmbed; break;
    }

    if (Share){
      hackdash.app.modals.show(new Share({
        model: this.model
      }));
    }

    this.destroy();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  enc: function(str){
    return window.encodeURI(str);
  },

  getTwitterLink: function(){
    var link = 'https://twitter.com/intent/tweet?'
      , people = ''
      , url = 'url=' + window.location.protocol + "//" + window.location.host
      , hashtags = 'hashtags='
      , text = 'text=';

    var domain = this.model.get('domain');
    var title = this.model.get('title');

    function getPeople(list){
      return _.map(list, function(user){

        if (hackdash.user && hackdash.user._id === user._id){
          // remove me
          return '';
        }

        if (user.provider === 'twitter'){
          return '@' + user.username;
        }
        else {
          return user.name;
        }

        return '';

      }).join(' ');
    }

    if (this.type === 'dashboard'){
      people = getPeople(this.model.get('admins').toJSON());
      url += '/d/' + domain;
    }

    else if (this.type === 'project'){
      people = getPeople(this.model.get('contributors'));
      url += '/p/' + this.model.get('_id');
    }

    hashtags += ['hackdash', domain].join(',');
    text += this.shareText[this.type] + (title || domain) + ' via ' + people;

    link += this.enc(url) + '&' + this.enc(hashtags) + '&' + this.enc(text);
    return link;
  },

  showFBShare: function(e){
    e.preventDefault();

    var people = ''
      , url = '' + window.location.protocol + "//" + window.location.host
      , text = ''
      , picture = '';

    var domain = this.model.get('domain');
    var title = this.model.get('title');

    function getPeople(list){
      return _.map(list, function(user){

        if (hackdash.user && hackdash.user._id === user._id){
          // remove me
          return '';
        }

        return user.name;

      }).join(', ');
    }

    if (this.type === 'dashboard'){
      people = getPeople(this.model.get('admins').toJSON());

      var covers = this.model.get('covers');
      picture = url + ((covers && covers.length && covers[0]) || '/images/logo-wotify.png');

      url += '/d/' + domain;
    }

    else if (this.type === 'project'){
      people = getPeople(this.model.get('contributors'));

      var cover = this.model.get('cover');
      picture = url + (cover || '/images/logo-wotify.png');

      url += '/p/' + this.model.get('_id');
    }

    var textShort = 'Hacking at ' + (title || domain);
    text += textShort + ' via ' + people;
    text += ' ' + ['#hackdash', domain].join(' #');

    window.FB.ui({
      method: 'feed',
      name: textShort,
      link: url,
      picture: picture,
      caption: text
    }, function( response ) {
      console.log(response);
    });
  },

  showLinkedInShare: function(e){
    e.preventDefault();

    var link = 'https://www.linkedin.com/shareArticle?mini=true&'
      , url = 'url=' + window.location.protocol + "//" + window.location.host
      , stitle = 'title='
      , text = 'summary='
      , source = '&source=Wotify';

    var domain = this.model.get('domain');
    var title = this.model.get('title');

    if (this.type === 'dashboard'){
      url += '/d/' + domain;
    }
    else if (this.type === 'project'){
      url += '/p/' + this.model.get('_id');
    }

    var textShort = 'Hacking at ' + (title || domain);
    stitle += textShort;
    text += textShort + ' - Wotify';

    link += this.enc(url) + '&' + this.enc(stitle) + '&' + this.enc(text) + source;
    window.open(link,'LinkedIn','height=350,width=520');
  },

  getNetworks: function(){

    var networks = [{
      name: 'twitter',
      link: this.getTwitterLink()
    }];

    if (window.hackdash.fbAppId){
      networks.push({
        name: 'facebook'
      });
    }

    return networks.concat([{
      name: 'linkedin'
    }, {
      name: 'google-plus',
      link: "javascript:void(window.open('https://plus.google.com/share?url='+encodeURIComponent(location), 'Share to Google+','width=600,height=460,menubar=no,location=no,status=no'));"
    }]);

  }

}, {

  show: function(el, options){

    var sharer = new Sharer(options);
    sharer.render();

    $('body').append(sharer.$el);

    var clickOutside = function(e){
      var $target = $(e.target);
      if ($target.hasClass('share') || $target.hasClass('fa-share-alt')){
        return;
      }

      var id = '#' + sharer.$el.get(0).id;

      if(!$target.closest(id).length && $(id).is(":visible")) {
        sharer.destroy();
      }
    };

    $('html').on('click', clickOutside);

    var $el = $(el),
      offset = $el.offset(),
      mw = $(window).width(),
      elW = sharer.$el.width(),
      w = sharer.$el.width()/2 - $el.width()/2,
      h = sharer.$el.height()/2 - $el.height()/2,
      l = offset.left - w,
      t = offset.top - h;

    if (l + elW > mw){
      l -= (l + (elW*1.2)) - mw;
    }

    sharer.$el.css({
      top: t,
      left: l
    });

    sharer.on('close destroy', function(){
      sharer.$el.remove();
      $('html').off('click', clickOutside);
    });

    return sharer;
  }

});
},{"./Dashboard/Share":30,"./Project/Share":131,"./templates/sharer.hbs":142}],138:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var helper;

  return "      <div class=\"alert alert-danger\" id=\"login-errors\">\n        "
    + container.escapeExpression(((helper = (helper = helpers.showErrors || (depth0 != null ? depth0.showErrors : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"showErrors","hash":{},"data":data}) : helper)))
    + "\n      </div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper;

  return "      <div class=\"alert alert-success\" id=\"login-messages\">\n        "
    + container.escapeExpression(((helper = (helper = helpers.showMessages || (depth0 != null ? depth0.showMessages : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"showMessages","hash":{},"data":data}) : helper)))
    + "\n      </div>\n";
},"5":function(container,depth0,helpers,partials,data) {
    var helper;

  return "/"
    + container.escapeExpression(((helper = (helper = helpers.token || (depth0 != null ? depth0.token : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"token","hash":{},"data":data}) : helper)));
},"7":function(container,depth0,helpers,partials,data) {
    return "            <label for=\"password\">Write your new password</label>\n            <input type=\"password\" class=\"form-control\" id=\"password\" name=\"password\" placeholder=\"Super-secret\">\n";
},"9":function(container,depth0,helpers,partials,data) {
    return "            <label for=\"email\">Email address</label>\n            <input type=\"email\" class=\"form-control\" id=\"email\" name=\"email\" placeholder=\"Em@il\">\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : {};

  return "<div class=\"modal-header\">\n  <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\n    <i class=\"fa fa-close\"></i>\n  </button>\n  <h2 class=\"modal-title\">New password</h2>\n</div>\n\n<div class=\"modal-body\">\n  <div class=\"row\">\n\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.showErrors : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.showMessages : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n    <div class=\"col-xs-12 col-md-8 col-md-offset-2\">\n\n\n      <form class=\"signup\" method=\"post\" action=\"/lost-password"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.token : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\">\n        <div class=\"form-group\">\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.token : depth0),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.program(9, data, 0),"data":data})) != null ? stack1 : "")
    + "        </div>\n        <button type=\"submit\" class=\"btn btn-default\">Submit</button>\n      </form>\n\n\n    </div>\n  </div>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],139:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var helper;

  return "    <div class=\"alert alert-danger\" id=\"login-errors\">\n      "
    + container.escapeExpression(((helper = (helper = helpers.showErrors || (depth0 != null ? depth0.showErrors : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"showErrors","hash":{},"data":data}) : helper)))
    + "\n    </div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper;

  return "    <div class=\"alert alert-success\" id=\"login-messages\">\n      "
    + container.escapeExpression(((helper = (helper = helpers.showMessages || (depth0 != null ? depth0.showMessages : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"showMessages","hash":{},"data":data}) : helper)))
    + "\n    </div>\n";
},"5":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var alias1=container.lambda, alias2=container.escapeExpression;

  return "\n      <div class=\"col-xs-12 col-md-8 col-md-offset-2\">\n        <a href=\"/auth/"
    + alias2(alias1(depth0, depth0))
    + alias2(alias1((depths[1] != null ? depths[1].redirectURL : depths[1]), depth0))
    + "\" class=\"btn btn-primary signup-btn signup-"
    + alias2(alias1(depth0, depth0))
    + "\" data-bypass>\n          <i class=\"fa fa-"
    + alias2(alias1(depth0, depth0))
    + "\"></i>Access with "
    + alias2((helpers.firstUpper || (depth0 && depth0.firstUpper) || helpers.helperMissing).call(depth0 != null ? depth0 : {},depth0,{"name":"firstUpper","hash":{},"data":data}))
    + "\n        </a>\n      </div>\n\n";
},"7":function(container,depth0,helpers,partials,data) {
    var helper;

  return "    <div class=\"row\">\n      <div class=\"col-xs-12 col-md-8 col-md-offset-2\">\n\n      <hr>\n      <h3>Or login with your email/password:</h3>\n\n      <form class=\"login\" action=\"/login"
    + container.escapeExpression(((helper = (helper = helpers.redirectURL || (depth0 != null ? depth0.redirectURL : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"redirectURL","hash":{},"data":data}) : helper)))
    + "\" method=\"post\">\n        <div class=\"form-group\">\n          <label for=\"username\">Email address</label>\n          <input type=\"email\" class=\"form-control\" id=\"username\" name=\"username\" placeholder=\"Em@il\">\n        </div>\n        <div class=\"form-group\">\n          <label for=\"password\">Password</label>\n          <input type=\"password\" class=\"form-control\" id=\"password\" name=\"password\" placeholder=\"Password\">\n          <span class=\"help-block\"><a href=\"/lost-password\" class=\"lostpass\" data-bypass>lost password?</a></span>\n        </div>\n        <button type=\"submit\" class=\"btn btn-default\">Submit</button>\n      </form>\n\n      <hr>\n      <p class=\"pull-right\"><strong>New user?</strong> <a href=\"/register\" class=\"register\">Register here</a></p>\n\n      </div>\n    </div>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=depth0 != null ? depth0 : {};

  return "<div class=\"modal-header\">\n  <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\n    <i class=\"fa fa-close\"></i>\n  </button>\n  <h2 class=\"modal-title\">Log In</h2>\n</div>\n\n<div class=\"modal-body\">\n\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.showErrors : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.showMessages : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0, blockParams, depths),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n  <div class=\"row\">\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.providers : depth0),{"name":"each","hash":{},"fn":container.program(5, data, 0, blockParams, depths),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "  </div>\n\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.localLogin : depth0),{"name":"if","hash":{},"fn":container.program(7, data, 0, blockParams, depths),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "</div>\n";
},"useData":true,"useDepths":true});

},{"hbsfy/runtime":162}],140:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"modal-header\">\n  <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\n    <i class=\"fa fa-close\"></i>\n  </button>\n  <h3 class=\"modal-title\">"
    + alias4(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"title","hash":{},"data":data}) : helper)))
    + "</h3>\n</div>\n\n<div class=\"modal-body\">\n  <p class=\"bg-"
    + alias4(((helper = (helper = helpers.type || (depth0 != null ? depth0.type : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"type","hash":{},"data":data}) : helper)))
    + "\">"
    + alias4(((helper = (helper = helpers.message || (depth0 != null ? depth0.message : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"message","hash":{},"data":data}) : helper)))
    + "</p>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],141:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var helper;

  return "      <div class=\"alert alert-danger\" id=\"login-errors\">\n        "
    + container.escapeExpression(((helper = (helper = helpers.showErrors || (depth0 != null ? depth0.showErrors : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"showErrors","hash":{},"data":data}) : helper)))
    + "\n      </div>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {};

  return "<div class=\"modal-header\">\n  <button type=\"button\" class=\"close\" data-dismiss=\"modal\">\n    <i class=\"fa fa-close\"></i>\n  </button>\n  <h2 class=\"modal-title\">New User</h2>\n</div>\n\n<div class=\"modal-body\">\n  <div class=\"row\">\n\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.showErrors : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n    <div class=\"col-xs-12 col-md-8 col-md-offset-2\">\n\n\n      <form class=\"signup\" method=\"post\" action=\"/register"
    + container.escapeExpression(((helper = (helper = helpers.redirectURL || (depth0 != null ? depth0.redirectURL : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"redirectURL","hash":{},"data":data}) : helper)))
    + "\">\n        <div class=\"form-group\">\n          <label for=\"name\">Name</label>\n          <input type=\"name\" class=\"form-control\" id=\"name\" name=\"name\" placeholder=\"Name\">\n        </div>\n        <div class=\"form-group\">\n          <label for=\"email\">Email address</label>\n          <input type=\"email\" class=\"form-control\" id=\"email\" name=\"email\" placeholder=\"Em@il\">\n        </div>\n        <div class=\"form-group\">\n          <label for=\"password\">Password</label>\n          <input type=\"password\" class=\"form-control\" id=\"password\" name=\"password\" placeholder=\"Password\">\n        </div>\n        <button type=\"submit\" class=\"btn btn-default\">Submit</button>\n      </form>\n\n\n    </div>\n  </div>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],142:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "    <li class=\""
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "\">\n      <a "
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.link : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + ">\n        <i class=\"fa fa-"
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "\"></i>\n      </a>\n    </li>\n";
},"2":function(container,depth0,helpers,partials,data) {
    var helper;

  return "href=\""
    + container.escapeExpression(((helper = (helper = helpers.link || (depth0 != null ? depth0.link : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"link","hash":{},"data":data}) : helper)))
    + "\"";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "<div class=\"embed\">\n  <a>embed/insert</a>\n</div>\n<div class=\"social-buttons\">\n  <ul>\n"
    + ((stack1 = helpers.each.call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.networks : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "  </ul>\n</div>";
},"useData":true});

},{"hbsfy/runtime":162}],143:[function(require,module,exports){
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


},{"./handlebars/base":144,"./handlebars/exception":147,"./handlebars/no-conflict":157,"./handlebars/runtime":158,"./handlebars/safe-string":159,"./handlebars/utils":160}],144:[function(require,module,exports){
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


},{"./decorators":145,"./exception":147,"./helpers":148,"./logger":156,"./utils":160}],145:[function(require,module,exports){
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


},{"./decorators/inline":146}],146:[function(require,module,exports){
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


},{"../utils":160}],147:[function(require,module,exports){
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


},{}],148:[function(require,module,exports){
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


},{"./helpers/block-helper-missing":149,"./helpers/each":150,"./helpers/helper-missing":151,"./helpers/if":152,"./helpers/log":153,"./helpers/lookup":154,"./helpers/with":155}],149:[function(require,module,exports){
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


},{"../utils":160}],150:[function(require,module,exports){
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


},{"../exception":147,"../utils":160}],151:[function(require,module,exports){
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


},{"../exception":147}],152:[function(require,module,exports){
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


},{"../utils":160}],153:[function(require,module,exports){
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


},{}],154:[function(require,module,exports){
'use strict';

exports.__esModule = true;

exports['default'] = function (instance) {
  instance.registerHelper('lookup', function (obj, field) {
    return obj && obj[field];
  });
};

module.exports = exports['default'];


},{}],155:[function(require,module,exports){
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


},{"../utils":160}],156:[function(require,module,exports){
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


},{"./utils":160}],157:[function(require,module,exports){
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
},{}],158:[function(require,module,exports){
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


},{"./base":144,"./exception":147,"./utils":160}],159:[function(require,module,exports){
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


},{}],160:[function(require,module,exports){
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


},{}],161:[function(require,module,exports){
// Create a simple path alias to allow browserify to resolve
// the runtime on a supported path.
module.exports = require('./dist/cjs/handlebars.runtime')['default'];

},{"./dist/cjs/handlebars.runtime":143}],162:[function(require,module,exports){
module.exports = require("handlebars/runtime")["default"];

},{"handlebars/runtime":161}],163:[function(require,module,exports){
module.exports={
  "db": {
    "name": "hackdash2",
    "host": "localhost",
    "url": "mongodb://localhost:27017/hackdash2"
  },
  "host": "ideacamp.wotify.dev",
  "port": 3000,
  "publicHost": "http://ideacamp.wotify.dev:3000",
  "session": "wefewfef",
  "disqus_shortname": "whatif",
  "title": "Wotify",
  "live": true,
  "mailer": "smtps://noreply%40wotify.co:crow4cadem1@mail.platoniq.net",
  "mailerFrom": "Wotify notification <noreply@wotify.co>",
  "prerender": {
    "enabled": false,
    "db": "mongodb://localhost/prerender"
  },
  "publicDashboardCreation" : false,
  "homeCreateProject" : true,
  "homeToolsUrl" : "http://wotify.eu",
  "team": [
    "570cbfa05c8f17f3469fb140"
  ],
  "maxQueryLimit": 30,
  "googleAnalytics": "",
  "googleApiKey": "AIzaSyAQcsQT_qLQhXTpFbjUg5dY4i6UKP6l7kY",
  "facebookAppId": "",
  "useLocalLogin": true,
  "theme": "ideacamp"
}

},{}],164:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    return "dashboard-footer";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "<a class=\"brand "
    + ((stack1 = helpers["if"].call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.isAdmin : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\">\n  <span class=\"logo logo-wotify\" title=\"Wotify\"></span>\n  <span class=\"logo\" title=\"IdeaCamp 2017\"></span>\n  <span class=\"logo-platoniq\" title=\"Developed by Platoniq\">Platoniq.net</span>\n  <span class=\"logo-hackdash\" title=\"Powered by Hackdash\">Powered by Hackdash</span>\n</a>\n\n<div class=\"admin-footer\"></div>\n\n<a class=\"up-button\">\n  <i class=\"fa fa-long-arrow-up\"></i>\n  <span>up</span>\n</a>\n";
},"useData":true});

},{"hbsfy/runtime":162}],165:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<a class=\"brand\">\n  <span class=\"logo logo-wotify\" title=\"Wotify\"></span>\n  <span class=\"logo\" title=\"IdeaCamp 2017\"></span>\n  <span class=\"logo-platoniq\" title=\"Developed by Platoniq\">Platoniq.net</span>\n  <span class=\"logo-hackdash\" title=\"Powered by Hackdash\">Powered by Hackdash</span>\n</a>\n\n<a class=\"up-button\">\n  <i class=\"fa fa-long-arrow-up\"></i>\n  <span>up</span>\n</a>\n";
},"useData":true});

},{"hbsfy/runtime":162}],166:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    return "      <div class=\"profile-btn\">\n        <button id=\"create-project\" class=\"btn btn-primary btn-blue\" type=\"button\">Create project</button>\n        <div class=\"dropdown-project dropdown\" id=\"dashboard-list\"></div>\n      </div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper;

  return "      <a class=\"btn-profile\">\n        "
    + container.escapeExpression(((helper = (helper = helpers.getMyProfileImageHex || (depth0 != null ? depth0.getMyProfileImageHex : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"getMyProfileImageHex","hash":{},"data":data}) : helper)))
    + "\n      </a>\n      <a class=\"logout\" href=\"/logout\" data-bypass>Log out</a>\n";
},"5":function(container,depth0,helpers,partials,data) {
    return "      <a class=\"login\">Log in</a>\n";
},"7":function(container,depth0,helpers,partials,data) {
    return "        <li class=\"visible-xs\">\n          <a class=\"logout\" href=\"/logout\" data-bypass>Log out</a>\n        </li>\n";
},"9":function(container,depth0,helpers,partials,data) {
    return "        <li>\n          <a class=\"login\">Log in</a>\n        </li>\n";
},"11":function(container,depth0,helpers,partials,data) {
    return "        <div class=\"col-xs-12\">\n          <div class=\"input-group\">\n              <div class=\"pull-left\">\n                <button id=\"goto-tools\" class=\"btn btn-primary btn-red\" type=\"button\">Our tools</button>\n              </div>\n          </div>\n        </div>\n";
},"13":function(container,depth0,helpers,partials,data) {
    return "        <div class=\"col-xs-12\">\n          <div class=\"input-group\">\n            <input id=\"domain\" type=\"text\" class=\"form-control\" placeholder=\"event name (5-20 chars)\">\n            <span class=\"input-group-btn\">\n              <button id=\"create-dashboard\" class=\"btn btn-primary\" type=\"button\">create event</button>\n            </span>\n          </div>\n          <p id=\"new-dashboard-error\" class=\"text-center text-danger hidden\">ERROR</p>\n        </div>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, options, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=helpers.blockHelperMissing, buffer = 
  "<div class=\"landing-header\">\n\n  <div class=\"logo-roadbook\" title=\"Ideacamp Digital Roadbook\"></div>\n\n  <div class=\"my-profile\">\n\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.homeCreateProject : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n    <div class=\"profile-btn hidden-xs\">\n";
  stack1 = ((helper = (helper = helpers.isLoggedIn || (depth0 != null ? depth0.isLoggedIn : depth0)) != null ? helper : alias2),(options={"name":"isLoggedIn","hash":{},"fn":container.program(3, data, 0),"inverse":container.program(5, data, 0),"data":data}),(typeof helper === alias3 ? helper.call(alias1,options) : helper));
  if (!helpers.isLoggedIn) { stack1 = alias4.call(depth0,stack1,options)}
  if (stack1 != null) { buffer += stack1; }
  buffer += "    </div>\n\n  </div>\n\n\n  <div class=\"text-vcenter call-action\">\n\n    <div class=\"logo logo-ideacamp\" title=\"2017 Moving communities\"></div>\n\n  </div>\n\n</div>\n\n<div class=\"container-fluid\">\n  <div class=\"row\">\n    <div class=\"col-md-12 text-center\">\n\n      <a class=\"btn btn-default mobile-menu visible-xs\">\n        <i class=\"fa fa-align-justify\"></i>\n      </a>\n\n      <ul class=\"nav nav-tabs landing\" role=\"tablist\">\n\n        <li id=\"collection\" class=\"collection\">\n          <a href=\"#collections\" role=\"tab\" data-toggle=\"tab\">Collections</a>\n        </li>\n        <li id=\"dashboard\" class=\"dashboard\">\n          <a href=\"#dashboards\" role=\"tab\" data-toggle=\"tab\">Event boards</a>\n        </li>\n        <li id=\"project\" class=\"project\">\n          <a href=\"#projects\" role=\"tab\" data-toggle=\"tab\">Projects</a>\n        </li>\n        <li id=\"user\" class=\"user\">\n          <a href=\"#users\" role=\"tab\" data-toggle=\"tab\">People</a>\n        </li>\n";
  stack1 = ((helper = (helper = helpers.isLoggedIn || (depth0 != null ? depth0.isLoggedIn : depth0)) != null ? helper : alias2),(options={"name":"isLoggedIn","hash":{},"fn":container.program(7, data, 0),"inverse":container.program(9, data, 0),"data":data}),(typeof helper === alias3 ? helper.call(alias1,options) : helper));
  if (!helpers.isLoggedIn) { stack1 = alias4.call(depth0,stack1,options)}
  if (stack1 != null) { buffer += stack1; }
  return buffer + "      </ul>\n\n    </div>\n  </div>\n</div>\n\n<div class=\"tab-content\">\n  <div role=\"tabpanel\" class=\"tab-pane\" id=\"dashboards\"></div>\n  <div role=\"tabpanel\" class=\"tab-pane\" id=\"projects\"></div>\n  <div role=\"tabpanel\" class=\"tab-pane\" id=\"users\"></div>\n  <div role=\"tabpanel\" class=\"tab-pane\" id=\"collections\"></div>\n</div>\n\n<div class=\"col-md-12 stats-ctn\"></div>\n\n<div class=\"col-md-12 team-wrapper\">\n  <h3 class=\"team-tab\">team</h3>\n  <div class=\"team-ctn\"></div>\n</div>\n\n<div class=\"col-md-12 partners-wrapper\">\n  <h3 class=\"partners-tab\">Co-Producers</h3>\n  <div class=\"partners-ctn\"></div>\n</div>\n\n<div class=\"col-md-12 network-wrapper\">\n  <h3 class=\"network-tab\">IdeaCamp Network</h3>\n  <div class=\"network-ctn\">\n\n    <ul>\n      <li class=\"clubture\"></li>\n      <li class=\"pravonagrad\"></li>\n      <li class=\"operacija-grad\"></li>\n      <li class=\"tetes-art\"></li>\n      <li class=\"goteo\"></li>\n      <li class=\"oberliht\"></li>\n      <li class=\"critica-politica\"></li>\n      <li class=\"subtopia\"></li>\n    </ul>\n\n  </div>\n</div>\n\n<div class=\"landing-footer\">\n  <div class=\"text-vcenter call-action\">\n\n    <div class=\"container-fluid\">\n\n      <div class=\"row\">\n\n\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.homeToolsUrl : depth0),{"name":"if","hash":{},"fn":container.program(11, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.canCreateDashboard : depth0),{"name":"if","hash":{},"fn":container.program(13, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n      </div>\n\n    </div>\n\n  </div>\n</div>\n\n<div class=\"col-md-12 about-ctn\">\nWotify Dashboard is a repository of events and projects where the \"Co-creation made Agile\" methodology is applied (developed by <a href=\"http://platoniq.net/\" data-bypass=\"true\" target=\"__blank\">Platoniq</a> as part of the Europeana Creative project). Wotify Dashboard is a fork of <a href=\"https://github.com/GoteoFoundation/hackdash\" data-bypass=\"true\" target=\"__blank\">Hackdash</a>.\n</p>\n\n</div>\n<div class=\"col-md-12 footer-ctn\"></div>\n";
},"useData":true});

},{"hbsfy/runtime":162}],167:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<ul>\n  <li class=\"europeana\"></li>\n  <li class=\"platoniq\"></li>\n  <li class=\"madrid\"></li>\n</ul>\n";
},"useData":true});

},{"hbsfy/runtime":162}]},{},[6]);
