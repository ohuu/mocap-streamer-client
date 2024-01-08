import Peer, { DataConnection } from "peerjs";

export interface ConnectionStatus {
  status: "connected" | "disconnected" | "no-response";
  lastReceived?: number | null;
  responseTimeoutId?: NodeJS.Timeout | null;
}

export interface Participant {
  peer: Peer;
  dataConnections: DataConnection[];
  remoteConnection: ConnectionStatus;
  localConnection: ConnectionStatus;
}
