(function () {
    class vanillaZoom {
        constructor(element) {
            this.container = element;
            this.firstSmallImage = this.container.querySelector('.small-preview');
            this.wrapper = this.container.querySelector('.wrapper');
            this.image = this.container.querySelector('.image');
            this.bigImage = this.container.querySelector('.big-image');
            this.activePosition = {
                x: 0,
                y: 0,
            }

            this.init();
            this.changePhoto();
            this.mouseEnter();
            this.mouseMove();
            this.mouseLeave();
        }

        init() {
            if (!this.container) {
                console.error('Нет элемента container');
            }
            if (!this.wrapper) {
                console.error('Нет элемента wrapper');
            }
            if (!this.image) {
                console.error('Нет элемента image');
            }
            if (!this.bigImage) {
                console.error('Нет элемента bigImage');
            }
            if (!this.firstSmallImage) {
                console.error('Нет элемента firstSmallImage');
            } else {
                this.image.src = this.firstSmallImage.src;
                this.bigImage.src = this.firstSmallImage.src;
            }
        }

        changePhoto() {
            this.container.addEventListener('click', (e) => {
                const elem = e.target;
                if (elem.classList.contains('small-preview')) {
                    this.image.src = elem.src;
                    this.bigImage.src = elem.src;
                }
            })
        }

        mouseEnter() {
            this.wrapper.addEventListener('mouseenter', (e) => {
                let dimensionWrap = this.wrapper.getBoundingClientRect();
                this.activePosition = {
                    x: e.clientX - dimensionWrap.left,
                    y: e.clientY - dimensionWrap.top,
                }
                this.image.style.transform = `scale(2.5)`;
                this.image.style.transformOrigin = `${this.activePosition.x}px ${this.activePosition.y}px`;
                // this.bigImage.style.display = 'block';
            })
        }

        mouseMove() {
            this.wrapper.addEventListener('mousemove', (e) => {
                let dimensionWrap = this.wrapper.getBoundingClientRect();
                let dimensionBigImage = this.bigImage.getBoundingClientRect();
                const size = {
                    width: dimensionWrap.width,
                    height: dimensionWrap.height,
                    naturalWidth: dimensionBigImage.width,
                    naturalHeight: dimensionBigImage.height,
                }
                this.activePosition = {
                    x: e.clientX - dimensionWrap.left,
                    y: e.clientY - dimensionWrap.top,
                }
                this.image.style.transformOrigin = `${this.activePosition.x}px ${this.activePosition.y}px`;
            })
        }


        mouseLeave() {
            this.wrapper.addEventListener('mouseleave', () => {
                this.bigImage.style.display = 'none';
                this.bigImage.style.top = '0';
                this.bigImage.style.left = '0';
                this.image.style.transform = `scale(1)`;
            })
        }


    }

    let zoom = document.querySelectorAll('.vanilla-zoom');

    zoom.forEach(item => {
        new vanillaZoom(item);
    })
})();
