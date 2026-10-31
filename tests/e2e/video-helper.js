// A made-up video for the browser tests: a green square moves over grey, recorded in the page itself (WebM).
export const madeUpVideo = async (page, secs = 3) =>
  Buffer.from(
    await page.evaluate(async (secs) => {
      const c = document.createElement('canvas');
      c.width = 320;
      c.height = 240;
      const g = c.getContext('2d');
      const rec = new MediaRecorder(c.captureStream(20), { mimeType: 'video/webm' });
      const parts = [];
      rec.ondataavailable = (e) => e.data.size && parts.push(e.data);
      const done = new Promise((ok) => (rec.onstop = ok));
      const t0 = performance.now();
      rec.start(250);
      await new Promise((ok) => {
        const draw = () => {
          const k = (performance.now() - t0) / 1000;
          g.fillStyle = '#cccccc';
          g.fillRect(0, 0, 320, 240);
          g.fillStyle = '#2d5a3d';
          g.fillRect(20 + k * 40, 80, 60, 60);
          if (k < secs) requestAnimationFrame(draw);
          else ok();
        };
        draw();
      });
      rec.stop();
      await done;
      const buf = new Uint8Array(await new Blob(parts, { type: 'video/webm' }).arrayBuffer());
      let s = '';
      for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      return btoa(s);
    }, secs),
    'base64',
  );
