const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    createProxyMiddleware({
      target: 'http://localhost:3000',
      changeOrigin: true,
      pathFilter: '/api',  // <--- O SEGREDO ESTÁ AQUI (Isso filtra sem cortar o link)
    })
  );
};