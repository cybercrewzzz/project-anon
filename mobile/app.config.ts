import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Project Anon',
  slug: 'project-anon',
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package:
      process.env.BUILD_TYPE === 'development' ?
        'com.cybercrewz.projectanon.development'
      : process.env.BUILD_TYPE === 'preview' ?
        'com.cybercrewz.projectanon.preview'
      : 'com.cybercrewz.projectanon',
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: {
          backgroundColor: '#000000',
        },
      },
    ],
    [
      'expo-font',
      {
        android: {
          fonts: [
            {
              fontFamily: 'Poppins',
              fontDefinitions: [
                {
                  path: './assets/fonts/Poppins-Regular.ttf',
                  weight: 400,
                },
                {
                  path: './assets/fonts/Poppins-Medium.ttf',
                  weight: 500,
                },
                {
                  path: './assets/fonts/Poppins-SemiBold.ttf',
                  weight: 600,
                },
                {
                  path: './assets/fonts/Poppins-Italic.ttf',
                  weight: 400,
                  style: 'italic',
                },
                {
                  path: './assets/fonts/Poppins-MediumItalic.ttf',
                  weight: 500,
                  style: 'italic',
                },
                {
                  path: './assets/fonts/Poppins-SemiBoldItalic.ttf',
                  weight: 600,
                  style: 'italic',
                },
              ],
            },
          ],
        },
      },
    ],
    'expo-web-browser',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: 'e679d9bd-f8f0-42f5-a927-a2af93914373',
    },
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    url: 'https://u.expo.dev/e679d9bd-f8f0-42f5-a927-a2af93914373',
  },
});
