import React from "react";
import { View, Text } from "react-native";
import { StyleSheet } from 'react-native-unistyles';

const SignupNLogin = () => {
  return (
    <View style={styles.container}>
      <Text>SignupNLogin</Text>
    </View>
  );
};

export default SignupNLogin;

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background.secondary,
    paddingTop: rt.insets.top,
    paddingBottom: rt.insets.bottom,
    paddingLeft: rt.insets.left + 16,
    paddingRight: rt.insets.right + 16,
  },
}));

