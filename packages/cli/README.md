# NovaPulse CLI

Command-line interface for NovaPulse.

## Installation

```bash
npm install -g novapulse-cli
```

## Usage

### Initialize

```bash
npx novapulse-cli init
```

### Login

```bash
npx novapulse-cli login
# Or with API key
npx novapulse-cli login --api-key YOUR_API_KEY
```

### Create Task

```bash
npx novapulse-cli task:create --title "My Task" --description "Task description" --status todo
```

### List Tasks

```bash
npx novapulse-cli task:list
npx novapulse-cli task:list --status in_progress --limit 20
```

## Commands

- `init` - Initialize NovaPulse in the current directory
- `login` - Login to NovaPulse
- `task:create` - Create a new task
- `task:list` - List tasks

