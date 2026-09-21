import localforage from "localforage";

const rawStorage = localforage.createInstance({
  name: "arajas-6-pocket-billiards",
  storeName: "app_storage",
});

const STORAGE_CHANGE_EVENT = "localforage_storage_change";

export const emitStorageChange = (key: string, value?: unknown) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(STORAGE_CHANGE_EVENT, {
        detail: { key, value },
      }),
    );
  }
};

export const onStorageChange = (
  keys: string | string[],
  callback: (key: string, value?: unknown) => void,
) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const keyList = Array.isArray(keys) ? keys : [keys];
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ key: string; value?: unknown }>;
    if (keyList.includes(customEvent.detail.key)) {
      callback(customEvent.detail.key, customEvent.detail.value);
    }
  };

  window.addEventListener(STORAGE_CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener(STORAGE_CHANGE_EVENT, handler);
  };
};

// localforage overwrites instance methods when the driver is selected
// (`_wrapLibraryMethodsWithReady` / `_extend`). Patching setItem on the
// instance at module load is therefore discarded. A Proxy intercepts the
// current method on every call instead.
const storage = new Proxy(rawStorage, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);

    if (prop === "setItem" && typeof value === "function") {
      return async function setItem<T>(
        key: string,
        item: T,
        callback?: (err: unknown, value: T) => void,
      ): Promise<T> {
        const res = await value.call(target, key, item, callback);
        emitStorageChange(key, item);
        return res;
      };
    }

    if (prop === "removeItem" && typeof value === "function") {
      return async function removeItem(key: string, callback?: (err: unknown) => void): Promise<void> {
        const res = await value.call(target, key, callback);
        emitStorageChange(key);
        return res;
      };
    }

    if (typeof value === "function") {
      return value.bind(target);
    }

    return value;
  },
});

export default storage;
