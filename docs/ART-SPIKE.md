# Art spike: Mixamo steps (for Karan)

Goal: put a real animated hero into `/assets/hero/` so the spike page uses it instead of the placeholder. Takes about 10 minutes. You only need a free Adobe login.

The page at `/spike/` already works without these files (it shows a placeholder hero). Once the files are in the repo and deployed, it picks them up automatically.

## 1. Pick the character

1. Go to https://www.mixamo.com and sign in.
2. Open the **Characters** tab and choose a stock character. Y Bot or X Bot are fine for the test. Any other stock character also works.

## 2. Download the hero with skin (T-pose)

1. With the character selected, click **Download**.
2. Format: **FBX Binary (.fbx)**. Pose: **T-pose**.
3. Save the file as **`hero.fbx`**.

## 3. Download the five animations

For each one: open the **Animations** tab, search for the name, click it, and check the character plays it. Then click **Download** with these settings: Format **FBX Binary (.fbx)**, Skin **Without Skin**, Frames per second **30**, Keyframe Reduction **none**. If the animation has an **In Place** checkbox, tick it.

| Save as | Search for | Notes |
|---|---|---|
| `run.fbx` | "running" (a normal jog or sprint) | tick **In Place** |
| `jump.fbx` | "jump" (a running jump if offered) | tick **In Place** |
| `slide.fbx` | "slide" or "running slide" | tick **In Place** if shown |
| `kick.fbx` | "soccer" or "kick" (pass or shot) | any short kick will do |
| `fall.fbx` | "fall" or "falling back" | the game-over tumble |

If an exact name does not exist, choose the closest one. This is only a pipeline test.

## 4. Put the files in the repo

Copy all six files into `assets/hero/` in the repo, so you have:

```
assets/hero/hero.fbx
assets/hero/run.fbx
assets/hero/jump.fbx
assets/hero/slide.fbx
assets/hero/kick.fbx
assets/hero/fall.fbx
```

Then tell me, and I will commit them and check how they look.

## What to judge when it runs

- Does the cartoon look (flat shading, dark outlines) feel like the style you want?
- Is the camera angle good for reading threats coming from the right?
- Does the zoomie dog read as funny and clear (wind-up, then charge)?
- Is it smooth (the page shows an fps counter)?
