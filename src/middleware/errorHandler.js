function errorHandler(err, _req, res, _next) {
  console.error('[erro]', err);

  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Erro interno do servidor' : err.message,
  });
}

module.exports = { errorHandler };
