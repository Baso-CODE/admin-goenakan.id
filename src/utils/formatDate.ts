
export const formatDate = (
  dateString: string,
  options: { style?: "datetime" | "date" | "time" | "relative" } = {}
): string => {
  if (!dateString) return "-";

  const date = new Date(dateString);
  const { style = "datetime" } = options;

  // RELATIVE TIME (misal: "3 jam lalu", "2 hari lalu")
  if (style === "relative") {
    const diff = Date.now() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} hari lalu`;
    if (hours > 0) return `${hours} jam lalu`;
    if (minutes > 0) return `${minutes} menit lalu`;
    return "Baru saja";
  }

  // LOCALE FORMATTER (Indonesia)
  const formatter = new Intl.DateTimeFormat("id-ID", {
    dateStyle: style === "date" || style === "datetime" ? "medium" : undefined,
    timeStyle: style === "time" || style === "datetime" ? "short" : undefined,
    timeZone: "Asia/Jakarta",
  });

  return formatter.format(date);
};
