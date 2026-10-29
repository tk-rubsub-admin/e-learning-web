type LoadingListener = () => void;

let activeRequestCount = 0;
const listeners = new Set<LoadingListener>();

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

export const startApiLoading = () => {
  activeRequestCount += 1;
  notifyListeners();
};

export const stopApiLoading = () => {
  activeRequestCount = Math.max(activeRequestCount - 1, 0);
  notifyListeners();
};

export const getApiLoadingState = (): boolean => activeRequestCount > 0;

export const subscribeApiLoading = (listener: LoadingListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
