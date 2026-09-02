/**
 * coi-serviceworker.js — Cross-Origin Isolation via Service Worker
 *
 * Injects COOP/COEP headers client-side so SharedArrayBuffer (required for
 * WASM pthreads) works on static hosts like GitHub Pages that don't allow
 * custom HTTP response headers.
 *
 * Usage: add ONE line to your HTML <head>, before any other scripts:
 *   <script src="coi-serviceworker.js"></script>
 *
 * The first load registers the SW and reloads the page automatically.
 * All subsequent loads are served with the injected isolation headers.
 *
 * Source: https://github.com/gzuidhof/coi-serviceworker (MIT)
 * Bundled here for self-contained FHE16 deployment.
 */

/* ── Service Worker registration (runs in page context) ── */
if (typeof window !== 'undefined') {
  const coiEnableReloadGuard = 'fhe16-coi-enable-reload';
  const coiDisableReloadGuard = 'fhe16-coi-disable-reload';
  const coiReloadGuardValue = `${window.location.origin}${window.location.pathname}`;
  // Explicit legacy/fallback testing must be able to observe the real
  // non-isolated environment instead of having this helper reload the page.
  // Production pages normally omit this query flag.
  const coiServiceWorkerDisabled = /(?:^|[?&])fhe16-disable-coi-sw=1(?:&|$)/
    .test(window.location.search);
  if (coiServiceWorkerDisabled) {
    // unregister() does not detach the controller from the current document.
    // Reload exactly once after removing this script's registration, then keep
    // a guard if the page is still isolated (for example because the origin
    // server itself sends COOP/COEP) so the escape hatch can never loop.
    const scriptUrl = document.currentScript?.src
      || new URL('coi-serviceworker.js', window.location.href).href;
    void disableCoiServiceWorker(scriptUrl);
  } else if (window.crossOriginIsolated) {
    clearReloadGuard(coiEnableReloadGuard);
  } else if (!window.crossOriginIsolated && !window.isSecureContext) {
    console.warn('[coi-sw] Not a secure context — HTTPS required for SharedArrayBuffer.');
  } else if (!window.crossOriginIsolated) {
    if (readReloadGuard(coiEnableReloadGuard, coiReloadGuardValue)) {
      console.warn(
        '[coi-sw] Reload guard stopped another reload; service-worker isolation did not activate.',
      );
    } else if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(document.currentScript.src).then(async () => {
        // Do not consume the one reload while the registration is merely
        // installing; wait until it is active so the next navigation can be
        // controlled and receive the isolation headers.
        await navigator.serviceWorker.ready;
        // Reload once so the newly installed controller can inject COOP/COEP.
        // If it still cannot isolate the next document, the guard above stops.
        if (!window.crossOriginIsolated) {
          writeReloadGuard(coiEnableReloadGuard, coiReloadGuardValue);
          window.location.reload();
        }
      }).catch((error) => {
        console.warn('[coi-sw] Registration failed:', error);
      });
    } else {
      console.warn('[coi-sw] Service Workers not supported — pthreads WASM unavailable.');
    }
  }

  async function disableCoiServiceWorker(scriptUrl) {
    console.info('[coi-sw] Disabled by fhe16-disable-coi-sw=1.');
    if (!('serviceWorker' in navigator)) return;

    const normalizeScriptUrl = (rawUrl) => {
      if (!rawUrl) return '';
      const url = new URL(rawUrl, window.location.href);
      url.search = '';
      url.hash = '';
      return url.href;
    };
    const targetScriptUrl = normalizeScriptUrl(scriptUrl);
    const controllerMatches = normalizeScriptUrl(navigator.serviceWorker.controller?.scriptURL)
      === targetScriptUrl;

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const matchingRegistrations = registrations.filter((registration) =>
        [registration.installing, registration.waiting, registration.active]
          .some((worker) => normalizeScriptUrl(worker?.scriptURL) === targetScriptUrl));
      const unregisterResults = await Promise.all(
        matchingRegistrations.map((registration) => registration.unregister()),
      );
      const removedRegistration = unregisterResults.some(Boolean);
      const alreadyReloaded = readReloadGuard(coiDisableReloadGuard, coiReloadGuardValue);

      if ((controllerMatches || removedRegistration) && !alreadyReloaded) {
        writeReloadGuard(coiDisableReloadGuard, coiReloadGuardValue);
        console.info('[coi-sw] Registration removed; reloading once to detach its controller.');
        window.location.reload();
        return;
      }

      if (!navigator.serviceWorker.controller && !window.crossOriginIsolated) {
        clearReloadGuard(coiDisableReloadGuard);
        clearReloadGuard(coiEnableReloadGuard);
        console.info('[coi-sw] Non-isolated fallback is active.');
      } else if (alreadyReloaded) {
        console.warn(
          '[coi-sw] Reload guard stopped another reload; this origin may provide COOP/COEP itself.',
        );
      } else if (navigator.serviceWorker.controller) {
        console.warn('[coi-sw] A different service worker still controls this page; it was not removed.');
      }
    } catch (error) {
      console.warn('[coi-sw] Failed to disable the isolation service worker:', error);
    }
  }

  function readReloadGuard(key, value) {
    try {
      if (window.sessionStorage.getItem(key) === value) return true;
    } catch (_) {}
    return window.history.state?.[key] === value;
  }

  function writeReloadGuard(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (_) {}
    try {
      const state = window.history.state && typeof window.history.state === 'object'
        ? window.history.state : {};
      window.history.replaceState({ ...state, [key]: value }, '');
    } catch (_) {}
  }

  function clearReloadGuard(key) {
    try {
      window.sessionStorage.removeItem(key);
    } catch (_) {}
    try {
      if (window.history.state && typeof window.history.state === 'object'
          && Object.prototype.hasOwnProperty.call(window.history.state, key)) {
        const state = { ...window.history.state };
        delete state[key];
        window.history.replaceState(state, '');
      }
    } catch (_) {}
  }
}

/* ── Service Worker install/fetch handler (runs in SW context) ── */
if (typeof ServiceWorkerGlobalScope !== 'undefined' &&
    self instanceof ServiceWorkerGlobalScope) {

  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

  self.addEventListener('fetch', (event) => {
    // Only intercept same-origin navigations and sub-resources.
    if (event.request.cache === 'only-if-cached' &&
        event.request.mode !== 'same-origin') return;

    event.respondWith(
      // Preserve the request/browser cache policy. Development freshness for
      // large WASM assets belongs to serve.py's response headers; forcing
      // no-store here would penalize every static production deployment.
      fetch(event.request).then((response) => {
        if (response.status === 0) return response;

        const headers = new Headers(response.headers);
        headers.set('Cross-Origin-Opener-Policy',   'same-origin');
        headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

        return new Response(response.body, {
          status:     response.status,
          statusText: response.statusText,
          headers,
        });
      })
    );
  });
}
