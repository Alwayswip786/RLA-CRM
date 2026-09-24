import React from 'react';

export type TabBadgeVariant = 'default' | 'pulse' | 'gold' | 'danger' | 'success';

export interface TabItem<T = string> {
  id: T;
  label: string;
  shortLabel?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode | string | number;
  badgeVariant?: TabBadgeVariant;
  disabled?: boolean;
}

export interface SegmentedTabsProps<T = string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidthMobile?: boolean;
  variant?: 'pill' | 'card';
  ariaLabel?: string;
}

export interface ScrollableTabsProps<T = string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  variant?: 'pill' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  autoCenter?: boolean;
  showGradients?: boolean;
  ariaLabel?: string;
}

export interface UnderlineTabsProps<T = string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  equalWidth?: boolean;
  size?: 'sm' | 'md';
  ariaLabel?: string;
}
