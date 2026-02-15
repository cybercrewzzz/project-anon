import { AppText } from '@/components/AppText';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { router } from 'expo-router';
import { purple } from '@/theme/palettes/purple';

export default function TnS() {
  return (
    <View style={styles.container}>
      <View style={{justifyContent: 'flex-start'}}>
        <AppText
          variant="largeTitle"
          color="primary"
          style={{ textAlign: 'center', paddingTop: 80, color: purple[600], fontSize: 26, fontWeight: "bold" }}
        >
          Terms & Conditions
        </AppText>
        </View>

        <Pressable style={{backgroundColor: purple[700], padding: 15, borderRadius: 25, width: 300, alignItems: "center", marginTop: 510}} onPress={() => router.push("/")}>
            <AppText style={{color: "#FFFFFF", fontSize: 16, fontWeight: "bold"}} >Agree & Continue</AppText>
        </Pressable>
    </View>
    );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: theme.background.default,
    marginTop: rt.insets.top,
    gap: 50,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}));