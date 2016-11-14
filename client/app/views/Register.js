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

  ui: {
    form: 'form.signup',
    name: 'form.signup #name',
    email: 'form.signup #email',
    password: 'form.signup #password'
  },
  events: {
    "submit @ui.form": "signup",
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

  signup: function(e) {
    var name = this.ui.name.val();
    var email = this.ui.email.val();
    var password = this.ui.password.val();
    console.log('Welcome', name,email,password, e);

    return false;
  }
  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});