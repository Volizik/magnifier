import { DOMCreator } from './utils/DOMCreator';
import { Utils } from './utils/Utils';

export class GlassMagnifier {
    constructor({ containerId = 'magnifier', imageSrc, lensSize = 100 }) {
        if (!imageSrc) throw Error('imagesSrc is required!');

        this.wrapId = 'magnifier_wrap';
        this.imageId = 'magnifier_image';
        this.imageGlassId = 'magnifier_image_lens';
        this.glassSize = lensSize;

        this.#createDOM(containerId, imageSrc);
        this.#addHandlers();
    }

    #createDOM(containerId, imageSrc) {
        const elements = [
            {tag: 'div', attrs: {id: this.wrapId}},
            {tag: 'div', attrs: {id: this.imageGlassId}},
            {tag: 'img', attrs: {id: this.imageId, src: imageSrc}},
        ];
        const styles = `
                #${this.wrapId} {
                    position: relative;
                    height: 100%;
                    width: 100%;
                }
                #${this.imageGlassId} {
                    position: absolute;
                    border: 3px solid #000;
                    border-radius: 50%;
                    cursor: none;
                    box-sizing: border-box;
                    width: ${this.glassSize}px;
                    height: ${this.glassSize}px;
                    background-image: url('${imageSrc}');
                    background-repeat: no-repeat;
                }
                #${this.imageId} {
                    height: 100%;
                    width: 100%;
                }
            `;
        new DOMCreator().createElements(containerId, elements).appendStyles(styles);
    }

    #addHandlers() {
        new GlassMagnifierMovementHandlers(this.wrapId, this.imageId, this.imageGlassId).add();
    }
}

class GlassMagnifierMovementHandlers {
    isZoomed = false;
    #touchDevice = (navigator.maxTouchPoints || 'ontouchstart' in document.documentElement);

    #animationSpeed;
    #animationSpeedTouch = 0.2;
    #animationSpeedMouse = 0.1;

    constructor(wrapId, imageId, imageGlassId) {
        this.wrap = document.getElementById(wrapId);
        this.image = document.getElementById(imageId);
        this.glass = document.getElementById(imageGlassId);

        this.#addStyles();

        this.bw = 3;
        this.w = this.glass.offsetWidth / 2;
        this.h = this.glass.offsetHeight / 2;
        this.zoom = Utils.getScale(this.image) || 2;

        this.#animationSpeed = this.#touchDevice ? this.#animationSpeedTouch : this.#animationSpeedMouse;
    }

    add() {
        if (this.#touchDevice) {
            this.glass.addEventListener("touchmove", this.#moveGlass.bind(this));
            this.image.addEventListener("touchmove", this.#moveGlass.bind(this));
        } else {
            this.glass.addEventListener("mousemove", this.#moveGlass.bind(this));
            this.image.addEventListener("mousemove", this.#moveGlass.bind(this));
        }
    }

    #moveGlass(e) {
        /* Prevent any other actions that may occur when moving over the image */
        e.preventDefault();
        /* Get the cursor's x and y positions: */
        const pos = this.#getCursorPos(e);
        let x = pos.x;
        let y = pos.y;
        /* Prevent the magnifier glass from being positioned outside the image: */
        if (x > this.image.width - (this.w / this.zoom)) {x = this.image.width - (this.w / this.zoom);}
        if (x < this.w / this.zoom) {x = this.w / this.zoom;}
        if (y > this.image.height - (this.h / this.zoom)) {y = this.image.height - (this.h / this.zoom);}
        if (y < this.h / this.zoom) {y = this.h / this.zoom;}
        /* Set the position of the magnifier glass: */
        this.glass.style.left = (x - this.w) + "px";
        this.glass.style.top = (y - this.h) + "px";
        /* Display what the magnifier glass "sees": */
        this.glass.style.backgroundPosition = "-" + ((x * this.zoom) - this.w + this.bw) + "px -" + ((y * this.zoom) - this.h + this.bw) + "px";
    }

    #addStyles() {
        this.glass.style.backgroundSize = `${this.image.width * this.zoom}px ${this.image.height * this.zoom}px`;
    }

    #getCursorPos(e) {
        /* Get the x and y positions of the image: */
        const { left, top } = this.image.getBoundingClientRect();
        /* Calculate the cursor's x and y coordinates, relative to the image: */
        let x = e.pageX - left;
        let y = e.pageY - top;
        /* Consider any page scrolling: */
        x = x - window.scrollX;
        y = y - window.scrollY;

        return { x, y };
    }
}
