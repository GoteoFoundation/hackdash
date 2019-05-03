/**
 * VIEW: ProfileCard Edit
 *
 */

var template = require('./templates/cardEdit.hbs')
  , roles = hackdash.roles;

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  ui: {
    "name": "input[name=name]",
    "role": "select[name=role]",
    "skills": "select[name=skills]",
    "email": "input[name=email]",
    "picture": "#dragdrop",
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
    "errorPicture": ".error-cover",
  },

  events: {
    "click #save": "saveProfile",
    "click #cancel": "cancel",
    "focus @ui.location": "geolocate"
  },

  modelEvents:{
    "change": "render"
  },

  templateHelpers: function() {
    var self = this;
    return {
      canEditRole: function () {
        return hackdash.userHasPermission(hackdash.user, 'user_change_role');
      },
      roles: function() {
        return roles;
      },
      getRole: function() {
        if(roles) {
          var r = _.findWhere(roles, {role: this.role});
          if(r) {
            return r.name;
          }
          return this.role;
        }
        return null;
      },
      showSkills: function() {
        return hackdash.skills && hackdash.skills.length;
      },
      skillsList: function() {
        return hackdash.skills || [];
      },
      hasSkillSelected: function(skill) {
        var s = this.skills || [];
        return s.indexOf(skill) > -1 ? ' selected' : '';
      },
      skillsText: function() {
        return self.skillsText(this.role);
      }
    };
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------
  initialize: function(){
    this.autocomplete = null;
    this.updatedPicture = false;
  },

  onRender: function(){
    if(this.ui.location.length) {
      this.initGoogleAutocomplete(this.ui.location.get(0));
      if(!this.model.get('location') || !this.model.get('location').coordinates || this.model.get('location').coordinates.length === 0) {
        this.geolocate(); //Ask for browser geolocation
      }
    }
    this.initImageDrop();
    this.initSelect2();
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  initSelect2: function(){
    if (this.model && this.model.get('skills')){
      this.ui.skills.val(this.model.get('skills'));
    }

    this.ui.skills.select2({
      theme: 'bootstrap',
      placeholder: this.skillsText(this.model && this.model.get('role')),
      minimumResultsForSearch: 10
    });
    // Fix for select2
    $('.select2-container', this.$el).css({width: '100%'});
  },

  initImageDrop: function(){
    var self = this;
    var $dragdrop = $('#dragdrop', this.$el);

    var pictureZone = new Dropzone($dragdrop.get(0), {
      url: hackdash.apiURL + '/profiles/picture',
      paramName: 'picture',
      maxFiles: 1,
      maxFilesize: 8, // MB
      acceptedFiles: 'image/jpeg,image/png,image/gif',
      uploadMultiple: false,
      clickable: true,
      dictDefaultMessage: __('Drop Image Here'),
      dictFileTooBig: __('File is too big, 500 Kb is the max'),
      dictInvalidFileType: __('Only jpg, png and gif are allowed')
    });

    pictureZone.on("error", function(file, message) {
      console.log('error',message);
      self.ui.errorPicture.removeClass('hidden').text(__(message));
      file.accepted = false;
    });

    pictureZone.on("complete", function(file) {
      if (!file.accepted){
        pictureZone.removeFile(file);
        return;
      }

      self.ui.errorPicture.addClass('hidden').text('');

      var url = JSON.parse(file.xhr.response).href;
      self.model.set({ "picture": url }, { silent: true });
      self.updatedPicture = true;
      pictureZone.removeFile(file);

      $dragdrop
        .css('background-image', 'url(' + url + ')');

      $('.dz-message span', $dragdrop).css('opacity', '0.6');

    });
  },
  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  saveProfile: function(){
    // Mandatory fields
    var toSave = {
      name: this.ui.name.val(),
      email: this.ui.email.val(),
      bio: this.ui.bio.val(),
      skills: this.ui.skills.val(),
      social: {
        facebook: this.ui.facebook.val(),
        twitter: this.ui.twitter.val(),
        linkedin: this.ui.linkedin.val(),
        instagram: this.ui.instagram.val(),
        google: this.ui.google.val(),
        github: this.ui.github.val(),
      }
    };
    if(this.updatedPicture) {
      toSave.picture = this.model.get('picture');
    }
    if(hackdash.userHasPermission(hackdash.user, 'user_change_role') && this.ui.role.val()) {
      toSave.role = this.ui.role.val();
    }
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
        coordinates: [lng, lat]
      };
    }

    // console.log('TOSAVE',toSave);

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
  skillsText: function(role) {
    // Text can be personalized for every role if needed
    var s = 'Skills for role ' + role;
    var t =  __(s);
    if(t === s) {
      return __('User skills');
    }
    return t;
  },

  errors: {
    "name_required": __("Name is required"),
    "email_required": __("Email is required"),
    "email_invalid": __("Invalid Email"),
    "email_existing": __("Already registered Email")
  },

  /**
   * Landing routes have different styles (uses different jade/pug layouts)
   * router.navigate will mess the dom,
   * Quick fix is to redirect location for home views
   */
  exit: function(){
    var homeViews = ['/', '/collections', '/login', '/register', '/lost-password', '/dashboars', '/projects', '/users'];
    window.fromURL = window.fromURL || window.hackdash.getQueryVariable('from') || '/';
    if(window.fromURL.charAt(0) !== '/') {
      window.fromURL = '/' + window.fromURL;
    }
    if (window.fromURL && homeViews.indexOf(window.fromURL) === -1){
      hackdash.app.router.navigate(window.fromURL, {
        trigger: true,
        replace: true
      });

      window.fromURL = "";
      return;
    }

    window.location = window.fromURL;
  },

  showError: function(err){
    $("#save", this.$el).button('reset');

    if (err.responseText === "OK"){

      if(!hackdash.userHasPermission(hackdash.user, 'user_update')) {
        $('#cancel').addClass('hidden');
        $('#save').addClass('hidden');
        $(".saved", this.$el).removeClass('hidden').addClass('show');

        window.clearTimeout(this.timer);
        this.timer = window.setTimeout(this.exit.bind(this), 2000);
      }

      return;
    }

    try {
      var error = JSON.parse(err.responseText).error;
      var ctrl = error.split("_");
      if(ctrl && this.ui[ctrl[0]]) {
        this.ui[ctrl[0]].parents('.form-group').addClass('has-error');
        this.ui[ctrl[0]].after('<span class="help-block">' + (this.errors[error] || __(error)) + '</span>');
        this.ui[ctrl[0]].focus();
        $('html, body').animate({
            scrollTop: this.ui[ctrl[0]].offset().top
        }, 500);
      } else {
        window.alert(error);
      }
    } catch(e) {
      // Quick and dirty
      window.alert(err.responseText);
    }

  },

  cleanErrors: function(){
    $(".has-error", this.$el).removeClass("has-error");
    $("span.help-block", this.$el).remove();
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
