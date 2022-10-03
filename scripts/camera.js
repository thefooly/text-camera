/**
 * Author: Andrea Gallidabino
 * Date: 3 October 2022 
*/


const defaultConstraints = {
  video: true,
  audio: false,
}

const camera = (constraints = defaultConstraints) => {
  return navigator.mediaDevices.getUserMedia(constraints)
    .catch(err => {
        console.error('Error: ', err);
    });
};