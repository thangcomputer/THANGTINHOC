import { useEffect, useState } from 'react';
import './PageLoader.css';

/**
 * 5 Loading Modes:
 * 1. spinner  - Vòng xoay gradient
 * 2. pulse    - Logo pulse + ripple
 * 3. dots     - 3 chấm nhảy
 * 4. wave     - Sóng equalizer
 * 5. progress - Thanh progress bar ngang
 */
const MODES = ['spinner', 'pulse', 'dots', 'wave', 'progress'];

export default function PageLoader({ mode = 'spinner', siteName = 'Thắng Tin Học', logo }) {
  const [progressWidth, setProgressWidth] = useState(0);

  useEffect(() => {
    if (mode === 'progress') {
      let w = 0;
      const timer = setInterval(() => {
        w += Math.random() * 15 + 5;
        if (w >= 95) w = 95;
        setProgressWidth(w);
      }, 200);
      return () => clearInterval(timer);
    }
  }, [mode]);

  const currentMode = MODES.includes(mode) ? mode : 'spinner';

  return (
    <div className="page-loader">
      <div className="page-loader-bg" />

      {/* Mode 1: Gradient Spinner */}
      {currentMode === 'spinner' && (
        <div className="loader-spinner-wrap">
          <div className="loader-spinner-ring" />
          <div className="loader-spinner-ring inner" />
          <div className="loader-spinner-dot" />
        </div>
      )}

      {/* Mode 2: Logo Pulse */}
      {currentMode === 'pulse' && (
        <div className="loader-pulse-wrap">
          <div className="loader-pulse-ripple" />
          <div className="loader-pulse-ripple delay" />
          <div className="loader-pulse-core">
            {logo ? (
              <img src={logo} alt="" className="loader-pulse-logo" />
            ) : (
              <span className="loader-pulse-text">T</span>
            )}
          </div>
        </div>
      )}

      {/* Mode 3: Bouncing Dots */}
      {currentMode === 'dots' && (
        <div className="loader-dots-wrap">
          <div className="loader-dot" style={{ '--i': 0 }} />
          <div className="loader-dot" style={{ '--i': 1 }} />
          <div className="loader-dot" style={{ '--i': 2 }} />
          <div className="loader-dot" style={{ '--i': 3 }} />
          <div className="loader-dot" style={{ '--i': 4 }} />
        </div>
      )}

      {/* Mode 4: Wave Equalizer */}
      {currentMode === 'wave' && (
        <div className="loader-wave-wrap">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="loader-wave-bar" style={{ '--i': i }} />
          ))}
        </div>
      )}

      {/* Mode 5: Progress Bar */}
      {currentMode === 'progress' && (
        <div className="loader-progress-wrap">
          <div className="loader-progress-icon">⚡</div>
          <div className="loader-progress-track">
            <div className="loader-progress-fill" style={{ width: `${progressWidth}%` }} />
            <div className="loader-progress-glow" style={{ left: `${progressWidth}%` }} />
          </div>
          <span className="loader-progress-pct">{Math.round(progressWidth)}%</span>
        </div>
      )}

      <p className="loader-label">{siteName}</p>
    </div>
  );
}
