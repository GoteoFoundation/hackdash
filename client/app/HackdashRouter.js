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

    app.project = new Project({
      domain: dashboard
    });

    app.header.show(new Header());

    app.main.show(new ProjectEditView({
      model: app.project
    }));

    app.footer.show(new Footer({
      model: app.dashboard
    }));

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
      app.main.show(new ProjectEditView({
        model: app.project
      }));

      app.setTitle('Edit project');
    });

    app.footer.show(new Footer({
      model: app.dashboard
    }));
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

    app.footer.show(new Footer({
      model: app.dashboard
    }));
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
