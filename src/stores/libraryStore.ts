import { create } from 'zustand';

type LibraryStore = {
  version: number;
  bumpVersion: () => void;
};

export const useLibraryStore = create<LibraryStore>((set) => ({
  version: 0,
  bumpVersion: () => set((state) => ({ version: state.version + 1 })),
}));

export function notifyLibraryChanged(): void {
  useLibraryStore.getState().bumpVersion();
}
