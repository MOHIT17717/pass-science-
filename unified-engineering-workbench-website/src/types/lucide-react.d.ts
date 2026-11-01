declare module 'lucide-react' {
  import * as React from 'react';

  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    className?: string;
  }

  export type LucideIcon = React.FC<LucideProps>;

  export const Layers: LucideIcon;
  export const Menu: LucideIcon;
  export const X: LucideIcon;
  export const Download: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Cpu: LucideIcon;
  export const Flame: LucideIcon;
  export const Box: LucideIcon;
  export const Terminal: LucideIcon;
  export const Lock: LucideIcon;
  export const Zap: LucideIcon;
  export const Radio: LucideIcon;
  export const Network: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const Activity: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const Eye: LucideIcon;
  export const ZoomIn: LucideIcon;
  export const Copy: LucideIcon;
  export const Check: LucideIcon;
  export const ShieldAlert: LucideIcon;
  export const Monitor: LucideIcon;
  export const HardDrive: LucideIcon;
  export const FileCode: LucideIcon;
  export const Info: LucideIcon;
  export const Mail: LucideIcon;
  export const User: LucideIcon;
  export const GraduationCap: LucideIcon;
  export const Code2: LucideIcon;
  export const Sparkles: LucideIcon;
  export const ArrowDown: LucideIcon;
  export const Github: LucideIcon;
  export const MapPin: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const Laptop: LucideIcon;
  export const FolderDown: LucideIcon;
  export const Play: LucideIcon;
  export const ArrowUpRight: LucideIcon;
}
