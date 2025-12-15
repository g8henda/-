// Audio assets using reliable public sources
const SFX_URLS = {
  shuffle: 'https://www.soundjay.com/card/sounds/card-shuffle-1.mp3',
  deal: 'https://www.soundjay.com/card/sounds/card-place-1.mp3', // Single card placement
  chips: 'https://www.soundjay.com/misc/sounds/coins-in-hand-2.mp3', // Simulates chips handling
  check: 'https://www.soundjay.com/door/sounds/door-knock-1.mp3', // Knocking on table
  fold: 'https://www.soundjay.com/card/sounds/card-flip-1.mp3',
  win: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
  turn: 'https://www.soundjay.com/button/sounds/button-16.mp3' // Subtle ping for turn
};

// Royalty-free background music playlist (Jazz / Lo-Fi vibes)
export const BGM_PLAYLIST = [
  { title: "Smooth Jazz", url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3" },
  { title: "Late Night Lounge", url: "https://cdn.pixabay.com/download/audio/2022/03/24/audio_34416705d5.mp3" },
  { title: "Poker Face Beats", url: "https://cdn.pixabay.com/download/audio/2023/08/21/audio_128796916a.mp3" }
];

class AudioManager {
  private sounds: Record<string, HTMLAudioElement> = {};
  private enabled: boolean = true;

  constructor() {
    // Preload sounds
    Object.entries(SFX_URLS).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.volume = 0.5; // Default SFX volume
      this.sounds[key] = audio;
    });
  }

  playSfx(key: keyof typeof SFX_URLS) {
    if (!this.enabled || !this.sounds[key]) return;
    
    // Clone node to allow overlapping sounds (e.g. multiple chip sounds)
    const sound = this.sounds[key].cloneNode() as HTMLAudioElement;
    sound.volume = 0.4;
    sound.play().catch(e => console.warn('Audio play failed (interaction required)', e));
  }

  toggleSound(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const audioManager = new AudioManager();