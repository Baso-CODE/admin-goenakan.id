export interface WhatsappClickAttribution {
  id: string;
  code: string;
  pagePath: string;
  ctaName: string;
  attribution?: any;
  createdAt: string;
}

export interface ParsedAttribution {
  code: string;
  platform: string;
  badgeClass: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  pagePath: string;
  ctaName: string;
  landingPage: string;
  referrer: string;
  gaClientId: string | null;
  gaSessionId: string | null;
  createdAt: string;
}

export function parseWhatsappClickAttribution(
  click?: WhatsappClickAttribution | null
): ParsedAttribution | null {
  if (!click) return null;

  const rawAttr = click.attribution || {};
  const last = rawAttr.last || rawAttr.first || {};
  const params = last.params || {};

  const source = params.utm_source || "";
  const medium = params.utm_medium || "";
  const campaign = params.utm_campaign || "";
  const content = params.utm_content || "";
  const term = params.utm_term || "";
  const gclid = params.gclid || "";
  const fbclid = params.fbclid || "";
  const ttclid = params.ttclid || "";
  const referrer = last.referrer || "";

  let platform = "Website";
  let badgeClass = "bg-sky-50 text-sky-700 border-sky-200";

  const lower = (source + " " + medium + " " + referrer).toLowerCase();

  if (lower.includes("instagram") || fbclid) {
    platform = "Instagram Ads";
    badgeClass = "bg-pink-50 text-pink-700 border-pink-200";
  } else if (lower.includes("facebook") || lower.includes("meta")) {
    platform = "Facebook Ads";
    badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
  } else if (lower.includes("google") || gclid) {
    platform = "Google Ads";
    badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (lower.includes("tiktok") || ttclid) {
    platform = "TikTok Ads";
    badgeClass = "bg-purple-50 text-purple-700 border-purple-200";
  } else if (source) {
    platform = source.toUpperCase();
  }

  return {
    code: click.code,
    platform,
    badgeClass,
    source,
    medium,
    campaign,
    content,
    term,
    pagePath: click.pagePath,
    ctaName: click.ctaName,
    landingPage: last.landing_page || click.pagePath,
    referrer,
    gaClientId: rawAttr.ga_client_id || null,
    gaSessionId: rawAttr.ga_session_id || null,
    createdAt: click.createdAt,
  };
}
