/**
 * Author: Andrea Gallidabino
 * Date: 3 October 2022 
*/

const containerQuerySelector = '#text-textarea';
const hiddenCanvasSelector = '#hidden-canvas';
const hiddenVideoSelector = '#hidden-video';

const fps = 10;
const drawFrame = (context, videoElement) => {
	context.drawImage(videoElement, 0, 0);
};

const getTextRender = (canvas) => {
	// return textColorFromCanvas(canvas);
	return textFromCanvas(canvas);
};

const defaultElementWidth = 300;
const defaultElementHeight = 200;

const setElementSize = (element, width = defaultElementWidth, height = defaultElementHeight) => {
		element.width = width;
		element.height = height;
}

const init = async () => {
	const containerElement = document.querySelector(containerQuerySelector);
	setElementSize(containerElement, defaultElementWidth, defaultElementHeight);

	const videoElement = document.querySelector(hiddenVideoSelector);
	setElementSize(videoElement, defaultElementWidth, defaultElementHeight);
	
	const canvasElement = document.querySelector(hiddenCanvasSelector);
	setElementSize(canvasElement, defaultElementWidth, defaultElementHeight);
	const context = canvasElement.getContext('2d');

  const constraints = {
    audio: false,
    video: { width: defaultElementWidth, height: defaultElementHeight }
  }

	const mediaStream = await camera(constraints);

	videoElement.srcObject = mediaStream;
	videoElement.addEventListener('loadedmetadata', () => {
		videoElement.play();
	});

	videoElement.addEventListener('play', () => {
		setInterval(() => {
			drawFrame(context, videoElement);

			const textString = getTextRender(canvasElement);
			containerElement.innerHTML = textString;
		}, 1000 / fps);
	});
}