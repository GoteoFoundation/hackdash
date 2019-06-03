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
  , FormResponses = require("./views/Form/FormResponses")
  , FormView = require("./views/Form")
  , CollectionView = require("./views/Collection")
  ;

var EmptyView = Backbone.Marionette.ItemView.extend({
  template: _.template('<h1 class="text-center text-danger">' + __('Please login to view this page') + '</h1>'),
});

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
    , "dashboards/:dash/surveys": "showDashboardSurveys"
    , "dashboards/:dash/surveys/:fid": "showDashboardSurveys"
    , "dashboards/:dash/surveys/:fid/respond": "showDashboardSurveysRespond"
    , "dashboards/:dash/create": "showProjectCreate"
    , "dashboards/:dash/forms": "showDashboardFormsEdit"
    , "dashboards/:dash/forms/:form": "showDashboardFormsResponses"

    , "forms": "showForms"
    , "forms/:fid": "showForms"
    , "forms/:fid/:pid": "showForms"
    , "forms/:fid/:pid/respond": "showFormRespond"

    , "projects/:pid/edit" : "showProjectEdit"
    , "projects/:pid" : "showProjectFull"
    , "projects/:pid/forms": "showProjectForms"
    , "projects/:pid/:status" : "showProjectFull"

    , "collections/:cid" : "showCollection"
    , "collections/:cid/forms" : "showCollectionFormsEdit"
    , "collections/:cid/forms/:form": "showCollectionFormsResponses"

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
      var forms = new Forms();
      forms.domain = dash;
      forms.fetch().always(function(){
        // console.log('obtained forms', forms, 'dash', dash, forms.getPublic());
        app.projects.fetch({}, { parse: true }).done(function(){
          app.projects.buildShowcase(app.dashboard.get("showcase"));

          app.header.show(new Header({
            model: app.dashboard,
            collection: app.projects
          }));

          app.main.show(new DashboardView({
            model: app.dashboard,
            forms: forms.getPublic()
          }));

          app.footer.show(new Footer({
            model: app.dashboard
          }));

          app.setTitle(app.dashboard.get('title') || app.dashboard.get('domain'));

        });
      });
    });

  },

  showLoginModal:function() {
    if(!window.hackdash.user) {
      window.hackdash.app.previousURL = window.location.pathname;
      window.hackdash.app.header.show(new Header());
      window.hackdash.app.main.show(new EmptyView());
      window.hackdash.app.footer.show(new Footer());
      window.hackdash.app.showLogin();
      return true;
    }
    return false;
  },

  showDashboardSurveys: function(dashboard, fid){

    console.log('surveys', dashboard);
    var app = window.hackdash.app;
    var self = this;
    if(self.showLoginModal()) {
      return;
    }

    app.dashboard = new Dashboard();
    app.dashboard.set('domain', dashboard);
    app.dashboard.fetch().done(function(){

      if(fid) {
        app.type = 'dashboard_forms_item';
        // find form
        var form = new Form({
          id: fid
        });
        form.fetch().done(function(){
          self.showFormsView(form, null, true);
        }).error(function(){
          app.main.show(new FormView()); // Shows no permissions form
        });
      } else {

        app.type = "dashboard_forms";

          var forms = new Forms();
          forms.domain = dashboard;
          forms.fetch().done(function(){
            console.log('obtained forms', forms, 'dash', dashboard, forms.getPublic());

            app.header.show(new Header());

            // here the forms list view
            app.main.show(new FormView({
              model: null,
              collection: forms.getPublic(),
              readOnly: false
            }));

            app.footer.show(new Footer({
              model: app.dashboard
            }));
          });
      }

      app.setTitle('Public Forms/Surveys for ' + (app.dashboard.get('title') || app.dashboard.get('domain')));
    });
  },

  showDashboardSurveysRespond: function(dashboard, fid) {
    var app = window.hackdash.app;
    var self = this;
    if(self.showLoginModal()) {
      return;
    }

    app.type = 'dashboard_forms_item';
    app.dashboard = new Dashboard();
    app.dashboard.set('domain', dashboard);
    app.dashboard.fetch().done(function(){
      // find form
      var form = new Form({
        id: fid
      });
      form.fetch().done(function(){
        self.showFormsView(form);
      });
      app.setTitle('Public Forms/Surveys for ' + (app.dashboard.get('title') || app.dashboard.get('domain')));
    });
  },
  showDashboardFormsEdit: function(dashboard){

    var app = window.hackdash.app;
    var self = this;
    if(self.showLoginModal()) {
      return;
    }

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

  showDashboardFormsResponses: function(dashboard, idform){

    var app = window.hackdash.app;
    var self = this;

    if(self.showLoginModal()) {
      return;
    }

    app.type = "dashboard_form";

    var form = new Form({
      id: idform,
      domain: dashboard
    });
    app.dashboard = new Dashboard();
    app.dashboard.set('domain', dashboard);
    app.dashboard.fetch().done(function(){
      if(!self.canEditDashboard(window.hackdash.user, app.dashboard.attributes)) {
        window.location = "/dashboards/" + app.dashboard.attributes.domain;
      }
      form.fetch().done(function(){

        app.header.show(new Header());

        // here the forms editor
        app.main.show(new FormResponses({
          model: form
        }));

        app.footer.show(new Footer({
          model: app.dashboard
        }));
        app.setTitle('Responses for form ' + form.get('title'));
      });
    });
  },

  showCollectionFormsResponses: function(cid, idform){

    var app = window.hackdash.app;
    var self = this;
    if(self.showLoginModal()) {
      return;
    }

    app.type = "col_form";

    var form = new Form({
      id: idform,
      group: cid
    });
    app.collection = new Collection();
    app.collection.set('_id', cid);
    app.collection.fetch().done(function(){
      console.log('checking collection permissions', app);
      if(!self.canEditCollection(window.hackdash.user, app.collection.attributes)) {
        console.log('Cannot edit, redirect to ', app.collection.attributes.domain);
        window.location = "/collections/" + app.collection.attributes._id;
      }
      form.fetch().done(function(){

        app.header.show(new Header());

        // here the forms editor
        app.main.show(new FormResponses({
          model: form
        }));

        app.footer.show(new Footer({
          model: app.collection
        }));
        app.setTitle('Responses for form ' + form.get('title'));
      });
    });
  },

  showCollectionFormsEdit: function(cid){

    var app = window.hackdash.app;
    var self = this;
    if(self.showLoginModal()) {
      return;
    }

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
    if(!window.hackdash.user) {
      app.previousURL = window.location.pathname;
      app.showLogin();
    }

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

    app.setTitle(__('Create Project'));
  },

  showProjectEdit: function(pid){

    var app = window.hackdash.app;
    if(!window.hackdash.user) {
      app.previousURL = window.location.pathname;
      app.showLogin();
    }

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

  showProjectFull: function(pid, status){

    var app = window.hackdash.app;
    app.type = "project";

    app.project = new Project({ _id: pid });

    app.project.fetch().done(function(){

      var forms = new Forms();
      forms.project = pid;
      forms.fetch().done(function(){
        // console.log('obtained forms', forms, 'pid', pid, forms.getForProject(pid));

        app.header.show(new Header());

        app.main.show(new ProjectFullView({
          model: app.project,
          status: status,
          forms: forms.getForProject(pid)
        }));

        app.setTitle(app.project.get('title') || __('Projects'));
      });
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

        app.setTitle(app.collection.get('title') || __('Collections'));
      });
  },

  showFormsView: function (model, collection, readOnly) {
    var app = window.hackdash.app;
    app.header.show(new Header());
    app.main.show(new FormView({
      model: model,
      collection: collection,
      readOnly: readOnly
    }));
    app.footer.show(new Footer());
    app.setTitle((model ? model.get('title') : __('Forms')));
  },

  showForms: function (fid, pid) {
    var app = window.hackdash.app;
    var self = this;
    if(self.showLoginModal()) {
      return;
    }

    if(fid) {
      app.type = 'forms_item';
      // find form
      var form = new Form({
        id: fid
      });
      form.fetch().done(function(){
        // Form project specified
        if(pid) {
          var project = new Project({
            _id: pid
          });
          project.fetch().done(function(){

            app.type = 'forms_project';
            app.project = project;
            self.showFormsView(form, null, true);
          });
        } else {
          self.showFormsView(form);
        }
      }).error(function(){
        app.main.show(new FormView()); // Shows no permissions form
      });
    } else {
      app.type = 'forms_list';
      var forms = new Forms();
      forms.fetch().done(function(){
        self.showFormsView(null, forms);
      });
    }
  },

  showFormRespond: function(fid, pid) {
    var app = window.hackdash.app;
    var self = this;
    if(self.showLoginModal()) {
      return;
    }
    app.type = 'forms_item';
    // find form
    var form = new Form({
      id: fid
    });
    form.fetch().done(function(){
      var project = new Project({
        _id: pid
      });
      project.fetch().done(function(){
        app.type = 'forms_project';
        app.project = project;
        self.showFormsView(form);
      });
    });
  },

  showProjectForms: function(pid) {
    var app = window.hackdash.app;
    var self = this;
    if(self.showLoginModal()) {
      return;
    }

    var project = new Project({
      _id: pid
    });
    project.fetch().done(function(){
      app.project = project;
      app.type = 'forms_project';
      var forms = new Forms();
      forms.project = pid;
      forms.fetch().done(function(){
        self.showFormsView(null, forms.getForProject(pid));
      });
    });
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
      // console.log('PROFILE',app.profile);
      app.main.show(new ProfileView({
        model: app.profile
      }));

      app.footer.show(new Footer());

      app.setTitle(app.profile.get('name') || __('Profile'));
    });

  },

  canEditDashboard: function(user, dash) {
    var owner = user && dash && dash.owner && user._id === dash.owner._id;
    var admin = user && dash && _.indexOf(user.admin_in, dash.domain) > -1;
    return owner || admin;
  },

  canEditCollection: function(user, col) {
    var owner = user && col && col.owner && user._id === col.owner._id;
    var admin = user && col && _.indexOf(user.group_admin_in, col._id) > -1;
    return owner || admin;
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
