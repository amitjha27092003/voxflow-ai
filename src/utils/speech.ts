// Smooth, natural Indian human Text-to-Speech (TTS) synthesizer

let cachedVoices: SpeechSynthesisVoice[] = [];

/**
 * Loads available browser speech voices asynchronously.
 * Waits for voiceschanged event if the voices array is initially empty.
 */
function getVoicesAsync(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve([]);
      return;
    }

    const immediate = window.speechSynthesis.getVoices();
    if (immediate && immediate.length > 0) {
      cachedVoices = immediate;
      resolve(immediate);
      return;
    }

    let resolved = false;

    const onVoicesChanged = () => {
      if (resolved) return;
      resolved = true;
      const v = window.speechSynthesis.getVoices();
      cachedVoices = v;
      window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      resolve(v);
    };

    window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);

    // Fallback safety timeout (200ms)
    setTimeout(() => {
      if (resolved) return;
      resolved = true;
      window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      const v = window.speechSynthesis.getVoices();
      cachedVoices = v;
      resolve(v);
    }, 200);
  });
}

/**
 * Prioritizes natural Indian Hindi / English neural voices in exact specified order:
 * 1. "Google हिन्दी" or any voice with lang === "hi-IN" (ideal for natural Devanagari Hindi)
 * 2. "Microsoft Swara"
 * 3. "Microsoft Neerja"
 * 4. "Google UK English Female"
 * 5. "en-IN" neural / natural voices
 * 6. Any other en-IN voice
 */
function findNaturalIndianVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  // 1. "Google हिन्दी" or any voice with lang === "hi-IN"
  const googleHindi = voices.find(
    (v) =>
      v.name.includes("Google हिन्दी") ||
      v.name.includes("Google Hindi") ||
      (v.lang === "hi-IN" && v.name.toLowerCase().includes("google"))
  );
  if (googleHindi) return googleHindi;

  const anyHiIn = voices.find(
    (v) =>
      v.lang.toLowerCase() === "hi-in" ||
      v.lang.toLowerCase() === "hi_in" ||
      v.lang.toLowerCase().startsWith("hi")
  );
  if (anyHiIn) return anyHiIn;

  // 2. "Microsoft Swara" (Natural/Neural Hindi)
  const swara = voices.find((v) => v.name.toLowerCase().includes("swara"));
  if (swara) return swara;

  // 3. "Microsoft Neerja" (Natural/Neural Indian English)
  const neerja = voices.find((v) => v.name.toLowerCase().includes("neerja"));
  if (neerja) return neerja;

  // 4. "Google UK English Female"
  const googleUkFemale = voices.find((v) =>
    v.name.toLowerCase().includes("google uk english female")
  );
  if (googleUkFemale) return googleUkFemale;

  // 5. en-IN neural/natural voices
  const enInNeural = voices.find(
    (v) =>
      (v.lang.toLowerCase() === "en-in" || v.lang.toLowerCase() === "en_in") &&
      (v.name.toLowerCase().includes("natural") ||
        v.name.toLowerCase().includes("neural") ||
        v.name.toLowerCase().includes("online"))
  );
  if (enInNeural) return enInNeural;

  // 6. Any en-IN voice
  const anyEnIn = voices.find(
    (v) => v.lang.toLowerCase() === "en-in" || v.lang.toLowerCase() === "en_in"
  );
  if (anyEnIn) return anyEnIn;

  // Fallback: any voice mentioning India
  const anyIndian = voices.find((v) => v.name.toLowerCase().includes("india"));
  if (anyIndian) return anyIndian;

  return null;
}

/**
 * Speaks text using the native browser speech synthesizer with optimal cadence and pitch.
 * Ensures sentence flows smoothly in one single breath without word-by-word robotic pauses.
 */
export async function speakHindi(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("Speech synthesis is not supported in this browser.");
    if (onEnd) onEnd();
    return;
  }

  if (!text || text.trim() === "") {
    if (onEnd) onEnd();
    return;
  }

  try {
    // 1. Cleanly cancel any queued or in-progress speech
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    // 2. Load available voices asynchronously
    const voices = cachedVoices.length > 0 ? cachedVoices : await getVoicesAsync();
    const chosenVoice = findNaturalIndianVoice(voices);

    // 3. Configure utterance parameters for smooth, natural Indian speech
    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = "hi-IN";
    utterance.rate = 1.02; // Optimal natural pace without robotic pauses
    utterance.pitch = 1.0;

    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }

    // Small timeout ensures cancel() has processed in Chromium before speaking
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 15);
  } catch (err) {
    console.error("Speech synthesis error:", err);
    if (onEnd) onEnd();
  }
}
