export const saveDayData = (blocks: any[]) => {
  const key = new Date().toISOString().split("T")[0];
  localStorage.setItem(key, JSON.stringify(blocks));
};

export const loadDayData = () => {
  const key = new Date().toISOString().split("T")[0];
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
};

export const saveDayDataByDate = (date: string, blocks: any[]) => {
  localStorage.setItem(date, JSON.stringify(blocks));
};

export const loadDayDataByDate = (date: string) => {
  const raw = localStorage.getItem(date);
  return raw ? JSON.parse(raw) : null;
};

export const exportCSV = (blocks: any[]) => {
  const header = "Time,Label,Done,Notes\n";
  const rows = blocks
    .map(
      (b) =>
        `${b.time},${b.label},${b.complete ? "Yes" : "No"},"${b.notes.join(
          "; "
        )}"`
    )
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `AMP_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportCSVByDate = (date: string, blocks: any[]) => {
  const header = "Time,Label,Done,Notes\n";
  const rows = blocks
    .map(
      (b) =>
        `${b.time},${b.label},${b.complete ? "Yes" : "No"},"${b.notes.join(
          "; "
        )}"`
    )
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `AMP_${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
