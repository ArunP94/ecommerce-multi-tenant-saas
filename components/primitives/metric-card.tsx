import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: { direction: "up" | "down"; percentage: number };
  footer?: string;
  description?: string;
}

export function MetricCard({ title, value, trend, footer, description }: MetricCardProps) {
  const TrendIcon = trend?.direction === "up" ? IconTrendingUp : IconTrendingDown;

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
        {trend && (
          <CardAction>
            <Badge variant="outline">
              <TrendIcon />
              {trend.direction === "up" ? "+" : "-"}
              {trend.percentage}%
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      {(footer || description) && (
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          {footer && (
            <div className="line-clamp-1 flex gap-2 font-medium">
              {footer} {trend && <TrendIcon className="size-4" />}
            </div>
          )}
          {description && (
            <div className="text-muted-foreground">{description}</div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
