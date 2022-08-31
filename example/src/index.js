import { Magnifier, SideMagnifier, GlassMagnifier } from '../../dist'

document.addEventListener('DOMContentLoaded', () => {
    const src = 'https://ae05.alicdn.com/kf/He1a5115e565749d6a891335dfdc6c5f6r/TWS-Bluetooth-5-0-Earphones-3500mAh-Charging-Box-Wireless-Headphone-9D-Stereo-Sports-Waterproof-Earbuds-Headsets.jpg'
    new Magnifier({
        imageSrc: src,
        containerId: 'magnifier',
    })
    new SideMagnifier({
        imageSrc: src,
        containerId: 'side-magnifier',
    })
    new GlassMagnifier({
        imageSrc: src,
        containerId: 'glass-magnifier',
    })
})
