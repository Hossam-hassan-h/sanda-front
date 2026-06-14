import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RevenueChartProps {
  data: { month: string; amount: number }[];
}

const formatNumber = (value: unknown) =>
  Number.isFinite(Number(value)) ? Number(value).toLocaleString() : "0";

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">الإيرادات الشهرية</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                formatter={(value) => [`${formatNumber(value)} ج`, "الإيرادات"]}
              />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
