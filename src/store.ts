import { reactive } from "vue";
import { ConnectionConfig } from "../shared/types";

export interface Store {
  peerName?: string;
  roomName?: string;
  clientType: "Sender" | "Receiver" | "Both";
  connectionServer: ConnectionConfig;
}

export const store = reactive<Store>({
  clientType: "Both",
  connectionServer: {
    // https: true,
    // host: "mocap-server.onrender.com",
    // port: 443,
    https: false,
    host: "localhost",
    port: 8000,
  },
});
