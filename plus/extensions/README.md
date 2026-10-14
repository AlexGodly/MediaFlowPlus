# Plus-exclusive feature extensions

The shared `src/`, `assets/`, and `scripts/` directories mirror published Personal source. Do not add Plus-exclusive features directly in those folders; they are replaced when Personal updates.

Add Plus-only modules under `runtime/`, CSS under `styles/`, and images under `assets/`. Register each filename (relative to its folder) in `manifest.json`.

The one-way importer copies these additions after importing Personal:
- runtime modules → `src/js/components/plus/` and appended to runtime-order.json
- stylesheets → `assets/css/plus/` and linked in index.html
- assets → `assets/plus/`

Missing files or filename conflicts block deployment. This repository alone is writable. The Personal source checkout never has push credentials.