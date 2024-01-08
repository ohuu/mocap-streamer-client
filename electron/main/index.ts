import { app, BrowserWindow, shell, ipcMain } from "electron";
import { release } from "node:os";
import { join } from "node:path";
import * as dgram from "dgram";
import { observableFromUdp, observerToUdp } from "./rxUdp";
import { Subscription, Observer } from "rxjs";
import {
  ConnectionConfig,
  createConnectionUpdate,
  createParticipantsUpdate,
  createPeerStatus,
} from "../../shared/types";
import {
  createParticipant,
  prepareConnectionMessage,
  setUpConnection,
  setupRoom,
} from "./peer";
import { Participant } from "./types";
import { DataConnection } from "peerjs";

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, "..");
process.env.DIST = join(process.env.DIST_ELECTRON, "../dist");
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, "../public")
  : process.env.DIST;

// Disable GPU Acceleration for Windows 7
if (release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

// if (!app.requestSingleInstanceLock()) {
//   app.quit();
//   process.exit(0);
// }

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null;
// Here, you can also use other preload
const preload = join(__dirname, "../preload/index.js");
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, "index.html");

let remoteSocket: dgram.Socket | null = null;
let subscription: Subscription | null = null;
let localObserver: Observer<Buffer> | null = null;
let participant: Participant | null = null;
let peerInterval: NodeJS.Timeout | null = null;

function noResponseTimeout(): NodeJS.Timeout {
  return setTimeout(() => {
    win.webContents.send(
      "connectionUpdate",
      createConnectionUpdate("remote", "timeout")
    );
    if (participant != null) {
      participant.remoteConnection.status = "no-response";
    }
  }, 10000);
}

function createPeerInterval(
  setupPeer: (conn: DataConnection) => void
): NodeJS.Timeout {
  if (participant == null)
    throw new Error(
      "Tried setting up the peer interval without the peer being initialised"
    );
  return setInterval(() => {
    if (participant == null) {
      clearInterval(peerInterval);
    } else {
      participant.peer.listAllPeers((peers: string[]) => {
        participant.peer.socket.emit("HEARTBEAT");
        for (const peer of peers.filter(
          (peer) =>
            participant.dataConnections.find((conn) => peer === conn.peer) ==
            null
        )) {
          setupPeer(participant.peer.connect(peer, { reliable: false }));
        }

        for (const conn of participant.dataConnections.filter(
          (conn) => !peers.includes(conn.peer)
        )) {
          conn.close();
        }
      });
    }
  }, 10000);
}

