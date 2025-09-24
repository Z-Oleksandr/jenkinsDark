(function() {
  'use strict';
  
  const STORAGE_KEY = 'jenkins-dark-enabled'; // Define the missing constant
  
  function makeToggle() {
    // Check if toggle already exists to prevent duplicates
    if (document.getElementById('jenkins-dark-toggle-btn')) {
      return;
    }
    
    const wrap = document.createElement('div');
    wrap.id = 'jenkins-dark-toggle-wrap';
    wrap.style.position = 'fixed';
    wrap.style.bottom = '20px';
    wrap.style.left = '20px';
    wrap.style.zIndex = '9999';
    wrap.style.padding = '1.5px';
    wrap.style.borderRadius = '8px';
    wrap.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    wrap.style.boxShadow = '0 6px 18px rgba(0,0,0,0.5)';
    wrap.style.backdropFilter = 'blur(6px)';
   
    const btn = document.createElement('button');
    btn.id = 'jenkins-dark-toggle-btn';
    btn.textContent = 'Toggle Dark';
    btn.style.cursor = 'pointer';
    btn.style.border = 'none';
    btn.style.background = 'transparent';
    btn.style.color = 'inherit';
    btn.style.padding = '9.5px 18px';
    btn.style.borderRadius = '4px';
    btn.style.fontSize = '10px';
    btn.style.outline = 'none';
    btn.style.boxSizing = 'border-box';
   
    wrap.appendChild(btn);
    document.body.appendChild(wrap);
   
    btn.addEventListener('click', async () => {
      try {
        const val = await getEnabled();
        await setEnabled(!val);
        applyState(!val);
      } catch (error) {
        console.error('Error toggling dark mode:', error);
      }
    });
  }
 
  function applyState(enabled) {
    if (enabled) {
      document.documentElement.classList.add('jenkins-dark-material-enabled');
    } else {
      document.documentElement.classList.remove('jenkins-dark-material-enabled');
    }
  }
 
  function getEnabled() {
    return new Promise((resolve, reject) => {
      try {
        if (chrome.storage && chrome.storage.local) {
          chrome.storage.local.get([STORAGE_KEY], (result) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(result && result[STORAGE_KEY] !== false);
            }
          });
        } else {
          // Fallback for testing or when chrome.storage is unavailable
          resolve(true);
        }
      } catch (e) {
        reject(e);
      }
    });
  }
 
  function setEnabled(value) {
    return new Promise((resolve, reject) => {
      try {
        if (chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ [STORAGE_KEY]: value }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        } else {
          // Fallback for testing
          resolve();
        }
      } catch (e) {
        reject(e);
      }
    });
  }
 
  // Avoid inverting colored icons/logos: find images with svg or with known classes and add class to prevent inversion
  function fixImages() {
    const imgs = document.querySelectorAll('img');
    imgs.forEach(img => {
      // If image is likely a logo or contains transparency, do not invert
      const src = (img.currentSrc || img.src || '').toLowerCase();
      if (src.includes('logo') || 
          src.includes('jenkins') || 
          img.width < 16 || 
          img.height < 16 ||
          src.includes('icon')) {
        img.classList.add('jenkins-dark-no-invert');
      }
    });
    
    // Also handle SVG elements
    const svgs = document.querySelectorAll('svg');
    svgs.forEach(svg => {
      // Prevent inversion of SVG logos and icons
      if (svg.classList.contains('logo') || 
          svg.classList.contains('icon') ||
          svg.width?.baseVal?.value < 16 ||
          svg.height?.baseVal?.value < 16) {
        svg.classList.add('jenkins-dark-no-invert');
      }
    });
  }
 
  // Handle dynamically added content
  function observeChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Fix images in newly added content
              const imgs = node.querySelectorAll ? node.querySelectorAll('img') : [];
              const svgs = node.querySelectorAll ? node.querySelectorAll('svg') : [];
              
              [...imgs, ...svgs].forEach(element => {
                if (element.tagName === 'IMG') {
                  const src = (element.currentSrc || element.src || '').toLowerCase();
                  if (src.includes('logo') || src.includes('jenkins') || 
                      element.width < 16 || element.height < 16 || src.includes('icon')) {
                    element.classList.add('jenkins-dark-no-invert');
                  }
                } else if (element.tagName === 'SVG') {
                  if (element.classList.contains('logo') || element.classList.contains('icon') ||
                      element.width?.baseVal?.value < 16 || element.height?.baseVal?.value < 16) {
                    element.classList.add('jenkins-dark-no-invert');
                  }
                }
              });
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
 
  // Wait for DOM to be ready
  function waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  }
 
  // Bootstrap
  (async function init() {
    try {
      const enabled = await getEnabled();
      applyState(enabled);
      await waitForDOM();
      makeToggle();
      fixImages();
      observeChanges();
    } catch (error) {
      console.error('Error initializing dark mode extension:', error);
    }
  })();
})();