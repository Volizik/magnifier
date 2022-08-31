export class DOMCreator {
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
