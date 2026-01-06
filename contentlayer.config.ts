import { defineDocumentType, makeSource } from 'contentlayer2/source-files'
import readingTime from 'reading-time'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrettyCode from 'rehype-pretty-code'

export const Blog = defineDocumentType(() => ({
  name: 'Blog',
  // 文件路径匹配规则
  filePathPattern: '**/*.mdx',
  contentType: 'mdx',
  // 定义入口字段
  fields: {
    title: {
      type: 'string',
      required: true,
    },
    summary: {
      type: 'string',
      required: true,
    },
    publishedAt: {
      type: 'string',
      required: true,
    },
    tags: {
      type: 'list',
      of: {
        type: 'string',
      }
    }
  },
  // 定义额外出参
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => {
        // 生成基于路径的唯一slug，但移除mdx扩展名
        // 对于嵌套在子目录的文件，会生成类似'vue3-performance'的slug
        const pathParts = doc._raw.flattenedPath.split('/');
        return pathParts.join('-').replace(/\.mdx$/, '')
      },
    },
    readingTime: {
      type: 'nested',
      resolve: (doc) => readingTime(doc.body.code),
    },
  },
}))

export default makeSource({
  // 文件路径
  contentDirPath: 'posts',
  documentTypes: [Blog],
  // 忽略以_开头的文档
  contentDirExclude: ['**/_*.mdx', '_**/*.mdx'],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypePrettyCode,
        {
          // 代码主题类型 https://unpkg.com/browse/shiki@0.14.2/themes/
          theme: 'one-dark-pro',
          // To apply a custom background instead of inheriting the background from the theme
          keepBackground: false,
        },
      ],
      [
        rehypeAutolinkHeadings,
        {
          properties: {
            // 锚点类名
            className: ['anchor'],
          },
        },
      ],
    ],
  },
})
