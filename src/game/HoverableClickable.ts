import { Rectangle } from "./drawables/Shape.ts";
import { Point } from "./geometry/Vector.ts";

export interface IHoverable {
  onHover: () => void;
  offHover: () => void;
  checkHovering: (p: Point, gridScale: number) => boolean;
}

class HoverableBase extends Rectangle { }

export interface IClickable {
  onClick: () => void;
  checkIfClicked: (p: Point, gridScale: number) => boolean;
}

export class Clickable extends Rectangle implements IClickable {
  onClick() {
    // TODO
  }
  checkIfClicked(p: Point, gridScale: number) {
    const offsetX = p.x - (this.xPos * gridScale);
    const offsetY = p.y - (this.yPos * gridScale);

    if (offsetX > 0 && offsetY > 0 && offsetX < this.width * gridScale && offsetY < this.height * gridScale) {
      this.onClick();
      return true;
    }
    return false;
  }

}

type GConstructor<T = {}> = new (...args: any[]) => T;

type hoverable = GConstructor<Rectangle>;

function HoverableMixin<T extends hoverable>(Base: T) {
  return class HoverableMixin extends Base implements IHoverable {
    isHovered = false;

    onHover() { }
    offHover() { }

    checkHovering(p: Point, gridScale: number) {
      const offsetX = p.x - (this.xPos * gridScale);
      const offsetY = p.y - (this.yPos * gridScale);

      if (offsetX > 0 && offsetY > 0 && offsetX < this.width * gridScale && offsetY < this.height * gridScale) {
        if (!this.isHovered) {
          this.isHovered = true;
          this.onHover();
        }
        return true;
      } else {
        if (this.isHovered) {
          this.isHovered = false;
          this.offHover();
        }
        return false;
      }
    }
  }
}

export const Hoverable = HoverableMixin(HoverableBase);

export const HoverableClickable = HoverableMixin(Clickable);