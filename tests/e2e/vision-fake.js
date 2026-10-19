// Paket L2 «Bilderkennung»: a stand-in for the MediaPipe library the app loads from the CDN, so the browser
// test runs without the internet and without the 30 MB of models. It answers like the real one:
// - ObjectDetector: three things at fixed places (a bottle, a sleeping bag, a teddy bear the app does not know);
// - ImageEmbedder: the mean colour of the part as its fingerprint (so a taught part is found again);
// - PoseLandmarker: a made-up rider seen from the left; in a video the knee bends and stretches.
export const FAKE_VISION = `
export const FilesetResolver = { forVisionTasks: async () => ({}) };
const make = (C) => ({ createFromOptions: async () => new C() });
class OD {
  detect() {
    const box = (x, name, score) => ({ boundingBox: { originX: x, originY: 40, width: 160, height: 160 }, categories: [{ categoryName: name, score }] });
    return { detections: [box(20, 'bottle', 0.9), box(240, 'sleeping bag', 0.8), box(460, 'teddy bear', 0.7)] };
  }
}
class IC {
  classify() { return { classifications: [{ categories: [] }] }; }
}
class IE {
  embed(c) {
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
    const n = Math.hypot(r, g, b) || 1;
    return { embeddings: [{ floatEmbedding: [r / n, g / n, b / n] }] };
  }
}
const rider = (kneeX) => {
  const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.1 }));
  const set = (i, x, y) => (lm[i] = { x, y, z: 0, visibility: 0.95 });
  set(11, 0.6, 0.3); set(13, 0.7, 0.4); set(15, 0.78, 0.42);
  set(23, 0.4, 0.45); set(25, kneeX, 0.65); set(27, 0.45, 0.85);
  return lm;
};
let frame = 0;
class PL {
  detect() { return { landmarks: [rider(0.47)] }; }
  detectForVideo() { frame += 1; return { landmarks: [rider(0.47 + 0.08 * Math.abs(Math.sin(frame / 3)))] }; }
}
export const ObjectDetector = make(OD);
export const ImageClassifier = make(IC);
export const ImageEmbedder = make(IE);
export const PoseLandmarker = make(PL);
`;
