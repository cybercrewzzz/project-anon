import { Stack } from 'expo-router';

const VolunteerLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: true, headerTitleAlign: 'center' }}>
      <Stack.Screen
        name="editVolunteerProfile"
        options={{
          headerShown: true,
          title: 'Volunteer Connect',
        }}
      />
    </Stack>
  );
};

export default VolunteerLayout;
