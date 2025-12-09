# NovaPulse SDK

Official Node.js SDK for NovaPulse API.

## Installation

```bash
npm install @novapulse/sdk
```

## Usage

```typescript
import NovaPulseSDK from '@novapulse/sdk';

// Initialize
const sdk = NovaPulseSDK.init({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.novapulse.com/api/v1', // Optional
});

// Create a task
const task = await sdk.createTask({
  title: 'New Task',
  description: 'Task description',
  status: 'todo',
  priority: 'high',
});

// Get tasks
const { tasks } = await sdk.getTasks({
  status: 'todo',
  limit: 10,
});

// Update task
await sdk.updateTask(task._id, {
  status: 'in_progress',
});

// Delete task
await sdk.deleteTask(task._id);
```

## Webhook Verification

```typescript
// Verify webhook signature
const isValid = sdk.verifyWebhookSignature(
  requestBody,
  signatureHeader,
  webhookSecret
);
```

