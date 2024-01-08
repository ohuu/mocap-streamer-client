export interface ConnectionConfig {
  https?: boolean;
  host: string;
  port: number;
}

export interface PeerStatus {
  status: "connected" | "disconnected" | "error" | "setupRoom";
  message?: string;
}

export interface ParticipantsUpdate {
  connections: string[];
  update?: {
    type: "connected" | "disconnected";
    connection: string;
  };
}

export interface ConnectionUpdate {
  type: "local" | "remote";
  status: "connected" | "timeout" | "disconnected";
}

export function createPeerStatus(
  status: PeerStatus["status"],
  message?: string
): PeerStatus {
  return { status, message };
}

export function createParticipantsUpdate(
  connections: string[],
  update?: ParticipantsUpdate["update"]
): ParticipantsUpdate {
  return { connections, update };
}

export function createConnectionUpdate(
  type: ConnectionUpdate["type"],
  status: ConnectionUpdate["status"]
): ConnectionUpdate {
  return { type, status };
}
