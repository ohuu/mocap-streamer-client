import Peer, { DataConnection } from "peerjs";
import { ConnectionConfig } from "../../shared/types";
import { Participant } from "./types";

export async function setupRoom(
  roomName: string,
  connection: ConnectionConfig
): Promise<string | null> {
  try {
    await fetch(
      `http${connection.https ? "s" : ""}://${connection.host}:${
        connection.port
      }/setup-room/${roomName}`,
      { method: "POST" }
    );
    return null;
  } catch (err) {
    return `Something went wrong setting up the room: ${err}`;
  }
}

export function createParticipant(
  peerName: string,
  roomName: string,
  connection: ConnectionConfig
): Promise<Participant> {
  const peer = new Peer(peerName, {
    host: connection.host,
    port: connection.port,
    path: `/room/${roomName}`,
  });

  return new Promise((resolve, reject) => {
    peer.on("open", () =>
      peer.listAllPeers((peers) =>
        resolve({
          peer,
          dataConnections: peers.map((id) =>
            peer.connect(id, { reliable: false })
          ),
          remoteConnection: { status: "disconnected" },
          localConnection: { status: "disconnected" },
        })
      )
    );
    peer.on("error", (err) => {
      return reject(err.message);
    });
  });
}

export function setUpConnection(options: {
  conn: DataConnection;
  onDataReceived: (data: Buffer) => void;
  onPeerConnected?: () => void;
  onPeerDisconnected: () => void;
}) {
  const setUpListeners = (conn: DataConnection) => {
    console.log(conn);
    options.onPeerConnected?.();
    conn.on("close", options.onPeerDisconnected);

    conn.on("data", (data): void =>
      options.onDataReceived(
        Buffer.from(data as ArrayBuffer, 0, (data as ArrayBuffer).byteLength)
      )
    );
  };
  if (options.conn.open) {
    setUpListeners(options.conn);
  } else {
    options.conn.on("open", () => setUpListeners(options.conn));
  }
}

export function prepareConnectionMessage(
  peerName: string,
  msg: Buffer
): Buffer {
  const prefix = `${peerName}:`;
  return Buffer.concat([Buffer.from(prefix, "utf-8"), msg]);
}
