import { create } from 'zustand';

interface Company {
  _id: string;
  name: string;
  email?: string;
  logo?: string;
  settings?: Record<string, any>;
}

interface CompanyState {
  company: Company | null;
  departments: any[];
  teams: any[];
  setCompany: (company: Company | null) => void;
  setDepartments: (departments: any[]) => void;
  setTeams: (teams: any[]) => void;
}

export const useCompanyStore = create<CompanyState>((set) => ({
  company: null,
  departments: [],
  teams: [],
  
  setCompany: (company) => set({ company }),
  setDepartments: (departments) => set({ departments }),
  setTeams: (teams) => set({ teams }),
}));

