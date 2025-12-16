export type PageHeaderProps = {
  title: string;
  description?: string;
  onSync?: () => Promise<void>;
};