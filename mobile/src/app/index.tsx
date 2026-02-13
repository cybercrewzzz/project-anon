import React from 'react';
import { Redirect } from 'expo-router';
import { useRole } from '@/store/useRole';

const Index = () => {
  const role = useRole(state => state.role);
  //if (role === 'user') return <Redirect href="/user/home" />;
  if (role === 'user') return <Redirect href='/StartedScreens/selectLanguage'/>;
  if (role === 'volunteer') return <Redirect href="/volunteer/home" />;
  if (!role) {
    console.log(
      'Add EXPO_PUBLIC_ROLE=user or EXPO_PUBLIC_ROLE=volunteer to mobile/.env file',
    );
  }
};

export default Index;
