import { notFound } from "next/navigation";
import { PageNavbar, PageFooter, Link, ArrowLeft } from "@/components/SiteLayout";
import { Clock, Calendar } from "lucide-react";
import { posts } from "@/lib/blog-data";

export async function generateStaticParams() {
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-white/30 selection:text-white">
      <PageNavbar />

      <main className="px-5 pt-32 pb-24 sm:px-8 sm:pt-40 sm:pb-32">
        <article className="mx-auto max-w-3xl">
          {/* Back Link */}
          <div>
            <Link 
              href="/blog" 
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition hover:text-white mb-10"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to all insights
            </Link>
          </div>

          {/* Header */}
          <header className="mb-14">
            <div className="flex items-center gap-3 text-sm text-zinc-500 mb-6 font-medium">
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-zinc-300">
                {post.category}
              </span>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {post.date}
              </div>
              <span className="text-zinc-700">•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {post.readTime}
              </div>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-6 sm:text-5xl leading-tight">
              {post.title}
            </h1>
            <p className="text-lg leading-relaxed text-zinc-400">
              {post.excerpt}
            </p>
          </header>

          <hr className="my-10 border-white/10" />

          {/* Content */}
          <div 
            className="text-zinc-300 leading-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-12 [&_h2]:mb-6 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-white [&_h3]:mt-8 [&_h3]:mb-4 [&_p]:mb-6 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6 [&_li]:mb-2 [&_strong]:text-white [&_strong]:font-semibold [&_em]:text-zinc-400 [&_a]:text-white [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-zinc-300"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Footer Author Box */}
          <div 
            className="mt-20 rounded-3xl border border-white/10 bg-zinc-900/50 p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
          >
            <div>
              <h3 className="font-bold text-white text-lg">Did this help?</h3>
              <p className="text-zinc-400 text-sm mt-1">Written by the CMO automated team. Find more growth engineering on X.</p>
            </div>
            <a
              href="https://x.com/surojitpvt"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200 whitespace-nowrap"
            >
              Follow @surojitpvt
            </a>
          </div>
        </article>
      </main>

      <PageFooter />
    </div>
  );
}
