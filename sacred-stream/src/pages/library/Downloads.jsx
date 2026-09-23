import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DownloadCloud, Trash2 } from 'lucide-react';
import { getSurah, surahs } from '../../data/catalog';
import { download, downloadedBytes, formatBytes, removeDownload, useDownloadStore } from '../../offline/downloads';
import { useOnline } from '../../offline/useOnline';
import DownloadButton from '../../components/DownloadButton';
import Cover from '../../components/Cover';

const JUZ_AMMA = surahs.filter((s) => s.juzStart === 30);
const bytesOf = (list) => list.reduce((sum, s) => sum + s.sizeBytes, 0);
const TOTAL = bytesOf(surahs);

function useStorageEstimate(dep) {
  const [estimate, setEstimate] = useState(null);
  useEffect(() => {
    let active = true;
    navigator.storage?.estimate?.().then((e) => active && setEstimate(e));
    return () => {
      active = false;
    };
  }, [dep]);
  return estimate;
}

export default function Downloads() {
  const status = useDownloadStore((s) => s.status);
  const online = useOnline();
  const used = downloadedBytes(status);
  const listed = Object.keys(status)
    .map(Number)
    .sort((a, b) => a - b)
    .map(getSurah);
  const doneCount = listed.filter((s) => status[s.id] === 'done').length;
  const estimate = useStorageEstimate(doneCount);
  const missing = (list) => list.filter((s) => status[s.id] !== 'done');

  return (
    <>
      <section className="rounded-2xl bg-surface-container-low p-4">
        <div className="flex items-baseline justify-between">
          <p className="font-bold">
            {doneCount} of 114 surahs on this device
          </p>
          <p className="text-sm text-on-surface-variant tabular">{formatBytes(used)}</p>
        </div>
        <div className="h-1.5 rounded-full bg-surface-container-highest mt-3" aria-hidden>
          <div className="h-full rounded-full bg-primary" style={{ width: `${(used / TOTAL) * 100}%` }} />
        </div>
        {estimate?.quota ? (
          <p className="text-xs text-on-surface-variant mt-2">
            About {formatBytes(Math.max(0, estimate.quota - estimate.usage))} free for this app on your device.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            type="button"
            disabled={!online || !missing(JUZ_AMMA).length}
            onClick={() => download(missing(JUZ_AMMA).map((s) => s.id))}
            className="px-4 h-10 rounded-full bg-surface-container-high text-sm font-semibold hover:bg-surface-bright disabled:opacity-50"
          >
            Download Juz ʿAmma · {formatBytes(bytesOf(missing(JUZ_AMMA)))}
          </button>
          <button
            type="button"
            disabled={!online || !missing(surahs).length}
            onClick={() => download(missing(surahs).map((s) => s.id))}
            className="px-4 h-10 rounded-full bg-primary text-on-primary text-sm font-bold hover:brightness-110 disabled:opacity-50"
          >
            Download everything · {formatBytes(bytesOf(missing(surahs)))}
          </button>
          {doneCount > 0 && (
            <button
              type="button"
              onClick={() => removeDownload(listed.map((s) => s.id))}
              className="px-4 h-10 rounded-full text-sm font-semibold text-error hover:bg-surface-container-high flex items-center gap-2"
            >
              <Trash2 size={16} aria-hidden /> Remove all
            </button>
          )}
        </div>
        {estimate?.quota && bytesOf(missing(surahs)) > estimate.quota - estimate.usage ? (
          <p className="text-xs text-on-surface-variant mt-3">There may not be room for everything. Download the surahs you need most first.</p>
        ) : null}
        {!online && <p className="text-xs text-on-surface-variant mt-3">You’re offline. Connect to download more.</p>}
      </section>

      {listed.length ? (
        <ul className="mt-4">
          {listed.map((s) => (
            <li key={s.id} className="flex items-center gap-3 rounded-xl hover:bg-surface-container-low pr-1">
              <Link to={`/surah/${s.id}`} className="flex items-center gap-3 flex-1 min-w-0 p-2">
                <Cover surah={s} showName={false} className="w-11 h-11 shrink-0" />
                <span className="min-w-0">
                  <span className="block font-bold truncate">{s.nameTranslit}</span>
                  <span className="block text-xs text-on-surface-variant tabular">{formatBytes(s.sizeBytes)}</span>
                </span>
              </Link>
              <DownloadButton surah={s} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-12 px-6">
          <span className="mx-auto w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary">
            <DownloadCloud size={26} aria-hidden />
          </span>
          <h2 className="font-bold text-lg mt-4">Listen without a connection</h2>
          <p className="text-on-surface-variant mt-1 max-w-sm mx-auto">
            Download surahs for flights, commutes and places with poor signal. The text downloads with the audio.
          </p>
        </div>
      )}
    </>
  );
}
