export function createIdleClean(clean: () => void, timeout: number) {
  let id: ReturnType<typeof setTimeout>;
  return {
    start: function () {
      this.stop();
      id = setTimeout(() => {
        clean();
      }, timeout);
    },
    stop: () => {
      if (id) {
        clearTimeout(id);
      }
    },
  };
}
