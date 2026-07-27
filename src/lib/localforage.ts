import localforage from "localforage";

const storage = localforage.createInstance({
  name: "arajas-6-pocket-billiards",
  storeName: "app_storage",
});

export default storage;
