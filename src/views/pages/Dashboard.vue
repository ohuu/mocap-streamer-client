<script setup lang="ts">
import { ipcRenderer } from "electron";
import { ref } from "vue";
import { useRouter } from "vue-router";
import {
  ConnectionUpdate,
  ParticipantsUpdate,
  PeerStatus,
} from "../../../shared/types";
import { store } from "../../store";
import ConnectionDetailsForm, {
  ConnectionDetails,
} from "../components/ConnectionDetailsForm.vue";
import Modal from "../components/Modal.vue";

const router = useRouter();

interface LogMessage {
  type?: "info" | "error" | "warn";
  text: string;
}

const log = ref<LogMessage[]>([]);

const participants = ref<string[]>([]);
const localConnectionStatus = ref<ConnectionUpdate["status"]>("disconnected");
const remoteConnectionStatus = ref<ConnectionUpdate["status"]>("disconnected");

ipcRenderer.on(
  "participantsUpdate",
  (_evt, { connections, update }: ParticipantsUpdate) => {
    participants.value = connections;
    if (update != null) {
      log.value.push({
        type: "info",
        text: `${update.connection} has ${update.type}`,
      });
    }
  }
);

ipcRenderer.on(
  "connectionUpdate",
  (_evt, { type, status }: ConnectionUpdate) => {
    if (type === "remote") {
      log.value.push({
        type: "info",
        text:
          status === "disconnected"
            ? "Stopped sending data"
            : status === "timeout"
            ? "Sending data has been interrupted"
            : remoteConnectionStatus.value === "disconnected"
            ? "Started sending data"
            : "Resumed sending data",
      });
      remoteConnectionStatus.value = status;
    } else {
      log.value.push({
        type: "info",
        text:
          status === "disconnected"
            ? "Stopped receiving data"
            : status === "timeout"
            ? "Receiving data has been interrupted"
            : localConnectionStatus.value === "disconnected"
            ? "Started receiving data"
            : "Resumed receiving data",
      });
      localConnectionStatus.value = status;
    }
  }
);

ipcRenderer.on("peerStatusUpdate", (_evt, { status, message }: PeerStatus) => {
  switch (status) {
    case "setupRoom":
      break;
    case "connected": {
      log.value.push({ type: "warn", text: "Connected to the room" });
      break;
    }
    case "disconnected": {
      log.value.push({ type: "warn", text: "Disconnected from the room" });
      break;
    }
    case "error": {
      log.value.push({
        type: "error",
        text: message ?? "An unknown error has occurred",
      });
    }
  }
});

function connectUdpRemote({ address, port }: ConnectionDetails) {
  ipcRenderer.invoke("udpConnectRemote", address, port).catch(console.error);
}

function connectUdpLocal({ address, port }: ConnectionDetails) {
  ipcRenderer.invoke("udpConnectLocal", address, port).catch(console.error);
}

function disconnectUdpRemote() {
  ipcRenderer.invoke("udpDisconnectRemote").catch(console.error);
}

function disconnectUdpLocal() {
  ipcRenderer.invoke("udpDisconnectLocal").catch(console.error);
}

function disconnectAll() {
  ipcRenderer
    .invoke("disconnectAll")
    .then(() => router.push("/"))
    .catch(console.error);
}
</script>

<template>
  <Modal :open="true">
    <nav class="mb-8 flex flex-row flex-wrap content-center justify-between">
      <div class="flex flex-row gap-2 text-white/50">
        <button
          class="bg-slate-500/75 hover:bg-slate-500 aspect-square rounded px-1.5 py-0.5"
          @click="disconnectAll"
        >
          <v-icon name="hi-arrow-left" />
        </button>
      </div>
      <h2>
        Connected as
        <span class="border-b border-slate-400" v-text="store.peerName" />
        to room
        <span class="border-b border-slate-400" v-text="store.roomName" />
      </h2>
    </nav>
    <div class="flex flex-row flex-nowrap justify-between mb-8">
      <div class="h-44 w-full relative">
        <ul class="absolute bottom-0 left-0 right-0 max-h-44 overflow-y-auto">
          <li
            v-for="msg in log"
            :class="
              msg.type === 'info'
                ? 'text-info'
                : msg.type === 'error'
                ? 'text-error'
                : msg.type === 'warn'
                ? 'text-warning'
                : ''
            "
          >
            {{ msg.text }}
          </li>
        </ul>
      </div>
      <div class="border-l-2 border-slate-400 px-4 w-[70%]">
        <h3 class="py-2 border-b border-inherit">Connected Participants</h3>
        <ul>
          <li v-for="peer in participants" :key="peer" v-text="peer" />
        </ul>
      </div>
    </div>
    <div :class="store.clientType === 'Both' ? 'grid grid-cols-2 gap-2' : ''">
      <div v-if="store.clientType === 'Sender' || store.clientType === 'Both'">
        <ConnectionDetailsForm
          v-if="remoteConnectionStatus === 'disconnected'"
          :initial="{ address: '127.0.0.1', port: 7004 }"
          submit-label="Start Sending"
          @submit="connectUdpRemote"
        />
        <div v-else>
          <button
            class="btn btn-block btn-primary my-4"
            @click="disconnectUdpRemote"
          >
            Stop Sending
          </button>
          <span v-if="remoteConnectionStatus === 'connected'">Connected</span>
          <span v-else>No response</span>
        </div>
      </div>
      <div
        v-if="store.clientType === 'Receiver' || store.clientType === 'Both'"
      >
        <ConnectionDetailsForm
          v-if="localConnectionStatus === 'disconnected'"
          :initial="{ address: '127.0.0.1', port: 7000 }"
          submit-label="Start Receiving"
          @submit="connectUdpLocal"
        />
        <div v-else>
          <button
            class="btn btn-block btn-primary my-4"
            @click="disconnectUdpLocal"
          >
            Stop Receiving
          </button>
          <span v-if="localConnectionStatus === 'connected'">Connected</span>
          <span v-else>Timed out</span>
        </div>
      </div>
    </div>
  </Modal>
</template>
