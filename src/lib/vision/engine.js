/**
 * Paket L2 «Bilderkennung» (Noah 19.10.2026 «1 a und b … 3 a und b … 5a und b»): the picture
 * recognition ON THE DEVICE. MediaPipe Tasks Vision (Google, free, Apache 2.0) is loaded only the first
 * time it is needed: the script and its WebAssembly from the jsdelivr CDN, the models from Google's
 * model storage (together about 30 MB, once; the service worker keeps them, so it works offline after).
 * Nothing of it is in the app bundle or the install-time cache. No picture leaves the device here.
 *
 * Four helpers, each loaded on first use:
 *   detect(img)   → [{ box: {x, y, w, h} (pixels), label, score }]   things on the photo (80 kinds)
 *   classify(src) → [{ label, score }]                               what a cut-out is (1000 kinds)
 *   embed(src)    → Float32Array (length 1024, unit length)           a «fingerprint» to recognise taught things
 *   pose(img)     → [{ x, y, z, visibility }] × 33 | null             the body points for the sitting position
 *   poseVideo(video, ms) → the same for one frame of a video
 */
export const MP_VERSION = '1.0.1';
export const MP_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/vision_bundle.mjs`;
export const MP_WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
const MODELS = 'https://storage.googleapis.com/mediapipe-models';
export const MODEL_URLS = {
  detect: `${MODELS}/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`,
  classify: `${MODELS}/image_classifier/efficientnet_lite0/int8/1/efficientnet_lite0.tflite`,
  embed: `${MODELS}/image_embedder/mobilenet_v3_small/float32/1/mobilenet_v3_small.tflite`,
  pose: `${MODELS}/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task`,
};

let lib = null; // Promise<{ mod, files }>
const tasks = {}; // name → Promise<task>

/** The library and its WebAssembly files, loaded once. */
function library() {
  if (!lib) {
    lib = (async () => {
      const mod = await import(/* @vite-ignore */ MP_URL);
      const files = await mod.FilesetResolver.forVisionTasks(MP_WASM);
      return { mod, files };
    })();
    lib.catch(() => (lib = null)); // a failed download may be tried again
  }
  return lib;
}

/** One task, made once; GPU where the device has it, else the processor. */
function task(name, make) {
  if (!tasks[name]) {
    tasks[name] = (async () => {
      const { mod, files } = await library();
      const opts = (delegate) => ({ baseOptions: { modelAssetPath: MODEL_URLS[make.model ?? name], delegate }, ...make.options });
      const Cls = mod[make.cls];
      try {
        if (make.cpu) throw new Error('cpu only');
        return await Cls.createFromOptions(files, opts('GPU'));
      } catch {
        return await Cls.createFromOptions(files, opts('CPU'));
      }
    })();
    tasks[name].catch(() => delete tasks[name]);
  }
  return tasks[name];
}

const DEF = {
  detect: { cls: 'ObjectDetector', options: { runningMode: 'IMAGE', scoreThreshold: 0.25, maxResults: 20 } },
  // the int8 classifier fails on the GPU path («Unsupported input tensor type: Float32»), so it runs on the processor
  classify: { cls: 'ImageClassifier', cpu: true, options: { runningMode: 'IMAGE', maxResults: 3 } },
  embed: { cls: 'ImageEmbedder', options: { runningMode: 'IMAGE', l2Normalize: true } },
  pose: { cls: 'PoseLandmarker', options: { runningMode: 'IMAGE', numPoses: 1 } },
  poseVideo: { cls: 'PoseLandmarker', model: 'pose', options: { runningMode: 'VIDEO', numPoses: 1 } },
};

/** Loads what the pack photo needs (shows the first-time download as one step). */
export const preparePack = () => Promise.all([task('detect', DEF.detect), task('classify', DEF.classify), task('embed', DEF.embed)]);
/** Loads what the sitting position needs. */
export const preparePose = (video = false) => (video ? task('poseVideo', DEF.poseVideo) : task('pose', DEF.pose));

export async function detect(img) {
  const d = await task('detect', DEF.detect);
  const r = d.detect(img);
  return (r?.detections ?? [])
    .map((x) => ({ box: { x: x.boundingBox.originX, y: x.boundingBox.originY, w: x.boundingBox.width, h: x.boundingBox.height }, label: x.categories?.[0]?.categoryName ?? '', score: x.categories?.[0]?.score ?? 0 }))
    .filter((x) => x.label && x.box.w > 4 && x.box.h > 4);
}

export async function classify(src) {
  const c = await task('classify', DEF.classify);
  // the finer name is a help, not a must: without it the detector's word still counts
  try {
    return (c.classify(src)?.classifications?.[0]?.categories ?? []).map((x) => ({ label: x.categoryName ?? x.displayName ?? '', score: x.score ?? 0 }));
  } catch {
    return [];
  }
}

export async function embed(src) {
  const e = await task('embed', DEF.embed);
  const v = e.embed(src)?.embeddings?.[0]?.floatEmbedding;
  return v ? Float32Array.from(v) : null;
}

export async function pose(img) {
  const p = await task('pose', DEF.pose);
  return p.detect(img)?.landmarks?.[0] ?? null;
}

// The video model keeps its own clock; every frame needs a later time than the one before.
let lastMs = 0;
export async function poseVideo(video, ms) {
  const p = await task('poseVideo', DEF.poseVideo);
  lastMs = Math.max(lastMs + 1, Math.round(ms));
  return p.detectForVideo(video, lastMs)?.landmarks?.[0] ?? null;
}

/** For the tests: forget the loaded library and tasks. */
export function resetEngine() {
  lib = null;
  for (const k of Object.keys(tasks)) delete tasks[k];
  lastMs = 0;
}
