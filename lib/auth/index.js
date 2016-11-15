
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
import bus from 'lib/bus';
import {url as gravatarUrl} from 'gravatar';
import crypto from 'crypto';

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
    app.get(`/auth/${provider}`, saveRedirect, passport.authenticate(provider, {scope: 'email', failureRedirect: '/login', failureFlash: true }));
  } else {
    app.get(`/auth/${provider}`, saveRedirect, passport.authenticate(provider, { failureRedirect: '/login', failureFlash: true }));
  }
  app.get(`/auth/${provider}/callback`, passport.authenticate(provider, { failureRedirect: '/login', failureFlash: true }), redirectSubdomain);

  // Require provider own module
  // TODO: Figure out how to use ES2015 syntax instead of requires
  const _provider = provider === 'google' ? 'google-oauth20' : provider;
  const Strategy = require(`passport-${_provider}`).Strategy;
  const ops = keys[provider];
  ops.passReqToCallback = true;
  passport.use(new Strategy(ops, async (req, token, tokenSecret, profile, done) => {
    try {

      let user = await User.findOne({provider_id: profile.id, provider: provider}).exec();

      if(!user) {

        user = new User();
        user.provider = provider;
        user.provider_id = profile.id;

        if(profile.emails && profile.emails.length && profile.emails[0].value) {
          user.email = profile.emails[0].value;
          // TODO: link to existing user if email exists
          let exists = await User.findOne({email: user.email}).exec();
          if(exists) {
            return done(null, false, {'message': 'Sorry this email is already registered, please try the original login provider.'});
          }
        }


        setPicture(user, profile);

        user.name = profile.displayName || profile.username;
        user.username = profile.username || profile.displayName;

        return done(null, await user.save());

      } else {

        //Update user picture provider if url changed
        var picBefore = user.picture;
        setPicture(user, profile);
        if (user.picture !== picBefore){
          return done(null, await user.save());
        } else {
          return done(null, user);
        }
      }

    } catch(err) {

        return done(null, false, {'message': 'Sorry, server error: ' + err});

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
      req.flash('error', 'This email is already registered. Try to login with the original provider or reset the password.');
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

  /**
   * Loca retrieve password
   */
  const localNewToken = async (req, res, next) => {
    try {
      let email = req.body.email.trim().toLowerCase();
      console.log('NEW TOKEN PASS FOR USER', email);
      let user = await User.findOne({email: email}).exec();

      if(!user) {
        req.flash('error', 'Not user found for this email!');
        console.log('ERROR RETRIEVING PASSWORD, Not user found');
        return res.redirect('/login');
      }

      // Generate change password token
      let token = await crypto.randomBytes(20);
      if(!token) {
        req.flash('error', 'Sorry, internal server error while generating token');
        res.redirect('/login');
      }
      user.resetPasswordToken = token.toString('hex');
      user.resetPasswordExpires = Date.now() + (3600000 * 12); // 12 hours
      await user.save();

      bus.emit('user', {
        type: 'new_password',
        user: user,
        token: user.resetPasswordToken
      });

      req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.')
      return res.redirect('/login');

      next();

    } catch(err) {
        req.flash('error', 'Sorry, server error! ' + err);
        console.log('ERROR RETRIEVING PASSWORD, Server error', err);
        return res.redirect('/login');
    }
  };

  const localCheckPassword = async (req, res, next) => {
      // let password = req.body.password.trim();
      console.log('CHECK NEW PASS FOR USER', req.params.token, req.method);
      try {
        let user = await User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }).exec();
        if(!user) {
          req.flash('error', 'This token is invalid or has expired!');
          return res.redirect('/login');
        }
        if(req.method === 'POST') {
          let password = req.body.password.trim();
          if(!password) {
            req.flash('error', 'Please write valid a password.');
            return res.redirect('/lost-password/' +  req.params.token);
          }
          user.resetPasswordToken = null;
          user.resetPasswordExpires = null;
          user.password = user.generateHash(password);
          await user.save();
          req.flash('info', 'Great! You may now login with your new password.')
          res.redirect('/login');
        }
        next();
      } catch(err) {
        req.flash('error', 'Sorry, server error: ' + err );
        console.log('SERVER ERROR', err);
        return res.redirect('/login');
      }
  };

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

  app.post('/lost-password', saveRedirect, localNewToken, redirectSubdomain);
  app.all('/lost-password/:token', localCheckPassword);
}
