# Bot Conquest — Game Specification

## World vision

Bot Conquest takes place across one interconnected mechanical world. It is not divided into numbered sectors, discrete stages, or finish-line courses. Its spaces support exploration, backtracking, alternate routes, optional rooms, shortcuts, hidden caches, environmental storytelling, and small secrets.

The current replacement fragment spans 9,600 horizontal units and 1,400 vertical units. It is not the complete map and has no region-clear state, glowing finish gate, or traversal-percentage objective.

## Player

The player controls a compact spherical/oval mechanical bot. Its body collision box is 50 × 36 world units, making it visibly wider than tall. Three red optical sensors communicate facing direction.

Three mechanical legs connect body-mounted anchors to actual nearby platform surfaces. Their targets are spread laterally by 44 units with up to 112 units of reach so they remain visible around the body. The center foot receives a left/right bias instead of hiding directly beneath the bot. A foot remains latched during each step interval, then one leg at a time selects a slightly randomized reachable contact point. If no surface exists within leg range, that leg retracts and is not rendered.

### Abilities

| Action | Input | Required behavior |
| --- | --- | --- |
| Move / horizontal aim | `A`, `D` | Accelerate left/right and aim in that direction |
| Jump / aim up | `W` | Perform the starting basic jump and set upward aim |
| Double jump | `W` in air | Locked at the beginning; available after its future pickup |
| Wall movement | Hold/press `W` at wall | Locked at the beginning; available after its future pickup |
| Aim down | `S` | Set downward aim without moving |
| Dash | `Shift` | Locked at the beginning; short horizontal burst after unlock |
| Basic slash | `Space` | Instantly strike the full 105-unit area in the locked aim direction |
| Repair | `E` | Available from the start; spend 30 electricity to restore one missing shell |
| Electric field | `Q` | Locked initially; spend 40 electricity after unlock |
| Electric jab | `F` | Locked initially; spend 25 electricity after unlock |
| Restart | `R` | Return the current prototype map to its initial state |

The basic slash supports left, right, up, and down. Its aim is captured when the attack begins. Pressing Space immediately evaluates the complete 105-unit directional hitbox once. Its only presentation is a 0.09-second straight white slash facing forward; it never extends, retracts, curves, or resembles a pointer.

## Resource loop

Enemies award scrap when killed: crawler 6, roller 8, hopper 10, drone 12, and brute 25. Scrap has no spending behavior yet.

The player has an electricity meter capped at 100. A standard slash against an enemy adds 12 electricity. Three conduits each contain 24 electricity, yield 4 per slash, and stay permanently empty after six successful harvests. A target hit by a special attack returns 4 electricity.

Nine ordinary junk piles have 5–6 health and burst into configured scrap payouts when destroyed. A tenth, 90-unit-tall VOLT-sealed junk wall has minimum damage 2 and requires the future electric jab. Hitting junk does not generate electricity.

The electric field lasts 0.9 seconds and uses a true 112-unit-radius circular collision test. The electric jab lasts 0.5 seconds, reaches 170 units in its locked direction, and deals two damage.

## Lives and failure

The player starts with three core shells. Enemy contact removes one shell and briefly grants invulnerability. Touching a spike immediately removes one shell and returns the player to the last safe position recorded on the most recently supported platform; the player never continues falling through the spike pit. Falling completely out of the world still returns to the initial spawn. Losing the third shell ends the run.

## Enemies

Selected crawlers and rollers patrol passively within configured leashes. Basic ground enemies detect at 210 units and brutes at 240 units. Distance alone is insufficient: both the player and ground enemy must stand on the same supporting platform before pursuit begins. Ground enemies probe for walkable support before every step.

Crawlers change direction immediately and pursue at a steady 75 units per second. Oblong rollers accelerate gradually toward a 150-unit-per-second chase speed, preserving momentum rather than copying crawler motion. Square brutes stop for a visible 0.38-second warning, lock a direction, and charge at 190 units per second for 0.42 seconds before cooling down. Hoppers remain the jumping archetype.

Drones detect at 340 units. When inactive they hover around their spawn height. Once active they steer toward the player's actual two-dimensional position at 105 units per second. Drone movement resolves horizontal and vertical collision against solid blocks, so drones cannot fly through floors, ceilings, or walls.

Current archetypes are crawler, roller, hopper, drone, and brute. The brute takes three basic-slash hits; basic enemies take one.

### Boss encounter

After traversing roughly two-thirds of the current route, the player enters a 1,300-unit-wide open arena. Crossing its inner trigger drops a solid gate behind the player and another at the far exit. The gates finish closing in about 0.3 seconds and cannot be crossed while the boss remains alive.

The Heavy Core boss has 18 health and three deterministic attacks:

- A telegraphed horizontal charge locks its direction before rushing at 260 units per second.
- An aerial slam launches upward, then creates an expanding 300-unit ground shockwave when it lands.
- A volley fires three energy bolts toward the player's current position with a small angular spread.

The HUD displays the boss health bar throughout the encounter. Defeating the Heavy Core awards 150 scrap, removes remaining boss hazards, retracts both gates, and permanently clears the arena for the run.

## Current map fragment

The current map is a complete geometric reset and must not derive its layout from the discarded access-path prototype. It spans X 0–9,600 and Y -600–800. Eight enormous foundations form a rolling lower traversal network, with every upward change limited to 70 units and every hazard gap limited to 160 units so the starting jump remains sufficient.

Heavy overhead blocks pair with those foundations to create eight large lower chambers. Each recess is genuine negative space between a solid floor and ceiling. Two smaller playable alcoves are physically framed at the outer ends of the world, where they cannot block traversal. Fourteen interior blocks create cover and alternate elevations; each is exactly 70 units high, sits flush on one foundation, and preserves at least 80 units of recovery floor on both sides. No ordinary collision block is thinner than 60 units.

Only three small optional cache shelves require double jump; together they occupy less than 15% of the lower foundation width and never gate forward traversal. The map contains seven spike gaps, twenty-one ordinary combat encounters, one boss encounter, three exhaustible conduits, nine ordinary junk piles, and one armored junk wall.

Solid rectangles never intersect: platform faces may touch but cannot overlap, bury one another, or contain a placed enemy, conduit, or junk pile. Lower transitions are reversible with the basic jump, eliminating one-way drops that strand the player.

The world contains no embedded area-name captions, directional labels, or text-box-like room names. Visual depth comes from three parallax structure layers, deep unlabeled recesses, and massive blocks with beveled top and side faces. The HUD shows coordinates, lives, electricity, scrap, and the available starting kit without naming map regions.

## Quality requirements

- Gameplay rules stay deterministic apart from cosmetic particles and leg placement.
- Rendering, input, level data, geometry, and simulation remain separate modules.
- Automated tests cover starting locks, starting repair, post-unlock abilities, camera bounds, junk destruction, conduit depletion, four-direction melee combat, resources, life loss, enemy behavior, boss gates, all three boss attacks, boss rewards, and valid surface contact.
- Level-data tests enforce world dimensions, minimum 60-unit block thickness, zero solid intersections, object clearance, reversible lower-route gaps, recovery space around every interior obstacle, framed unlabeled recesses, and upper ability gates.
- The browser console has no errors during the start and play states.
