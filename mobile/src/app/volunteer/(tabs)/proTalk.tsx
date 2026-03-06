import { View, Text, Button, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProTalk = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>ProTalk</Text>
        <Button
          title="To the OTPVerification"
          onPress={() => router.push('/volunteer/authScreens/OTPVerification')}
        />
        <Button
          title="To Enter Email"
          onPress={() => router.push('/volunteer/authScreens/enterEmail')}
        />
        <Button
          title="To Login Successful"
          onPress={() =>
            router.push('/volunteer/loginSuccessful/LoginSuccessful')
          }
        />
        <Button
          title="To Sign Up and Login"
          onPress={() =>
            router.navigate('/volunteer/signUpNlogin/SignUpNLogin')
          }
        />
        <Button
          title="P2P AND"
          onPress={() => router.navigate('/volunteer/P2p-And/p2p-and')}
        />
      </View>
    </SafeAreaView>
  );
};

export default ProTalk;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'center',
  },
});
