# Docs hosting plan

This repository now contains two documentation paths: a static public entry and a Mintlify-compatible source tree:

- `docs/index.html` for the current static page at `walllnut.com/docs/`
- `docs.json`
- `index.mdx`
- `concepts/*.mdx`
- `papers/*.mdx`
- `benchmarks/*.mdx`
- `products/*.mdx`
- `sdk/*.mdx`
- `openapi/fhe16-api.json`

## Intended hosting

Current public docs:

- `walllnut.com/docs/` from this GitHub Pages site

Later Mintlify docs:

- `docs.walllnut.com` after Mintlify custom domain or a separate docs host is connected

Keep the main site on:

- `walllnut.com`

## Later Mintlify dashboard steps

1. Create a Mintlify project.
2. Connect this GitHub repository.
3. Use the repository root as the docs root, because `docs.json` is at the root.
4. Add `docs.walllnut.com` as the custom domain.
5. Add the DNS records Mintlify shows in the dashboard.
6. Change public site links from `/docs/` to `https://docs.walllnut.com`.

## Local preview

Install Mintlify's CLI and run it from this repository root:

```bash
mint dev
```

Validate before publishing:

```bash
mint validate
```

## Current caveat

The OpenAPI file is a draft API contract. It is for planning the FHE16 developer interface and generating documentation pages, not for claiming that the public production API is already live.

## GitHub Pages domain note

This repository currently has `CNAME` set to `walllnut.com`. A single GitHub Pages site should not be assumed to serve both `walllnut.com` and `docs.walllnut.com` from the same `CNAME` setup. To use `docs.walllnut.com` before Mintlify, use a separate Pages repo with its own `CNAME`, or use a DNS/proxy platform such as Cloudflare/Netlify/Vercel.
