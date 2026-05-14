import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("page-header", className)}>
      <div>
        <p className="page-eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-subtitle">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

interface AppCardProps {
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  as?: "div" | "section" | "article";
}

export function AppCard({
  children,
  className,
  bodyClassName,
  as: Component = "div",
}: AppCardProps) {
  return (
    <Component className={cn("app-card", className)}>
      <div className={cn("app-card-body", bodyClassName)}>{children}</div>
    </Component>
  );
}

interface SectionHeaderProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({
  icon: Icon,
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="icon-tile icon-tile-primary">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="section-title">{title}</h2>
          {description && <p className="section-description mt-0.5">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

interface FormSectionHeaderProps {
  icon: LucideIcon;
  title: string;
  className?: string;
}

export function FormSectionHeader({ icon: Icon, title, className }: FormSectionHeaderProps) {
  return (
    <div className={cn("section-heading", className)}>
      <Icon className="h-4 w-4" />
      <h3 className="section-kicker text-primary">{title}</h3>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  icon?: LucideIcon;
  tone?: "primary" | "gold" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const toneClass: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  primary: "icon-tile-primary",
  gold: "icon-tile-gold",
  success: "icon-tile-success",
  warning: "icon-tile-warning",
  danger: "icon-tile-danger",
  info: "icon-tile-info",
};

export function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "primary",
  className,
}: MetricCardProps) {
  return (
    <div className={cn("app-card p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <span className="metric-label">{label}</span>
        {Icon && (
          <span className={cn("icon-tile", toneClass[tone])}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="metric-value mt-3">{value}</p>
      {helper && <div className="supporting-text mt-1">{helper}</div>}
    </div>
  );
}

export function FieldError({ error }: { error?: string[] }) {
  if (!error?.[0]) return null;
  return <p className="field-error">{error[0]}</p>;
}
