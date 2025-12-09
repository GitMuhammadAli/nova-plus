#!/usr/bin/env node

import { Command } from 'commander';
import axios from 'axios';
import inquirer from 'inquirer';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const program = new Command();
const CONFIG_FILE = path.join(os.homedir(), '.novapulse', 'config.json');

interface Config {
  apiKey?: string;
  baseUrl?: string;
}

function loadConfig(): Config {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (error) {
    // Ignore
  }
  return {};
}

function saveConfig(config: Config): void {
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function getApiClient() {
  const config = loadConfig();
  if (!config.apiKey) {
    console.error(chalk.red('Error: Not logged in. Run "novapulse login" first.'));
    process.exit(1);
  }

  return axios.create({
    baseURL: config.baseUrl || 'http://localhost:5500/api/v1',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
  });
}

program
  .name('novapulse')
  .description('NovaPulse CLI tool')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize NovaPulse in the current directory')
  .action(async () => {
    console.log(chalk.blue('Initializing NovaPulse...'));
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'baseUrl',
        message: 'API Base URL:',
        default: 'http://localhost:5500/api/v1',
      },
    ]);

    const config = {
      baseUrl: answers.baseUrl,
    };

    saveConfig(config);
    console.log(chalk.green('✓ NovaPulse initialized!'));
    console.log(chalk.yellow('Run "novapulse login" to authenticate.'));
  });

program
  .command('login')
  .description('Login to NovaPulse')
  .option('-k, --api-key <key>', 'API key')
  .action(async (options) => {
    let apiKey = options.apiKey;

    if (!apiKey) {
      const answers = await inquirer.prompt([
        {
          type: 'password',
          name: 'apiKey',
          message: 'Enter your API key:',
        },
      ]);
      apiKey = answers.apiKey;
    }

    const config = loadConfig();
    config.apiKey = apiKey;
    saveConfig(config);

    // Test the API key
    try {
      const client = getApiClient();
      await client.get('/auth/me');
      console.log(chalk.green('✓ Login successful!'));
    } catch (error: any) {
      console.error(chalk.red('✗ Login failed:'), error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

program
  .command('task:create')
  .description('Create a new task')
  .requiredOption('-t, --title <title>', 'Task title')
  .option('-d, --description <description>', 'Task description')
  .option('-s, --status <status>', 'Task status', 'todo')
  .option('-p, --priority <priority>', 'Task priority')
  .action(async (options) => {
    try {
      const client = getApiClient();
      const response = await client.post('/tasks', {
        title: options.title,
        description: options.description,
        status: options.status,
        priority: options.priority,
      });

      const task = response.data.data || response.data;
      console.log(chalk.green('✓ Task created successfully!'));
      console.log(chalk.blue('Task ID:'), task._id);
      console.log(chalk.blue('Title:'), task.title);
    } catch (error: any) {
      console.error(chalk.red('✗ Failed to create task:'), error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

program
  .command('task:list')
  .description('List tasks')
  .option('-s, --status <status>', 'Filter by status')
  .option('-l, --limit <limit>', 'Limit results', '10')
  .action(async (options) => {
    try {
      const client = getApiClient();
      const response = await client.get('/tasks', {
        params: {
          status: options.status,
          limit: parseInt(options.limit),
        },
      });

      const data = response.data.data || response.data;
      const tasks = Array.isArray(data) ? data : data?.tasks || [];

      if (tasks.length === 0) {
        console.log(chalk.yellow('No tasks found.'));
        return;
      }

      console.log(chalk.blue(`\nFound ${tasks.length} task(s):\n`));
      tasks.forEach((task: any) => {
        console.log(chalk.bold(task.title));
        console.log(`  ID: ${task._id}`);
        console.log(`  Status: ${task.status}`);
        if (task.priority) console.log(`  Priority: ${task.priority}`);
        console.log('');
      });
    } catch (error: any) {
      console.error(chalk.red('✗ Failed to list tasks:'), error.response?.data?.message || error.message);
      process.exit(1);
    }
  });

program.parse();

