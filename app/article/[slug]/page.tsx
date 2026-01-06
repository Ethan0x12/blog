import { allBlogs } from 'contentlayer/generated'
import { notFound } from 'next/navigation'
import { useMDXComponent } from 'next-contentlayer2/hooks'
import Link from 'next/link'

// 格式化日期函数
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('zh-CN', options)
}

export async function generateStaticParams() {
  console.log('allBlogs', allBlogs)
  return allBlogs.map((post) => ({
    slug: post.slug,
  }))
}

type BlogSlugProps = {
  params: {
    slug: string
  }
}

// 在App Router中，params已经是解析好的对象，不需要await
// 保持组件为普通函数以正确使用Hooks

function BlogSlug({ params }: BlogSlugProps) {
  const post = allBlogs.find((post) => post.slug === params.slug)
  if (!post) {
    notFound()
  }

  const Component = useMDXComponent(post.body.code)
  
  // 找到上一篇和下一篇文章
  const sortedBlogs = allBlogs.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
  const currentIndex = sortedBlogs.findIndex(blog => blog.slug === params.slug)
  const prevPost = currentIndex < sortedBlogs.length - 1 ? sortedBlogs[currentIndex + 1] : null
  const nextPost = currentIndex > 0 ? sortedBlogs[currentIndex - 1] : null

  return (
    <>
      {/* 返回首页按钮 */}
      <div className="mb-8">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          返回首页
        </Link>
      </div>
      
      {/* 文章标题和元信息 */}
      <article className="mb-12">
        <header className="mb-8 pb-6 border-b border-border">
          <div className="flex flex-wrap gap-2 mb-4">
            {
              (post.tags || []).map((tag) => (
                <span key={tag} className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                  {tag}
                </span>
              ))
            }
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center justify-between gap-4 text-muted">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008z" />
                </svg>
                <span>{formatDate(post.publishedAt)}</span>
              </div>
              
              {post.readingTime && (
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{post.readingTime.text}</span>
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* 文章内容 */}
        <div className="article-content">
          <Component />
        </div>
        
        {/* 文章底部 */}
        <footer className="mt-12 pt-6 border-t border-border">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <p className="font-medium text-foreground">分享这篇文章</p>
              <div className="flex justify-center sm:justify-start gap-4 mt-2">
                <a href="#" className="text-muted hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm3 8h-1.35c-.538 0-.65.221-.65.778V10h2l-.209 2H13v7h-3v-7H8v-2h2V7.692C10 5.923 10.931 5 13.029 5H15v3z" />
                  </svg>
                </a>
                <a href="#" className="text-muted hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-1.998v-2.861c0-1.881-2.002-1.722-2.002 0V16h-2v-6h2v1.093c.872-1.616 4-1.736 4 1.548V16z" />
                  </svg>
                </a>
                <a href="#" className="text-muted hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </article>
      
      {/* 文章导航 */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-12 pt-8 border-t border-border">
        {prevPost && (
          <Link 
            href={`/article/${prevPost.slug}`} 
            className="flex-1 p-4 border border-border rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-all flex items-start gap-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mt-0.5 text-muted shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <div>
              <p className="text-sm text-muted">上一篇</p>
              <p className="font-medium text-foreground line-clamp-1">{prevPost.title}</p>
            </div>
          </Link>
        )}
        
        {nextPost && (
          <Link 
            href={`/article/${nextPost.slug}`} 
            className={` flex-1 p-4 border border-border rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-all flex justify-end items-start gap-3 ${!prevPost ? 'sm:ml-auto' : ''}`}
          >
            <div className="text-right">
              <p className="text-sm text-muted">下一篇</p>
              <p className="font-medium text-foreground line-clamp-1">{nextPost.title}</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mt-0.5 text-muted shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        )}
      </div>
    </>
  )
}

export default async function HOC({ params }: BlogSlugProps) {
  const awaitParams = await params
  return <BlogSlug params={awaitParams} />
}