// // Add this to your app.js file or create a new mobile-fix.js file

// // Mobile width fix for dynamically generated elements
// function fixMobileWidth() {
//   // Check if we're on mobile
//   if (window.innerWidth <= 767) {
    
//     // Remove problematic dynamically generated divs
//     const problematicSelectors = [
//       'div[class*="sidebar-entry-btn"]',
//       'div[class*="root-widget"]',
//       'div[class*="c4g-widget"]',
//       'div[class*="float-btn-box"]',
//       'div[class*="extra-tools-box"]',
//       '.sidebar-entry-btn-6tSbV4',
//       '.float-btn-box-y3jJtK',
//       '.extra-tools-box-3TTWxU'
//     ];
    
//     problematicSelectors.forEach(selector => {
//       const elements = document.querySelectorAll(selector);
//       elements.forEach(element => {
//         element.style.display = 'none';
//         // Or completely remove: element.remove();
//       });
//     });
    
//     // Force body and html width
//     document.documentElement.style.width = '100%';
//     document.documentElement.style.maxWidth = '100%';
//     document.documentElement.style.overflowX = 'hidden';
//     document.body.style.width = '100%';
//     document.body.style.maxWidth = '100%';
//     document.body.style.overflowX = 'hidden';
//     document.body.style.margin = '0';
//     document.body.style.padding = '0';
    
//     // Fix container widths
//     const containers = document.querySelectorAll('.container');
//     containers.forEach(container => {
//       container.style.width = '100%';
//       container.style.maxWidth = '100%';
//       container.style.paddingLeft = '16px';
//       container.style.paddingRight = '16px';
//     });
    
//     // Fix sections
//     const sections = document.querySelectorAll('section');
//     sections.forEach(section => {
//       section.style.width = '100%';
//       section.style.maxWidth = '100%';
//     });
    
//     // Hide any elements with suspicious positioning
//     const suspiciousElements = document.querySelectorAll('div[style*="bottom: 657"]');
//     suspiciousElements.forEach(element => {
//       element.style.display = 'none';
//     });
//   }
// }

// // Run on load
// document.addEventListener('DOMContentLoaded', fixMobileWidth);

// // Run on resize
// window.addEventListener('resize', fixMobileWidth);

// // Run periodically to catch dynamically added elements
// setInterval(fixMobileWidth, 1000);

// // Mutation observer to catch dynamically added problematic elements
// const observer = new MutationObserver(function(mutations) {
//   let shouldFix = false;
  
//   mutations.forEach(function(mutation) {
//     mutation.addedNodes.forEach(function(node) {
//       if (node.nodeType === Node.ELEMENT_NODE) {
//         // Check if added element is problematic
//         if (node.className && (
//           node.className.includes('sidebar-entry') ||
//           node.className.includes('root-widget') ||
//           node.className.includes('c4g-widget') ||
//           node.className.includes('float-btn-box') ||
//           node.className.includes('extra-tools-box')
//         )) {
//           shouldFix = true;
//         }
//       }
//     });
//   });
  
//   if (shouldFix && window.innerWidth <= 767) {
//     fixMobileWidth();
//   }
// });

// // Start observing
// observer.observe(document.body, {
//   childList: true,
//   subtree: true
// });

// // Debug function - remove in production
// function debugMobileWidth() {
//   console.log('Current viewport width:', window.innerWidth);
//   console.log('Document width:', document.documentElement.scrollWidth);
//   console.log('Body width:', document.body.scrollWidth);
  
//   // Find elements causing horizontal scroll
//   const allElements = document.querySelectorAll('*');
//   allElements.forEach(el => {
//     if (el.scrollWidth > window.innerWidth) {
//       console.log('Wide element found:', el, 'Width:', el.scrollWidth);
//     }
//   });
// }

// // Call debug function (remove in production)
// // debugMobileWidth();