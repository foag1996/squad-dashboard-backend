const jiraService = require('../services/jira.service');

/**
 * GET /api/health
 */
const health = (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    jiraConfigured: !!process.env.JIRA_BASE_URL,
  });
};

/**
 * GET /api/sprint/issues
 * Devuelve HUs del sprint activo (con cache)
 */
const getSprintIssues = async (req, res) => {
  try {
    const data = await jiraService.getActiveSprintIssues();
    res.json(data);
  } catch (err) {
    console.error('[getSprintIssues]', err.message);
    res.json({ error: err.message });
  }
};

/**
 * GET /api/sprint/stats
 * Devuelve estadísticas del sprint activo
 */
const getSprintStats = async (req, res) => {
  try {
    const data = await jiraService.getSprintStats();
    res.json(data);
  } catch (err) {
    console.error('[getSprintStats]', err.message);
    res.json({ error: err.message });
  }
};

/**
 * GET /api/sprint/members
 * Devuelve cards de miembros con sus HUs
 */
const getSprintMembers = async (req, res) => {
  try {
    const data = await jiraService.getSprintMembers();
    res.json(data);
  } catch (err) {
    console.error('[getSprintMembers]', err.message);
    res.json({ error: err.message });
  }
};

/**
 * GET /api/sprint/refresh
 * Fuerza refresco desde Jira (invalida cache)
 */
const refreshSprint = async (req, res) => {
  try {
    jiraService.invalidateCache();
    const data = await jiraService.getActiveSprintIssues();
    res.json({ ...data, refreshed: true, refreshedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[refreshSprint]', err.message);
    res.json({ error: err.message });
  }
};

module.exports = {
  health,
  getSprintIssues,
  getSprintStats,
  getSprintMembers,
  refreshSprint,
};
