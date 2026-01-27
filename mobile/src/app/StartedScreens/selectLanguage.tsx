import { AppText } from '@/components/AppText';
import React from 'react';
import { View, Image } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

const SelectLanguage = () => {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <Image
          source={require('mobile/assets/images/banners/startBanner.png')}
          style={{ width: 200, height: 200, marginBottom: 20 }}
          resizeMode="contain"
        />

        <AppText
          variant="sectionTitle"
          style={{ marginBottom: 10, marginLeft: 20, color:  }}
        >
          Choose your app language:
              </AppText>

        <AppText variant="body">You can change this anytime... </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create(theme =>({
  container: {
    flex: 1,
    paddingTop: 100,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
}));
export default SelectLanguage;
