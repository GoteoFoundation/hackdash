
/**
 * This module is in charge of the authentication/authorization routes
 * We are using PassportJS for a really easy way to add custom authentication
 * services.
 *
 * The plan is to add username/password login in the future (or email-only)
 */

/*
 * Module dependencies
 */

import {Router} from 'express';
import passport from 'passport';
import passportHttp from 'passport-http';
import keys from 'keys.json';
import config from 'config';
import {User} from 'lib/models';
import {url as gravatarUrl} from 'gravatar';

/**
 * Expose auth related router
 */

const app = Router();
export default app;

/**
 * Helpers for database user (de)serialization
 */

passport.serializeUser(({_id}, done) => done(null, _id));
passport.deserializeUser((_id, done) => User.findById(_id, done));


/**
 * Helper for saving user url intent so we redirect to that resource
 * on successful login
 */

const saveRedirect = ({session={}, query}, res, next) => {
  let redirect = query.redirect || '';
  redirect = redirect.charAt(0) === '/' ? redirect : `/${redirect}`;
  session.redirectUrl = redirect;
  next();
};

const redirectSubdomain = ({session}, res) => {
  console.log('REDIRECT SUB', session);
  return res.redirect(session.redirectUrl || '/')
};

const setPicture = (user, profile) => {
  if(profile.photos && profile.photos.length && profile.photos[0].value) {
    user.picture =  profile.photos[0].value.replace('_normal', '_bigger');
  }
  else if(profile.provider == 'facebook') {
    user.picture = "//graph.facebook.com/" + profile.id + "/picture";
    user.picture += "?width=73&height=73";
  }
  else if (profile.provider === "github"){
    user.picture = user.picture || profile._json.avatar_url;
  }
  else {
    user.picture = gravatarUrl(user.email || '', {s: '73'});
  }

  user.picture = user.picture || '/default_avatar.png';
};


/**
 * Generate strategies for each provider
 */

const generateStrategy = provider => {

  // Generate routes
  if(provider === 'google') {
    app.get(`/auth/${provider}`, saveRedirect, passport.authenticate(provider, {scope: 'email'}));
  } else {
    app.get(`/auth/${provider}`, saveRedirect, passport.authenticate(provider));
  }
  app.get(`/auth/${provider}/callback`, passport.authenticate(provider, { failureRedirect: '/' }), redirectSubdomain);

  // Require provider own module
  // TODO: Figure out how to use ES2015 syntax instead of requires
  const _provider = provider === 'google' ? 'google-oauth20' : provider;
  const Strategy = require(`passport-${_provider}`).Strategy;

  passport.use(new Strategy(keys[provider], async (token, tokenSecret, profile, done) => {
    let user = await User.findOne({provider_id: profile.id, provider: provider}).exec();
    if(!user) {
      console.log('GENERATE', user)
      user = new User();
      user.provider = provider;
      user.provider_id = profile.id;

      if(profile.emails && profile.emails.length && profile.emails[0].value)
        user.email = profile.emails[0].value;

      setPicture(user, profile);

      user.name = profile.displayName || profile.username;
      user.username = profile.username || profile.displayName;

      try {
        done(null, await user.save());
      } catch(err) {
        done(err, null);
      }
    } else {
      //Update user picture provider if url changed
      var picBefore = user.picture;
      setPicture(user, profile);
      if (user.picture !== picBefore){
        try {
          done(null, await user.save());
        } catch(err) {
          done(err, null);
        }
      } else {
        done(null, user);
      }
    }
  }));
}

Object.keys(keys).forEach(generateStrategy);



if(config.useLocalLogin) {

  /**
   * Local user registration
   */
  const localRegister = async (req, res, next) => {
    var name = req.body.name.trim(),
        email = req.body.email.trim().toLowerCase(),
        password = req.body.password.trim();
    console.log('REGISTER NEW USER', name, email);

    let user = await User.findOne({email: email}).exec();
    if(user) {
      // user already exists
      req.flash('error', 'This email is already registered. Try to login with the original provider.');
      return res.redirect('/login');
    }

    // check data
    if(!name || !email || !password) {
      req.flash('error', 'Missing data. Please fill all fields.');
      return res.redirect('/register');
    }

    try {
      // Create user
      user = new User();
      user.provider = 'local';
      user.name = name;
      user.username = name;
      user.email = email;
      user.password = user.generateHash(password);
      setPicture(user, {provider: 'local'});
      await user.save();
      req.login(user, function(err) {
        if (err) {
          console.log('LOGIN ERROR', err);
          return next(err);
        }
      });
    }
    catch(err) {
      req.flash('error', 'User cannot be created due a server error: ', err);
      console.log('ERROR CREATING USER: ', err);
      res.redirect('/register');
    }

    next();
  }

  const LocalStrategy = require('passport-local').Strategy;

  passport.use(new LocalStrategy(async (email, password, done) => {
    try {

      let user = await User.findOne({ email: email.toLowerCase() }).exec();

      if (!user) {
        return done(null, false, { message: 'Incorrect Email.' });
      }

      if (!user.password) {
        console.log('NO PASSWORD');
        return done(null, false, { message: 'This user does not login with password. Try the original provider.' });
      }
      if(!user.validPassword(password)) {
        console.log('INVALID PASSWORD');
        return done(null, false, { message: 'Incorrect password.' });
      }

      console.log('USER OK', email, user);
      return done(null, user);

    } catch (err) {
      return done(null, false, 'Sorry, server error: ' + err)
    }
  }));

  app.post('/login',
    saveRedirect,
    passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
    redirectSubdomain);

  app.post('/register', saveRedirect, localRegister, redirectSubdomain);
}
