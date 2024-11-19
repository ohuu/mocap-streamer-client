declare module "three/addons/utils/SkeletonUtils.js" {
  import {
    AnimationClip,
    Bone,
    Matrix4,
    Object3D,
    Skeleton,
    SkeletonHelper,
  } from "Three";

  function retarget(
    target: Object3D | Skeleton,
    source: Object3D | Skeleton,
    options: any
  ): void;

  function retargetClip(
    target: Skeleton | Object3D,
    source: Skeleton | Object3D,
    clip: AnimationClip,
    options: any
  ): AnimationClip;

  function getHelperFromSkeleton(skeleton: Skeleton): SkeletonHelper;

  function getSkeletonOffsets(
    target: Object3D | Skeleton,
    source: Object3D | Skeleton,
    options: any
  ): Matrix4[];

  function renameBones(skeleton: Skeleton, names: {}): any;

  function getBones(skeleton: Skeleton | Bone[]): Bone[];

  function getBoneByName(name: string, skeleton: Skeleton): Bone;

  function getNearestBone(bone: Bone, names: {}): Bone;

  function findBoneTrackData(name: string, tracks: any[]): {};

  function getEqualsBonesNames(
    skeleton: Skeleton,
    targetSkeleton: Skeleton
  ): string[];

  function clone(source: Object3D): Object3D;

  export {
    retarget,
    retargetClip,
    getHelperFromSkeleton,
    getSkeletonOffsets,
    renameBones,
    getBones,
    getBoneByName,
    getNearestBone,
    findBoneTrackData,
    getEqualsBonesNames,
    clone,
  };
}
