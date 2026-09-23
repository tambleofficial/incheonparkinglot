import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

const [, , slugArg, ...titleParts] = process.argv;
const slug = (slugArg || "").trim();
const title = titleParts.join(" ").trim();

if (!/^[a-z0-9][a-z0-9-]*$/.test(slug) || !title) {
  console.error('Usage: npm run new:post -- my-post-slug "글 제목"');
  process.exit(1);
}

const root = process.cwd();
const dest = join(root, "public", "blog", slug, "index.html");
if (existsSync(dest)) {
  console.error(`Post already exists: public/blog/${slug}/index.html`);
  process.exit(1);
}

const template = await readFile(join(root, "templates", "blog-post.html"), "utf8");
const date = new Date().toISOString().slice(0,10);
const description = `${title}에 관한 파킹라인 주차정보입니다.`;
const category = "주차정보";

const html = template
  .replaceAll("{{TITLE}}", title)
  .replaceAll("{{DESCRIPTION}}", description)
  .replaceAll("{{DATE}}", date)
  .replaceAll("{{CATEGORY}}", category);

await mkdir(join(root, "public", "blog", slug), { recursive:true });
await writeFile(dest, html, "utf8");
console.log(`Created: public/blog/${slug}/index.html`);
console.log("Edit the HTML body, then run: npm run build");
