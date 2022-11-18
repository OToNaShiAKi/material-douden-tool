const request = window.indexedDB.open("Lyric");
request.addEventListener("upgradeneeded", (event) => {
  const DB = event.target.result;
  if (!DB.objectStoreNames.contains("music")) {
    const LyricStore = DB.createObjectStore("music", { keyPath: "id" });
    LyricStore.createIndex("name", "name");
    LyricStore.createIndex("singer", "singer");
  }
});

export const Save = (store, music) => {
  const DB = request.result;
  return new Promise((resolve, reject) => {
    const transaction = DB.transaction(store, "readwrite")
      .objectStore(store)
      .put(music);
    transaction.addEventListener("success", resolve);
    transaction.addEventListener("error", reject);
  });
};

export const Get = async (store) => {
  request.readyState !== "done" &&
    (await new Promise((resolve) => request.addEventListener("success", resolve)));
  const DB = request.result;
  return await new Promise((resolve, reject) => {
    const transaction = DB.transaction(store, "readonly")
      .objectStore(store)
      .getAll();
    transaction.addEventListener("success", () => resolve(transaction.result));
    transaction.addEventListener("error", reject);
  });
};

export const Remove = (store, id) => {
  const DB = request.result;
  return new Promise((resolve, reject) => {
    const transaction = DB.transaction(store, "readwrite")
      .objectStore(store)
      .delete(id);
    transaction.addEventListener("success", () => resolve(transaction.result));
    transaction.addEventListener("error", reject);
  });
};
