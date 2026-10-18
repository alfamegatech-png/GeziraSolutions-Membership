const validateRequest = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.query, { abortEarly: false }); // Validate the query parameters
  if (error) {
    return res.status(400).json({
      error: error.details.map((detail) => detail.message).join(", "),
    });
  }
  next();
};

module.exports = {
  validateRequest: validateRequest
};
