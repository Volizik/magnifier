import { DOMCreator } from './utils/DOMCreator';
import { Utils } from './utils/Utils';

export class SideMagnifier {
    #wrapId = 'magnifier_wrap';
    #imageId = 'magnifier_image';
    #lensId = 'magnifier_image_lens';
    #resultContainerId = 'magnifier_result';

    #containerId;
    #imageSrc;
    #lensSize;
    #resultSize = 300;

    constructor({ containerId = 'magnifier', imageSrc, lensSize = 50 }) {
        if (!imageSrc) throw Error('imagesSrc is required!');

        this.#containerId = containerId;
        this.#imageSrc = imageSrc;
        this.#lensSize = lensSize;

        this.#createDOM();
        this.#addHandlers();
    }

    #createDOM() {
        const elements = [
            {tag: 'div', attrs: {id: this.#wrapId}},
            {tag: 'img', attrs: {id: this.#imageId, src: this.#imageSrc}},
            {tag: 'div', attrs: {id: this.#lensId}},
            {tag: 'div', attrs: {id: this.#resultContainerId}},
        ];
        const styles = `
                #${this.#wrapId} {
                    position: relative;
                    height: 100%;
                    width: 100%;
                }
                #${this.#lensId} {
                    position: absolute;
                    border: 1px solid #000;
                    box-sizing: border-box;
                    width: ${this.#lensSize}px;
                    height: ${this.#lensSize}px;
                }
                #${this.#resultContainerId} {
                    border: 1px solid #000;
                    box-sizing: border-box;
                    width: ${this.#resultSize}px;
                    height: ${this.#resultSize}px;
                    background-image: url("${this.#imageSrc}");
                }
                #${this.#imageId} {
                    height: 100%;
                    width: 100%;
                }
            `;
        new DOMCreator().createElements(this.#containerId, elements).appendStyles(styles);
    }

    #addHandlers() {
        new SideMagnifierMovementHandlers(this.#containerId, this.#imageId, this.#lensId, this.#resultContainerId).add()
    }

}

class SideMagnifierMovementHandlers {
    isZoomed = false;
    #touchDevice = (navigator.maxTouchPoints || 'ontouchstart' in document.documentElement);

    #animationSpeed;
    #animationSpeedTouch = 0.2;
    #animationSpeedMouse = 0.1;

    #cx;
    #cy;

    constructor(wrapId, imageId, lensId, resultId) {
        this.wrap = document.getElementById(wrapId);
        this.image = document.getElementById(imageId);
        this.lens = document.getElementById(lensId);
        this.result = document.getElementById(resultId);

        this.#addStyles();

        // TODO: change this code to make lens size will be depended on image scale
        this.#cx = this.result.offsetWidth / this.lens.offsetWidth;
        this.#cy = this.result.offsetHeight / this.lens.offsetHeight;
        this.zoom = Utils.getScale(this.image) || 2;

        this.#addStyles();

        this.#animationSpeed = this.#touchDevice ? this.#animationSpeedTouch : this.#animationSpeedMouse;
    }

    #animate() {
        this.lens.style.left = this.x * this.#animationSpeed + "px";
        this.lens.style.top = this.y* this.#animationSpeed + "px";
        /* Display what the magnifier glass "sees": */
        this.result.style.backgroundPosition = "-" + (this.x * this.#cx) + "px -" + (this.y * this.#cy) + "px";

        this.animationId = requestAnimationFrame(this.#animate.bind(this));
    }

    add() {
        if (this.#touchDevice) {
            this.lens.addEventListener("touchmove", this.#moveLens.bind(this));
            this.image.addEventListener("touchmove", this.#moveLens.bind(this));
        } else {
            this.lens.addEventListener("mousemove", this.#moveLens.bind(this));
            this.image.addEventListener("mousemove", this.#moveLens.bind(this));
        }
    }

    #moveLens(e) {
        /* Prevent any other actions that may occur when moving over the image */
        e.preventDefault();
        /* Get the cursor's x and y positions: */
        const pos = this.#getCursorPos(e);
        this.x = pos.x - (this.lens.offsetWidth / 2);
        this.y = pos.y - (this.lens.offsetHeight / 2);
        /* Prevent the magnifier glass from being positioned outside the image: */
        if (this.x > this.image.width - this.lens.offsetWidth) {this.x = this.image.width - this.lens.offsetWidth;}
        if (this.x < 0) {this.x = 0;}
        if (this.y > this.image.height - this.lens.offsetHeight) {this.y = this.image.height - this.lens.offsetHeight;}
        if (this.y < 0) {this.y = 0;}

        this.#animate()
        // /* Set the position of the magnifier glass: */
        // this.lens.style.left = x + "px";
        // this.lens.style.top = y + "px";
        // /* Display what the magnifier glass "sees": */
        // this.result.style.backgroundPosition = "-" + (x * this.#cx) + "px -" + (y * this.#cy) + "px";
    }

    #addStyles() {
        this.result.style.backgroundSize = (this.image.width * this.#cx) + "px " + (this.image.height * this.#cy) + "px";
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
