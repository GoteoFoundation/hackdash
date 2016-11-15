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
  },
  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  saveProfile: function(){
    var toSave = {};

    _.each(this.ui, function(ele, type){
      toSave[type] = ele.val();
    }, this);

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

    var ctrl = error.split("_")[0];
    this.ui[ctrl].parents('.control-group').addClass('error');
    this.ui[ctrl].after('<span class="help-inline">' + this.errors[error] + '</span>');
  },

  cleanErrors: function(){
    $(".error", this.$el).removeClass("error");
    $("span.help-inline", this.$el).remove();
  },

  initGoogleAutocomplete: function(el) {
    console.log(this.ui);
    var autocomplete;
    var fillInAddress = this.fillInAddress;
    if(window.google) {
      this.autocomplete = autocomplete = new window.google.maps.places.Autocomplete(el, {types: ['geocode']});
      autocomplete.addListener('place_changed', function(){fillInAddress(autocomplete);});
    }
  },

  fillInAddress: function(autocomplete) {
    var place = autocomplete.getPlace();
    // Get each component of the address from the place details
    // and fill the corresponding field on the form.
    for (var i = 0; i < place.address_components.length; i++) {
      var addressType = place.address_components[i].types[0];
      var short = place.address_components[i].short_name;
      var long = place.address_components[i].long_name;
      if(addressType === 'country') {
        $('input[name="country"]').val(short);
      }
      else if(addressType === 'locality') {
        $('input[name="city"]').val(long);
      }
      else if(addressType === 'administrative_area_level_2') {
        $('input[name="region"]').val(short);
      }
      else if(addressType === 'postal_code') {
        $('input[name="zip"]').val(short);
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
      var autocomplete = this.autocomplete;
      window.navigator.geolocation.getCurrentPosition(function(position) {
        var geolocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        var circle = new window.google.maps.Circle({
          center: geolocation,
          radius: position.coords.accuracy
        });
        autocomplete.setBounds(circle.getBounds());
      });
    }
  }

});