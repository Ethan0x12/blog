"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { allBlogs } from "contentlayer/generated";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<typeof allBlogs>([]);
  const [showResults, setShowResults] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 搜索功能实现
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const results = allBlogs.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.summary?.toLowerCase().includes(query) ||
        (post.tags &&
          post.tags.some((tag) => tag.toLowerCase().includes(query)))
    );

    setSearchResults(results);
  }, [searchQuery]);

  // 处理搜索输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowResults(true);
  };

  // 处理搜索表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      // 如果有搜索结果，跳转到第一篇文章
      window.location.href = `/article/${searchResults[0].slug}`;
    }
  };

  // 关闭搜索结果下拉框
  useEffect(() => {
    const handleClickOutside = () => {
      setShowResults(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {/* logo */}
          <Link
            href="/"
            className="text-2xl font-bold text-primary flex items-center gap-2 group"
          >
            <span className="relative">
              JAMX
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all duration-300 group-hover:w-full"></span>
            </span>
            <span className="hidden sm:inline text-muted">BLOG</span>
          </Link>
          {/* tab link */}
          <nav className="hidden sm:flex items-center gap-2">
            <Link 
              href="/recommend" 
              className="text-sm text-muted px-3 py-2 rounded-md transition-all duration-200 hover:bg-primary/10 hover:text-primary font-medium"
            >
              GITHUB开源项目推荐
            </Link>
          </nav>
        </div>

        {/* 移动端菜单按钮 */}
        <button
          className="sm:hidden p-2 rounded-md text-muted hover:bg-primary/10 hover:text-primary transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "关闭菜单" : "打开菜单"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            )}
          </svg>
        </button>

        {/* 搜索功能 - 仅在桌面端显示 */}
        <div className="hidden sm:block relative" onClick={(e) => e.stopPropagation()}>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="搜索文章..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowResults(true)}
              className="pl-10 pr-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-64"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="absolute top-2.5 left-2 w-5 h-5 text-muted"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setShowResults(false);
                }}
                className="absolute top-3 right-2 text-muted hover:text-foreground"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </form>

          {/* 搜索结果下拉框 */}
          {showResults && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto w-full sm:w-64">
              {searchResults.length > 0 ? (
                searchResults.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/article/${post.slug}`}
                    className="block px-4 py-2 hover:bg-primary/5 transition-colors"
                    onClick={() => setShowResults(false)}
                  >
                    <h4 className="font-medium text-foreground line-clamp-1">
                      {post.title}
                    </h4>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {post.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {post.tags.length > 2 && (
                          <span className="text-xs text-muted">
                            +{post.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                ))
              ) : (
                <div className="px-4 py-3 text-muted">未找到匹配的文章</div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* 移动端导航菜单 */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-background border-b border-border animate-in slide-in-from-top duration-200">
          <div className="container mx-auto px-4 py-3">
            {/* 移动端搜索框 */}
            <div className="relative mb-4" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  placeholder="搜索文章..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setShowResults(true)}
                  className="pl-10 pr-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary w-full"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="absolute left-2 top-2.5 w-5 h-5 text-muted"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setShowResults(false);
                    }}
                    className="absolute right-2 top-3 text-muted hover:text-foreground"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </form>
            </div>
            
            {/* 移动端导航链接 */}
            <nav className="flex flex-col gap-2">
              <Link 
                href="/recommend" 
                className="block text-center py-3 px-4 bg-primary/5 text-primary font-medium rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                GITHUB开源项目推荐
              </Link>
            </nav>
          </div>
        </div>
      )}
      
      {/* 移动端搜索结果 */}
      {mobileMenuOpen && showResults && searchQuery && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto w-full">
          {searchResults.length > 0 ? (
            searchResults.map((post) => (
              <Link
                key={post.slug}
                href={`/article/${post.slug}`}
                className="block px-4 py-3 hover:bg-primary/5 transition-colors"
                onClick={() => {
                  setShowResults(false);
                  setMobileMenuOpen(false);
                }}
              >
                <h4 className="font-medium text-foreground line-clamp-1">
                  {post.title}
                </h4>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {post.tags.length > 2 && (
                      <span className="text-xs text-muted">
                        +{post.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            ))
          ) : (
            <div className="px-4 py-3 text-muted">未找到匹配的文章</div>
          )}
        </div>
      )}
    </header>
  );
}
