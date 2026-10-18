const globalError = (err, req, res, next) => {
  let error = err.message;
  let code = err.statusCode || 500;
  process.env.MODE === 'development' ?
    res.status(code).json({ error, stack: err.stack }) :
    res.status(code).json({ error });
};

module.exports = {
  globalError: globalError
};
