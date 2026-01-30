import { useUserStore } from '@/zustand-stores/userStore';
import { authAPI } from '@/app/services';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export function useAuth() {
  const { user, isAuthenticated, setUser, logout: logoutStore, isLoading, setLoading } = useUserStore();
  const router = useRouter();
  const { toast } = useToast();

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authAPI.login({ email, password });
      const userData = response.data?.user || response.data;
      setUser(userData);
      router.push('/dashboard');
      return userData;
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.response?.data?.message || 'Invalid credentials',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { email: string; password: string; name: string; role?: string }) => {
    try {
      setLoading(true);
      const response = await authAPI.register(data);
      const userData = response.data?.user || response.data;
      setUser(userData);
      router.push('/dashboard');
      return userData;
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.response?.data?.message || 'Registration failed',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Continue with logout even if API fails
    } finally {
      logoutStore();
      router.push('/login');
    }
  };

  const checkAuth = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getCurrentUser();
      const userData = response.data;
      setUser(userData);
      return userData;
    } catch (error) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
  };
}

