
/**
 * Generic route helpers
 */

export const notAllowed = (req, res) => res.send(405);
export const isAuth = (req, res, next) => req.isAuthenticated() ? next(): res.send(401, 'User not authenticated');
export const isDashboardAdmin = (req, res, next) => {
  var domain = req.params.domain || req.body.domain;

  var isAdmin = (req.user.admin_in.indexOf(domain) >= 0);

  if (!isAdmin) {
    return res.send(403, "Only Administrators are allowed for this action.");
  }

  next();
};
