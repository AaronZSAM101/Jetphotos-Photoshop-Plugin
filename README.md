# Aviation Photo Check Tools

Photoshop UXP panel version of the viewer check tools:

- `检查污点`: per-channel histogram equalization preview.
- `居中`: same center composition guide used by the viewer.
- `地平`: same fine horizon grid used by the viewer.

This first version is intentionally non-destructive. It reads a scaled RGB preview from the active Photoshop document and displays the processed result inside the panel; it does not write pixels back to the PSD.

## Run locally

1. Open Adobe UXP Developer Tool.
2. Add this folder as a plugin.
3. Load it into Photoshop.
4. Open a photo document and open `Plugins > Photo Check`.

The plugin uses manifest v5 and requires Photoshop `23.3.0` or newer.
