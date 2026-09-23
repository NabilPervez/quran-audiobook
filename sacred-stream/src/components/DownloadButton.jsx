import { useState } from 'react';
import { AlertCircle, CheckCircle2, Download, Square, Trash2 } from 'lucide-react';
import { cancel, download, formatBytes, removeDownload, useDownloadStore } from '../offline/downloads';
import ActionSheet from './ActionSheet';

function Ring({ fraction }) {
  const r = 9;
  const c = 2 * Math.PI * r;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden className="absolute inset-0 m-auto">
      <circle cx="11" cy="11" r={r} fill="none" strokeWidth="2" className="stroke-surface-container-highest" />
      <circle cx="11" cy="11" r={r} fill="none" strokeWidth="2" strokeLinecap="round" className="stroke-primary" strokeDasharray={`${c * fraction} ${c}`} transform="rotate(-90 11 11)" />
    </svg>
  );
}

/**
 * Download state for one surah. `variant="pill"` shows a labelled button (surah page);
 * `variant="icon"` is a compact icon button (lists).
 */
export default function DownloadButton({ surah, variant = 'icon' }) {
  const status = useDownloadStore((s) => s.status[surah.id]);
  const progress = useDownloadStore((s) => s.progress[surah.id] ?? 0);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const size = formatBytes(surah.sizeBytes);

  let label, icon, onClick;
  if (status === 'done') {
    label = 'Downloaded';
    icon = <CheckCircle2 size={18} className="text-primary" aria-hidden />;
    onClick = () => setConfirmRemove(true);
  } else if (status === 'downloading' || status === 'queued') {
    label = status === 'queued' ? 'Waiting…' : `${Math.round(progress * 100)}%`;
    icon = (
      <span className="relative w-[22px] h-[22px] flex items-center justify-center">
        <Ring fraction={status === 'queued' ? 0 : progress} />
        <Square size={8} fill="currentColor" aria-hidden />
      </span>
    );
    onClick = () => cancel(surah.id);
  } else if (status === 'error') {
    label = 'Retry download';
    icon = <AlertCircle size={18} className="text-error" aria-hidden />;
    onClick = () => download(surah.id);
  } else {
    label = `Download · ${size}`;
    icon = <Download size={18} aria-hidden />;
    onClick = () => download(surah.id);
  }

  const aria =
    status === 'done'
      ? `${surah.nameTranslit} is downloaded. Remove download`
      : status === 'downloading' || status === 'queued'
        ? `Downloading ${surah.nameTranslit}, ${Math.round(progress * 100)}%. Cancel`
        : status === 'error'
          ? `Download of ${surah.nameTranslit} failed. Retry`
          : `Download ${surah.nameTranslit} (${size}) for offline listening`;

  return (
    <>
      {variant === 'pill' ? (
        <button type="button" onClick={onClick} aria-label={aria} className="h-12 px-5 rounded-full bg-surface-container-high font-semibold flex items-center gap-2 hover:bg-surface-bright tabular">
          {icon} {label}
        </button>
      ) : (
        <button type="button" onClick={onClick} aria-label={aria} title={label} className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest">
          {icon}
        </button>
      )}
      {confirmRemove && (
        <ActionSheet
          title={`${surah.nameTranslit} is downloaded`}
          subtitle={`${size} on this device. It plays without an internet connection.`}
          onClose={() => setConfirmRemove(false)}
          items={[{ icon: Trash2, label: 'Remove download', destructive: true, onSelect: () => removeDownload(surah.id) }]}
        />
      )}
    </>
  );
}
