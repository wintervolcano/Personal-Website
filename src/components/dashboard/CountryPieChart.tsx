import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Theme } from "../themeToggle";

type CountryCount = {
  country: string;
  count: number;
};

type Props = {
  data: CountryCount[];
  theme: Theme;
};

// Color palette for the pie chart
const COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#ec4899", // pink-500
  "#84cc16", // lime-500
  "#6366f1", // indigo-500
];

export function CountryPieChart({ data, theme }: Props) {
  const isDark = theme === "dark";
  const textColor = isDark ? "#888" : "#666";

  // Map country codes to names (basic mapping)
  const countryNames: Record<string, string> = {
    US: "United States",
    GB: "United Kingdom",
    DE: "Germany",
    FR: "France",
    CA: "Canada",
    AU: "Australia",
    IN: "India",
    JP: "Japan",
    BR: "Brazil",
    NL: "Netherlands",
    IT: "Italy",
    ES: "Spain",
    CN: "China",
    KR: "South Korea",
    MX: "Mexico",
    Unknown: "Unknown",
  };

  const getCountryName = (code: string) => countryNames[code] || code;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="count"
          nameKey="country"
          label={({ country, percent }) =>
            percent > 0.05 ? `${country} ${(percent * 100).toFixed(0)}%` : ""
          }
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? "#1a1a1a" : "#fff",
            border: `1px solid ${isDark ? "#333" : "#ddd"}`,
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: number, name: string) => [
            value,
            getCountryName(name),
          ]}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value: string) => (
            <span style={{ color: textColor, fontSize: "11px" }}>
              {getCountryName(value)}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
