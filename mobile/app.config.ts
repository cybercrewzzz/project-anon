import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const appEnv = process.env.APP_ENV;

  return {
    ...config,
    name:
      appEnv === 'development' ? 'Anora (Dev)'
      : appEnv === 'preview' ? 'Anora (Preview)'
      : 'Anora',
    slug: 'project-anon',
    scheme:
      appEnv === 'development' ? 'anora-app-dev'
      : appEnv === 'preview' ? 'anora-app-preview'
      : 'anora-app',
    ios: {
      supportsTablet: true,
    },
    android: {
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package:
        appEnv === 'development' ? 'com.cybercrewz.projectanon.development'
        : appEnv === 'preview' ? 'com.cybercrewz.projectanon.preview'
        : 'com.cybercrewz.projectanon',
      softwareKeyboardLayoutMode: 'pan',
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
        },
      ],
      [
        'expo-font',
        {
          android: {
            fonts: [
              {
                fontFamily: 'Inter 18pt',
                fontDefinitions: [
                  {
                    path: './assets/fonts/Inter_18pt-Regular.ttf',
                    weight: 400,
                  },
                  {
                    path: './assets/fonts/Inter_18pt-SemiBold.ttf',
                    weight: 600,
                  },
                ],
              },
              {
                fontFamily: 'Inter 24pt',
                fontDefinitions: [
                  {
                    path: './assets/fonts/Inter_24pt-Regular.ttf',
                    weight: 400,
                  },
                  {
                    path: './assets/fonts/Inter_24pt-SemiBold.ttf',
                    weight: 600,
                  },
                  {
                    path: './assets/fonts/Inter_24pt-Bold.ttf',
                    weight: 700,
                  },
                ],
              },
              {
                fontFamily: 'Inter 28pt',
                fontDefinitions: [
                  {
                    path: './assets/fonts/Inter_28pt-Regular.ttf',
                    weight: 400,
                  },
                  {
                    path: './assets/fonts/Inter_28pt-Bold.ttf',
                    weight: 700,
                  },
                ],
              },
            ],
          },
        },
      ],
      'expo-web-browser',
      'expo-secure-store',
      'expo-sqlite',
      'expo-asset',
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
  };
};
