export type SearchBarProps = {
  onSearch: (query: string) => void;
  placeholder?: string;
  showResults?: boolean;
  resultCount?: number;
  debounceTime?: number;
}