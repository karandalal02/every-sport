# Roadmap

Each layer adds one thing and keeps everything before it working.

| Layer | Adds |
|---|---|
| **Art spike** | Placeholder Mixamo hero, zoomie dog and one background in the browser, to validate the art style and the animation workflow before building the game around it |
| **v1: The Gauntlet** | See [V1 spec](V1-SPEC.md) |
| **v2: More sports and places** | New sports (rugby, sumo, tennis, boxing) and settings (park, office, beach, market), each with its own threats |
| **v3: Portals** | Mid-run jumps between settings, and sport mashups (for example sumo plus rugby) |
| **v4: Odd pickups** | Collectibles in strange places (a fish from a bathtub, a trophy from a fountain) that fill a sticker album |
| **v5: Learn from the opposition** | Beat a sport enough times to unlock its move. Plus a daily seeded run you can challenge friends on |

Other ideas parked for later: lives, hero looks and kits as cosmetic rewards, score bonuses for passes and goals.

## Asset workflow

- Karan uses Mixamo for humanoid animations (run, jump, slide, kick, fall) and Blockbench or Blender for simple models, following step-by-step guidance.
- Code handles kits, colours, outlines, lighting, procedural animation and integration.
- Assets are exported as `.glb` and committed to the repo.
