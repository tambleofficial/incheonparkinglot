# 파킹라인 — Cloudflare Workers + GitHub + HTML 블로그 배포용

## 배포 구조
이 프로젝트는 **Cloudflare Workers Static Assets**용입니다.
Pages가 아니라 Workers에 연결합니다.

- `public/` : 실제 배포되는 웹사이트 파일
- `public/blog/` : 블로그 글
- `templates/` : 블로그 글/목록 템플릿
- `scripts/` : 블로그 목록 자동생성 도구
- `wrangler.jsonc` : Workers 설정

## Cloudflare Workers 배포

1. GitHub에 이 프로젝트의 파일 전체를 저장소 루트에 업로드합니다.
2. Cloudflare Dashboard → **Workers & Pages → Create application → Import a repository**
3. GitHub 저장소를 선택합니다.
4. Worker 이름은 `parkingline`으로 만들거나, 다른 이름을 쓸 경우 `wrangler.jsonc`의 `name`도 같은 값으로 바꿉니다.
5. Build 설정:
   - Production branch: `main`
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
   - Root directory: `/` (저장소 루트)
   - **Build output directory는 입력하지 않습니다.** Workers는 Pages와 다릅니다.
6. 저장 후 배포합니다.

### 선택사항: Sitemap 자동생성
Cloudflare → Worker → Settings → Builds → Build variables에 아래 값을 추가합니다.

`SITE_URL=https://실제도메인.com`

그러면 배포 전에 `sitemap.xml`과 `robots.txt`가 자동으로 생성됩니다.

---

# 블로그 글 배포 방식

네. 글은 **각 글을 HTML 파일로 배포**하면 됩니다.

권장 구조:

```text
public/
  blog/
    index.html
    incheon-airport-parking-tip/
      index.html
    terminal-1-parking-guide/
      index.html
```

이렇게 하면 실제 URL은 Workers의 `auto-trailing-slash` 처리로:

- `/blog/`
- `/blog/incheon-airport-parking-tip/`
- `/blog/terminal-1-parking-guide/`

처럼 깔끔하게 나옵니다.

## 새 글 만드는 가장 쉬운 방법

로컬에서:

```bash
npm install
npm run new:post -- incheon-airport-parking-tip "인천공항 주차대행 이용 전 체크할 사항"
```

그러면:

`public/blog/incheon-airport-parking-tip/index.html`

이 자동 생성됩니다.

HTML 본문을 수정한 뒤 GitHub에 push하면 됩니다.

Cloudflare가 자동으로:
1. `npm run build`
2. 블로그 글 목록 갱신
3. sitemap 생성(SITE_URL 설정 시)
4. `wrangler deploy`
5. 실사이트 반영

을 수행합니다.

## 수동으로 글 파일을 만들어도 됩니다

`templates/blog-post.html`을 복사해서:

`public/blog/원하는-slug/index.html`

로 저장해도 됩니다.

단, 아래 meta 4개는 유지해야 블로그 목록에 자동 노출됩니다.

```html
<meta name="blog-title" content="글 제목">
<meta name="blog-description" content="목록에 표시할 설명">
<meta name="blog-date" content="2026-09-23">
<meta name="blog-category" content="주차정보">
```

## 글 배포 시 권장사항

- URL slug는 영문 소문자 + 하이픈 권장
- 글 1개 = 폴더 1개 + `index.html`
- 글의 사진은 필요하면 해당 글 폴더에 이미지 파일을 같이 넣어도 됨
- SEO 때문에 동일 글을 여러 URL에 중복 배포하지 않는 것을 권장
- 기존 글 URL은 가급적 변경하지 않는 것이 좋음

## 로컬 미리보기

```bash
npm install
npm run dev
```

Wrangler가 로컬 개발 서버를 띄웁니다.
