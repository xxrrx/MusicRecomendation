require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const errorMiddleware = require('./shared/middleware/error.middleware');
const env = require('./shared/config/env');

const app = express();

// Security & logging
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// API routes
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/users', require('./modules/user/user.routes'));
app.use('/api/music', require('./modules/music/music.routes'));
app.use('/api/player', require('./modules/player/player.routes'));
app.use('/api/playlists', require('./modules/playlist/playlist.routes'));
app.use('/api/social', require('./modules/social/social.routes'));
app.use('/api/search', require('./modules/search/search.routes'));
app.use('/api/charts', require('./modules/charts/charts.routes'));
app.use('/api/artist', require('./modules/artist/artist.routes'));
app.use('/api/admin', require('./modules/admin/admin.routes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// Global error handler
app.use(errorMiddleware);

const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
