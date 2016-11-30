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
    console.log('value', value);
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
    this.ui.element.get(0).rawData = ob;
    console.log('VALOBJ', this.ui.element.get(0).rawData);
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
