// import { Loader, Object3D, Skeleton } from "three";
// import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
// import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// let standardSkeleton: Skeleton | null = null;
// const skeletons: Record<string, Object3D | GLTF> = {};
// const loaders: { exts: string[]; loader: Loader<Object3D | GLTF> }[] = [
//   { loader: new FBXLoader(), exts: ["fbx"] },
//   { loader: new GLTFLoader(), exts: ["gltf", "glb"] },
// ];

// const extRegex = /\.(?<ext>[^.]+)$/;

// export function registerSkeleton(
//   path: string,
//   name?: string | null
// ): Promise<(typeof skeletons)[string]> {
//   const ext = extRegex.exec(path)?.groups?.["ext"].toLowerCase();
//   return new Promise((res, rej) => {
//     const loader =
//       ext != null
//         ? loaders.find(({ exts }) => exts.includes(ext))?.loader
//         : null;
//     if (loader != null) {
//       loader.load(
//         path,
//         (obj) => {
//           if (name != null) {
//             skeletons[name] = obj;
//           }
//           res(obj);
//         },
//         undefined,
//         rej
//       );
//     } else {
//       rej(
//         new Error(
//           `No suitable 3D model loader found. Accepted extensions are:"${loaders
//             .flatMap(({ exts }) => exts)
//             .join('", "')}"`
//         )
//       );
//     }
//   });
// }

// registerSkeleton("./assets/standardSkeleton.fbx")
//   .then((data) => {
//     if ("isObject3D" in data) {
//       const skeletonHelper = new SkeletonHelper(data);
//       console.log(skeletonHelper.bones);
//       const skeleton = new Skeleton(skeletonHelper.bones);
//       skeleton.calculateInverses();
//       console.log(skeleton);
//     } else {
//       console.log(JSON.stringify(data.scene));
//       const skeleton = new SkeletonHelper(data.scene);
//       console.log(skeleton.bones);
//     }
//     (data as GLTF).parser;
//   })
//   .catch(console.error);

// import { retarget } from "three/addons/utils/SkeletonUtils.js";

// https://threejs.org/docs/index.html#examples/en/utils/SkeletonUtils.retarget
// retarget();

import {
  AnimationClip,
  Euler,
  Loader,
  Object3D,
  Quaternion,
  QuaternionKeyframeTrack,
  Skeleton,
  SkeletonHelper,
  VectorKeyframeTrack,
} from "three";
import { BVH, BVHLoader } from "three/examples/jsm/loaders/BVHLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { retargetClip } from "three/examples/jsm/utils/SkeletonUtils.js";
import { SegmentData, StandardSubjectData, SubjectData } from "../types";

let standardSkeleton: Skeleton | null = null;
const loaders: { exts: string[]; loader: Loader<Object3D | BVH> }[] = [
  { loader: new FBXLoader(), exts: ["fbx"] },
  { loader: new BVHLoader(), exts: ["bvh"] },
];

const extRegex = /\.(?<ext>[^.]+)$/;

export function loadSkeleton(path: string): Promise<Skeleton> {
  const ext = extRegex.exec(path)?.groups?.["ext"].toLowerCase();
  return new Promise((res, rej) => {
    const loader =
      ext != null
        ? loaders.find(({ exts }) => exts.includes(ext))?.loader
        : null;

    if (loader != null) {
      loader.load(
        path,
        (data) => {
          let skeleton: Skeleton;

          if ("isObject3D" in data) {
            const helper = new SkeletonHelper(data);
            skeleton = new Skeleton(helper.bones);
            skeleton.calculateInverses();
          } else {
            skeleton = data.skeleton;
          }

          res(skeleton);
        },
        undefined,
        rej
      );
    } else {
      rej(
        new Error(
          `No suitable 3D model loader found for "${path}". Accepted extensions are: "${loaders
            .flatMap(({ exts }) => exts)
            .join('", "')}"`
        )
      );
    }
  });
}

loadSkeleton("./assets/input.bvh").then((skeleton) => {
  standardSkeleton = skeleton;
  console.log("ORIGINAL BVH", skeleton);

  console.log(skeleton.bones.map((bone) => JSON.stringify(bone.rotation)));
});

