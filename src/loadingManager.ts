import * as THREE from 'three';
import { runtimeFlags } from './model/runtimeFlags';

export function hideLoader(reason: string = 'unknown') {
  const screen = document.getElementById('loading-screen');
  if (!screen) return;

  if (runtimeFlags.isDev) {
    console.log('[Loader] hideLoader:', reason);
  }
  screen.classList.add('fade-out');
  screen.addEventListener('transitionend', () => screen.remove(), { once: true });
}

let managerDone = false;
let firstFrameDone = false;

function maybeHide(reason: string) {
  if (managerDone && firstFrameDone) {
    hideLoader(reason);
  }
}

export const loadingManager = new THREE.LoadingManager();

loadingManager.onStart = (url, loaded, total) => {
  if (runtimeFlags.isDev) {
    console.log('[Loader] start', { url, loaded, total });
  }
};

loadingManager.onProgress = (url, loaded, total) => {
  if (runtimeFlags.isDev) {
    console.log('[Loader] progress', { url, loaded, total });
  }
};

loadingManager.onError = (url) => {
  if (runtimeFlags.isDev) {
    console.warn('[Loader] error', url);
  }
  // Don't get stuck forever if a file 404s.
  hideLoader('onError');
};

loadingManager.onLoad = () => {
  if (runtimeFlags.isDev) {
    console.log('[Loader] onLoad (all managed items finished)');
  }
  managerDone = true;
  maybeHide('onLoad+first-frame');
};

// Safety: if nothing is tracked by the manager, you would otherwise stay stuck.
setTimeout(() => hideLoader('timeout-fallback'), 12000);

export function markFirstFrameRendered() {
  if (firstFrameDone) return;
  firstFrameDone = true;
  maybeHide('first-frame');
}
