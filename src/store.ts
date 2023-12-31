import Peer, { DataConnection } from "peerjs";
import { reactive } from "vue";

export interface Store {
  identity?: Peer;
  roomName?: string;
  dataConnections?: DataConnection[];
  clientType: "Sender" | "Receiver" | "Both";
  connectionServer: {
    https: boolean;
    host: string;
    port: number;
  };
}

export const store = reactive<Store>({
  clientType: "Both",
  connectionServer: {
    https: true,
    host: "mocap-server.onrender.com",
    port: 443,
    // https: false,
    // host: "localhost",
    // port: 8000,
  },
});
