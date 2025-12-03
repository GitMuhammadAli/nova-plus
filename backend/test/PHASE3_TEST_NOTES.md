# Phase 3 Test Notes

## Test Status

The test files are created but require proper authentication setup to run fully. Currently:

### Issues Fixed:
1. ✅ Import path issues resolved (all `src/` imports changed to relative paths)
2. ✅ Test data cleanup added to prevent duplicate key errors
3. ✅ SuperTest import fixed

### Remaining Issues:
1. ⚠️ Authentication tokens are placeholders - tests need actual JWT tokens
2. ⚠️ Password hashing - test users need properly hashed passwords for login

## How to Run Tests Properly

### Option 1: Mock Authentication (Recommended for Unit Tests)
Modify tests to bypass authentication or use test guards that don't require real tokens.

### Option 2: Real Authentication (Recommended for E2E Tests)
1. Hash passwords properly in `beforeAll`:
```typescript
import * as bcrypt from 'bcrypt';
const hashedPassword = await bcrypt.hash('testpassword', 10);
```

2. Login and get real tokens:
```typescript
const loginResponse = await request(app.getHttpServer())
  .post('/api/v1/auth/login')
  .send({
    email: 'manager@test.com',
    password: 'testpassword',
  });
managerToken = loginResponse.body.data?.accessToken || loginResponse.body.token;
```

### Option 3: Generate JWT Directly
Use JwtService to generate tokens directly in tests:
```typescript
const jwtService = app.get(JwtService);
managerToken = jwtService.sign({
  sub: managerId,
  email: 'manager@test.com',
  role: UserRole.MANAGER,
  companyId: companyId,
});
```

## Test Structure

All tests follow this pattern:
1. `beforeAll`: Setup test data (company, users, departments, projects, tasks)
2. Test cases: Test each endpoint
3. `afterAll`: Cleanup test data

## Manual Testing

Since automated tests require authentication setup, use Postman or Thunder Client to test:

1. **Manager Endpoints**:
   - Login as manager → Get token
   - Test all `/api/v1/manager/*` endpoints

2. **User Endpoints**:
   - Login as user → Get token
   - Test all `/api/v1/user/*` endpoints

3. **Security Tests**:
   - Try accessing manager endpoints as user (should fail)
   - Try accessing other user's tasks (should fail)

## Next Steps

1. Set up proper authentication in tests
2. Add test database isolation (separate test DB)
3. Add test data factories for easier setup
4. Add integration with CI/CD pipeline

