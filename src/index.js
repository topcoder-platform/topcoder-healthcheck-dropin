import express from 'express';


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
  res.status((result ? HTTP_HEALTHY : HTTP_FAILED)).json({ checksRun: (checks ? checks.length : 0) });
  return result;
}

/**
 * middleware - express middleware for executing custom health checks
 *
 * @param  {array} checks optional array of functions to execute to check service health. functions must return boolean
 * @returns {function}        middleware function
 */
function middleware(checks) {
  return function middle(req, res, next) {
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
 * @returns {object}        returns the express server that was initialized
 */
function init(checks, cb) {
  let checksArray = checks;
  let svcStartCB = cb;
  if (typeof checks === 'function') {
    checksArray = null;
    svcStartCB = checks;
  }

  if (!svcStartCB) {
    svcStartCB = (err) => {
      if (!err) {
        console.log('Topcoder Health Check DropIn started and ready to roll');
      } else {
        console.log(err);
      }
    };
  }

  const app = express();
  app.get('/health', middleware(checksArray));
  const port = process.env.port || 3000;
  return app.listen(port, (err) => {
    console.log(`********** Topcoder Health Check DropIn listening on port ${port}`);
    svcStartCB(err);
  });
}

module.exports = {
  init,
  middleware,
  HTTP_HEALTHY,
  HTTP_FAILED,
};
