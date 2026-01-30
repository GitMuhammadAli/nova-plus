export type UserRole = 'admin' | 'moderator' | 'user';
export type UserStatus = 'active' | 'inactive' | 'pending';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  department: string;
  location: string;
  joinedAt: string;
  lastActive: string;
  sessions: number;
}

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    email: 'sarah.chen@company.com',
    role: 'admin',
    status: 'active',
    department: 'Engineering',
    location: 'San Francisco, CA',
    joinedAt: '2023-01-15',
    lastActive: '2024-01-20 14:30',
    sessions: 247,
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    email: 'marcus.j@company.com',
    role: 'moderator',
    status: 'active',
    department: 'Product',
    location: 'New York, NY',
    joinedAt: '2023-03-22',
    lastActive: '2024-01-20 12:15',
    sessions: 182,
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.r@company.com',
    role: 'user',
    status: 'active',
    department: 'Marketing',
    location: 'Austin, TX',
    joinedAt: '2023-06-10',
    lastActive: '2024-01-19 16:45',
    sessions: 156,
  },
  {
    id: '4',
    name: 'David Kim',
    email: 'david.kim@company.com',
    role: 'user',
    status: 'inactive',
    department: 'Sales',
    location: 'Chicago, IL',
    joinedAt: '2023-08-05',
    lastActive: '2024-01-10 09:20',
    sessions: 89,
  },
  {
    id: '5',
    name: 'Priya Patel',
    email: 'priya.p@company.com',
    role: 'moderator',
    status: 'active',
    department: 'Engineering',
    location: 'Seattle, WA',
    joinedAt: '2023-04-18',
    lastActive: '2024-01-20 11:00',
    sessions: 203,
  },
  {
    id: '6',
    name: 'Alex Thompson',
    email: 'alex.t@company.com',
    role: 'user',
    status: 'pending',
    department: 'Design',
    location: 'Portland, OR',
    joinedAt: '2024-01-18',
    lastActive: '2024-01-18 10:30',
    sessions: 3,
  },
];
