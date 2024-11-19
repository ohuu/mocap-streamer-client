declare module "three/addons/exporters/GLTFExporter.js" {
  import { Object3D } from "three";

  class GLTFExporter {
    parse(
      object: Object3D,
      onDone: (out: any) => void,
      onError?: () => void,
      options?: any
    ): void;
    parseAsync(object: Object3D, options?: any): Promise<any>;
  }

  export { GLTFExporter };
}
