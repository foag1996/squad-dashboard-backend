const { Router } = require('express');
const jiraController = require('../controllers/jira.controller');

const router = Router();

/**
 * GET /api/health
 * Health check del servidor
 */
router.get('/health', jiraController.health);

/**
 * GET /api/sprint/issues
 * HUs del sprint activo con Key, Título, Estado, Prioridad y Asignado
 * Respuesta cacheada en memoria
 */
router.get('/sprint/issues', jiraController.getSprintIssues);

/**
 * GET /api/sprint/stats
 * Estadísticas del sprint: total, en progreso, completadas, % avance
 */
router.get('/sprint/stats', jiraController.getSprintStats);

/**
 * GET /api/sprint/members
 * Cards de miembros del squad con sus HUs asignadas
 */
router.get('/sprint/members', jiraController.getSprintMembers);

/**
 * GET /api/sprint/refresh
 * Fuerza refresco desde Jira (invalida cache)
 */
router.get('/sprint/refresh', jiraController.refreshSprint);

module.exports = router;
