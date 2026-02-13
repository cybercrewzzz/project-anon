import React from 'react';
import { Redirect } from 'expo-router';

const Index = () => {
  const role = process.env.EXPO_PUBLIC_ROLE;
  if (role === 'user') return <Redirect href="/user/home" />;
  if (role === 'volunteer') return <Redirect href="/volunteer/home" />;
  if (!role) {
    console.log(
      'Add EXPO_PUBLIC_ROLE=user or EXPO_PUBLIC_ROLE=volunteer to env file',
    );
  }
};

export default Index;
