export const ELECTRICITY_MAX = 100;
export const ELECTRICITY_PER_HIT = 12;
export const ABILITY_COSTS = Object.freeze({ heal:30, field:40, electricJab:24 });
export const ATTACK_TIMING = Object.freeze({ primary:.09, field:.9, electricJab:.5 });
export const ATTACK_RANGE = Object.freeze({ primary:105, field:112, electricJab:170 });

export const SCRAP_VALUES = Object.freeze({ crawler:6, roller:8, hopper:10, drone:12, brute:25, boss:150 });

export function directionalBox(actor, direction, range=50, thickness=30) {
  const centerX=actor.x+actor.w/2,centerY=actor.y+actor.h/2;
  if(direction.x>0)return{x:actor.x+actor.w-2,y:centerY-thickness/2,w:range,h:thickness};
  if(direction.x<0)return{x:actor.x-range+2,y:centerY-thickness/2,w:range,h:thickness};
  if(direction.y<0)return{x:centerX-thickness/2,y:actor.y-range+2,w:thickness,h:range};
  return{x:centerX-thickness/2,y:actor.y+actor.h-2,w:thickness,h:range};
}

export function fieldCircle(actor, radius=ATTACK_RANGE.field) {
  return{x:actor.x+actor.w/2,y:actor.y+actor.h/2,radius};
}

export function circleIntersectsRect(circle,rect) {
  const closestX=Math.max(rect.x,Math.min(circle.x,rect.x+rect.w));
  const closestY=Math.max(rect.y,Math.min(circle.y,rect.y+rect.h));
  return (closestX-circle.x)**2+(closestY-circle.y)**2<=circle.radius**2;
}
