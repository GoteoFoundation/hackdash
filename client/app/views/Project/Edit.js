/**
 * VIEW: Project
 *
 */

var template = require('Project/templates/edit.hbs')
  , ExtraFields = require('./ExtraFields')
  ;

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "page-ctn project edition",
  template: template,

  regions:{
    "extraFieldsTop": ".extra-fields-top",
  },

  ui: {
    "domain": "select[name=domain]",
    "title": "input[name=title]",
    "description": "textarea[name=description]",
    "link": "input[name=link]",
    "tags": "select[name=tags]",
    "status": "select[name=status]",
    "location": "input[name=location]",
    "city": "input[name=city]",
    "region": "input[name=region]",
    "country": "input[name=country]",
    "zip": "input[name=zip]",
    "lat": "input[name=lat]",
    "lng": "input[name=lng]",
    "errorCover": ".error-cover",
    "toolsUrl": ".tools-url",
    "save": "#save"
  },

  events: {
    "click #ghImportBtn": "showGhImport",
    "click #searchGh": "searchRepo",

    "click @ui.toolsUrl": "toolsUrl",

    // "focus @ui.location": "geolocate",

    "click @ui.save": "save",
    "click #cancel": "cancel"
  },

  templateHelpers: {
    selectedTag: function(val) {
      return this.tags && _.indexOf(this.tags, val) > -1 ? ' selected' : '';
    },
    statuses: function() {
      return this.dashboard.getStatuses();
    },
    isAdmin: function() {
      var user = hackdash.user;
      return user &&  user.admin_in.indexOf(this.domain) >= 0;
    },
    domains: function() {
      var user = hackdash.user;
      if (hackdash.userHasPermission(user, 'project_change_dashboard') && user.admin_in.indexOf(this.domain) >= 0) {
        return user.admin_in;
      }
      return null;
    }
  },

  modelEvents: {
    "change": "render"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function() {
    if(this.model) {
      this.setModelStatus(this.model.get('status') || hackdash.statuses[0].status);
      // console.log(this.model.attributes);
      if(this.ui.location.length) {
        this.initGoogleAutocomplete(this.ui.location.get(0));
        // if(!this.model.get('location') || !this.model.get('location').coordinates || this.model.get('location').coordinates.length === 0) {
        //   this.geolocate(); //Ask for browser geolocation
        // }
      }
    }
  },

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
    var user = hackdash.user;

    var toSave = {
      title: this.ui.title.val(),
      description: this.ui.description.val(),
      link: this.ui.link.val(),
      tags: this.ui.tags.val(),
      status: this.ui.status.val(),
      cover: this.model.get('cover')
    };

    var lat = parseFloat(this.ui.lat.val());
    var lng = parseFloat(this.ui.lng.val());
    if(!isNaN(lat) && !isNaN(lng)) {
      toSave.location = {
        type: 'Point',
        city: this.ui.city.val(),
        region: this.ui.region.val(),
        country: this.ui.country.val(),
        zip: this.ui.zip.val(),
        coordinates: [lng, lat]
      };
    }

    if(hackdash.userHasPermission(user, 'project_change_dashboard') && user.admin_in.indexOf(this.ui.domain.val()) >= 0) {
      toSave.domain = this.ui.domain.val();
    }
    this.cleanErrors();

    var s = this.extraFields[this.ui.status.val()];
    if(s) {
      var model = s.model;
      toSave.extra = model.get('extra');
    }

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
    "title_required": __("Title is required"),
    "description_required": __("Description is required"),
    "status_invalid": __("Invalid status")
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
    var el = this.ui[ctrl] ? this.ui[ctrl] : this.ui.save;
    el.parents('.control-group').addClass('has-error');
    el.after('<span class="help-block">' + (this.errors[error] ? this.errors[error] : error) + '</span>');
  },

  cleanErrors: function(){
    $(".has-error", this.$el).removeClass("error");
    $("span.help-block", this.$el).remove();
  },

  extraFields: {},

  setModelStatus: function(status) {
    if(this.model) {
      if(status) {
        this.model.set({status: status}, {silent: true});
      }
      this.currentStatus = _.findWhere(hackdash.statuses, {status: this.model.get('status')});
      if(this.currentStatus.toolsUrl) {
        this.ui.toolsUrl.removeClass('hidden');
      } else {
        this.ui.toolsUrl.addClass('hidden');
      }
      if(this.currentStatus.fields && this.currentStatus.fields.length) {
        console.log('extra fields',this.currentStatus.fields);
        // if(!this.extraFieldsValues[this.currentStatus.status]) {
        //   this.extraFieldsValues[this.currentStatus.status] =
        // }
        this.extraFields[this.currentStatus.status] = new ExtraFields({
            model: this.model,
            status: this.currentStatus.status,
            fields: this.currentStatus.fields
          });
        this.extraFieldsTop.show(this.extraFields[this.currentStatus.status]);
      } else {
        this.extraFieldsTop.empty();
      }
    }
  },

  toolsUrl: function() {
    window.open(this.currentStatus.toolsUrl);
  },

  initSelect2: function(){
    var self = this;
    if (self.model && self.model.get('status')){
      self.ui.status.val(self.model.get('status'));
    }
    if (self.model && self.model.get('domain')){
      self.ui.domain.val(self.model.get('domain'));
    }

    self.ui.domain.select2({
      // theme: 'bootstrap',
      minimumResultsForSearch: 10
    });

    self.ui.status.select2({
      // theme: 'bootstrap',
      minimumResultsForSearch: 10
    });

    self.ui.status.on('change',  function() {
      self.setModelStatus(self.ui.status.val());
    });

    $('a.select2-choice').attr('href', null);

    self.ui.tags.select2({
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
      dictDefaultMessage: __('Drop Image Here'),
      dictFileTooBig: __('File is too big, 500 Kb is the max'),
      dictInvalidFileType: __('Only jpg, png and gif are allowed')
    });

    coverZone.on("error", function(file, message) {
      self.ui.errorCover.removeClass('hidden').text(__(message));
      file.accepted = false;
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
    this.ui.country.val('');
    this.ui.city.val('');
    this.ui.region.val('');
    this.ui.zip.val('');
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
