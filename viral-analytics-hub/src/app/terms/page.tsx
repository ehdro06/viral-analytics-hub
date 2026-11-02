import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of Service · ViralLink" };

const CONTACT = "ideal3339@gmail.com";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="November 2, 2026">
      <p>
        These terms apply when you use ViralLink, a URL shortener with click analytics run by an individual developer in
        the Republic of Korea. By signing in you agree to them. How we handle personal information is described in the{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>1. The service</h2>
      <p>
        ViralLink lets you create short links, see statistics about clicks on them, and check where links lead. The
        service is free and currently in an early (beta) stage: features may change, and it is provided without any
        guarantee of availability.
      </p>

      <h2>2. Your account</h2>
      <p>
        You sign in with Google or GitHub. You are responsible for activity on your account and for keeping your API keys
        secret. You can delete your account at any time in Settings.
      </p>

      <h2>3. Acceptable use</h2>
      <p>You must not use ViralLink to link to, or to disguise:</p>
      <ul>
        <li>phishing, malware, scams or other fraud;</li>
        <li>spam or unsolicited bulk messages;</li>
        <li>content that is illegal in Korea or where you or your audience are, or that infringes others&apos; rights;</li>
        <li>sexual content involving minors, or content inciting violence or hatred.</li>
      </ul>
      <p>
        You must not try to overload, disrupt or bypass the limits and security of the service, or access other users&apos;
        data.
      </p>

      <h2>4. Our rights</h2>
      <p>
        We check links against Google Safe Browsing and may refuse, pause or delete links, and suspend accounts, that
        break these terms or put visitors at risk, without prior notice where needed to protect others. Usage limits
        (for example, how many links you can create per minute or day) apply to keep the service available for everyone.
      </p>

      <h2>5. Liability</h2>
      <p>
        To the extent permitted by law, ViralLink is provided &quot;as is&quot;. We are not liable for lost profits or
        indirect damages, or for content on websites that short links lead to. Nothing in these terms limits liability
        that cannot be limited by law, including for intent or gross negligence.
      </p>

      <h2>6. Changes and ending</h2>
      <p>
        We may change these terms; significant changes will be announced at least 7 days in advance. You can stop using
        the service and delete your account at any time. If we shut the service down, we will give reasonable notice.
      </p>

      <h2>7. Law and contact</h2>
      <p>
        These terms are governed by the laws of the Republic of Korea. Questions:{" "}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>
    </LegalPage>
  );
}
