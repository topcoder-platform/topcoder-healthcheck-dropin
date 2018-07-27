/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0 */
import chai, { expect } from 'chai';
import httpMocks from 'node-mocks-http';
import hc from '../index';

let request = {}; // define REQUEST
let response = {}; // define RESPONSE

describe('topcoder', () => {
  describe('#healthCheck', () => {
    beforeEach((done) => {
      /*
       * before each test, reset the REQUEST and RESPONSE variables
       * to be send into the middle ware
      * */
      console.log('executing beforeEach');
      request = httpMocks.createRequest({
        method: 'GET',
        url: '/health',
      });

      response = httpMocks.createResponse();
      response.checkCount = 0;
      console.log(`Check count is set to: ${response.checkCount}`);

      done();
    });

    it('should run check functions and return HTTP_HEALTHY', (done) => {
      const aChecks = [(req, res) => {
        ++res.checkCount;
        console.log(`check 1 ran. Check count is now: ${res.checkCount}`);
        return true;
      },
      (req, res) => {
        ++res.checkCount;
        console.log(`check 2 ran. Check count is now: ${res.checkCount}`);
        return true;
      },
      ];

      const mw = hc.middleware(aChecks);

      mw(request, response); // close middleware
      expect(response.checkCount).to.equal(aChecks.length);
      expect(response.statusCode).to.equal(hc.HTTP_HEALTHY);
      done();
    }); // close it

    it('should run check functions and return HTTP_FAILED', (done) => {
      const aChecks = [(req, res) => {
        ++res.checkCount;
        console.log(`check 1 ran. Check count is now: ${res.checkCount}`);
        return true;
      },
      (req, res) => {
        ++res.checkCount;
        console.log(`check 2 ran. Check count is now: ${res.checkCount}`);
        return false;
      },
      ];

      const mw = hc.middleware(aChecks);

      mw(request, response); // close middleware
      expect(response.checkCount).to.equal(aChecks.length);
      expect(response.statusCode).to.equal(hc.HTTP_FAILED);
      done();
    }); // close it

    /*
    it('should init express app', () => {
      const app = hc.init([
        () => { console.log('yo!'); return true; },
        () => { console.log('sucka!'); return true; },
      ]);
      expect(app).to.be.an('object');
    });
*/
  });
});
