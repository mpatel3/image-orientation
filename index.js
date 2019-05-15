const imgOrientationPlugin = function () {
    const getOrientation = (file, e) => {
        // If Array buffer does not exist.
        if (!(e && e.target && e.target.result)) {
            return -1;
        }
        // create low level interface for reading and writing numbers.
        const view = new DataView(e.target.result); // e.target.result - Array buffer of a file.
        // GET Unsigned 16-bit integer at the specified byte offset from the start of the DataView.
        // false - consider as big-endian format.
        if (view.getUint16(0, false) !== 0xFFD8) {
            return -2; // Not a JPEG
        }
        const length = view.byteLength;
        let offset = 2;
        while (offset < length) {
            if (view.getUint16(offset + 2, false) <= 8) return -1; // Not defined.
            const marker = view.getUint16(offset, false);
            offset += 2;
            if (marker === 0xFFE1) {
                if (view.getUint32(offset += 2, false) !== 0x45786966) {
                    return -1;
                }
                const little = view.getUint16(offset += 6, false) === 0x4949;
                offset += view.getUint32(offset + 4, little);
                const tags = view.getUint16(offset, little);
                offset += 2;
                for (let i = 0; i < tags; i += 1) {
                    if (view.getUint16(offset + (i * 12), little) === 0x0112) {
                        return view.getUint16(offset + (i * 12) + 8, little);
                    }
                }
            } else if ((marker & 0xFF00) !== 0xFF00) {
                break;
            } else {
                offset += view.getUint16(offset, false);
            }
        }
        return -1;
    },

    resetOrientation = (srcBase64, srcOrientation, callbackfunction, oImage) => {
            const img = new Image();
            img.onload = (e) => {
                e.stopPropagation(); // stop event from propgating to other handlers.
                const [width, height, canvas] = [img.width, img.height, document.createElement('canvas')];
                const ctx = canvas.getContext('2d');
                // set Canvas dimentions.
                // if image has orientation number between 4 to 9 | meaning image orientation is different.
                if (1 < srcOrientation && srcOrientation < 9) {
                  canvas.width = width;
                  canvas.height = height;
                }

                // transform context before drawing image
                /* ****************************************************************************
                * description - transform(a,b,c,d,e,f) takes 6 parameters
                * a - Horizontal scaling
                * b - Horizontal skewing
                * c - Vertical skewing
                * d - Vertical scaling
                * e - Horizontal moving
                * f - Vertical moving
                * ***************************************************************************** */
                switch (srcOrientation) {
                  case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
                  case 3: ctx.transform(-1, 0, 0, -1, width, height); break;
                  case 4: ctx.transform(1, 0, 0, -1, 0, height); break;
                  case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
                  case 6: ctx.transform(0, 1, -1, 0, height, 0); break;
                  case 7: ctx.transform(0, -1, -1, 0, height, width); break;
                  case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
                  default: break;
                }
                // draw image
                ctx.drawImage(img, 0, 0);
                // render New base64 encoded URL
                callbackfunction(canvas.toDataURL(), oImage);
            };
            img.src = srcBase64;
    },

    arrayBufferToBase64 = (buffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer),
            len = bytes.byteLength;
        for (let i = 0; i < len; i += 1) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    return {
        getOrientation,
        resetOrientation,
        arrayBufferToBase64,
    };
};
export default imgOrientationPlugin;
