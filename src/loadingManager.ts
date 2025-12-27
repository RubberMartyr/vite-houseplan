import * as THREE from 'three';

export const loadingManager = new THREE.LoadingManager(() => {
  const screen = document.getElementById('loading-screen');
  if (!screen) return;

  screen.classList.add('fade-out');
  screen.addEventListener('transitionend', () => screen.remove(), { once: true });
});
