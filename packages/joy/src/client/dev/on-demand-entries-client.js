import { setupPing, currentPage, closePing } from "./on-demand-entries-utils";

export default async ({ assetPrefix }) => {
  window.addEventListener("locationchange", function () {
    setupPing.bind(this, assetPrefix, () => window.location.pathname);
  });
  setupPing(assetPrefix, () => window.location.pathname, currentPage);

  // prevent HMR connection from being closed when running tests
  if (!process.env.__JOY_TEST_MODE) {
    document.addEventListener("visibilitychange", (_event) => {
      const state = document.visibilityState;
      if (state === "visible") {
        setupPing(assetPrefix, () => window.location.pathname);
      } else {
        closePing();
      }
    });

    window.addEventListener("beforeunload", () => {
      closePing();
    });
  }
};

(function () {
  const pushState = history.pushState;
  const replaceState = history.replaceState;

  history.pushState = function () {
    pushState.apply(history, arguments);
    window.dispatchEvent(new Event("pushstate"));
    window.dispatchEvent(new Event("locationchange"));
  };

  history.replaceState = function () {
    replaceState.apply(history, arguments);
    window.dispatchEvent(new Event("replacestate"));
    window.dispatchEvent(new Event("locationchange"));
  };

  window.addEventListener("popstate", function () {
    window.dispatchEvent(new Event("locationchange"));
  });
})();
