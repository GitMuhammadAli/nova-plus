# Phase 3 Testing Guide

## Quick Start

### Prerequisites
1. MongoDB running locally or connection string configured
2. Backend dependencies installed: `npm install`
3. Environment variables set in `.env`

### Run All Tests
```bash
cd backend
npm run test:e2e
```

## Manual Testing Checklist

### Manager Role Testing

#### Projects
- [ ] Login as Manager
- [ ] GET `/api/v1/manager/projects` - Should return department projects
- [ ] GET `/api/v1/manager/projects/:id` - Should return project with progress
- [ ] GET `/api/v1/manager/projects/:id/tasks` - Should return project tasks

#### Tasks
- [ ] POST `/api/v1/manager/tasks` - Create task for department user
- [ ] POST `/api/v1/manager/tasks` - Try to create task for user outside department (should fail)
- [ ] GET `/api/v1/manager/tasks` - List all department tasks
- [ ] GET `/api/v1/manager/tasks/:id` - Get task details
- [ ] PATCH `/api/v1/manager/tasks/:id` - Update task
- [ ] POST `/api/v1/manager/tasks/:id/assign` - Assign task to user
- [ ] POST `/api/v1/manager/tasks/:id/status` - Change task status
- [ ] POST `/api/v1/manager/tasks/:id/comment` - Add comment
- [ ] POST `/api/v1/manager/tasks/:id/attachment` - Add attachment
- [ ] DELETE `/api/v1/manager/tasks/:id` - Delete task

#### Team
- [ ] GET `/api/v1/manager/team` - View team members with stats
- [ ] GET `/api/v1/manager/team/:userId` - View team member details

#### Stats
- [ ] GET `/api/v1/manager/stats/overview` - Get overview stats
- [ ] GET `/api/v1/manager/stats/tasks` - Get task statistics
- [ ] GET `/api/v1/manager/stats/team` - Get team productivity stats

### User Role Testing

#### Tasks
- [ ] Login as User
- [ ] GET `/api/v1/user/tasks` - View assigned tasks
- [ ] GET `/api/v1/user/tasks/:id` - View task details
- [ ] PATCH `/api/v1/user/tasks/:id/status` - Update status: todo → in_progress (should work)
- [ ] PATCH `/api/v1/user/tasks/:id/status` - Update status: in_progress → review (should work)
- [ ] PATCH `/api/v1/user/tasks/:id/status` - Update status: review → done (should work)
- [ ] PATCH `/api/v1/user/tasks/:id/status` - Try todo → done (should fail)
- [ ] POST `/api/v1/user/tasks/:id/comment` - Add comment
- [ ] POST `/api/v1/user/tasks/:id/attachment` - Add attachment

#### Projects
- [ ] GET `/api/v1/user/projects` - View assigned projects
- [ ] GET `/api/v1/user/projects/:id` - View project details with my tasks

#### Stats
- [ ] GET `/api/v1/user/stats/overview` - Get overview stats
- [ ] GET `/api/v1/user/stats/productivity` - Get productivity stats

### Security Testing

#### Access Control
- [ ] User tries to access `/api/v1/manager/projects` (should return 403)
- [ ] User tries to access another user's task (should return 404)
- [ ] Manager tries to assign task to user outside department (should return 403)
- [ ] Manager tries to access task from another department (should return 403)

#### Data Isolation
- [ ] Manager from Company A cannot see Company B's data
- [ ] User from Department A cannot see Department B's data
- [ ] All queries properly filter by companyId and departmentId

## Postman Collection

Import the Postman collection for easy API testing:
- Collection includes all Phase 3 endpoints
- Pre-configured with example requests
- Includes test scripts for validation

## Test Data Setup

### Required Test Data
1. **Company**: Test company with ID
2. **Company Admin**: User with COMPANY_ADMIN role
3. **Manager**: User with MANAGER role, assigned to department
4. **Department**: Department with manager assigned
5. **User**: User with USER role, in manager's department
6. **Project**: Project assigned to user
7. **Task**: Task assigned to user

### Sample Test Data Script
```javascript
// Run this in MongoDB shell or via seed script
db.companies.insertOne({
  name: "Test Company",
  domain: "test.com",
  isActive: true
});

// Create users, departments, projects, tasks...
```

## Common Issues

### Issue: 403 Forbidden
- **Cause**: User doesn't have required role or department access
- **Solution**: Verify user role and department assignment

### Issue: 404 Not Found
- **Cause**: Resource doesn't exist or user doesn't have access
- **Solution**: Check resource ID and user permissions

### Issue: 400 Bad Request - Invalid Status Transition
- **Cause**: User trying to skip status steps
- **Solution**: Follow valid transitions: todo → in_progress → review → done

## Success Criteria

Phase 3 is complete when:
- ✅ All Manager endpoints work correctly
- ✅ All User endpoints work correctly
- ✅ Status transitions are enforced
- ✅ Department scoping works
- ✅ Security boundaries are enforced
- ✅ All tests pass
- ✅ Manual testing checklist completed

