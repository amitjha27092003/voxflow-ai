// Speech synthesis utility for Hindi/Indian English voice feedback

export function speakHindi(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("Speech synthesis is not supported in this browser.");
    if (onEnd) onEnd();
    return;
  }

  try {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Try finding hi-IN or en-IN voice
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(
      (v) => v.lang === "hi-IN" || v.lang.startsWith("hi") || v.name.includes("Hindi")
    );
    const indianEnglishVoice = voices.find(
      (v) => v.lang === "en-IN" || v.name.includes("India")
    );

    if (hindiVoice) {
      utterance.voice = hindiVoice;
      utterance.lang = "hi-IN";
    } else if (indianEnglishVoice) {
      utterance.voice = indianEnglishVoice;
      utterance.lang = "en-IN";
    } else {
      utterance.lang = "hi-IN";
    }

    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error("Speech synthesis error:", err);
    if (onEnd) onEnd();
  }
}
