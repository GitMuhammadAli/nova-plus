import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types/user';

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      logout: () => set({ 
        user: null, 
        isAuthenticated: false 
      }),
      
      hasRole: (role) => {
        const { user } = get();
        if (!user) return false;
        
        const userRole = user.role as UserRole;
        const roles = Array.isArray(role) ? role : [role];
        
        return roles.includes(userRole);
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

