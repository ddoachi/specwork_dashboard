// Mock data for development and testing
import { DashboardStats, EpicProgress, RecentActivity, SpecHierarchy } from './types';

export const mockDashboardStats: DashboardStats = {
  summary: {
    epics: 12,
    features: 45,
    tasks: 120,
    completed: 32,
    inProgress: 28,
    blocked: 5,
  },
  progressByEpic: {
    'E01': { total: 24, completed: 12, percentage: 50, title: 'Foundation & Infrastructure' },
    'E02': { total: 18, completed: 3, percentage: 16.7, title: 'Core Platform Services' },
    'E03': { total: 15, completed: 8, percentage: 53.3, title: 'User Interface & Experience' },
    'E04': { total: 12, completed: 6, percentage: 50, title: 'Integration & APIs' },
    'E05': { total: 20, completed: 2, percentage: 10, title: 'Security & Compliance' },
  },
};

export const mockEpicProgress: EpicProgress[] = [
  {
    epicId: 'E01',
    title: 'Foundation & Infrastructure',
    progress: 50,
    tasks: { completed: 12, total: 24 },
    status: 'in_progress',
  },
  {
    epicId: 'E02', 
    title: 'Core Platform Services',
    progress: 16.7,
    tasks: { completed: 3, total: 18 },
    status: 'in_progress',
  },
  {
    epicId: 'E03',
    title: 'User Interface & Experience', 
    progress: 53.3,
    tasks: { completed: 8, total: 15 },
    status: 'in_progress',
  },
  {
    epicId: 'E04',
    title: 'Integration & APIs',
    progress: 50,
    tasks: { completed: 6, total: 12 },
    status: 'in_progress',
  },
  {
    epicId: 'E05',
    title: 'Security & Compliance',
    progress: 10,
    tasks: { completed: 2, total: 20 },
    status: 'not_started',
  },
];

export const mockRecentActivity: RecentActivity[] = [
  {
    id: '1',
    specId: 'T025',
    specTitle: 'Database Mount Configuration',
    action: 'completed',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min ago
  },
  {
    id: '2', 
    specId: 'F03',
    specTitle: 'Authentication Service',
    action: 'updated',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: '3',
    specId: 'T041',
    specTitle: 'API Rate Limiting',
    action: 'blocked',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
  },
  {
    id: '4',
    specId: 'E06',
    specTitle: 'Monitoring & Observability',
    action: 'created',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
];

export const mockSpecTree: SpecHierarchy[] = [
  {
    id: 'E01',
    title: 'Foundation & Infrastructure',
    type: 'epic',
    status: 'in_progress',
    progress: 50,
    children: [
      {
        id: 'F01',
        title: 'Storage Infrastructure',
        type: 'feature', 
        status: 'in_progress',
        progress: 66,
        children: [
          {
            id: 'T01',
            title: 'Hot Storage Configuration',
            type: 'task',
            status: 'completed',
            progress: 100,
          },
          {
            id: 'T02', 
            title: 'Database Mount Setup',
            type: 'task',
            status: 'completed',
            progress: 100,
          },
          {
            id: 'T03',
            title: 'Cold Storage Integration',
            type: 'task',
            status: 'in_progress',
            progress: 30,
          },
        ],
      },
      {
        id: 'F02',
        title: 'Network Architecture',
        type: 'feature',
        status: 'not_started',
        progress: 0,
        children: [
          {
            id: 'T04',
            title: 'Load Balancer Configuration',
            type: 'task', 
            status: 'not_started',
            progress: 0,
          },
          {
            id: 'T05',
            title: 'SSL Certificate Management',
            type: 'task',
            status: 'not_started',
            progress: 0,
          },
        ],
      },
    ],
  },
  {
    id: 'E02',
    title: 'Core Platform Services',
    type: 'epic',
    status: 'in_progress', 
    progress: 16.7,
    children: [
      {
        id: 'F03',
        title: 'Authentication Service',
        type: 'feature',
        status: 'in_progress',
        progress: 40,
        children: [
          {
            id: 'T06',
            title: 'User Registration API',
            type: 'task',
            status: 'completed',
            progress: 100,
          },
          {
            id: 'T07',
            title: 'JWT Token Management',
            type: 'task',
            status: 'in_progress',
            progress: 75,
          },
          {
            id: 'T08',
            title: 'Password Reset Flow',
            type: 'task',
            status: 'not_started',
            progress: 0,
          },
        ],
      },
    ],
  },
];

// Helper function to use mock data when backend is not available
export function shouldUseMockData(): boolean {
  return process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
}