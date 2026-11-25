// The "Built by" credit is read from an environment variable so it is never stored in the repository.
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.statusCode = 200;
  res.end(JSON.stringify({ builtBy: String(process.env.BUILT_BY || '').slice(0, 80) }));
};
