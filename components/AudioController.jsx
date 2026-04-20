import { useEffect, useState } from 'react';

const TRACKS = [
  { id: 'rain',   name: 'Rain Ambience', url: '/audio/rain.mp3',    radius: 2.5, speed: 0.15, height: 1.2 },
  { id: 'synth',  name: 'Synth Pad',     url: '/audio/synth.mp3',   radius: 3.5, speed: 0.5,  height: 0.5 },
  { id: 'bass',   name: 'Bass Loop',     url: '/audio/bass.mp3',    radius: 2.0, speed: 0.3,  height: 0 },
  { id: 'drums',  name: 'Drum Loop',     url: '/audio/drums.mp3',   radius: 3.0, speed: 0.7,  height: 0.8 },
];

export function AudioController({ engine }) {
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState({});
  const [volumes, setVolumes] = useState(
    Object.fromEntries(TRACKS.map((t) => [t.id, 0.7]))
  );
  const [master, setMaster] = useState(0.8);

  const handleStart = async () => {
    await engine.init();
    await Promise.all(
      TRACKS.map((t) => engine.loadTrack(t.id, t.url, {
        radius: t.radius, speed: t.speed, height: t.height, volume: volumes[t.id],
      }))
    );
    setReady(true);
  };

  const toggle = (id) => {
    if (playing[id]) engine.stop(id);
    else engine.play(id);
    setPlaying((p) => ({ ...p, [id]: !p[id] }));
  };

  const updateVolume = (id, v) => {
    setVolumes((prev) => ({ ...prev, [id]: v }));
    engine.setVolume(id, v);
  };

  const updateMaster = (v) => {
    setMaster(v);
    engine.setMasterVolume(v);
  };

  return (
    <div style={styles.panel}>
      <h2 style={styles.title}>◢ CYBER-NOIR ◣</h2>
      <p style={styles.sub}>🎧 Headphones required for 8D effect</p>

      {!ready ? (
        <button style={styles.start} onClick={handleStart}>
          ► INITIALIZE AUDIO
        </button>
      ) : (
        <>
          <div style={styles.row}>
            <label style={styles.label}>MASTER</label>
            <input
              type="range" min="0" max="1" step="0.01"
              value={master}
              onChange={(e) => updateMaster(parseFloat(e.target.value))}
              style={styles.slider}
            />
          </div>
          <hr style={styles.hr} />
          {TRACKS.map((t) => (
            <div key={t.id} style={styles.trackRow}>
              <button
                onClick={() => toggle(t.id)}
                style={{
                  ...styles.trackBtn,
                  background: playing[t.id] ? '#ff2bd6' : 'transparent',
                  color: playing[t.id] ? '#000' : '#ff2bd6',
                }}
              >
                {playing[t.id] ? '■' : '▶'}
              </button>
              <span style={styles.trackName}>{t.name}</span>
              <input
                type="range" min="0" max="1" step="0.01"
                value={volumes[t.id]}
                onChange={(e) => updateVolume(t.id, parseFloat(e.target.value))}
                style={styles.slider}
              />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

const styles = {
  panel: {
    position: 'fixed', top: 20, left: 20, zIndex: 10,
    background: 'rgba(8, 4, 20, 0.85)',
    border: '1px solid #ff2bd6',
    borderRadius: 8,
    padding: 20,
    minWidth: 320,
    color: '#e0d0ff',
    fontFamily: 'monospace',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 0 30px rgba(255, 43, 214, 0.3)',
  },
  title: { color: '#ff2bd6', margin: 0, letterSpacing: 4, textShadow: '0 0 10px #ff2bd6' },
  sub: { fontSize: 11, opacity: 0.6, marginTop: 4 },
  start: {
    width: '100%', padding: '12px', marginTop: 12,
    background: 'linear-gradient(90deg, #ff2bd6, #9b2bff)',
    border: 'none', color: '#000', fontWeight: 'bold',
    letterSpacing: 2, cursor: 'pointer', borderRadius: 4,
  },
  row: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 },
  label: { fontSize: 11, color: '#00e5ff', width: 70 },
  hr: { border: 0, borderTop: '1px solid #3a1b50', margin: '12px 0' },
  trackRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  trackBtn: {
    width: 30, height: 30, border: '1px solid #ff2bd6',
    borderRadius: '50%', cursor: 'pointer', fontSize: 12, fontWeight: 'bold',
  },
  trackName: { flex: 1, fontSize: 12 },
  slider: { flex: 1, accentColor: '#ff2bd6' },
};
