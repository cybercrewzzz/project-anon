import { create } from 'zustand';

type Role = 'user' | 'volunteer';

interface RoleState {
  role: Role;
  setRole: (newRole: Role) => void;
}

const parseRole = (value?: string): Role =>
  value === 'volunteer' ? 'volunteer' : 'user';

export const useRole = create<RoleState>()(set => ({
  role: parseRole(process.env.EXPO_PUBLIC_ROLE),
  setRole: newRole => set({ role: newRole }),
}));
