
/**
 * Generic route helpers
 */
import _ from 'underscore';
import roles from 'config/roles.json';
var h = require('lib/routes/helpers');

// duplicate helpers
export const isAuth = h.isAuth;

// Check an atomic permissions from the user's role
export const userHasPermission = (user, perm) => {
  if(!user) {
    return false;
  }

  var role = _.findWhere(roles, {role: user.role}) || {role: null, perms:[]};
  return role.perms.indexOf(perm) >= 0;
};

// Check either is admin in domain or group and user has perm
// return: isAdmin(domain or group) and has perm (if perm defined)
export const userAdminAndPermission = (user, domain, group, perm) => {
  if(!user) return false;
  let admin_in = user.admin_in || [];
  let group_admin_in = user.group_admin_in || [];
  // if domain, needs to be admin in it
  let domain_admin = domain && (admin_in.indexOf(domain) > -1);
  // if group(collection), needs to be admin in it
  let group_admin = group && (group_admin_in.indexOf(group) > -1);
  if(!domain_admin && !group_admin) {
    return false;
  }
  // console.log('IS ADMIN',domain_admin,group_admin,user.role,domain,group);
  if(perm) return userHasPermission(user, perm);
  return true;

};

export const notAllowed = (req, res) => res.status(405).send('Not allowed');

export const isDashboardAdmin = (req, res, next) => {
  var domain = req.params.domain || req.body.domain || req.domain;

  var isAdmin = (req.user.admin_in.indexOf(domain) >= 0);

  if (!isAdmin) {
    return res.status(403).send("Only dashboard administrators are allowed for this action");
  }

  next();
};

export const isCollectionAdmin = (req, res, next) => {
  var group = req.params.group || req.body.group || req.group;

  var isAdmin = (req.user.group_admin_in.indexOf(group) >= 0);

  if (!isAdmin) {
    return res.status(403).send("Only collection administrators are allowed for this action");
  }

  next();
};

