
/**
 * Generic route helpers
 */

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

