const TOKEN_KEY = "cloud_storage_access_token";

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

function writeToken(token) {
  try {
    if (!token) localStorage.removeItem(TOKEN_KEY);
    else localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

const listeners = new Set();

export const authStore = {
  getToken() {
    return readToken();
  },
  setToken(token) {
    writeToken(token);
    for (const listener of listeners) listener(token || "");
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

