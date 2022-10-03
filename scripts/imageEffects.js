/**
 * Author: Andrea Gallidabino
 * Date: 3 October 2022 
*/

const getColorAtOffset = (data, offset) => {
	return {
		red: data[offset],
		green: data[offset + 1],
		blue: data[offset + 2],
		alpha: data[offset + 3]
	};
}

const bound = (value, interval) => {
	return Math.max(interval[0], Math.min(interval[1], value));
}

const effects = (canvas, filter, options) => {

	const context = canvas.getContext("2d");
	const imageData = context.getImageData(0,0, canvas.width, canvas.height);

	imageData.data = Filters[filter](canvas, imageData.data, options)

	context.clearRect(0, 0, canvas.width, canvas.height);
  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL()
}

const Filters = {
	grayscale: (canvas, data, options) => {
		for (let i = 0; i < canvas.height; i++) {
      for (let j = 0; j < canvas.width; j++) {
      	const offset = (i * canvas.width + j) * 4;
      	const colors = getColorAtOffset(data, offset)

      	const average = (colors.red + colors.green + colors.blue) / 3
				data[offset] = average;
				data[offset + 1] = average;
				data[offset + 2] = average;
				data[offset + 3] = colors.alpha;
    	}
  	}

  	return data
	},

	optGrayscale: (canvas, data) => {
		for (let i = 0; i < canvas.height; i++) {
	      for (let j = 0; j < canvas.width; j++) {
	      	const offset = (i * canvas.width + j) * 4;
	      	const colors = getColorAtOffset(data, offset)

					const avg = 0.2126 * colors.red + 0.7152 * colors.green + 0.0722 * colors.blue;
    			data[offset] = avg
    			data[offset + 1] = avg
    			data[offset + 2] = avg
	    }
	  }

  	return data
	},


	brightness: (canvas, data, options) => {
		const adjustment = options.adjustment || 40

		for (let i = 0; i < canvas.height; i++) {
	      for (let j = 0; j < canvas.width; j++) {
	      	const offset = (i * canvas.width + j) * 4;
	      	const colors = getColorAtOffset(data, offset)

	      	data[offset] += adjustment
    			data[offset + 1] += adjustment
    			data[offset + 2] += adjustment
	    }
	  }

  	return data
	},

	threshold: (canvas, data, options) => {
		const threshold = options.threshold || 100

		for (let i = 0; i < canvas.height; i++) {
      for (let j = 0; j < canvas.width; j++) {
      	const offset = (i * canvas.width + j) * 4;
      	const colors = getColorAtOffset(data, offset)

      	const avg = 0.2126 * colors.red + 0.7152 * colors.green + 0.0722 * colors.blue;
      	const newColor = (avg >= threshold) ? 255 : 0;

				data[offset] = newColor;
				data[offset + 1] = newColor;
				data[offset + 2] = newColor;
		  }
		}

  	return data
	},

	negative: (canvas, data) => {
		for (let i = 0; i < canvas.height; i++) {
      for (let j = 0; j < canvas.width; j++) {
      	const offset = (i * canvas.width + j) * 4;
      	const colors = getColorAtOffset(data, offset)

				data[offset] = 255 - colors.red;
				data[offset + 1] = 255 - colors.green;
				data[offset + 2] =  255 - colors.blue;
				data[offset + 3] = colors.alpha;
		  }
		}

  	return data
	},

	convolute: (canvas, data, options) => {
		const weights = options.weights || 
			// [1/9, 1/9, 1/9,
			// 1/9, 1/9, 1/9,
			// 1/9, 1/9, 1/9]
			[0, -1, 0,
			-1, 5, 0,
				0, -1, 0]
		const side = Math.round(Math.sqrt(weights.length));
		const halfSide = Math.floor(side / 2);

		const opaque = options.opaque || false
		const alphaFactor = opaque ? 1 : 0;

		const tmpCanvas = document.createElement('canvas');
		const tmpCtx = tmpCanvas.getContext('2d');

		const tempImageData = tmpCtx.createImageData(canvas.width, canvas.height);
		const tempData = tempImageData.data	

		for (let i = 0; i < canvas.height; i++) {
      for (let j = 0; j < canvas.width; j++) {
      	tempI = i
      	tempJ = j
      	const offset = (i * canvas.width + j) * 4;

      	const red = 0
      	const green = 0
      	const blue = 0
      	const alpha = 0

      	for (let convI = 0; convI < side; convI++) {
        	for (let convJ = 0; convJ < side; convJ++) {
        		const tempConvI = tempI + convI - halfSide;
          	const tempConvJ = tempJ + convJ - halfSide;

          	if (tempConvI >= 0 && tempConvI < canvas.height && tempConvJ >= 0 && tempConvJ < canvas.width) {
	            const convOffset = (tempConvI * canvas.width + tempConvJ) * 4;
	            const wt = weights[(convI * side) + convJ];

	            red += data[convOffset] * wt;
	            green += data[convOffset + 1] * wt;
	            blue += data[convOffset + 2] * wt;
	            alpha += data[convOffset + 3] * wt;
          	}
        	}
        }

        tempData[offset] = red;
				tempData[offset + 1] = green;
				tempData[offset + 2] = blue;
				tempData[offset + 3] = alpha + alphaFactor * (255-alpha)
      }
    }

    for (let i = 0; i < canvas.height; i++) {
      for (let j = 0; j < canvas.width; j++) {
     		const offset = (i * canvas.width + j) * 4;

     		data[offset] = tempData[offset]
     		data[offset + 1] = tempData[offset + 1]
     		data[offset + 2] = tempData[offset + 2]
     		data[offset + 3] = tempData[offset + 3]
      }
    }

    return data
	},

	convoluteUnsigned: (canvas, data, options) => {
		const weights = options.weights || 
			[0, -1, 0,
			-1, 5, -1,
				0, -1, 0]
		const side = Math.round(Math.sqrt(weights.length));
		const halfSide = Math.floor(side / 2);

		const opaque = options.opaque || false
		const alphaFactor = opaque ? 1 : 0;

		const tempData = new Array(canvas.height * canvas.width * 4)	

		for (let i = 0; i < canvas.height; i++) {
      for (let j = 0; j < canvas.width; j++) {
      	let tempI = i
      	let tempJ = j
      	const offset = (i * canvas.width + j) * 4;

      	const red = 0
      	const green = 0
      	const blue = 0
      	const alpha = 0

      	for (let convI = 0; convI < side; convI++) {
        	for (let convJ = 0; convJ < side; convJ++) {
        		const tempConvI = tempI + convI - halfSide;
          	const tempConvJ = tempJ + convJ - halfSide;

          	if (tempConvI >= 0 && tempConvI < canvas.height && tempConvJ >= 0 && tempConvJ < canvas.width) {
	            const convOffset = (tempConvI * canvas.width + tempConvJ) * 4;
	            const wt = weights[(convI * side) + convJ];

	            red += data[convOffset] * wt;
	            green += data[convOffset + 1] * wt;
	            blue += data[convOffset + 2] * wt;
	            alpha += data[convOffset + 3] * wt;
          	}
        	}
        }

        tempData[offset] = red;
				tempData[offset + 1] = green;
				tempData[offset + 2] = blue;
				tempData[offset + 3] = alpha + alphaFactor * (255-alpha)
      }
    }

    return tempData
	},

	contrast: (canvas, data, options) => {
		const contrast = options.contrast || 128
		const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
		
		for (let i = 0; i < canvas.height; i++) {
	      for (let j = 0; j < canvas.width; j++) {
	      	const offset = (i * canvas.width + j) * 4;
	      	const colors = getColorAtOffset(data, offset)

	      	// const average = (colors.red + colors.green + colors.blue) / 3
					data[offset] = bound(Math.floor((colors.red - 128) * contrastFactor) + 128, [0, 255]);
					data[offset + 1] = bound(Math.floor((colors.green - 128) * contrastFactor) + 128, [0, 255]);
					data[offset + 2] =  bound(Math.floor((colors.blue - 128) * contrastFactor) + 128, [0, 255]);
					data[offset + 3] = colors.alpha;
	    }
	  }

  	return data
	},

	sobel: (canvas, data, options) => {
		const grayscale = data.slice()

		grayscale = Filters.convolute(canvas, grayscale, {})

		const horizontal = grayscale.slice()
		const vertical = grayscale.slice()

		vertical = Filters.convoluteUnsigned(canvas, vertical, {weights:[
				-1 ,-2 ,-1, 
				 0 ,0 ,0, 
				 1, 2, 1]})

		horizontal = Filters.convoluteUnsigned(canvas, horizontal, {weights:[
				-1,0, 1, 
				-2,0, 2, 
				-1,0, 1]})

		for (let i = 0; i < data.length; i += 4) {
			const v = Math.abs(vertical[i])
			const h = Math.abs(horizontal[i])
			const hv = Math.sqrt(Math.pow(h,2) + Math.pow(v,2))/4
		  data[i] = h;
		  data[i + 1] = v;
		  data[i + 2] = hv;
		  data[i + 3] = 255;
		}
	}
}

