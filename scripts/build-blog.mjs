import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { existsSync } from "node:fs";

const root = process.cwd();
const publicDir = join(root, "public");
const blogDir = join(publicDir, "blog");
const templatePath = join(root, "templates", "blog-index.html");

function meta(html, name) {
  const re = new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["']`, "i");
  const m = html.match(re);
  return m ? m[1].trim() : "";
}

function esc(s="") {
  return s.replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}

async function collectPosts() {
  const entries = await readdir(blogDir, { withFileTypes: true });
  const posts = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const file = join(blogDir, e.name, "index.html");
    if (!existsSync(file)) continue;
    const html = await readFile(file, "utf8");
    const title = meta(html, "blog-title");
    const description = meta(html, "blog-description");
    const date = meta(html, "blog-date");
    const category = meta(html, "blog-category") || "주차정보";
    if (!title) continue;
    posts.push({ slug:e.name, title, description, date, category });
  }
  return posts.sort((a,b) => (b.date || "").localeCompare(a.date || ""));
}

const posts = await collectPosts();
const indexTemplate = await readFile(templatePath, "utf8");
const cards = posts.length
  ? posts.map(p => `<a class="post-card" href="./${encodeURIComponent(p.slug)}/">
      <div class="post-meta">${esc(p.category)}${p.date ? ` · ${esc(p.date)}` : ""}</div>
      <h2>${esc(p.title)}</h2>
      <p>${esc(p.description)}</p>
      <div class="more">글 읽기 →</div>
    </a>`).join("\n")
  : `<div class="empty">아직 등록된 주차정보 글이 없습니다.<br>새 HTML 글을 추가하면 이 목록이 자동으로 생성됩니다.</div>`;

await writeFile(join(blogDir, "index.html"), indexTemplate.replace("{{POST_CARDS}}", cards), "utf8");

// Optional sitemap. Set SITE_URL in Cloudflare build variables for production.
const siteUrl = (process.env.SITE_URL || "").replace(/\/+$/, "");
async function walk(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes:true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else if (e.isFile() && e.name.endsWith(".html") && e.name !== "404.html") out.push(p);
  }
  return out;
}
if (siteUrl) {
  const htmlFiles = await walk(publicDir);
  const urls = htmlFiles.map(file => {
    let rel = relative(publicDir, file).split(sep).join("/");
    let urlPath;
    if (rel === "index.html") urlPath = "/";
    else if (rel.endsWith("/index.html")) urlPath = "/" + rel.slice(0, -"index.html".length);
    else urlPath = "/" + rel.replace(/\.html$/, "");
    return `${siteUrl}${urlPath}`;
  }).sort();

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`;
  await writeFile(join(publicDir, "sitemap.xml"), sitemap, "utf8");
  await writeFile(join(publicDir, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`, "utf8");
} else {
  await writeFile(join(publicDir, "robots.txt"), "User-agent: *\nAllow: /\n", "utf8");
}

console.log(`Blog index generated: ${posts.length} post(s)`);
