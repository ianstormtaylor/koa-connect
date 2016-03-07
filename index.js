module.exports = function koaConnect(connectMiddleware) {
  return function koaConnect(ctx, next) {
    return new Promise(function (resolve, reject) {
      connectMiddleware(ctx.req, ctx.res, (err) => {
        if (err) reject(err);
        resolve(next())
      });
    })
  };
};
