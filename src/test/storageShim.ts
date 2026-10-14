// Test service chạy ở môi trường `node` (`// @vitest-environment node`), nơi
// không có Web Storage — authStore đọc/ghi thẳng vào localStorage/sessionStorage.
// File này phải được import TRƯỚC mọi module khác trong setup (ESM eval theo thứ tự).
if (typeof globalThis.localStorage === "undefined") {
    const store = new Map<string, string>();
    const shim: Storage = {
        getItem: (key) => store.get(key) ?? null,
        setItem: (key, value) => void store.set(key, String(value)),
        removeItem: (key) => void store.delete(key),
        clear: () => store.clear(),
        key: (index) => [...store.keys()][index] ?? null,
        get length() {
            return store.size;
        },
    };
    Object.assign(globalThis, { localStorage: shim, sessionStorage: shim });
}

export {};
