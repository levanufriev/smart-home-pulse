import { create } from 'zustand';

export interface RoomStore {
  selectedRoomId: string | null;
  setSelectedRoomId: (roomId: string | null) => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  selectedRoomId: null,
  setSelectedRoomId: (roomId) => set({ selectedRoomId: roomId }),
}));