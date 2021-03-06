'use strict';

const Koa = require('koa');
const supertest = require('supertest');
const connect = require('./index');

describe('koa-connect', () => {
  let app;

  beforeEach(() => {
    app = new Koa();
    app.use((ctx, next) => {
      ctx.status = 404;
      ctx.body = 'Original';
      next();
    })
  });

  it('works with a single noop Connect middleware', (done) => {
    app.use(connect((req, res, next) => next()));
    supertest(app.callback())
      .get('/')
      .expect('Original')
      .end(done);
  });

  it('works with two noop Connect middleware', (done) => {
    app.use(connect((req, res, next) => next()));
    app.use(connect((req, res, next) => next()));
    supertest(app.callback())
      .get('/')
      .expect('Original')
      .end(done);
  });

  it('passes correctly to downstream Koa middlewares', (done) => {
    app.use(connect((req, res, next) => next()));
    app.use((ctx) => ctx.status = 200);
    supertest(app.callback())
      .get('/')
      .expect(200)
      .end(done);
  });

  it('bubbles back to earlier middleware', (done) => {
    app.use((ctx, next) => {
      next()
        .then(() => {
          // Ensures that the following middleware is reached
          if ( ctx.status !== 200 ) {
            done(new Error('Never reached connect middleware'))
          }
          ctx.status = 201;
        })
    });

    app.use(connect((req, res) => res.statusCode = 200 ));

    supertest(app.callback())
      .get('/')
      .expect(201)
      .end(done);
  });

  it('receives errors from Connect middleware', (done) => {
    app.use((ctx, next) => {
      next().catch((err) => ctx.status = 500)
    })

    app.use(connect((req, res, next) => {
      next(new Error('How Connect does error handling'));
    }));

    app.use((ctx) => {
      // Fail the test if this is reached
      done(new Error('Improper error handling'))
    })

    supertest(app.callback())
      .get('/')
      .expect(500)
      .end(done);
  });

  it('Setting the body or status in Koa middlewares does not do anything if res.end was used in a Connect middleware', (done) => {
    const message = 'The message that makes it';
    app.use((ctx, next) => {
      next()
        .then(() => {
          if ( ctx.status !== 200 ) {
            done(new Error('Never reached connect middleware'));
          }
          // These calls won't end up doing anything
          ctx.status = 500;
          ctx.body = 'A story already written';
        })
    });

    app.use(connect((req, res) => {
      res.statusCode = 200;
      res.setHeader('Content-Length', message.length)
      res.end(message);
    }));

    supertest(app.callback())
      .get('/')
      .expect(200)
      .expect(message)
      .end(done);
  });
})
