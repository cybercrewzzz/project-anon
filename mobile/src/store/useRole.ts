import { create } from 'zustand';

type Role = 'user' | 'volunteer' | undefined;

interface RoleState {
  role: Role;
  setRole: (newRole: Role) => void;
}

const parseRole = (value?: string): Role =>
  value === 'volunteer' ? 'volunteer'
  : value === 'user' ? 'user'
  : undefined;

export const useRole = create<RoleState>()(set => ({
  role: parseRole(process.env.EXPO_PUBLIC_ROLE),
  setRole: newRole => set({ role: newRole }),
}));
