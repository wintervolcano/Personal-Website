import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Theme } from "../themeToggle";

type DailyCount = {
  date: string;
  count: number;
};

type Props = {
  data: DailyCount[];
  theme: Theme;
};

export function DetectionsLineChart({ data, theme }: Props) {
  const isDark = theme === "dark";

  const gridColor = isDark ? "#333" : "#e5e5e5";
  const textColor = isDark ? "#888" : "#666";
  const lineColor = "#3b82f6"; // blue-500

  // Format date for display (e.g., "Feb 3")
  const formatDate = (date: string) => {
    try {
      const d = new Date(date);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return date;
    }
  };

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis
          dataKey="date"
          stroke={textColor}
          tick={{ fill: textColor, fontSize: 10 }}
          tickFormatter={formatDate}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke={textColor}
          tick={{ fill: textColor, fontSize: 10 }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? "#1a1a1a" : "#fff",
            border: `1px solid ${isDark ? "#333" : "#ddd"}`,
            borderRadius: "8px",
            fontSize: "12px",
          }}
          labelFormatter={formatDate}
          formatter={(value: number) => [value, "Detections"]}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke={lineColor}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: lineColor }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
