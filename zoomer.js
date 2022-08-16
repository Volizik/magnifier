class Magnifier {
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

class DOMCreator {
    #makeElement(tag, attrs) {
        const element = document.createElement(tag);
        Object.entries(attrs).forEach(([key, value]) => {
            element[key] = value;
        });
        return element;
    }

    createElements(containerId, elements) {
        const container = document.getElementById(containerId)

        if (!container) {
            console.error(`Cant find container by id "${containerId}". Check if containerId is right`);
            return this;
        }

        const { tag, attrs } = elements.shift();
        const wrap = this.#makeElement(tag, attrs)

        elements
            .map(({ tag, attrs }) => this.#makeElement(tag, attrs))
            .forEach((elem) => wrap.appendChild(elem));

        container.appendChild(wrap);

        return this;
    }

    appendStyles(styles) {
        const style = document.createElement('style');
        style.textContent = styles;
        document.head.appendChild(style);

        return this;
    }
}

class Utils {
    static getScale(image) {
        const { height, width, naturalHeight, naturalWidth } = image;
        const heightScale = naturalHeight > height ? naturalHeight / height > 1 ? naturalHeight / height : naturalHeight / height + 1 : 1;
        const widthScale = naturalWidth > width ? naturalWidth / width > 1 ? naturalWidth / width : naturalWidth / width + 1 : 1;

        return Math.max(widthScale, heightScale);
    }
}

class GlassMagnifier {
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

class SideMagnifier {
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
