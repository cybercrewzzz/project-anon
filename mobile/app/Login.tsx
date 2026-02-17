import { Link, router } from 'expo-router';
import { TextInput, Pressable, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default function Login() {
  return (
    <View style={{ flex: 1 }}>
      {/* Heading Section */}
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        <Text
          style={{
            color: '#000000',
            fontWeight: 'bold',
            fontSize: 34,
            paddingTop: 100,
          }}
        >
          Project Anon
        </Text>
        <Text
          style={{
            color: '#9500FF',
            fontWeight: 'bold',
            fontSize: 28,
            paddingTop: 30,
          }}
        >
          Sign In
        </Text>
      </View>

      {/* Input Section */}
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 20,
          paddingTop: 60,
        }}
      >
        <TextInput
          style={{
            backgroundColor: '#F6ECFF',
            padding: 15,
            borderRadius: 20,
            width: 300,
            fontSize: 16,
            borderWidth: 1,
            borderColor: '#E0E0E0',
            // iOS shadow
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            // Android shadow
            elevation: 3,
          }}
          placeholder="Email"
          placeholderTextColor="#783FCA"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={{
            backgroundColor: '#F6ECFF',
            padding: 15,
            borderRadius: 20,
            width: 300,
            fontSize: 16,
            borderWidth: 1,
            borderColor: '#E0E0E0',
            // iOS shadow
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            // Android shadow
            elevation: 3,
          }}
          placeholder="Password"
          placeholderTextColor="#783FCA"
          secureTextEntry={true}
        />
      </View>

      {/* Forgot Password Section */}
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: 10,
        }}
      >
        <View style={{ width: 300, alignItems: 'flex-start' }}>
          <Link style={{ color: '#9500FF', fontSize: 12 }} href="/">
            Forgot your password?
          </Link>
        </View>
      </View>

      {/* Button Section */}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: 40,
          paddingBottom: 20,
          gap: 20,
        }}
      >
        <Pressable
          style={{
            backgroundColor: '#783FCA',
            padding: 15,
            borderRadius: 25,
            width: 300,
            alignItems: 'center',
          }}
          onPress={() => router.push('/Login')}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }}>
            Sign In
          </Text>
        </Pressable>
        <Text style={{ color: '#783FCA', fontSize: 16, fontWeight: 'bold' }}>
          {' '}
          OR{' '}
        </Text>
      </View>

      {/* Social Media Sign In Section */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          width: 300,
          gap: 10,
          alignSelf: 'center',
        }}
      >
        <View style={{ flex: 1, height: 1, backgroundColor: '#783FCA' }} />
        <Text style={{ color: '#783FCA', fontSize: 14, fontWeight: 'bold' }}>
          Sign In Using
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: '#783FCA' }} />
      </View>

      {/*Social media icons*/}
      <View
        style={{
          flexDirection: 'row',
          gap: 20,
          marginTop: 20,
          justifyContent: 'center',
          paddingBottom: 40,
        }}
      >
        <Pressable
          style={{
            backgroundColor: '#000000',
            width: 60,
            height: 60,
            borderRadius: 30,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => {
            /* Apple sign in */
          }}
        >
          <FontAwesome name="apple" size={32} color="white" />
        </Pressable>

        <Pressable
          style={{
            backgroundColor: '#FFFFFF',
            width: 60,
            height: 60,
            borderRadius: 30,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#E0E0E0',
          }}
          onPress={() => {
            /* Google sign in */
          }}
        >
          <FontAwesome name="google" size={30} color="#DB4437" />
        </Pressable>

        <Pressable
          style={{
            backgroundColor: '#1877F2',
            width: 60,
            height: 60,
            borderRadius: 30,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => {
            /* Facebook sign in */
          }}
        >
          <FontAwesome name="facebook" size={30} color="white" />
        </Pressable>
      </View>

      {/* Need An Account Section */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'center',
          justifyContent: 'flex-start',
          paddingBottom: 100,
        }}
      >
        <Text style={{ color: '#783FCA', fontSize: 16 }}>
          Need An Account?{' '}
        </Text>
        <Link
          style={{ color: '#783FCA', fontSize: 16, fontWeight: 'bold' }}
          href="/"
        >
          Sign Up
        </Link>
      </View>
    </View>
  );
}
