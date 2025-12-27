import * as THREE from 'three';

export function hideLoader(reason: string = 'unknown') {
  const screen = document.getElementById('loading-screen');
  if (!screen) return;

  console.log('[Loader] hideLoader:', reason);
  screen.classList.add('fade-out');
  screen.addEventListener('transitionend', () => screen.remove(), { once: true });
}

export const loadingManager = new THREE.LoadingManager();

loadingManager.onStart = (url, loaded, total) => {
  console.log('[Loader] start', { url, loaded, total });
};

loadingManager.onProgress = (url, loaded, total) => {
  console.log('[Loader] progress', { url, loaded, total });
};

loadingManager.onError = (url) => {
  console.warn('[Loader] error', url);
  // Don't get stuck forever if a file 404s.
  hideLoader('onError');
};

loadingManager.onLoad = () => {
  console.log('[Loader] onLoad (all managed items finished)');
  hideLoader('onLoad');
};

// Safety: if nothing is tracked by the manager, you would otherwise stay stuck.
setTimeout(() => hideLoader('timeout-fallback'), 12000);
