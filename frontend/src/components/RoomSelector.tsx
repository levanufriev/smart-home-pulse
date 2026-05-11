import React from "react";
import { useQuery } from "@apollo/client/react";
import { GET_ROOMS } from "../graphql/queries";
import { useRoomStore } from "../store/roomStore";
import type { GetRoomsResponse } from "../types";

export const RoomSelector: React.FC = () => {
  const { selectedRoomId, setSelectedRoomId } = useRoomStore();
  const { data, loading, error } = useQuery<GetRoomsResponse>(GET_ROOMS);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded-md w-48"></div>
      </div>
    );
  }

  if (error || !data?.rooms) {
    return <div className="text-red-600 text-sm">Failed to load rooms</div>;
  }

  return (
    <div className="flex flex-col space-y-2">
      <label
        htmlFor="room-select"
        className="text-sm font-medium text-gray-700"
      >
        Select Room
      </label>
      <select
        id="room-select"
        value={selectedRoomId || ""}
        onChange={(e) => setSelectedRoomId(e.target.value || null)}
        className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Select a room...</option>
        {data.rooms.map((room) => (
          <option key={room.id} value={room.id}>
            {room.name}
          </option>
        ))}
      </select>
    </div>
  );
};
