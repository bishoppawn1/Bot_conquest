# Bot Conquest

A dependency-free 2D canvas platformer prototype set in a growing interconnected world. Explore eight linked industrial regions across a 14,500-unit-wide ruin, fight four full bosses and an optional mini-boss, unlock movement and electrical abilities, discover alternate shells, and backtrack through ability-gated routes.

## Run

```bash
npm start
```

Open http://127.0.0.1:4173.

The start card includes an optional God Mode for playtesting. It begins with every upgrade, shell, item, and map while making shells and electricity infinite. Leave it unchecked for ordinary progression.

## Controls

- `A` / `D`: move
- `W`: basic jump and aim up
- `Shift`: dash
- `S`: aim down
- `Space`: instant white slash in the current aim direction
- `E`: channel a short repair for 30 electricity; taking damage interrupts it
- `O`: interact with rest stations and unlocked merchant doors
- `F`: Volt Jab after collecting the blue Sunken Vault core
- Hold `W` at a wall to climb after collecting the post-boss upgrade; press the direction away from the wall to jump off
- `I`: open the pausing inventory/map overlay
- `Shift`, `Q`, `F`: locked at the beginning and unlocked through later pickups

## Test

```bash
npm test
npm run test:coverage
npm run check
```

The automated suite checks deterministic simulation, all boss phases and rewards, combat economy, progression, God Mode, inventory and merchants, shells and equipment, enemy behavior, regional extensions, physical traversal, collision-free geometry, headroom, junk bypasses, and map projection. `npm run check` syntax-checks all source and test files, produces a production build, and runs the full suite.

The Edge Forge merchant in the Grand Exchange sells four persistent `+1` primary-slash upgrades with escalating scrap and material recipes.

See [SPEC.md](SPEC.md) for the current gameplay contract and [AGENTS.md](AGENTS.md) for contributor guidance and code ownership boundaries.
