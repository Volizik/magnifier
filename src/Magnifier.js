import { DOMCreator } from './utils/DOMCreator';
import { Utils } from './utils/Utils';

export class Magnifier {
    constructor({ containerId = 'magnifier', imageSrc }) {
        if (!imageSrc) throw Error('imagesSrc is required!');

        this.wrapId = 'magnifier_wrap';
        this.smallImageId = 'magnifier_small_image'
        this.naturalSizeImageId = 'magnifier_natural_size_image'

        this.#createDOM(containerId, imageSrc);
        this.#addHandlers();
    }

    #createDOM(containerId, imageSrc) {
        const elements = [
            {tag: 'div', attrs: {id: this.wrapId}},
            {tag: 'img', attrs: {id: this.smallImageId, src: imageSrc}},
            {tag: 'img', attrs: {id: this.naturalSizeImageId, src: imageSrc}},
        ];
        const styles = `
                #${this.wrapId} {
                    position: relative;
                    height: 100%;
                    width: 100%;
                    overflow: hidden;
                }
                #${this.naturalSizeImageId} {
                    position: absolute;
                    opacity: 0;
                    left: 0;
                    top: 0;
                }
                #${this.smallImageId} {
                    position: relative;
                    height: 100%;
                    width: 100%;
                    touch-action: none;
                    user-select: none;
                    z-index: 1;
                    transition: transform 0.3s;
                }
            `;
        new DOMCreator().createElements(containerId, elements).appendStyles(styles);
    }

    #addHandlers() {
        new MagnifierMovementHandlers(this.wrapId, this.smallImageId, this.naturalSizeImageId).add();
    }
}

class MagnifierMovementHandlers {
    isZoomed = false;
    #touchDevice = (navigator.maxTouchPoints || 'ontouchstart' in document.documentElement);

    #shiftX = 0;
    #shiftY = 0;
    #cursorX = 0;
    #cursorY = 0;
    #smallImageX = 0;
    #smallImageY = 0;

    #animationSpeed;
    #animationSpeedTouch = 0.2;
    #animationSpeedMouse = 0.1;

    constructor(wrapId, smallImageId, naturalSizeImageId) {
        this.wrap = document.getElementById(wrapId);
        this.smallImage = document.getElementById(smallImageId);
        this.naturalSizeImage = document.getElementById(naturalSizeImageId);
        this.wrapDimensions = this.wrap.getBoundingClientRect();

        this.#animationSpeed = this.#touchDevice ? this.#animationSpeedTouch : this.#animationSpeedMouse;
    }

    #animate(){
        let distX = this.#cursorX - this.#smallImageX;
        let distY = this.#cursorY - this.#smallImageY;

        this.#smallImageX += distX * this.#animationSpeed;
        this.#smallImageY += distY * this.#animationSpeed;

        this.smallImage.style.transformOrigin = `${this.#smallImageX}px ${this.#smallImageY}px`;

        this.animationId = requestAnimationFrame(this.#animate.bind(this));
    }

