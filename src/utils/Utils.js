export class Utils {
    static getScale(image) {
        const { height, width, naturalHeight, naturalWidth } = image;
        const heightScale = naturalHeight > height ? naturalHeight / height > 1 ? naturalHeight / height : naturalHeight / height + 1 : 1;
        const widthScale = naturalWidth > width ? naturalWidth / width > 1 ? naturalWidth / width : naturalWidth / width + 1 : 1;

        return Math.max(widthScale, heightScale);
    }
}
