# Personal Homepage Template

This is a static personal homepage template inspired by `https://cs.stanford.edu/~shirwu/`.

## Files

- `index.html`: page structure
- `style.css`: page styling
- `script.js`: all editable personal content
- `assets/avatar-placeholder.svg`: default profile image placeholder

## What To Edit

Most of the time, you only need to edit `script.js`:

- `profile.name`: your name
- `profile.role`: your title
- `profile.bio`: your introduction
- `profile.links`: email, GitHub, Scholar, LinkedIn, and more
- `news`: recent updates
- `topics`: research interests
- `featuredProjects`: selected projects or papers
- `experience`: education and work history
- `services`: teaching, reviewing, organizing, and community work
- `misc`: hobbies or personal notes
- `footer`: footer text

## Replace The Photo

1. Put your image file inside the `assets/` folder.
2. Update `profile.photo` in `script.js`, for example:

```js
photo: "assets/my-photo.jpg"
```

## Preview

Open `index.html` directly in your browser.

You can also upload these files directly to GitHub Pages, Vercel, or your own server.

## Import From PDF

This template now includes a PDF import section.

1. Open the page in a browser.
2. Start the local app server with `python server.py`.
3. Set `LLM_API_KEY` in the terminal before starting the server.
4. Click `Choose PDF`.
5. Select your resume or profile PDF.
6. The page will extract text, send it to the local parser endpoint, and auto-fill the homepage sections.

Notes:

- Best results come from text-based PDFs, not scanned image PDFs.
- The browser extracts PDF text locally, and the thin local backend sends that text to your OpenAI-compatible chat API for structured parsing.
- Optional settings:
- `LLM_BASE_URL` default is `https://api.siliconflow.cn/v1`
- `LLM_MODEL` default is `Pro/zai-org/GLM-4.7`
- Backward compatibility is preserved for `SILICONFLOW_API_KEY`, `SILICONFLOW_BASE_URL`, and `SILICONFLOW_MODEL`
- After import, you can still fine-tune anything by editing `script.js`.

## Export For GitHub Pages

GitHub Pages can host the static page, but it cannot run `server.py`, MySQL, or the PDF import API. Use the local app as the editor, then export a static JSON file before pushing to GitHub.

1. Start the local backend and import/update profiles at `http://127.0.0.1:8019/`.
2. Export the current MySQL profiles:

```bash
python export_static.py
```

3. Commit and push the generated `data/profiles.json` together with the page files:

```bash
git add index.html style.css script.js data/profiles.json export_static.py
git commit -m "update static profiles"
git push
```

On GitHub Pages, the browser automatically switches to static mode and reads `data/profiles.json`. Static mode is display-only: importing PDFs, deleting profiles, and changing pinned state still happen locally before export.