export function standardiseAnimation<const S extends string = string>(
  skeleton: Skeleton,
  currFrame: SubjectData<S>,
  prevFrame?: SubjectData<S> | null
): StandardSubjectData {
  if (standardSkeleton == null) {
    throw new Error("The standard skeleton has not been initialised yet");
  }

  const currFrameKeys = Object.keys(currFrame.segments);
  if (prevFrame != null) {
    const prevFrameKeys = Object.keys(prevFrame.segments);
    if (
      prevFrameKeys.length !== currFrameKeys.length ||
      prevFrameKeys.some((name, i) => currFrameKeys[i][0] !== name)
    ) {
      throw new Error(
        "Previous frame data format doesn't match the current frame format"
      );
    }
  }

  if (
    skeleton.bones.length !== currFrameKeys.length ||
    currFrameKeys.some(
      (name) => skeleton.bones.find((bone) => bone.name === name) == null
    )
  ) {
    throw new Error("Animation frames don't match the target skeleton");
  }

  skeleton.bones;

  const tracks = skeleton.bones.flatMap((bone) => {
    const startingPos =
      prevFrame != null
        ? [
            bone.position.x + prevFrame?.segments[bone.name as S].posx,
            bone.position.y + prevFrame?.segments[bone.name as S].posy,
            bone.position.z + prevFrame?.segments[bone.name as S].posz,
          ]
        : [bone.position.x, bone.position.y, bone.position.z];
    const startingRot =
      prevFrame != null
        ? new Quaternion()
            .setFromEuler(
              new Euler(
                bone.rotation.x + prevFrame.segments[bone.name as S].rotx,
                bone.rotation.y + prevFrame.segments[bone.name as S].roty,
                bone.rotation.z + prevFrame.segments[bone.name as S].rotz
              )
            )
            .toArray()
        : bone.quaternion.toArray();
    return [
      new VectorKeyframeTrack(
        `${bone.name}.position`,
        [0, 1],
        [
          ...startingPos,
          bone.position.x + currFrame.segments[bone.name as S].posx,
          bone.position.y + currFrame.segments[bone.name as S].posy,
          bone.position.z + currFrame.segments[bone.name as S].posz,
        ]
      ),
      new QuaternionKeyframeTrack(
        `${bone.name}.quaternion`,
        [0, 1],
        [
          ...startingRot,
          ...new Quaternion()
            .setFromEuler(
              new Euler(
                bone.rotation.x + currFrame.segments[bone.name as S].rotx,
                bone.rotation.y + currFrame.segments[bone.name as S].roty,
                bone.rotation.z + currFrame.segments[bone.name as S].rotz
              )
            )
            .toArray(),
        ]
      ),
    ];
  });

  const clip = new AnimationClip(undefined, 1, tracks);

  console.log(clip.validate(), clip.tracks);

  const standardisedClip = retargetClip(standardSkeleton, skeleton, clip);
  console.log(standardisedClip.validate(), standardisedClip.tracks);

  const outSegments: Record<string, SegmentData> = {};

  for (const track of standardisedClip.tracks) {
    if (track.name.endsWith(".quaternion")) {
      const name = track.name.slice(0, -".quaternion".length);
      const rotation = new Euler().setFromQuaternion(
        new Quaternion(...track.values.slice(-4))
      );
      outSegments[name] = {
        ...(outSegments[name] ?? {}),
        rotx: rotation.x,
        roty: rotation.y,
        rotz: rotation.z,
      };
    } else if (track.name.endsWith(".position")) {
      const name = track.name.slice(0, -".position".length);
      const [x, y, z] = track.values.slice(-3);
      outSegments[name] = {
        ...(outSegments[name] ?? {}),
        posx: x,
        posy: y,
        posz: z,
      };
    } else {
      throw new Error(`Unknown track "${track.name}" ${JSON.stringify(track)}`);
    }
  }

  console.log(outSegments);

  return { segments: outSegments, name: currFrame.name } as StandardSubjectData;
}

// https://threejs.org/docs/index.html#examples/en/utils/SkeletonUtils.retarget
// retarget();
