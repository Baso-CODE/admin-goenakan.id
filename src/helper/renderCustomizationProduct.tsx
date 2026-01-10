export const renderCustomization = (customData: any) => {
  if (!customData) return null;

  try {
    // 1. Parsing jika data masih berupa string JSON
    const parsed =
      typeof customData === "string" ? JSON.parse(customData) : customData;

    // 2. Handle jika struktur adalah { detail: "..." } dari backend
    const content = parsed.detail || parsed;

    // 3. Jika content masih object/array, render key-value
    if (typeof content === "object" && content !== null) {
      return (
        <div className="flex flex-col gap-1 mt-1 text-[10px] text-gray-600 bg-gray-50 p-1.5 rounded border border-gray-100">
          <span className="font-semibold text-gray-800">Customization:</span>
          {Object.entries(content).map(([key, value]) => (
            <div key={key} className="flex gap-1">
              <span className="capitalize text-gray-500">{key}:</span>
              <span className="font-medium text-gray-900">{String(value)}</span>
            </div>
          ))}
        </div>
      );
    }

    // 4. Jika content string biasa
    return (
      <div className="mt-1 text-[10px] text-gray-600 italic">
        <span className="font-semibold not-italic">Custom: </span>
        {String(content)}
      </div>
    );
  } catch (e) {
    // Fallback jika gagal parse (tampilkan apa adanya)
    return (
      <div className="mt-1 text-[10px] text-gray-500">
        Custom: {String(customData)}
      </div>
    );
  }
};
