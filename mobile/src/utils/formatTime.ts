export default function formatTime(totalSeconds: number) {
  const roundedSeconds = Math.round(totalSeconds);

  const minutes = Math.floor(roundedSeconds / 60);
  const seconds = roundedSeconds % 60;

  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');

  return `${paddedMinutes}:${paddedSeconds}`;
}