async function createWindow() {
  win = new BrowserWindow({
    title: "Main window",
    icon: join(process.env.VITE_PUBLIC, "favicon.ico"),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    // electron-vite-vue#298
    win.loadURL(url);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });

  ipcMain.handle("udpConnectRemote", (_evt, address: string, port: number) => {
    console.log("connecting to", address, port);
    if (participant != null) {
      participant.remoteConnection.status = "connected";
      participant.remoteConnection.lastReceived = Date.now();
      participant.remoteConnection.responseTimeoutId = noResponseTimeout();
    }
    remoteSocket = dgram.createSocket("udp4");
    remoteSocket.bind(port, address);
    const localBuffer = observableFromUdp(remoteSocket);
    win.webContents.send(
      "connectionUpdate",
      createConnectionUpdate("remote", "connected")
    );
    subscription = localBuffer.subscribe({
      next: (buffer) => {
        if (participant?.remoteConnection.status !== "disconnected") {
          participant.dataConnections.forEach((conn) => conn?.send(buffer));
          if (participant.localConnection.status !== "disconnected") {
            localObserver.next(
              prepareConnectionMessage(participant.peer.id, buffer)
            );
          }
          participant.remoteConnection.lastReceived = Date.now();
          if (participant.remoteConnection.responseTimeoutId != null) {
            win.webContents.send(
              "peerStatusUpdate",
              createPeerStatus("connected")
            );
            clearTimeout(participant.remoteConnection.responseTimeoutId);
          }
          participant.remoteConnection.responseTimeoutId = noResponseTimeout();
        }
      },
    });
  });

  function disconnectRemote() {
    remoteSocket?.close();
    subscription?.unsubscribe();
    remoteSocket = null;
    subscription = null;
    win.webContents.send(
      "connectionUpdate",
      createConnectionUpdate("remote", "disconnected")
    );
    if (participant != null) {
      if (participant.remoteConnection.responseTimeoutId != null) {
        clearTimeout(participant.remoteConnection.responseTimeoutId);
      }
      participant.remoteConnection.status = "disconnected";
      participant.remoteConnection.lastReceived = null;
      participant.remoteConnection.responseTimeoutId = null;
    }
  }

  ipcMain.handle("udpDisconnectRemote", disconnectRemote);

  ipcMain.handle("udpConnectLocal", (_evt, address: string, port: number) => {
    console.log("starting to send to", address, port);
    localObserver = observerToUdp(address, port, dgram.createSocket("udp4"));
    win.webContents.send(
      "connectionUpdate",
      createConnectionUpdate("local", "connected")
    );
    if (participant != null) {
      participant.localConnection.status = "connected";
    }
  });

  function disconnectLocal() {
    localObserver?.complete();
    localObserver = null;
    win.webContents.send(
      "connectionUpdate",
      createConnectionUpdate("local", "disconnected")
    );
    if (participant != null) {
      participant.localConnection.status = "disconnected";
    }
  }

  ipcMain.handle("udpDisconnectLocal", disconnectLocal);

  ipcMain.handle(
    "peerSetupRoom",
    (_evt, roomName: string, connection: ConnectionConfig) => {
      setupRoom(roomName, connection)
        .then(() =>
          win.webContents.send(
            "peerStatusUpdate",
            createPeerStatus("setupRoom")
          )
        )
        .catch((reason) =>
          win.webContents.send(
            "peerStatusUpdate",
            createPeerStatus("error", reason)
          )
        );
    }
  );

  ipcMain.handle("disconnectAll", () => {
    disconnectRemote();
    disconnectLocal();
    if (participant != null) {
      participant.dataConnections.forEach((conn) => conn.close());
      participant.peer.disconnect();
    }
    participant = null;
  });

  ipcMain.handle(
    "peerCreate",
    (
      _evt,
      peerName: string,
      roomName: string,
      connection: ConnectionConfig
    ) => {
      const setupPeer = (
        conn: DataConnection,
        alreadyConnected: boolean = false
      ) =>
        setUpConnection({
          conn,
          onDataReceived: (buffer) =>
            localObserver.next(prepareConnectionMessage(conn.peer, buffer)),
          onPeerConnected: alreadyConnected
            ? undefined
            : () => {
                if (participant != null) {
                  participant.dataConnections.push(conn);
                  win.webContents.send(
                    "participantsUpdate",
                    createParticipantsUpdate(
                      participant.dataConnections.map((conn) => conn.peer),
                      { type: "connected", connection: conn.peer }
                    )
                  );
                }
              },
          onPeerDisconnected: () => {
            if (participant != null) {
              participant.dataConnections = participant.dataConnections.filter(
                (other) => other.peer !== conn.peer
              );
              win.webContents.send(
                "participantsUpdate",
                createParticipantsUpdate(
                  participant.dataConnections.map((conn) => conn.peer),
                  { type: "disconnected", connection: conn.peer }
                )
              );
            }
          },
        });
      createParticipant(peerName, roomName, connection)
        .then((createdParticipant) => {
          participant = createdParticipant;

          participant.dataConnections.forEach((conn) => setupPeer(conn, true));
          participant.peer.on("connection", setupPeer);
          participant.peer.on("error", (err) =>
            win.webContents.send(
              "peerStatusUpdate",
              createPeerStatus("error", err.message)
            )
          );
          peerInterval = createPeerInterval(setupPeer);
          win.webContents.send(
            "peerStatusUpdate",
            createPeerStatus("connected")
          );
        })
        .catch((reason) =>
          win.webContents.send(
            "peerStatusUpdate",
            createPeerStatus("error", reason)
          )
        );
    }
  );
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  win = null;
  if (remoteSocket != null) {
    remoteSocket.close();
    subscription?.unsubscribe();
  }
  if (process.platform !== "darwin") app.quit();
});

// app.on("second-instance", () => {
//   if (win) {
//     // Focus on the main window if the user tried to open another
//     if (win.isMinimized()) win.restore();
//     win.focus();
//   }
// });

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// New window example arg: new windows url
ipcMain.handle("open-win", (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});
