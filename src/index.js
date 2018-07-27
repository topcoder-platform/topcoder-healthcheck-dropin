import express from 'express';

const app = express();

const HTTP_HEALTHY = 200;
const HTTP_FAILED = 503;


/**
 * executeCustomChecks - executes custom check functions
 *
 */


/**
  * executeCustomChecks - description
  *
  * @param  {object} req    request object
  * @param  {object} res    response object
  * @param  {array} checks array of functions to execute to check service health. functions must return boolean
  * @returns {boolean}        Returns true if checks is falsy otherwise returns false if any check fails
  */
function executeCustomChecks(req, res, checks) {
  if (checks) {
    return checks.reduce((accumulator, check) => accumulator && check(req, res), true);
  }
  return true;
}


/**
 * healthCheck - health check function to be used in middleware
 *
 * @param  {object} req    request object
 * @param  {object} res    response object
 * @param  {array} checks array of functions to execute health check
 * @returns {boolean}        result of checks
 */
function healthCheck(req, res, checks) {
  const result = executeCustomChecks(req, res, checks);
  res.sendStatus(result ? HTTP_HEALTHY : HTTP_FAILED);
  return result;
}

/**
 * middleware - express middleware for executing custom health checks
 *
 * @param  {array} checks optional array of functions to execute to check service health. functions must return boolean
 * @returns {function}        middleware function
 */
function middleware(checks) {
  return (req, res, next) => {
    if (req.url === '/health') {
      healthCheck(req, res, checks);
    } else {
      next();
    }
  };
}

/**
 * init - description
 *
 * @param  {array} checks optional array of functions to execute to check service health. functions must return boolean
 * @returns {object}        returns the express app that was initialized
 */
function init(checks) {
  app.get('/health', (req, res, next) => next());
  app.use(middleware(checks));
  const port = process.env.port || 3000;
  app.listen(port, () => {
    console.log(`Topcoder Health Check DropIn listening on port ${port}`);
  });

  return app;
}

module.exports = {
  init,
  middleware,
  HTTP_HEALTHY,
  HTTP_FAILED,
};
