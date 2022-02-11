console.log("WORKING")

const canvas = document.querySelector("#game-board") as HTMLCanvasElement;

canvas.width = 400;
canvas.height = 600;

const context = canvas.getContext('2d');

context!.fillStyle = 'red';
context?.fillRect(0, 0, canvas.width, canvas.height);
