const axios = require('axios');

// ─── Cache en memoria ────────────────────────────────────────────────────────
let cache = null;
let cacheTimestamp = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

const isCacheValid = () =>
  cache !== null && cacheTimestamp !== null && Date.now() - cacheTimestamp < CACHE_TTL_MS;

const invalidateCache = () => {
  cache = null;
  cacheTimestamp = null;
  console.log('[JiraService] Cache invalidado');
};

// ─── Helpers de autenticación ────────────────────────────────────────────────
const isJiraConfigured = () =>
  !!(process.env.JIRA_BASE_URL && process.env.JIRA_EMAIL && process.env.JIRA_API_TOKEN);

const buildAuthHeader = () => {
  const credentials = `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`;
  const encoded = Buffer.from(credentials).toString('base64');
  return `Basic ${encoded}`;
};

const buildAxiosInstance = () =>
  axios.create({
    baseURL: process.env.JIRA_BASE_URL,
    headers: {
      Authorization: buildAuthHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    timeout: 10000,
  });

// ─── Llamadas a Jira API ─────────────────────────────────────────────────────

/**
 * Obtiene el boardId del proyecto configurado en JIRA_PROJECT_KEY
 */
const getBoardId = async (client) => {
  const projectKey = process.env.JIRA_PROJECT_KEY || 'AC';
  const response = await client.get(
    `/rest/agile/1.0/board?projectKeyOrId=${encodeURIComponent(projectKey)}`
  );
  const boards = response.data.values;
  if (!boards || boards.length === 0) {
    throw new Error(`No se encontró board para el proyecto ${projectKey}`);
  }
  return boards[0].id;
};

/**
 * Obtiene el sprint activo de un board
 */
const getActiveSprint = async (client, boardId) => {
  const response = await client.get(
    `/rest/agile/1.0/board/${boardId}/sprint?state=active`
  );
  const sprints = response.data.values;
  if (!sprints || sprints.length === 0) {
    throw new Error('No hay sprint activo en este board');
  }
  return sprints[0];
};

/**
 * Obtiene las issues del sprint activo
 */
const getIssuesFromSprint = async (client, sprintId) => {
  const fields = 'summary,status,priority,assignee';
  const response = await client.get(
    `/rest/agile/1.0/sprint/${sprintId}/issue?fields=${fields}&maxResults=100`
  );
  return response.data.issues || [];
};

/**
 * Normaliza una issue de Jira al formato de respuesta
 */
const normalizeIssue = (issue) => ({
  key: issue.key,
  summary: issue.fields.summary,
  status: issue.fields.status?.name || 'Unknown',
  statusCategory: issue.fields.status?.statusCategory?.key || 'undefined',
  priority: issue.fields.priority?.name || 'None',
  assignee: issue.fields.assignee
    ? {
        displayName: issue.fields.assignee.displayName,
        accountId: issue.fields.assignee.accountId,
        avatarUrl: issue.fields.assignee.avatarUrls?.['48x48'] || null,
      }
    : null,
});

// ─── Datos mock para desarrollo ──────────────────────────────────────────────
const getMockData = () => {
  const mockIssues = [
    {
      key: 'AC-101',
      summary: 'Implementar autenticación JWT en el backend',
      status: 'In Progress',
      statusCategory: 'indeterminate',
      priority: 'High',
      assignee: { displayName: 'Tech Lead', accountId: 'mock-tl-001', avatarUrl: null },
    },
    {
      key: 'AC-102',
      summary: 'Crear endpoint de gestión de usuarios',
      status: 'Done',
      statusCategory: 'done',
      priority: 'High',
      assignee: { displayName: 'Tech Lead', accountId: 'mock-tl-001', avatarUrl: null },
    },
    {
      key: 'AC-103',
      summary: 'Diseñar arquitectura de microservicios',
      status: 'Done',
      statusCategory: 'done',
      priority: 'Medium',
      assignee: { displayName: 'Tech Lead', accountId: 'mock-tl-001', avatarUrl: null },
    },
    {
      key: 'AC-104',
      summary: 'Desarrollar API REST para módulo de pagos',
      status: 'In Progress',
      statusCategory: 'indeterminate',
      priority: 'High',
      assignee: { displayName: 'Backend Dev', accountId: 'mock-be-001', avatarUrl: null },
    },
    {
      key: 'AC-105',
      summary: 'Integrar pasarela de pagos con Stripe',
      status: 'To Do',
      statusCategory: 'new',
      priority: 'High',
      assignee: { displayName: 'Backend Dev', accountId: 'mock-be-001', avatarUrl: null },
    },
    {
      key: 'AC-106',
      summary: 'Configurar base de datos PostgreSQL en producción',
      status: 'To Do',
      statusCategory: 'new',
      priority: 'Medium',
      assignee: { displayName: 'Backend Dev', accountId: 'mock-be-001', avatarUrl: null },
    },
    {
      key: 'AC-107',
      summary: 'Implementar componente de tabla de datos con PrimeNG',
      status: 'Done',
      statusCategory: 'done',
      priority: 'Medium',
      assignee: { displayName: 'Frontend Dev', accountId: 'mock-fe-001', avatarUrl: null },
    },
    {
      key: 'AC-108',
      summary: 'Crear pantalla de dashboard con gráficos',
      status: 'Done',
      statusCategory: 'done',
      priority: 'High',
      assignee: { displayName: 'Frontend Dev', accountId: 'mock-fe-001', avatarUrl: null },
    },
    {
      key: 'AC-109',
      summary: 'Implementar theming dinámico con CSS variables',
      status: 'In Progress',
      statusCategory: 'indeterminate',
      priority: 'Low',
      assignee: { displayName: 'Frontend Dev', accountId: 'mock-fe-001', avatarUrl: null },
    },
    {
      key: 'AC-110',
      summary: 'Desarrollar módulo de reportes end-to-end',
      status: 'In Progress',
      statusCategory: 'indeterminate',
      priority: 'High',
      assignee: { displayName: 'Fullstack Dev', accountId: 'mock-fs-001', avatarUrl: null },
    },
    {
      key: 'AC-111',
      summary: 'Integrar Angular frontend con API de notificaciones',
      status: 'Done',
      statusCategory: 'done',
      priority: 'Medium',
      assignee: { displayName: 'Fullstack Dev', accountId: 'mock-fs-001', avatarUrl: null },
    },
    {
      key: 'AC-112',
      summary: 'Configurar pipeline CI/CD en GitHub Actions',
      status: 'To Do',
      statusCategory: 'new',
      priority: 'Medium',
      assignee: { displayName: 'Fullstack Dev', accountId: 'mock-fs-001', avatarUrl: null },
    },
  ];

  return {
    sprint: {
      id: 'mock-sprint-1',
      name: 'Sprint 1 - Squad Canales y Operaciones',
      state: 'active',
    },
    issues: mockIssues,
    _mock: true,
  };
};

// ─── Funciones públicas del servicio ─────────────────────────────────────────

/**
 * Obtiene las HUs del sprint activo.
 * Usa cache si está vigente; si no hay credenciales Jira, devuelve mock.
 */
const getActiveSprintIssues = async () => {
  if (isCacheValid()) {
    console.log('[JiraService] Sirviendo desde cache');
    return cache;
  }

  if (!isJiraConfigured()) {
    console.log('[JiraService] Sin credenciales Jira — usando datos mock');
    const mockData = getMockData();
    cache = mockData;
    cacheTimestamp = Date.now();
    return mockData;
  }

  try {
    const client = buildAxiosInstance();
    const boardId = await getBoardId(client);
    const sprint = await getActiveSprint(client, boardId);
    const rawIssues = await getIssuesFromSprint(client, sprint.id);

    const result = {
      sprint: {
        id: String(sprint.id),
        name: sprint.name,
        state: sprint.state,
      },
      issues: rawIssues.map(normalizeIssue),
    };

    cache = result;
    cacheTimestamp = Date.now();
    console.log(`[JiraService] ${result.issues.length} issues cargadas desde Jira`);
    return result;
  } catch (err) {
    console.error('[JiraService] Error al conectar con Jira:', err.message);
    throw new Error(`Error al obtener datos de Jira: ${err.message}`);
  }
};

/**
 * Calcula estadísticas del sprint activo.
 */
const getSprintStats = async () => {
  const data = await getActiveSprintIssues();
  const issues = data.issues;

  const total = issues.length;
  const done = issues.filter(
    (i) => i.statusCategory === 'done' || i.status.toLowerCase() === 'done'
  ).length;
  const inProgress = issues.filter(
    (i) =>
      i.statusCategory === 'indeterminate' ||
      i.status.toLowerCase() === 'in progress'
  ).length;
  const toDo = total - done - inProgress;
  const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

  return {
    sprint: data.sprint,
    total,
    done,
    inProgress,
    toDo,
    percentage,
    _mock: data._mock || false,
  };
};

/**
 * Construye las cards de miembros del squad con sus HUs.
 */
const getSprintMembers = async () => {
  const data = await getActiveSprintIssues();
  const issues = data.issues;

  // Definición estática del squad
  const squadDefinition = [
    {
      id: 'tech-lead',
      name: 'Tech Lead',
      role: 'Tech Lead',
      specialties: ['Angular', 'Node.js', 'Java Spring Boot', 'Arquitectura'],
    },
    {
      id: 'backend-dev',
      name: 'Backend Dev',
      role: 'Backend Developer',
      specialties: ['Java Spring Boot', 'Node.js', 'Express', 'MySQL', 'PostgreSQL'],
    },
    {
      id: 'frontend-dev',
      name: 'Frontend Dev',
      role: 'Frontend Developer',
      specialties: ['Angular 17+', 'TypeScript', 'PrimeNG', 'SCSS', 'RxJS'],
    },
    {
      id: 'fullstack-dev',
      name: 'Fullstack Dev',
      role: 'Fullstack Developer',
      specialties: ['Angular', 'Node.js', 'Java Spring Boot', 'MongoDB'],
    },
  ];

  const members = squadDefinition.map((member) => {
    // Buscar issues asignadas a este miembro por displayName
    const memberIssues = issues.filter(
      (issue) =>
        issue.assignee &&
        issue.assignee.displayName.toLowerCase().includes(member.name.toLowerCase())
    );

    const doneCount = memberIssues.filter(
      (i) => i.statusCategory === 'done' || i.status.toLowerCase() === 'done'
    ).length;

    const progress =
      memberIssues.length > 0
        ? Math.round((doneCount / memberIssues.length) * 100)
        : 0;

    const currentIssue =
      memberIssues.find(
        (i) =>
          i.statusCategory === 'indeterminate' ||
          i.status.toLowerCase() === 'in progress'
      ) || null;

    return {
      ...member,
      currentIssue: currentIssue
        ? { key: currentIssue.key, summary: currentIssue.summary, status: currentIssue.status }
        : null,
      allIssues: memberIssues.map((i) => ({
        key: i.key,
        summary: i.summary,
        status: i.status,
        priority: i.priority,
      })),
      progress,
    };
  });

  return {
    sprint: data.sprint,
    members,
    _mock: data._mock || false,
  };
};

module.exports = {
  getActiveSprintIssues,
  getSprintStats,
  getSprintMembers,
  invalidateCache,
};
