MODEL STUDIO — STANDALONE DEPLOYMENT

This folder is a self-contained copy of Model Studio. Deploy this folder as the root of a separate static site or repository. It does not depend on files in the parent website. Three.js loads from jsDelivr, so the 3D viewer requires an internet connection.

PROJECT FILES

Add one folder per project under assets/studio/. Each folder must contain exactly 4 or 5 images (.webp, .png, .jpg, or .jpeg), exactly 2 self-contained GLB files, and at least one ZIP containing the complete project files. For example:

assets/studio/Frame 01/
  1.webp
  2.webp
  3.webp
  4.webp
  GLB1.glb
  GLB2.glb
  Frame 01.zip

The folder name becomes the project title. Images and GLBs are sorted naturally by filename. GLB1.glb is shown by default; GLB2.glb is shown when Show face is on, together with the shared face GLB in assets/face/. The ZIP is available to download from the viewer.

Local servers with directory listings are scanned automatically when the page opens. If your server does not expose listings, run python scripts/generate-studio-projects.py. GitHub Pages and Vercel run this scanner automatically during deployment and generate studio-projects.json.

DEPLOY

GitHub Pages: create a repository from the contents of this folder, push to main, then set repository Settings > Pages > Source to GitHub Actions. The included workflow builds the separate project index and deploys the site.

Vercel: import the separate repository or deploy this folder as the project root. vercel.json runs the studio project scanner before serving the files.

The language dropdown supports English, Chinese, French, and German. The logo, face asset, viewer, and project scanner are copied into this folder.
