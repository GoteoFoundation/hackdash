
/**
 * Site router controllers
 */

/**
 * Module dependencies
 */

import {version as clientVersion} from 'client/package.json';
import {Dashboard, } from 'lib/models';
import {check} from 'lib/utils/metas';
import {setViewVar, loadProviders, render} from 'lib/routes/helpers';
import {port, host, publicHost, title, publicDashboardCreation, homeCreateProject, defaultHomeTab, live, disqus_shortname, discourseUrl, googleAnalytics, facebookAppId, useLocalLogin, googleApiKey, theme, language, languages, skills, internalComments, commentTypes, maxQueryLimit, minProjects} from 'config/config.json';
import roles from 'lib/settings/roles';
import statuses from 'lib/settings/statuses';
import keys from 'config/keys.json';

/**
 * Module scope constants
 */

// const appHost = `${host}${port !== 80 ? `:${port || 3000}` : ''}`;
const appHost = `${publicHost ? publicHost : host}`.replace(/^(https?):\/\//, '');

/**
 * Locales from theme (if any)
 */
var themeLocales = {};
if(theme) {
  try {
    themeLocales = require('themes/' + theme + '/locale');
    console.log("Adding custom locales from theme " +  theme);

  } catch(e) {
    console.warn("No custom locales for theme " + theme);
  }
}
// console.warn(themeLocales);

const setLocale = (req, res, next) => {
  var lang = req.session && req.session.lang;
  if(!lang || req.query.lang) {
    lang = req.query.lang || language;
    req.session.lang = lang;
    console.log('Set language to', lang);
  }
  res.locals.language = JSON.stringify(lang || null);
  next();
};

/**
 * If user has no email, redirect to their profile
 */

const checkProfile = ({user, session={}}, res, next) => {
  if (user && !user.email){
    const q = session.redirectUrl ? `?from=${session.redirectUrl}` : '';
    res.redirect(`/users/profile${q}`);
  }
  next();
};

/*
 * Add current user template variable
 */

const loadUser = (req, res, next) => {
  res.locals.errors = [];
  res.locals.user = req.user;
  res.locals.flashError = req.flash('error');
  res.locals.flashMessage = req.flash('info');
  next();
};

/*
 * Log out current user
 */

export const logout = (req, res, next) => {
  req.logout();
  next();
};

/**
 * Check subdomain
 * TODO: Put a real function name
 */

const hasSubDomain_GoDashboard = ({subdomains, socket}, res, next) => {
  if (subdomains.length) {
    const protocol = socket.encrypted ? 'https' : 'http';
    return res.redirect(`${protocol}://${host}/dashboards/${subdomains[0]}`);
  }
  next();
};

/**
 * Check remove subdomain
 * TODO: Put a real function name
 */

const hasSubDomain_RemoveIt = ({subdomains, socket}, res, next) => {
  if (subdomains.length) {
    const protocol = socket.encrypted ? 'https' : 'http';
    return res.redirect(`${protocol}://${host}${req.originalUrl}`);
  }
  next();
};

export const projectFormRedirect = ({subdomains, socket}, res) => {
  const protocol = socket.encrypted ? 'https' : 'http';
  if (subdomains.length) {
    const baseUrl = `${protocol}://${host}/dashboards/${subdomains[0]}`;
    return res.redirect(`${baseUrl}/create`);
  }
  return res.redirect(`${protocol}://${host}`);
};

export const userStack = [setLocale, loadUser, loadProviders];

export const viewsStack = [
  setViewVar('host', appHost),
  setViewVar('version', clientVersion),
  setViewVar('title', title),
  setViewVar('theme', theme),
  setViewVar('roles', JSON.stringify(roles)),
  setViewVar('publicDashboardCreation', publicDashboardCreation),
  setViewVar('googleApiKey', googleApiKey),
  setViewVar('useLocalLogin', useLocalLogin),
  setViewVar('discourseUrl', discourseUrl),
  setViewVar('homeCreateProject', homeCreateProject),
  setViewVar('defaultHomeTab', defaultHomeTab),
  setViewVar('statuses', JSON.stringify(statuses)),
  setViewVar('skills', JSON.stringify(skills || null)),
  setViewVar('themeLocales', JSON.stringify(themeLocales)),
  // setViewVar('language', JSON.stringify(language || null)),
  setViewVar('languages', JSON.stringify(languages || null)),
  setViewVar('disqus_shortname', disqus_shortname),
  setViewVar('internalComments', internalComments || false),
  setViewVar('maxQueryLimit', maxQueryLimit || 50),
  setViewVar('minProjects', typeof minProjects !== 'undefined' ? minProjects : 2),
  setViewVar('commentTypes', JSON.stringify(commentTypes || null)),
  setViewVar('googleAnalytics', googleAnalytics || null),
  setViewVar('fbAppId', (keys.facebook && keys.facebook.clientID) || facebookAppId || null),
  check()
];

export const homeStack = []
  .concat([hasSubDomain_GoDashboard])
  .concat(userStack)
  .concat([checkProfile])
  .concat(viewsStack)
  .concat([render('landing')]);

export const appStack = []
  .concat([hasSubDomain_RemoveIt])
  .concat(userStack)
  .concat([checkProfile])
  .concat(viewsStack)
  .concat([render('app')]);

export const profileStack = []
  .concat([hasSubDomain_RemoveIt])
  .concat(userStack)
  .concat(viewsStack)
  .concat([render('app')]);

export const embedStack = []
  .concat([hasSubDomain_RemoveIt])
  .concat(viewsStack)
  .concat([render('embed')]);
