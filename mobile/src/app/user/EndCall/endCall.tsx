import React from 'react';
import { View, Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from '@/components/AppText';

export default function EndCallConfirmScreen() {
  return (
    <View style={styles.container}>
      
      {/* Dark overlay */}
      <View style={styles.overlay} />

      {/* Bottom Modal */}
      <View style={styles.modalContainer}>
        
        <View style={styles.handle} />

        <AppText
          style={styles.title}
          textAlign="center"
        >
          Are you sure you want to end the call?
        </AppText>

        <View style={styles.divider} />

        <View style={styles.buttonRow}>
          
          <Pressable style={styles.button}>
            <AppText style={styles.buttonText}>Yes</AppText>
          </Pressable>

          <Pressable style={styles.button}>
            <AppText style={styles.buttonText}>No</AppText>
          </Pressable>

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.background.default,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  modalContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    alignItems: 'center',
    gap: 20,
  },

  handle: {
    width: 50,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CFCFCF',
    marginBottom: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
  },

  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E5E5E5',
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 30,
    marginTop: 10,
  },

  button: {
    backgroundColor: '#6A00F4',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}));