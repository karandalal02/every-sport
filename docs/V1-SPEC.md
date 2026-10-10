# V1 Spec

Working title: **Every Sport**. Desktop web only. Single player.

## 1. Pitch

Carry a ball through a day where every sport tries to tackle you. The world switches sport as you run: the ball, kit, background, music and threats all change. One mistake ends the run, so the fun is in reading threats quickly and answering them cleanly.

## 2. Design pillars

1. **Simple job, absurd world.** The task is always "keep running with the ball". The comedy comes from ordinary things (a grandma, a dog, a goose) committing far too hard to a sport.
2. **Readable at speed.** Every threat shows its shape and a wind-up, so the right answer is clear before it arrives.
3. **Short loop.** A run takes about a minute or two, and retry is instant.
4. **Shareable.** The end screen is a card worth screenshotting.
5. **Not a copy of Kick.** The sport-switching zones, the encounter system and the look are our own.

## 3. Core loop

1. The ball drops in from the top of the screen onto the player.
2. Control starts and the player runs forward on their own.
3. Encounters arrive one at a time. The player answers each with the right move.
4. The sport zone changes every so often (whistle, wipe, ball morph, kit swap).
5. A block ends the run. The end card shows score, rank and top 5.
6. Retry.

## 4. Controls (desktop only)

The player always runs. There is no left/right input.

| Key | Action |
|---|---|
| Up | Jump (the sport's own skill move) |
| Down | Duck / slide |
| Shift (hold) | Pace: run at 1.5x speed |
| Space | Pass |
| F | Shot |

Pass and shot are separate keys. Neither affects the score in v1.

## 5. Encounters

The track is a stream of encounters, one at a time.

| Type | Cue | Player response | Outcome |
|---|---|---|---|
| Threat | Red/orange warning with a wind-up animation | Jump, duck, or pass, depending on the threat's shape | Answer correctly: it passes. Fail: the run ends |
| Goal | Gold glowing post, hoop or net | Press F to shoot | A celebration and a breather. No score effect in v1 |

Passable objects (walls, parked cars, lamp posts, rink boards) are highlighted blue. A pass bounces off one.

### Threat shapes and answers

| Shape | Answer |
|---|---|
| Low | Jump |
| High | Duck |
| Wide | Pass off a nearby object, or outpace it |

### Generation rules

- **Seeded random.** Each run has a seed. This is free now and enables daily runs later.
- **Shuffled bag, not coin flips.** About 60% threats and 40% goals, so long streaks of one type do not happen.
- **Minimum spacing.** Encounters never overlap.
- **Solvable.** Every threat has at least one valid answer, including at 1.5x pace.
- **Escalation.** The gap between encounters shrinks and the share of threats rises as the run goes on.
- **Pace trade-off.** Pace covers distance faster, but encounters also arrive more often per second. There is no stamina bar.

## 6. Pass and shot

- When the ball leaves the player (pass or shot), it returns after about one second.
- While the ball is away, the player cannot be tackled.
- If lives are added later, the only change is an animation of the ball coming back to the player.

How the ball returns:

| Zone | After a shot | After a pass |
|---|---|---|
| Football | Rebounds off the post, or a ball kid kicks it back | Bounces off a wall or bystander |
| Basketball | Drops through the net and bounces back | Bounces off the floor or a wall |
| Ice hockey | Pops out of the net onto the ice | Rebounds off the boards |
| Field hockey | Rebounds off the goal backboard | Bounces off a fence or bystander |

Fallback: if the ball has not returned after a short timeout, it reappears at the player's feet with a sparkle, so flow never breaks.

## 7. Sport zones and threats

Four zones in v1. Each zone is an everyday place turned into a venue.

| Zone | Place | Palette | Ball |
|---|---|---|---|
| Football | Street and small park | Green and warm yellow | Football |
| Basketball | Schoolyard / car park | Orange and navy | Basketball |
| Ice hockey | Mall ice rink | Icy blue and white | Puck |
| Field hockey | Park pitch | Fresh green and white | Hockey ball |

Zone transition: telegraph (road markings and a HUD icon appear), whistle and wipe, ball morph and kit swap, then a safe window of about 1 to 2 seconds with no threats.

Two threats per zone:

| Zone | Threat | Shape | Answer | Wind-up tell |
|---|---|---|---|---|
| Football | Grandma slide tackler (handbag held high) | Low | Jump | Crouch, dust trail |
| Football | Zoomie dog | Low, fast | Jump | Ears back, bark |
| Basketball | Inflatable tube man | High, flailing | Duck | Wobbles and leans |
| Basketball | Pigeon swarm | High | Duck | Flock gathers and shadow grows |
| Ice hockey | Penguin belly-slide | Low | Jump | Tips forward onto belly |
| Ice hockey | Figure skater, spinning | Wide | Pass off the boards | Winds up into a spin |
| Field hockey | Lawnmower driven by a determined gardener | Low | Jump | Engine revs, grass flies |
| Field hockey | Sprinkler | Wide | Pass or outpace | Hiss, then spray arc |

## 8. Hero

One character with one look in v1: a player in a jersey. The kit changes per zone (shirt colour, number). The back of the jersey shows the player's three-letter initials on the end card. More looks are a later cosmetic reward.

Poses and animations: run, jump, duck/slide, pass, shot, block (the game-over tumble).

## 9. Art direction

- Cartoon in the spirit of *Avatar: The Last Airbender*: clean shapes, expressive faces, soft shading. Not anime.
- 2.5D / 3D with real depth: toon (cel) shading, soft outlines, a tilted side camera, parallax backdrops.
- Visual language, kept to three colours: **red/orange = danger**, **gold = goal**, **blue = passable object**.
- Juice: screen shake on the block, dust, confetti on goals, crowd and whistle sounds.

Planned tech: Three.js. Humanoid animation from Mixamo; simple animal and prop models from Blockbench or code; procedural motion (bob, squash, stretch) for non-humanoids. The art spike (see roadmap) validates this before we commit.

## 10. Scoring and leaderboard

- Score is **distance**. Passes and goals do not score in v1.
- On game over, show the **global top 5**. If the player placed, they enter a **3-character name** (a small blocklist of disallowed words applies).
- The end screen is a **shareable card**: score, rank, the player's jersey with initials, and a share button that captures a screenshot.
- Backend: a small serverless function on Vercel with a storage option from Vercel's marketplace (confirm the current product when we build). Secrets live in Vercel environment variables, never in the public repo.
- Scores come from the client, so the server rejects implausible values. This does not stop determined cheaters, and that is acceptable for v1.

## 11. Platform and hosting

- Desktop browsers only. Keyboard input.
- Public GitHub repository, deployed on Vercel.
- Everything lives in git, including assets.

## 12. Out of scope for v1

More than four zones, portals, pickups or collectibles, unlocks or cosmetics, lives, a daily seeded mode, mobile or touch support, accounts, and any score bonus for passes or goals.

## 13. Success criteria

- A first-time player understands the controls within one run.
- Every death feels fair: the player can say what the right answer was.
- Players retry immediately and want to beat their score.
- A shared end card makes someone else curious.
