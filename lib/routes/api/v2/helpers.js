
/**
 * Generic route helpers
 */
import _ from 'underscore';
import roles from 'config/roles.json';

// Check an atomic permissions from the user's role
export const userHasPermission = (user, perm) => {
  if(!user) {
    return false;
  }

  var role = _.findWhere(roles, {role: user.role}) || {role: null, perms:[]};
  return role.perms.indexOf(perm) >= 0;
};


export const notAllowed = (req, res) => res.status(405).send('Not allowed');
export const isAuth = (req, res, next) => req.isAuthenticated() ? next(): res.status(40).send('User not authenticated');

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

