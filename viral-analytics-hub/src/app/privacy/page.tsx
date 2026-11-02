import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy · ViralLink" };

const CONTACT = "ideal3339@gmail.com";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="November 2, 2026">
      <p>
        ViralLink is a URL shortener with click analytics, run by an individual developer in the Republic of Korea.
        This policy explains what personal information we process, why, for how long, who helps us process it, and how
        you can exercise your rights. It is written to meet the Korean Personal Information Protection Act (PIPA) and
        the EU General Data Protection Regulation (GDPR).
      </p>

      <h2>1. Who is responsible</h2>
      <p>
        Controller and privacy officer: the operator of ViralLink. Contact: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        We answer requests within 10 days.
      </p>

      <h2>2. What we collect and why</h2>
      <table>
        <thead>
          <tr><th>Whose</th><th>Data</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Account holders</td>
            <td>Name and email address from Google or GitHub sign-in, the provider&apos;s account ID</td>
            <td>Creating and running your account (contract)</td>
          </tr>
          <tr>
            <td>Account holders</td>
            <td>Your short links and their destinations; API keys (we keep only a hash of each key)</td>
            <td>Providing the service (contract)</td>
          </tr>
          <tr>
            <td>Account holders</td>
            <td>A login cookie (<code>SESSION</code>)</td>
            <td>Keeping you signed in. Strictly necessary, so no consent banner is used</td>
          </tr>
          <tr>
            <td>People who open a short link</td>
            <td>
              Time of the click, IP address <strong>anonymised before storage</strong> (the last part is removed, e.g.
              203.0.113.x), country and city derived from it, browser and operating system, and the referring site&apos;s
              domain only
            </td>
            <td>
              Click statistics for the link owner (legitimate interest). We cannot identify a visitor from this data and
              do not use it for advertising or tracking across sites
            </td>
          </tr>
          <tr>
            <td>Anyone using the link expander or creating links</td>
            <td>The URLs you submit</td>
            <td>Checking them against Google Safe Browsing to block malware and phishing (security)</td>
          </tr>
        </tbody>
      </table>
      <p>We do not sell personal information, use advertising cookies, or build profiles.</p>

      <h2>3. How long we keep it</h2>
      <ul>
        <li>Account data, links and API keys: until you delete your account.</li>
        <li>Click records: 12 months, then deleted automatically.</li>
        <li>Login sessions: up to 30 days of inactivity.</li>
        <li>Short-lived technical logs kept by our hosting providers: as set by those providers (typically 30 days).</li>
      </ul>

      <h2>4. Who processes data for us, and where</h2>
      <p>
        We use the following providers. Their servers are in the <strong>United States</strong>, so data is transferred
        abroad from the moment you use the service, over encrypted connections, for the purposes above and for the
        retention periods above.
      </p>
      <ul>
        <li><strong>Google Cloud</strong> (Google LLC): runs our servers and the cache (Oregon, US).</li>
        <li><strong>Neon</strong> (Neon, Inc.): stores the database (Oregon, US).</li>
        <li><strong>Vercel</strong> (Vercel Inc.): serves the website.</li>
        <li><strong>Google</strong> and <strong>GitHub</strong>: sign-in, only if you choose that provider.</li>
        <li><strong>Google Safe Browsing</strong>: receives URLs to check whether they are dangerous.</li>
      </ul>
      <p>
        Country and city are looked up in a GeoLite2 database by MaxMind that runs on our own servers; no data is sent
        to MaxMind. GeoLite2 data is created by MaxMind, available from{" "}
        <a href="https://www.maxmind.com" target="_blank" rel="noreferrer">maxmind.com</a>.
      </p>

      <h2>5. Your rights</h2>
      <p>
        You can ask to access, correct, delete or receive a copy of your personal information, to restrict or object to
        its processing, and you can withdraw consent at any time.
      </p>
      <ul>
        <li>
          <strong>Delete your account</strong> yourself in Settings. This immediately removes your account, links, API
          keys and all click records of your links.
        </li>
        <li>For anything else, email <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</li>
        <li>
          You can also complain to a supervisory authority: in Korea the Personal Information Protection Commission
          (privacy.go.kr, call 182) or the KISA privacy report center (privacy.kisa.or.kr, call 118); in the EU, your
          local data protection authority.
        </li>
      </ul>

      <h2>6. Security</h2>
      <p>
        All traffic is encrypted (HTTPS). Passwords are never handled by us: sign-in is delegated to Google or GitHub.
        Secrets are kept in a managed secret store, the cache server has no public internet address, and access to the
        systems is limited to the operator.
      </p>

      <h2>7. Children</h2>
      <p>ViralLink is not intended for children under 14, and we do not knowingly collect their information.</p>

      <h2>8. Changes</h2>
      <p>
        We will post any change on this page with a new date. For significant changes we will notify account holders by
        email at least 7 days in advance.
      </p>
    </LegalPage>
  );
}
