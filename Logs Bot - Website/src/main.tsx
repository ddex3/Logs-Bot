import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const preventImageCopy = () => {
  const preventContextMenu = (e: MouseEvent) => {
    const target = e.target;
    if (!target || !(target instanceof HTMLElement)) return;
    
    if (target.tagName === 'IMG' || target.tagName === 'SVG' || 
        (target.closest && (target.closest('svg') || target.closest('img'))) || 
        target.style.backgroundImage) {
      e.preventDefault();
      return false;
    }
  };

  const preventDragStart = (e: DragEvent) => {
    const target = e.target;
    if (!target || !(target instanceof HTMLElement)) return;
    
    if (target.tagName === 'IMG' || target.tagName === 'SVG' || 
        (target.closest && (target.closest('svg') || target.closest('img'))) || 
        target.style.backgroundImage) {
      e.preventDefault();
      return false;
    }
  };

  const preventSelectStart = (e: Event) => {
    const target = e.target;
    if (!target || !(target instanceof HTMLElement)) return;
    
    if (target.tagName === 'IMG' || target.tagName === 'SVG' || 
        (target.closest && (target.closest('svg') || target.closest('img'))) || 
        target.style.backgroundImage) {
      e.preventDefault();
      return false;
    }
  };

  const protectElement = (element: HTMLElement) => {
    if (element.tagName === 'IMG') {
      element.setAttribute('draggable', 'false');
      element.addEventListener('dragstart', (e) => e.preventDefault(), { passive: false });
      element.addEventListener('contextmenu', (e) => e.preventDefault(), { passive: false });
      element.style.userSelect = 'none';
      element.style.webkitUserSelect = 'none';
      element.style.webkitUserDrag = 'none';
    } else if (element.tagName === 'SVG' || element.closest('svg')) {
      element.addEventListener('dragstart', (e) => e.preventDefault(), { passive: false });
      element.addEventListener('contextmenu', (e) => e.preventDefault(), { passive: false });
      element.style.userSelect = 'none';
      element.style.webkitUserSelect = 'none';
      element.style.webkitUserDrag = 'none';
    }
  };

  document.addEventListener('contextmenu', preventContextMenu, { passive: false });
  document.addEventListener('dragstart', preventDragStart, { passive: false });
  document.addEventListener('selectstart', preventSelectStart, { passive: false });

  const images = document.querySelectorAll('img');
  images.forEach(protectElement);

  const svgs = document.querySelectorAll('svg');
  svgs.forEach(protectElement);

  const observer = new MutationObserver(() => {
    const newImages = document.querySelectorAll('img:not([draggable="false"])');
    newImages.forEach(protectElement);

    const newSvgs = document.querySelectorAll('svg');
    newSvgs.forEach(protectElement);
  });

  observer.observe(document.body, { childList: true, subtree: true });
};

preventImageCopy();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
