import {
    applyPaperStyles,
    removePaperStyles,
    renderOutput
} from './utils/generate-utils.mjs';
import { createPDF } from './utils/helpers.mjs';

// GLOBAL-VARIABLES
const AMPLITUDE = 2;
const SPACING = 4;
const MARGIN = 30;

const pageEl = document.querySelector('.page-a');
let outputImages = [];
const paperContent = document.querySelector('.paper-content');
const innerView = document.querySelector('.display-flex .left-margin-and-content');
/**
 * To generate image, we add styles to DIV and converts that HTML Element into Image.
 * This is the function that deals with it.
 */
async function convertDIVToImage() {
    const options = {
        scrollX: 0,
        scrollY: -window.scrollY,
        scale: document.querySelector('#resolution').value,
        useCORS: true
    };

    /** Function html2canvas comes from a library html2canvas which is included in the index.html */

    const tmp = paperContent.innerHTML.split("/");
    const lines = [];
    tmp.forEach((val, ind) => {
        val.split("<div>").forEach((extraVal, i) => {
            lines.push(extraVal);
        })
    })
    console.log(paperContent.innerHTML)
    try {
        innerView.removeChild(paperContent)
    } catch (error) {
             
    }
    let el = document.createElement("div");
    el.id = "innerDiv"
    pageEl.marginTop = "50px"
    innerView.appendChild(el);
    lines.forEach((value, index) => {
        let innerDiv = document.getElementById("innerDiv");
        let child = document.createElement("div")
        child.width = "100%";
        innerDiv.width = "100%"
        child.height = "25px"
        child.style.overflow = "hidden"
        let chars = value.replace("<div>", "").replace("<br>", "").split("");
        let amplitude = (Math.random() * AMPLITUDE)
        chars.forEach((val, ind) => {
            if (val == " " && chars[ind + 1] == " ") {
                return
            }
            let charDiv = document.createElement("span");
            charDiv.style.display = "block"
            charDiv.style.float = "left"
            charDiv.innerHTML = val
            charDiv.style.height = "25px";
            charDiv.style.fontFamily = 'f' + Math.floor(Math.random() * 3);
            if (val != " ") {
                charDiv.style.width = 5 + "px"
            } else {
                charDiv.style.width = ((Math.random() * SPACING) + 8) + "px"
            }
            charDiv.style.marginTop = (Math.sin(((index + ind) / (chars.length + lines.length) * Math.PI * 2) - (Math.PI / 2)) * amplitude) + "px"
            child.appendChild(charDiv);
        })
        child.style.padding = "0px 0px 0px " + ((Math.random() * MARGIN) + 25) + "px"
        child.style.marginTop = "-11.5px"
        innerDiv.appendChild(child)

    });

    console.log(pageEl);
    const canvas = await html2canvas(pageEl, options);

    /** Send image data for modification if effect is scanner */
    if (document.querySelector('#page-effects').value === 'scanner') {
        const context = canvas.getContext('2d');
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        contrastImage(imageData, 0.55);
        canvas.getContext('2d').putImageData(imageData, 0, 0);
    }
    outputImages.push(canvas);
    // Displaying no. of images on addition
    if (outputImages.length >= 1) {
        document.querySelector('#output-header').textContent =
            'Output ' + '( ' + outputImages.length + ' )';
    }
}

/**
 * This is the function that gets called on clicking "Generate Image" button.
 */
