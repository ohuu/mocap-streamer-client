declare module "three/addons/loaders/FBXLoader.js" {
  import { AnimationClip, Camera, Loader, LoadingManager, Scene } from "three";
  import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
  import { DDSLoader } from "three/examples/jsm/loaders/DDSLoader";

  interface FBX {
    animations: AnimationClip[];
    scene: Scene;
    scenes: Scene[];
    cameras: Camera[];
    asset: object;
  }

  class FBXLoader extends Loader {
    constructor(manager?: LoadingManager);
    dracoLoader: DRACOLoader | null;
    ddsLoader: DDSLoader | null;

    load(
      url: string,
      onLoad: (fbx: FBX) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
    setDRACOLoader(dracoLoader: DRACOLoader): FBXLoader;
    setDDSLoader(ddsLoader: DDSLoader): FBXLoader;
    parse(
      data: ArrayBuffer | string,
      path: string,
      onLoad: (fbx: FBX) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
  }

  export { FBXLoader, FBX };
}
