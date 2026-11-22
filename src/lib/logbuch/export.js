/**
 * «Verbesserungs-Logbuch» step 4: copy the order and save the pictures. The browser parts only; the text is in auftrag.js.
 * Nothing is sent anywhere: the text goes to the clipboard, the pictures to files on this device (or to the share sheet of the phone).
 */

/** Copy text to the clipboard (a hidden field as the fallback). True when it worked. */
export async function copyText(text, nav = globalThis.navigator, doc = globalThis.document) {
  try {
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* the fallback below */
  }
  try {
    const ta = doc.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    doc.body.appendChild(ta);
    ta.select();
    const ok = doc.execCommand('copy');
    ta.remove();
    return !!ok;
  } catch {
    return false;
  }
}

/** A photo (data URL) as a File of that name. */
export async function fileOf(photo, name) {
  const blob = await (await fetch(photo)).blob();
  return new File([blob], name, { type: blob.type || 'image/jpeg' });
}

/**
 * Save the pictures: where the phone can share files, in one share sheet (then «Save to files» or straight into the chat);
 * otherwise one download per picture. list: [{ name, photo }]. Returns how many were handed over.
 */
export async function savePictures(list, nav = globalThis.navigator, doc = globalThis.document) {
  const files = [];
  for (const p of list) files.push(await fileOf(p.photo, p.name));
  if (!files.length) return 0;
  try {
    if (nav?.canShare?.({ files }) && nav.share) {
      await nav.share({ files });
      return files.length;
    }
  } catch (err) {
    if (err?.name === 'AbortError') return 0; // the person closed the share sheet
  }
  for (const f of files) {
    const url = URL.createObjectURL(f);
    const a = doc.createElement('a');
    a.href = url;
    a.download = f.name;
    doc.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    await new Promise((ok) => setTimeout(ok, 300)); // browsers allow a few downloads in a row, one after the other
  }
  return files.length;
}
