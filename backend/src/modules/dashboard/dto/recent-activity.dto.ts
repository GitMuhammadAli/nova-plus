export class RecentActivityDto {
  id: string;
  type: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  action: string;
  description?: string;
  target?: string;
  timestamp: string;
  icon?: string;
}
