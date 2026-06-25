// localStorage helpers. SSR-safe (no-op if window is undefined).

const PROFILE_KEY = "fieldstation.profile.v1";
const BOOKMARKS_KEY = "fieldstation.bookmarks.v1";

function safeGet(key) {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // quota / private-mode — silently drop
  }
}

export function loadProfile() {
  const raw = safeGet(PROFILE_KEY);
  if (!raw) return { tags: [], onboarded: false };
  try {
    const p = JSON.parse(raw);
    return {
      tags: Array.isArray(p.tags) ? p.tags : [],
      onboarded: Boolean(p.onboarded),
    };
  } catch {
    return { tags: [], onboarded: false };
  }
}

export function saveProfile(profile) {
  safeSet(PROFILE_KEY, JSON.stringify(profile));
}

export function loadBookmarks() {
  const raw = safeGet(BOOKMARKS_KEY);
  if (!raw) return new Set();
  try {
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function saveBookmarks(set) {
  safeSet(BOOKMARKS_KEY, JSON.stringify([...set]));
}
