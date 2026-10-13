import sanitizeHtml from "sanitize-html";
import "./quotationNoteContent.css";
interface QuotationNoteContentProps {
  content: string | null | undefined;
}

export default function QuotationNoteContent({
  content,
}: QuotationNoteContentProps) {
  if (!content) return null;

  const isHtml = /<\/?[a-z][\s\S]*?>/i.test(content);

  if (!isHtml) {
    return <div className="whitespace-pre-wrap wrap-break-word">{content}</div>;
  }

  const safeHtml = sanitizeHtml(content, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "ul",
      "ol",
      "li",
      "blockquote",
      "h1",
      "h2",
      "h3",
      "span",
    ],
    allowedAttributes: {},
  });

  return (
    <div
      className="quotation-note-content"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
