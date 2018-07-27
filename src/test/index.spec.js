/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0 */
/* eslint no-console: off */
import { expect } from 'chai';
import httpMocks from 'node-mocks-http';
import supertest from 'supertest';
import hc from '../index';

let request = {}; // define REQUEST
let response = {}; // define RESPONSE

describe('topcoder', () => {
  const successChecks = [(req, res) => {
    res.checkCount = res.checkCount ? res.checkCount : 0;
    ++res.checkCount;
    console.log(`check 1 ran. Check count is now: ${res.checkCount}`);
    return true;
  },
  (req, res) => {
    res.checkCount = res.checkCount ? res.checkCount : 0;
    ++res.checkCount;
    console.log(`check 2 ran. Check count is now: ${res.checkCount}`);
    return true;
  },
  ];

  const failureChecks = [(req, res) => {
    res.checkCount = res.checkCount ? res.checkCount : 0;
    ++res.checkCount;
    console.log(`check 1 ran. Check count is now: ${res.checkCount}`);
    return true;
  },
  (req, res) => {
    res.checkCount = res.checkCount ? res.checkCount : 0;
    ++res.checkCount;
    console.log(`check 2 ran. Check count is now: ${res.checkCount}`);
    return false;
  },
  ];

  describe('#healthCheck middleware', () => {
    beforeEach((done) => {
      // before each test, reset the REQUEST and RESPONSE variables to be send into the middle ware
      request = httpMocks.createRequest({
        method: 'GET',
        url: '/health',
      });

      response = httpMocks.createResponse();
      response.checkCount = 0;
      console.log(`Check count is set to: ${response.checkCount}`);

      done();
    });

    it(`should run ${successChecks.length} check functions and return ${hc.HTTP_HEALTHY}`, (done) => {
      const mw = hc.middleware(successChecks);

      mw(request, response); // close middleware
      expect(response.checkCount).to.equal(successChecks.length);
      expect(response.statusCode).to.equal(hc.HTTP_HEALTHY);
      done();
    }); // close it

    it(`should run ${successChecks.length} check functions and return ${hc.HTTP_FAILED}`, (done) => {
      const mw = hc.middleware(failureChecks);

      mw(request, response); // close middleware
      expect(response.checkCount).to.equal(failureChecks.length);
      expect(response.statusCode).to.equal(hc.HTTP_FAILED);
      done();
    }); // close it
  });

  describe('#healthCheck init server with no check funcs', () => {
    let server = {};
    beforeEach((done) => {
      console.log('--- starting new server instance with no check funcs');
      server = hc.init(done);
    });

    afterEach((done) => {
      console.log('--- shutting down server instance with no check funcs');
      server.close(done);
    });

    it('should 404 respond to /', (done) => {
      console.log('testing root with no check funcs');
      supertest(server)
        .get('/')
        .expect(404, done);
    });

    it(`should ${hc.HTTP_HEALTHY} respond to /health`, (done) => {
      console.log('testing health endpoint with no check funcs');
      supertest(server)
        .get('/health')
        .expect(hc.HTTP_HEALTHY, { checksRun: 0 }, done);
    });
  });

  describe('#healthCheck init server with success check funcs', () => {
    let server = {};
    beforeEach((done) => {
      console.log('--- starting new server instance with check funcs');
      server = hc.init(successChecks, done);
    });

    afterEach((done) => {
      console.log('--- shutting down server instance with check funcs');
      server.close(done);
    });

    it('should 404 respond to /', (done) => {
      console.log('testing root');
      supertest(server)
        .get('/')
        .expect(404, done);
    });

    it(`should ${hc.HTTP_HEALTHY} respond to /health`, (done) => {
      console.log('testing health endpoint');
      supertest(server)
        .get('/health')
        .expect((res) => {
          if (res.statusCode !== hc.HTTP_HEALTHY) {
            throw new Error(`Expected ${hc.HTTP_HEALTHY} got ${res.statusCode}`);
          }

          if (!res.body.checksRun || (res.body.checksRun !== successChecks.length)) {
            throw new Error(`Expected checkCount of ${successChecks.length} got ${res.body.checksRun}`);
          }
        }).end(done);
    });
  });

  describe('#healthCheck init server with failure check funcs', () => {
    let server = {};
    beforeEach((done) => {
      server = hc.init(failureChecks);
      done();
    });

    afterEach((done) => {
      server.close(done);
    });

    it('should 404 respond to /', (done) => {
      console.log('testing root');
      supertest(server)
        .get('/')
        .expect(404, done);
    });

    it(`should ${successChecks.length} check functions and respond ${hc.HTTP_FAILED} to /health`, (done) => {
      console.log('testing health endpoint');
      supertest(server)
        .get('/health')
        .expect((res) => {
          if (res.statusCode === hc.HTTP_FAILED) {
            return true;
          }
          throw new Error(`Expected ${hc.HTTP_FAILED} got ${res.statusCode}`);
        }).end(done);
    });
  });
});
