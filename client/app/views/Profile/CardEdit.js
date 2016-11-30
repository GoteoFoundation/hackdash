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
      bio: this.ui.bio.val()
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
