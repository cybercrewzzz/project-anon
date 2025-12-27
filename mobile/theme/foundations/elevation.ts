import { Platform } from 'react-native';

const ios = {
  level0: {},
  level1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  level2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  level3: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
};

const android = {
  level0: { elevation: 0 },
  level1: { elevation: 1 },
  level2: { elevation: 3 }, // "enhanced Shadow used in figma"
  level3: { elevation: 6 },
};

export const elevation =
  Platform.OS === 'ios' ? ios : android;
