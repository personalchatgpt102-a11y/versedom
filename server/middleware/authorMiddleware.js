const authorMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    if (!req.user.authorProfile?.isAuthor) {
      return res.status(403).json({
        message: "Author access only",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      message: "Author middleware failed",
      error: error.message,
    });
  }
};

export default authorMiddleware;