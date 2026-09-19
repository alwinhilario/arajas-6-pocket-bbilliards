import localforage from "localforage";

const storage = localforage.createInstance({
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

const originalSetItem = storage.setItem.bind(storage);
storage.setItem = async function <T>(
  key: string,
  value: T,
  callback?: (err: unknown, value: T) => void,
): Promise<T> {
  const res = await originalSetItem(key, value, callback);
  emitStorageChange(key, value);
  return res;
};

const originalRemoveItem = storage.removeItem.bind(storage);
storage.removeItem = async function (key: string, callback?: (err: unknown) => void): Promise<void> {
  const res = await originalRemoveItem(key, callback);
  emitStorageChange(key);
  return res;
};

export default storage;
