import { useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import './VideoPlayer.css';

export default function VideoPlayer({ src, style = {}, className = '' }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.muted = false;
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  return (
    <div className={`video-player-wrap ${className}`} style={style}>
      <video
        ref={videoRef}
        src={src}
        muted
        loop={false}
        playsInline
        controls={isPlaying}
        className="video-player-el"
        onEnded={handleVideoEnd}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* Overlay Play Button */}
      {!isPlaying && (
        <div className="video-play-overlay" onClick={handlePlay}>
          <div className="video-play-btn">
            <div className="video-play-ripple" />
            <div className="video-play-ripple delay" />
            <div className="video-play-icon">
              <Play size={32} fill="#fff" />
            </div>
          </div>
          <span className="video-play-text">Nhấn để phát video</span>
        </div>
      )}

      {/* Floating Pause Button khi đang phát */}
      {isPlaying && (
        <button className="video-pause-float" onClick={handlePlay} title="Tạm dừng">
          <Pause size={16} />
        </button>
      )}
    </div>
  );
}
