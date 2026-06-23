const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3087;

app.use(express.json());

const APP_PREFIX = '/apps/12min-timer';
app.use((req, res, next) => {
  if (req.url === APP_PREFIX || req.url.startsWith(APP_PREFIX + '/')) {
    req.url = req.url.slice(APP_PREFIX.length) || '/';
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Error beacon
const ERR_LOG = path.join(__dirname, '.runtime-errors.log');
app.post('/api/__errors', (req, res) => {
  try {
    const line = JSON.stringify(req.body || {}) + '\n';
    fs.appendFile(ERR_LOG, line, () => {});
    fs.readFile(ERR_LOG, 'utf8', (e, data) => {
      if (e) return;
      const lines = data.split('\n');
      if (lines.length > 200) {
        fs.writeFile(ERR_LOG, lines.slice(-200).join('\n'), () => {});
      }
    });
  } catch (_) {}
  res.status(204).end();
});
app.get('/api/__errors', (req, res) => {
  fs.readFile(ERR_LOG, 'utf8', (e, data) => {
    if (e) return res.json({ errors: [] });
    const errors = data.trim().split('\n').filter(Boolean).map(l => {
      try { return JSON.parse(l); } catch (_) { return null; }
    }).filter(Boolean);
    res.json({ errors });
  });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`12min-timer running on port ${PORT}`);
  });
}

module.exports = app;
