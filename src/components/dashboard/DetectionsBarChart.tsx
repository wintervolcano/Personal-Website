import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Theme } from "../themeToggle";

type HourlyCount = {
  hour: number;
  count: number;
};

type Props = {
  data: HourlyCount[];
  theme: Theme;
};

export function DetectionsBarChart({ data, theme }: Props) {
  const isDark = theme === "dark";

  const gridColor = isDark ? "#333" : "#e5e5e5";
  const textColor = isDark ? "#888" : "#666";
  const barColor = "#10b981"; // emerald-500

  // Format hour for display (e.g., "12am", "6pm")
  const formatHour = (hour: number) => {
    if (hour === 0) return "12am";
    if (hour === 12) return "12pm";
    return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
  };

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis
          dataKey="hour"
          stroke={textColor}
          tick={{ fill: textColor, fontSize: 9 }}
          tickFormatter={formatHour}
          interval={2}
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
          labelFormatter={(hour: number) => `${formatHour(hour)} UTC`}
          formatter={(value: number) => [value, "Detections"]}
        />
        <Bar
          dataKey="count"
          fill={barColor}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
