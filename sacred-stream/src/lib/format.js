/** 75 -> "1:15", 3725 -> "1:02:05" */
export function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const s = Math.floor(sec % 60);
  const m = Math.floor((sec / 60) % 60);
  const h = Math.floor(sec / 3600);
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Human duration for metadata: 8 -> "8s", 968 -> "16m", 3682 -> "1h 1m" */
export function formatDuration(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return '0m';
  if (sec < 60) return `${Math.round(sec)}s`;
  const totalMin = Math.round(sec / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Remaining listening time phrased for humans: "12 min left", "45 sec left" */
export function formatRemaining(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return 'Finished';
  if (sec < 60) return `${Math.ceil(sec)} sec left`;
  const min = Math.ceil(sec / 60);
  if (min < 60) return `${min} min left`;
  return `${formatDuration(sec)} left`;
}
