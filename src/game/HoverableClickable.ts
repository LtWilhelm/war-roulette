import { applyMixins } from "./Mixins.ts";
import { Rectangle } from "./Shape.ts";

export interface IHoverable {
  onHover: () => void;
  offHover: () => void;
  checkHovering: (x: number, y: number) => boolean;
}

class HoverableBase extends Rectangle {}

export interface IClickable {
  onClick: () => void;
  checkIfClicked: (x: number, y: number) => boolean;
}

export class Clickable extends Rectangle implements IClickable {
  onClick() {
    // TODO
  }
  checkIfClicked(x: number, y: number) {
    const offsetX = (x - this.xPos);
    const offsetY = (y - this.yPos);

    if (offsetX > 0 && offsetY > 0 && offsetX < this.width && offsetY < this.height) {
      this.onClick();
      return true;
    }
    return false;
  }

}

type GConstructor<T = {}> = new (...args: any[]) => T;

type hoverable = GConstructor<Rectangle>;

function HoverableMixin<T extends hoverable>(Base: T) {
  return class HoverableMixin extends Base implements IHoverable{
    isHovered = false;

    onHover() { }
    offHover() { }
  
    checkHovering(x: number, y: number) {
      const offsetX = (x - this.xPos);
      const offsetY = (y - this.yPos);
  
      if (offsetX > 0 && offsetY > 0 && offsetX < this.width && offsetY < this.height) {
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