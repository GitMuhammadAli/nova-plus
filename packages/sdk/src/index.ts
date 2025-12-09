import axios, { AxiosInstance } from 'axios';

export interface NovaPulseConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  assignedTo?: string;
  projectId?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  projectId?: string;
  dueDate?: string;
}

export interface WebhookEvent {
  event: string;
  data: any;
  timestamp: string;
  webhookId: string;
}

export class NovaPulseSDK {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(config: NovaPulseConfig) {
    this.apiKey = config.apiKey;
    this.client = axios.create({
      baseURL: config.baseUrl || 'http://localhost:5500/api/v1',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Initialize the SDK
   */
  static init(config: NovaPulseConfig): NovaPulseSDK {
    return new NovaPulseSDK(config);
  }

  /**
   * Create a new task
   */
  async createTask(task: CreateTaskDto): Promise<Task> {
    const response = await this.client.post('/tasks', task);
    return response.data.data || response.data;
  }

  /**
   * Get tasks
   */
  async getTasks(params?: {
    status?: string;
    projectId?: string;
    assignedTo?: string;
    limit?: number;
    page?: number;
  }): Promise<{ tasks: Task[]; total: number; page: number; limit: number }> {
    const response = await this.client.get('/tasks', { params });
    const data = response.data.data || response.data;
    return {
      tasks: Array.isArray(data) ? data : data?.tasks || [],
      total: data?.total || data?.length || 0,
      page: data?.page || 1,
      limit: data?.limit || 50,
    };
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: string): Promise<Task> {
    const response = await this.client.get(`/tasks/${id}`);
    return response.data.data || response.data;
  }

  /**
   * Update task
   */
  async updateTask(id: string, updates: Partial<CreateTaskDto>): Promise<Task> {
    const response = await this.client.patch(`/tasks/${id}`, updates);
    return response.data.data || response.data;
  }

  /**
   * Delete task
   */
  async deleteTask(id: string): Promise<void> {
    await this.client.delete(`/tasks/${id}`);
  }

  /**
   * Subscribe to webhook events
   * Note: This is a helper method. You need to set up webhooks via the API or dashboard.
   */
  subscribeToEvents(handler: (event: WebhookEvent) => void): void {
    // In a real implementation, this would set up a webhook listener
    // For now, this is a placeholder that shows the expected interface
    console.warn('Webhook subscription requires setting up webhooks via the API. Use the webhooks API to create subscriptions.');
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = `sha256=${hmac.digest('hex')}`;
    return signature === expectedSignature;
  }
}

export default NovaPulseSDK;

