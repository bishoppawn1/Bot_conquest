export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const overlaps = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export function hasFloorAhead(actor, direction, platforms, distance = 10) {
  if (!direction) return true;
  const probeX = direction > 0 ? actor.x + actor.w + distance : actor.x - distance;
  const feetY = actor.y + actor.h;
  return platforms.some(platform =>
    probeX >= platform.x && probeX <= platform.x + platform.w &&
    platform.y >= feetY - 4 && platform.y <= feetY + 12
  );
}

export function supportingPlatform(actor,platforms,tolerance=12) {
  const centerX=actor.x+actor.w/2,feetY=actor.y+actor.h;
  return platforms.find(platform=>centerX>=platform.x&&centerX<=platform.x+platform.w&&Math.abs(platform.y-feetY)<=tolerance)??null;
}

export function shareSupportingPlatform(first,second,platforms) {
  const firstPlatform=supportingPlatform(first,platforms);
  return firstPlatform!==null&&firstPlatform===supportingPlatform(second,platforms);
}

export function nearestSurfacePoint(x, y, platforms, maxDistance = 58) {
  let nearest = null;
  let best = maxDistance * maxDistance;
  for (const platform of platforms) {
    const candidates = [
      { x: clamp(x, platform.x, platform.x + platform.w), y: platform.y },
      { x: platform.x, y: clamp(y, platform.y, platform.y + platform.h) },
      { x: platform.x + platform.w, y: clamp(y, platform.y, platform.y + platform.h) }
    ];
    for (const point of candidates) {
      const distance = (point.x - x) ** 2 + (point.y - y) ** 2;
      if (distance < best) { best = distance; nearest = point; }
    }
  }
  return nearest;
}

export function isSurfaceContact(point, platforms, epsilon = 0.01) {
  if (!point) return false;
  return platforms.some(platform => {
    const onTop = Math.abs(point.y-platform.y)<=epsilon && point.x>=platform.x && point.x<=platform.x+platform.w;
    const onLeft = Math.abs(point.x-platform.x)<=epsilon && point.y>=platform.y && point.y<=platform.y+platform.h;
    const onRight = Math.abs(point.x-(platform.x+platform.w))<=epsilon && point.y>=platform.y && point.y<=platform.y+platform.h;
    return onTop||onLeft||onRight;
  });
}