const textFromCanvas = (canvas, options = {}) => {
	const characters = (" .,:;i1tfLCG08@").split("");

	const context = canvas.getContext("2d");
	
	let textCharacters = "";

	const contrast = options.contrast || 128
	const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

	const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

	for (let y = 0; y < canvas.height; y++) { // every other row because letters are not square
		for (let x = 0; x < canvas.width; x++) {
			const offset = (y * canvas.width + x) * 4;

			const color = getColorAtOffset(imageData.data, offset);

			const contrastedColor = {
				red: bound(Math.floor((color.red - 128) * contrastFactor) + 128, [0, 255]),
				green: bound(Math.floor((color.green - 128) * contrastFactor) + 128, [0, 255]),
				blue: bound(Math.floor((color.blue - 128) * contrastFactor) + 128, [0, 255]),
				alpha: color.alpha
			};

			const brightness = (0.299 * contrastedColor.red + 0.587 * contrastedColor.green + 0.114 * contrastedColor.blue) / 255;
			const character = characters[(characters.length - 1) - Math.round(brightness * (characters.length - 1))];

			textCharacters += character;
		}
		textCharacters += "\n";
	}

	return textCharacters
}

const textColorFromCanvas = (canvas, options = {}) => {
	const characters = (" .,:;i1tfLCG08@").split("");

	const context = canvas.getContext("2d");
	
	let textCharacters = "";

	const contrast = options.contrast || 128
	const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

	const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

	for (let y = 0; y < canvas.height; y++) { // every other row because letters are not square
		for (let x = 0; x < canvas.width; x++) {
			const offset = (y * canvas.width + x) * 4;

			const color = getColorAtOffset(imageData.data, offset);

			const contrastedColor = {
				red: bound(Math.floor((color.red - 128) * contrastFactor) + 128, [0, 255]),
				green: bound(Math.floor((color.green - 128) * contrastFactor) + 128, [0, 255]),
				blue: bound(Math.floor((color.blue - 128) * contrastFactor) + 128, [0, 255]),
				alpha: color.alpha
			};

			const brightness = (0.299 * contrastedColor.red + 0.587 * contrastedColor.green + 0.114 * contrastedColor.blue) / 255;
			const character = characters[(characters.length - 1) - Math.round(brightness * (characters.length - 1))];

			textCharacters += `<span style="color: rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha})">${character}</span>`;
		}
		textCharacters += "\n";
	}

	return textCharacters
}