    add() {
        this.smallImage.addEventListener('mouseenter', ({ clientX, clientY }) => {
            if (this.#touchDevice) return false;
            this.#onEnter({ clientY, clientX });
        });
        this.smallImage.addEventListener('mousemove', ({ clientY, clientX, pageX, pageY }) => {
            if (this.#touchDevice) return false;
            this.#onMouseMove({ clientY, clientX });
        });
        this.smallImage.addEventListener('mouseleave', () => {
            if (this.#touchDevice) return false;
            this.#onLeave();
        });

        let tapedTwice = false;

        this.smallImage.addEventListener('click', ({ clientX, clientY }) => {
            if (!this.#touchDevice) return false;
            if (!tapedTwice) {
                tapedTwice = true;
                setTimeout(() => { tapedTwice = false }, 300);
                return false;
            }
            console.log('doubleClick');

            this.#onEnter({ clientY, clientX });

            this.smallImage.style.pointerEvents = 'none';

            const naturalSizeDimensions = this.naturalSizeImage.getBoundingClientRect();
            // Получаем проценты места где мы кликнули относительно маленькой картинки
            const yPercent = (clientY - this.wrapDimensions.top) * 100 / this.wrapDimensions.height;
            const xPercent = (clientX - this.wrapDimensions.left) * 100 / this.wrapDimensions.width;

            // Применяем этот процент к большой картинке
            this.naturalSizeImage.style.top = `${(this.wrapDimensions.height - naturalSizeDimensions.height) * yPercent / 100}px`;
            this.naturalSizeImage.style.left = `${(this.wrapDimensions.width - naturalSizeDimensions.width)  * xPercent / 100}px`;
        })
        this.naturalSizeImage.addEventListener('click', () => {
            if (!this.#touchDevice) return false;
            if (!tapedTwice) {
                tapedTwice = true;
                setTimeout(() => { tapedTwice = false }, 300);
                return false;
            }
            console.log('doubleClick');

            this.#onLeave();

            this.smallImage.style.pointerEvents = 'auto';
            this.naturalSizeImage.style.top = `0px`
            this.naturalSizeImage.style.left = `0px`
        })
        this.naturalSizeImage.addEventListener('touchstart', (e) => {
            if (!this.isZoomed) return false;

            const coords = this.#getCoords(this.naturalSizeImage);
            this.#shiftX = e.touches[0].pageX - coords.left;
            this.#shiftY = e.touches[0].pageY - coords.top;

            this.#onTouchMove({
                pageY: e.touches[0].pageY,
                pageX: e.touches[0].pageX,
            });
        });
        this.naturalSizeImage.addEventListener('touchmove', (e) => {
            this.#onTouchMove({
                pageY: e.touches[0].pageY,
                pageX: e.touches[0].pageX,
            });
        });
    }

    #getCoords(element) {
        const box = element.getBoundingClientRect();

        return {
            top: (box.top - this.wrapDimensions.top) + scrollY,
            left: (box.left - this.wrapDimensions.left) + scrollX
        };
    }

    #onTouchMove({ pageX = 0, pageY = 0 }) {
        const activePosition = {
            left: pageX - this.#shiftX,
            top: pageY - this.#shiftY,
        };
        const naturalSizeDimensions = this.naturalSizeImage.getBoundingClientRect();

        const minTop = this.wrapDimensions.height - naturalSizeDimensions.height
        const minLeft = this.wrapDimensions.width - naturalSizeDimensions.width

        if (activePosition.top > 0 ) {
            activePosition.top = 0;
        }
        if (activePosition.left > 0 ) {
            activePosition.left = 0;
        }
        if (activePosition.top < minTop ) {
            activePosition.top = minTop;
        }
        if (activePosition.left < minLeft ) {
            activePosition.left = minLeft;
        }

        this.naturalSizeImage.style.top = `${activePosition.top}px`;
        this.naturalSizeImage.style.left = `${activePosition.left}px`;

        // Получаем проценты относительно позиции большой картинки
        const xPercent = (activePosition.left * 100) / minLeft
        const yPercent = (activePosition.top * 100) / minTop

        // Применяем проценты к маленькой картинке
        this.#cursorX = (this.wrapDimensions.width * xPercent) / 100
        this.#cursorY = (this.wrapDimensions.height * yPercent) / 100
        // this.smallImage.style.transformOrigin = `${(this.wrapDimensions.width * xPercent) / 100}px ${(this.wrapDimensions.height * yPercent) / 100}px`;
    }

    #onMouseMove({ clientX, clientY }) {
        this.#cursorX = clientX - this.wrapDimensions.left;
        this.#cursorY = clientY - this.wrapDimensions.top;
    }

    #onEnter({ clientX, clientY }) {
        this.isZoomed = true;

        this.#cursorX = clientX - this.wrapDimensions.left
        this.#cursorY = clientY - this.wrapDimensions.top

        this.#animate();

        this.smallImage.style.transformOrigin = `${this.#cursorX}px ${this.#cursorY}px`;
        this.smallImage.style.transform = `scale(${Utils.getScale(this.smallImage)})`;
    }

    #onLeave() {
        this.isZoomed = false;

        cancelAnimationFrame(this.animationId);
        this.smallImage.style.transform = `scale(1)`;
    }
}
