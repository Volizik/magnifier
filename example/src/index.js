import { Magnifier } from '../../dist'
import src from './images/cupcakes.jpg'

document.addEventListener('DOMContentLoaded', () => {
    new Magnifier({
        src,
        containerId: 'magnifier',
    });
})
