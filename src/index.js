require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jiraRoutes = require('./routes/jira.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', jiraRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`[Squad Dashboard Backend] Servidor corriendo en http://localhost:${PORT}`);
  console.log(`[Squad Dashboard Backend] Jira configurado: ${process.env.JIRA_BASE_URL ? 'SI' : 'NO (usando datos mock)'}`);
});

module.exports = app;
