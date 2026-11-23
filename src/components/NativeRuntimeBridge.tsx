import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { useLocation, useNavigate } from 'react-router-dom';
import { isNativeRuntime } from '../platform/runtime';

export function NativeRuntimeBridge() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isNativeRuntime()) return;
    let handles: PluginListenerHandle[] = [];
    let active = true;

    Promise.all([
      CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack || location.pathname !== '/') navigate(-1);
        else void CapacitorApp.exitApp();
      }),
      Keyboard.addListener('keyboardWillShow', () => document.documentElement.setAttribute('data-keyboard-open', 'true')),
      Keyboard.addListener('keyboardWillHide', () => document.documentElement.removeAttribute('data-keyboard-open')),
    ]).then((created) => {
      if (active) handles = created;
      else created.forEach((handle) => void handle.remove());
    });

    return () => {
      active = false;
      handles.forEach((handle) => void handle.remove());
      document.documentElement.removeAttribute('data-keyboard-open');
    };
  }, [location.pathname, navigate]);

  return null;
}
