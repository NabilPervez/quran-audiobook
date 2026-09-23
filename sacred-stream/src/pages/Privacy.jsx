const UPDATED = '23 September 2026';

/** Plain-language privacy policy (linked from Settings and the Play Store listing). */
export default function Privacy() {
  return (
    <article className="max-w-2xl mx-auto px-4 lg:px-8 pt-6 pb-10 leading-relaxed">
      <h1 className="text-3xl font-extrabold tracking-tight">Privacy policy</h1>
      <p className="text-sm text-on-surface-variant mt-1">Last updated {UPDATED}</p>

      <h2 className="font-bold text-lg mt-8">The short version</h2>
      <p className="mt-2 text-on-surface/90">
        The Sacred Stream doesn’t have accounts, doesn’t collect personal data and doesn’t track you. Everything you create in the app
        stays on your device.
      </p>

      <h2 className="font-bold text-lg mt-8">What is stored, and where</h2>
      <ul className="mt-2 list-disc pl-5 space-y-1 text-on-surface/90">
        <li>Your listening progress, bookmarks, notes and settings are saved in your browser’s local storage on this device.</li>
        <li>Surahs you download are saved in your browser’s cache on this device.</li>
        <li>None of this is sent to us or to anyone else. Clearing the app’s data, or uninstalling it, deletes it.</li>
        <li>
          “Export” in Settings creates a backup file that you save yourself; the app never uploads it.
        </li>
      </ul>

      <h2 className="font-bold text-lg mt-8">What the app downloads</h2>
      <p className="mt-2 text-on-surface/90">
        The app loads its audio, verse text and fonts from its own website (quran-audiobook.netlify.app), hosted by Netlify. Like any web
        host, Netlify may keep standard server logs (such as IP address and the file requested) to operate and secure the service. We
        don’t use these logs to identify you.
      </p>

      <h2 className="font-bold text-lg mt-8">Analytics, ads and third parties</h2>
      <p className="mt-2 text-on-surface/90">There are no analytics, no advertising and no third-party trackers in the app.</p>

      <h2 className="font-bold text-lg mt-8">Children</h2>
      <p className="mt-2 text-on-surface/90">The app is suitable for all ages and collects no information from anyone, including children.</p>

      <h2 className="font-bold text-lg mt-8">Changes</h2>
      <p className="mt-2 text-on-surface/90">If this policy changes, the new version will be posted on this page with a new date.</p>

      <h2 className="font-bold text-lg mt-8">Contact</h2>
      <p className="mt-2 text-on-surface/90">Questions about privacy: use the developer contact on the app’s Google Play listing.</p>
    </article>
  );
}
