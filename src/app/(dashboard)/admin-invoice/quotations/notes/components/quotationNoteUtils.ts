export type QuotationNoteValue = {
  categoryId: string;
  templateId: string | null;
  content: string;
};

export type QuotationNoteTemplate = {
  id: string;
  title: string;
  content: string;
};

export type QuotationNoteCategory = {
  id: string;
  name: string;
  isPublic: boolean;
  templates: QuotationNoteTemplate[];
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildQuotationNote(title: string, content: string): string {
  const heading = title.trim()
    ? `<p><strong>${escapeHtml(title.trim())}</strong></p>`
    : "";

  const body = /<\/?[a-z][\s\S]*?>/i.test(content)
    ? content
    : `<p>${escapeHtml(content).replace(/\r?\n/g, "<br />")}</p>`;

  return `${heading}${body}`;
}
