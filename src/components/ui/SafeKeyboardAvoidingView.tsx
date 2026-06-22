import React from 'react';
import { KeyboardAvoidingView as RNKeyboardAvoidingView, KeyboardAvoidingViewProps, Platform } from 'react-native';
import { KeyboardAvoidingView as ControllerKeyboardAvoidingView } from 'react-native-keyboard-controller';

/**
 * A wrapper for KeyboardAvoidingView that safely falls back to React Native's 
 * standard implementation if the react-native-keyboard-controller native module 
 * is not linked (e.g., when running in Expo Go).
 */
import { KeyboardController } from 'react-native-keyboard-controller';

/**
 * A wrapper for KeyboardAvoidingView that safely falls back to React Native's 
 * standard implementation if the react-native-keyboard-controller native module 
 * is not linked (e.g., when running in Expo Go).
 */
export const SafeKeyboardAvoidingView = (props: any) => {
  // Check if the native module is actually linked
  const isLinked = !!KeyboardController && Platform.OS !== 'web';

  const { behavior, ...rest } = props;

  if (isLinked) {
    try {
      // The controller's KeyboardAvoidingView doesn't support 'position'.
      const controllerBehavior = (behavior === 'position') ? 'padding' : behavior;
      return <ControllerKeyboardAvoidingView behavior={controllerBehavior as any} {...rest} />;
    } catch (e) {
      // Fallback if something still goes wrong
    }
  }

  // Fallback for Expo Go or other unlinked environments.
  // 'translate-with-padding' is unique to the controller
  const safeBehavior = (behavior === 'translate-with-padding') ? 'padding' : behavior;
  
  return <RNKeyboardAvoidingView behavior={safeBehavior as any} {...rest} />;
};
