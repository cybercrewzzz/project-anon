import { AppText } from '@/components/AppText';
import { Animated, Pressable, View, Text, useWindowDimensions } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Background } from '@react-navigation/elements';
import { LinearGradient } from 'expo-linear-gradient';
import { purple } from '@/theme/palettes/purple';