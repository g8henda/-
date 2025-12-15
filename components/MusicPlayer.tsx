import React, { useState, useRef, useEffect } from 'react';
import { BGM_PLAYLIST } from '../utils/audio';

const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.2);
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(BGM_PLAYLIST[currentTrackIndex].url);
    audioRef.current.loop = true;
    audioRef.current.volume = volume;

    // Auto-play next track if not looped (optional logic, currently looping same track)
    audioRef.current.addEventListener('ended', nextTrack);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (isPlaying) {
        audioRef.current.play().catch(e => {
            console.log("Autoplay prevented, waiting for interaction");
            setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, volume]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const nextTrack = () => {
    const wasPlaying = isPlaying;
    setIsPlaying(false); // Stop current
    setCurrentTrackIndex((prev) => (prev + 1) % BGM_PLAYLIST.length);
    if (wasPlaying) setTimeout(() => setIsPlaying(true), 100);
  };

  return (
    <div className={`fixed top-4 right-4 z-[60] transition-all duration-300 ${isExpanded ? 'w-64' : 'w-12'} bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-full shadow-2xl overflow-hidden`}>
      <div className="relative flex items-center h-12">
        
        {/* Toggle Expand / Icon */}
        <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-white shrink-0 z-10"
        >
            {isPlaying ? (
                <span className="animate-spin text-xl">💿</span>
            ) : (
                <span className="text-xl">🎵</span>
            )}
        </button>

        {/* Controls (Visible when expanded) */}
        <div className={`flex items-center gap-3 pr-4 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="flex flex-col w-24">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider truncate">Now Playing</span>
                <span className="text-xs text-green-400 font-bold truncate">{BGM_PLAYLIST[currentTrackIndex].title}</span>
            </div>

            <button onClick={togglePlay} className="text-white hover:text-green-400 transition">
                {isPlaying ? '⏸' : '▶'}
            </button>

            <button onClick={nextTrack} className="text-white hover:text-green-400 transition">
                ⏭
            </button>
            
            <input 
                type="range" min="0" max="1" step="0.1" 
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-12 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;