export async function generateImages() {
    applyPaperStyles();
    pageEl.scroll(0, 0);

    const paperContentEl = document.querySelector('.page-a .paper-content');
    const scrollHeight = paperContentEl.scrollHeight;
    const clientHeight = 514; // height of .paper-content when there is no content

    const totalPages = Math.ceil(scrollHeight / clientHeight);

    if (totalPages > 1) {
        // For multiple pages
        if (paperContentEl.innerHTML.includes('<img')) {
            alert(
                "You're trying to generate more than one page, Images and some formatting may not work correctly with multiple images" // eslint-disable-line max-len
            );
        }
        const initialPaperContent = paperContentEl.innerHTML;
        const splitContent = initialPaperContent.split(/(\s+)/);

        // multiple images
        let wordCount = 0;
        for (let i = 0; i < totalPages; i++) {
            paperContentEl.innerHTML = '';
            const wordArray = [];
            let wordString = '';

            while (
                paperContentEl.scrollHeight <= clientHeight &&
                wordCount <= splitContent.length
            ) {
                wordString = wordArray.join(' ');
                wordArray.push(splitContent[wordCount]);
                paperContentEl.innerHTML = wordArray.join(' ');
                wordCount++;
            }
            paperContentEl.innerHTML = wordString;
            wordCount--;
            pageEl.scrollTo(0, 0);
            await convertDIVToImage();
            paperContentEl.innerHTML = initialPaperContent;
        }
    } else {
        // single image
        await convertDIVToImage();
    }

    removePaperStyles();
    renderOutput(outputImages);
    setRemoveImageListeners();
}

/**
 * Delete all generated images
 */

export const deleteAll = () => {
    outputImages.splice(0, outputImages.length);
    renderOutput(outputImages);
    document.querySelector('#output-header').textContent =
        'Output' + (outputImages.length ? ' ( ' + outputImages.length + ' )' : '');
};

const arrayMove = (arr, oldIndex, newIndex) => {
    if (newIndex >= arr.length) {
        let k = newIndex - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);
    return arr; // for testing
};

export const moveLeft = (index) => {
    if (index === 0) return outputImages;
    outputImages = arrayMove(outputImages, index, index - 1);
    renderOutput(outputImages);
};

export const moveRight = (index) => {
    if (index + 1 === outputImages.length) return outputImages;
    outputImages = arrayMove(outputImages, index, index + 1);
    renderOutput(outputImages);
};

/**
 * Downloads generated images as PDF
 */
export const downloadAsPDF = () => createPDF(outputImages);

/**
 * Sets event listeners for close button on output images.
 */
function setRemoveImageListeners() {
    document
        .querySelectorAll('.output-image-container > .close-button')
        .forEach((closeButton) => {
            closeButton.addEventListener('click', (e) => {
                outputImages.splice(Number(e.target.dataset.index), 1);
                // Displaying no. of images on deletion
                if (outputImages.length >= 0) {
                    document.querySelector('#output-header').textContent =
                        'Output' +
                        (outputImages.length ? ' ( ' + outputImages.length + ' )' : '');
                }
                renderOutput(outputImages);
                // When output changes, we have to set remove listeners again
                setRemoveImageListeners();
            });
        });

    document.querySelectorAll('.move-left').forEach((leftButton) => {
        leftButton.addEventListener('click', (e) => {
            moveLeft(Number(e.target.dataset.index));
            // Displaying no. of images on deletion
            renderOutput(outputImages);
            // When output changes, we have to set remove listeners again
            setRemoveImageListeners();
        });
    });

    document.querySelectorAll('.move-right').forEach((rightButton) => {
        rightButton.addEventListener('click', (e) => {
            moveRight(Number(e.target.dataset.index));
            // Displaying no. of images on deletion
            renderOutput(outputImages);
            // When output changes, we have to set remove listeners again
            setRemoveImageListeners();
        });
    });
}

/** Modifies image data to add contrast */

function contrastImage(imageData, contrast) {
    const data = imageData.data;
    contrast *= 255;
    const factor = (contrast + 255) / (255.01 - contrast);
    for (let i = 0; i < data.length; i += 4) {
        data[i] = factor * (data[i] - 128) + 128;
        data[i + 1] = factor * (data[i + 1] - 128) + 128;
        data[i + 2] = factor * (data[i + 2] - 128) + 128;
    }
    return imageData;
}