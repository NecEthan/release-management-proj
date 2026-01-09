import React, { useEffect, useState } from "react";
import { SearchBarProps } from "../../types/search-bar-props.type";
import "./search-bar.css";

export default function SearchBar({
    onSearch,
     placeholder = "Search...",
      showResults = false,
      resultCount = 0,
      debounceTime = 300
    }: SearchBarProps) {

    const [searchQuery, setSearchQuery] = useState("");

 useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, debounceTime);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch, debounceTime]);

  const handleClear = () => {
    setSearchQuery('');
  };


  return (
    <div className="search-bar-container">
        <div className="search-bar-input-wrapper">
            <input type="text"
                className="search-bar-input"
                value={searchQuery}
                placeholder={placeholder}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
                <button className="search-bar-clear" onClick={handleClear}>x</button>
            )}
        </div>

        {showResults && searchQuery && (
          <p className="search-bar-results">
              Found {resultCount} result{resultCount !== 1 ? 's' : ''}
          </p>    
        )}
    </div>
  )
}