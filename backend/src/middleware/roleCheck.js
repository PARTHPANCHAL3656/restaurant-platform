// Chain after staffAuth — relies on req.staff.role being set
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.staff || !allowedRoles.includes(req.staff.role)) {
      return res.status(403).json({ error: "Access denied. Insufficient permissions." })
    }
    next()
  }
}